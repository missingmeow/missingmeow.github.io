---
title: DuiLib 源码剖析
description: DuiLib 源码剖析，深度学习 DuiLib 的消息机制。
date: 2021-06-25
---

## Windows 消息机制

**UI线程：** 创建窗口的线程必须就是处理窗口所有消息的线程，即**UI线程**（User Interface Thread）创建了窗体及窗体上的各种控件，系统为UI线程分配一个消息队列用于窗口消息的派送（dispatch）。为了使窗口处置这些消息，线程必须有它自己的“消息循环”。操作系统把**非UI线程**视作普通工作线程（Workhorse），不会为它创建消息队列。因此，调用PostThreadMessage前，这个线程必须是UI线程从而有投寄消息的队列

**窗体过程：** 窗体过程（Window Procedure）是一个函数，每个窗体有一个窗体过程，负责处理该窗体的所有消息。UI控件也是独立的“Window”，拥有自己的“窗体过程”。

**消息队列：**

1. Windows操作系统的内核空间中有一个系统消息队列（system message queue），在内核空间中还为每个UI线程分配各自的线程消息队列(Thread message queue)。在发生输入事件之后，Windows操作系统的输入设备驱动程序将输入事件转换为一个“消息”投寄到系统消息队列；操作系统的一个专门线程从系统消息队列取出消息，分发到各个UI线程的输入消息队列中。
2. 应用程序的每个UI线程中有一段称之为“消息循环”的代码，通过**GetMessage**系统调用（或是**PeekMessage**系统调用）访问系统空间中的对应的UI线程的消息队列
3. 需要注意的是，GetMessage如果在应用程序消息队列未获取消息，则GetMessage调用不返回，该线程挂起，CPU使用权交给操作系统。即GetMessage为阻塞调用。

由此可见，Windows的事件驱动模式，并不是操作系统把消息主动分发给应用程序；而是由应用程序的每个UI线程通过“消息循环”代码从UI线程消息队列获取消息。

领悟：windows程序消息循环的机制

当一个应用程序建立的时候，操作系统会为该应用程序分配一个消息队列，凡是跟该程序相关的消息，操作系统都会把消息放到这个消息队列中，应用程序利用GetMessage从消息队列中取出一条具体的消息，利用TranslateMessage将WM_KEYDOWN和WM_KEYUP转换成一个WM_CHAR消息放到消息队列中。利用DispatchMessage将该消息投递出去，分发出去，分发给操作系统，操作系统利用设计窗口类时候指定的过程函数处理该消息。

## CWindowWnd 窗口基类

CWindowWnd 类主要实现了Windows窗口窗口的过程，包括注册窗口类，窗口过程函数处理，创建窗口等。简单说下由父类实例调用 Create 函数开始，准备创建窗口过程。

```cpp
Create(...) // 调用 Create 创建窗口
    |- RegisterWindowClass() // 注册窗口类，指定自定义的窗口过程函数（静态成员函数）
    |- ::CreateWindow(..., this) // 新建窗口，重要的是最后一个参数，把当前类地址传进去
            |- WM_NCCREATE // 首次创建窗口时在 WM_CREATE 消息之前发送。
                { 
                    // LPCREATESTRUCT.lpCreateParams 就是窗口创建时最后一个参数，可转换为 CWindowWnd* 的指针
                    LPCREATESTRUCT lpcs = reinterpret_cast<LPCREATESTRUCT>(lParam);
                    pThis = static_cast<CWindowWnd*>(lpcs->lpCreateParams);
                    // 设置一下窗口属性，USERDATA 用户数据属性设置为当前类的地址，后续可通过该属性获取类指针
                    ::SetWindowLongPtr(hWnd, GWLP_USERDATA, reinterpret_cast<LPARAM>(pThis));
                }
            |- ... WM_CREATE // 及后续的其他所有消息
                {
                    // 获取当前窗口类指针，通过 HandleMessage 回调到类中
                    pThis = reinterpret_cast<CWindowWnd*>(::GetWindowLongPtr(hWnd, GWLP_USERDATA));
                    return pThis->HandleMessage(uMsg, wParam, lParam);
                }
```

## WindowImplBase 窗口实现类

该类简单的展示了DuiLib究竟要如何使用，我们可以从中看下实现方式。

```c++
class WindowImplBase
    : public CWindowWnd // 继承窗口类，创建窗口的任务还是要交给它
    , public CNotifyPump // 消息泵，宏消息实现的地方
    , public INotifyUI // 实现 Notify(TNotifyUI& msg) 接口
    , public IMessageFilterUI // 实现 MessageHandler 接口
    , public IDialogBuilderCallback // 实现创建控件 CreateControl 的回调接口
{
    // 以下只挑部分说明
    virtual LRESULT HandleMessage(UINT uMsg, WPARAM wParam, LPARAM lParam) // 实现了 CWindowWnd 所有消息回调接口，处理消息最原始的地方就是从这里开始
    {
        LRESULT lRes = 0;
        BOOL bHandled = TRUE;
        switch (uMsg)
        {
        case WM_CREATE: lRes = OnCreate(uMsg, wParam, lParam, bHandled); break; // WM_CREATE 消息，定义一个函数处理初始化工作
        // ...... 这里还有很多不展开说明了
        default: bHandled = FALSE; break;
        }
        if (bHandled) return lRes;

        lRes = HandleCustomMessage(uMsg, wParam, lParam, bHandled); // 定义了一个虚函数，也就是如果继承该类的话，可以在父类重定义该类处理消息
        if (bHandled) return lRes;

        if (m_PaintManager.MessageHandler(uMsg, wParam, lParam, lRes)) // CPaintManager 会负责把相关消息封装成 TNotifyUI 形式通知 
            return lRes;
        return CWindowWnd::HandleMessage(uMsg, wParam, lParam);
    }

    LRESULT WindowImplBase::OnCreate(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled)
    {
        m_PaintManager.Init(m_hWnd); // 初始化 CPaintManager
        m_PaintManager.AddPreMessageFilter(this); // 注册 IMessageFilterUI 接口， 实现 LRESULT MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, bool& bHandled); 接口也能捕获到消息，但需要注意要捕获的消息类型会不会之前就被处理了
        // ......
        m_PaintManager.AttachDialog(pRoot);  // 把ui控件交给 pm 管理
        m_PaintManager.AddNotifier(this); // 注册 void Notify(TNotifyUI& msg) = 0; 回调实现

        InitWindow(); // DuiLib 窗口初始化完成，可以在该函数中实现自己业务相关的初始化操作
        return 0;
    }
}
```

## CDialogBuilder xml文件解析类

该类主要负责读取 xml 文件，解析里面的控件和属性，生成对应UI控件，最后返回一个跟节点入口。

```c++
// 以下代码属于 WindowImplBase OnCreate 函数中的节选部分
CDialogBuilder builder; // 创建一个实例
CControlUI* pRoot=NULL;
if (GetResourceType()==UILIB_RESOURCE) // 判断资源类型
{
    STRINGorID xml(_ttoi(GetSkinFile().GetData()));
    pRoot = builder.Create(xml, _T("xml"), this, &m_PaintManager); // Create 函数中有两个参数要注意一下
    // IDialogBuilderCallback 默认控件创建失败如果指定了该回调，会调用来创建实例
    // CPaintManagerUI 1.设置窗口属性，保存全局的字体图片信息 2.可以注册插件，创建控件时也会到这里来尝试创建实例（静态方法）
}
else
    pRoot = builder.Create(GetSkinFile().GetData(), (UINT)0, this, &m_PaintManager);
m_PaintManager.AttachDialog(pRoot);  // 把ui控件交给 pm 管理
```

```c++
CControlUI* CDialogBuilder::_Parse(CMarkupNode* pRoot, CControlUI* pParent, CPaintManagerUI* pManager)
{
    IContainerUI* pContainer = NULL;
    CControlUI* pReturn = NULL;
    for( CMarkupNode node = pRoot->GetChild() ; node.IsValid(); node = node.GetSibling() ) {
        LPCTSTR pstrClass = node.GetName();
        // 以下这几个控件属性属于所有控件可用的，实际上它们的值会保存到 CPaintManagerUI 实例中，具体可查看调用前的 _Create 函数
        if( _tcsicmp(pstrClass, _T("Image")) == 0 || _tcsicmp(pstrClass, _T("Font")) == 0 \
            || _tcsicmp(pstrClass, _T("Default")) == 0 
            || _tcsicmp(pstrClass, _T("MultiLanguage")) == 0 ) continue;

        CControlUI* pControl = NULL;
        if( _tcsicmp(pstrClass, _T("Include")) == 0 ) {
            // ....
        }
        else {
            // .... 内建控件实现
            // User-supplied control factory
            if( pControl == NULL ) {
                CDuiPtrArray* pPlugins = CPaintManagerUI::GetPlugins(); // 如果内建控件没有，则判断 CPaintManagerUI 有没有对应的插件可用于构建控件
                LPCREATECONTROL lpCreateControl = NULL;
                for( int i = 0; i < pPlugins->GetSize(); ++i ) {
                    lpCreateControl = (LPCREATECONTROL)pPlugins->GetAt(i);
                    if( lpCreateControl != NULL ) {
                        pControl = lpCreateControl(pstrClass);
                        if( pControl != NULL ) break;
                    }
                }
            }
            if( pControl == NULL && m_pCallback != NULL ) {
                pControl = m_pCallback->CreateControl(pstrClass); // 如果以上都创建失败，则使用 IDialogBuilderCallback 尝试
            }
        }
        // ...
        // 下面这里就根据 xml 控件的属性，给控件设置上去，所以，没有文档也可以到对应控件下面看该函数，就能知道当前支持的属性有哪些
        if( node.HasAttributes() ) {
            // Set ordinary attributes
            int nAttributes = node.GetAttributeCount();
            for( int i = 0; i < nAttributes; i++ ) {
                pControl->SetAttribute(node.GetAttributeName(i), node.GetAttributeValue(i));
            }
        }
        // ...
    }
}
```

## CPaintManagerUI 消息控件管理类

这个类的内容很多，实现代码有3500+行，这里简单说说消息管理相关的内容，其他的查看源码基本都能理解。

```c++
// 实际上查看库里面提供的例子，基本都是建完窗口并显示后，调用了以下的函数，这是个静态函数，无需先创建实例
// 如果对 WinForm 开发有了解的话，其实这个就是 Windows 程序消息循环机制，只不过加了一步duilib的处理
int CPaintManagerUI::MessageLoop()
{
    MSG msg = { 0 };
    while( ::GetMessage(&msg, NULL, 0, 0) ) { // 从消息队列里取出一条消息
        if( !CPaintManagerUI::TranslateMessage(&msg) ) { // duilib 对消息的处理
            ::TranslateMessage(&msg); // 翻译消息
            ::DispatchMessage(&msg); // 操作系统分发消息，会在对应窗口的窗口过程函数中再次处理
        }
    }
    return msg.wParam;
}

// 这个就是在上面消息循环里调用的消息处理函数
bool CPaintManagerUI::TranslateMessage(const LPMSG pMsg)
{
    UINT uStyle = GetWindowStyle(pMsg->hwnd);
    UINT uChildRes = uStyle & WS_CHILD;    
    LRESULT lRes = 0;
    if (uChildRes != 0)  // 获取当前消息所属的窗口是否属于子窗口
    {
        HWND hWndParent = ::GetParent(pMsg->hwnd);
        // m_aPreMessages 变量存储的就是每个 CPaintManagerUI 的实例
        // 对前面内容还有印象的话，就知道，WindowImplBase 窗口在 OnCreate 创建过程中曾 bind 了句柄到 CPaintManagerUI 中
        // 同时会把 CPaintManagerUI 实例指针放入到该数组中
        for( int i = m_aPreMessages.GetSize() - 1; i >= 0 ; --i ) 
        {
            CPaintManagerUI* pT = static_cast<CPaintManagerUI*>(m_aPreMessages[i]);        
            HWND hTempParent = hWndParent;
            while(hTempParent)
            {
                // 向上获取父窗口句柄，该链条上的所有句柄是否有属于该 CPaintManagerUI 实例管理的
                if(pMsg->hwnd == pT->GetPaintWindow() || hTempParent == pT->GetPaintWindow())
                {
                      // Windows 自带的该函数是将 快捷键 转换为命令消息发出去
                      // 这个需要自己注册 ITranslateAccelerator 接口，它会回调到注册函数里处理，暂时不讨论了
                    if (pT->TranslateAccelerator(pMsg))
                        return true;
                    // 里面实现了预消息处理函数，下面我们再看看这里的实现
                    pT->PreMessageHandler(pMsg->message, pMsg->wParam, pMsg->lParam, lRes);
                }
                hTempParent = GetParent(hTempParent);
            }
        }
    }
    else
        ; // 非子窗口的处理与上面基本一致，只是没有获取父窗口判断那一步而已 
    return false;
}

// 预处理消息
bool CPaintManagerUI::PreMessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, LRESULT& /*lRes*/)
{
    // m_aPreMessageFilters 数组管理着 IMessageFilterUI 接口的实现对象实例
    // 结合前面的 WindowImplBase 类，它是不是继承了 IMessageFilterUI 接口类，然后实现了 MessageHandler 函数，原来消息是来这这里
    for( int i = 0; i < m_aPreMessageFilters.GetSize(); i++ ) 
    {
        bool bHandled = false;
        LRESULT lResult = static_cast<IMessageFilterUI*>(m_aPreMessageFilters[i])->MessageHandler(uMsg, wParam, lParam, bHandled);
        if( bHandled ) {
            return true;
        }
    }
    switch( uMsg ) {
    case WM_KEYDOWN:
        // 处理 Tab 键切换焦点
        break;
    case WM_SYSCHAR:
        // 处理是否是快捷键
        break;
    case WM_SYSKEYDOWN:
        // 给当前焦点控件发送系统按键信息
        break;
    }
    return false;
}
```

到这里，消息处理的链条就比较清晰了。我们记得，在 WindowImplBase 的 HanleMessage 中，在函数的最后，调用了 `m_PaintManager.MessageHandler(uMsg, wParam, lParam, lRes);`，这个也属于 CPaintManagerUI 中的消息处理函数，但这个也是最后一步消息处理了，我们来看看该函数的实现。

```c++
bool CPaintManagerUI::MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, LRESULT& lRes)
{
    if( m_hWndPaint == NULL ) return false;
    // 这里还有个消息过滤，也是实现 IMessageFilterUI 接口，m_aMessageFilters 和 m_aPreMessageFilters 的区别就是调用顺序的不同
    // 想要注册这两个回调，调用的两个接口如下，所以根据你想要捕获的消息，需要分辨一下要在注册回调的时机
    // bool AddPreMessageFilter(IMessageFilterUI* pFilter);
    // bool AddMessageFilter(IMessageFilterUI* pFilter);
    // 在 WindowImplBase 类中，调用的是 m_PaintManager.AddPreMessageFilter(this); 所以你知道该类中各个消息回调的顺序了吗？
    for( int i = 0; i < m_aMessageFilters.GetSize(); i++ ) 
    {
        bool bHandled = false;
        LRESULT lResult = static_cast<IMessageFilterUI*>(m_aMessageFilters[i])->MessageHandler(uMsg, wParam, lParam, bHandled);
        if( bHandled ) {
            // 这里返回这里更新了鼠标最后的位置坐标
            return true;
        }
    }
    // ....
    switch( uMsg ) {
    case WM_APP + 1:
        // 这个消息用来处理异步的通知事件，还有控件延迟删除时也是会放到这里执行
        break;
    case WM_CLOSE:
        {
            // Make sure all matching "closing" events are sent
            TEventUI event = { 0 };
            event.ptMouse = m_ptLastMousePos;
            event.wKeyState = MapKeyState();
            event.dwTimestamp = ::GetTickCount();
            if( m_pEventHover != NULL ) {
                event.Type = UIEVENT_MOUSELEAVE;
                event.pSender = m_pEventHover;
                m_pEventHover->Event(event);
            }
            if( m_pEventClick != NULL ) {
                event.Type = UIEVENT_BUTTONUP;
                event.pSender = m_pEventClick;
                m_pEventClick->Event(event);
            }

            SetFocus(NULL);

            if( ::GetActiveWindow() == m_hWndPaint ) {
                HWND hwndParent = GetWindowOwner(m_hWndPaint);
                if ((GetWindowStyle(m_hWndPaint) & WS_CHILD) !=0 ) hwndParent = GetParent(m_hWndPaint);
                if( hwndParent != NULL ) ::SetFocus(hwndParent);
            }
            if (m_hwndTooltip != NULL) {
                ::DestroyWindow(m_hwndTooltip);
                m_hwndTooltip = NULL;
            }
        }
        break;
    case WM_ERASEBKGND:
        {
            // We'll do the painting here...
            lRes = 1;
        }
        return true;
    case WM_PAINT:
        // 界面绘画这块内容很长，有时间可以好好看看
        return true;
    // ... 后面的消息处理函数太多了，最后说下定时消息，看下DuiLib内部的控件消息 OnNotify 是如何实现的
    case WM_TIMER:
        {
            if( LOWORD(wParam) == LAYEREDUPDATE_TIMERID ) { // 分层更新消息
                if( m_bLayered && !::IsRectEmpty(&m_rcLayeredUpdate) ) {
                    LRESULT lRes = 0;
                    if( !::IsIconic(m_hWndPaint) ) MessageHandler(WM_PAINT, 0, 0L, lRes);
                    break;
                }
            }
            // m_aTimers 是设置了定时的控件的集合，控件设置请调用 CPaintManagerUI::SetTimer 函数
            for( int i = 0; i < m_aTimers.GetSize(); i++ ) {
                const TIMERINFO* pTimer = static_cast<TIMERINFO*>(m_aTimers[i]);
                if( pTimer->hWnd == m_hWndPaint && pTimer->uWinTimer == LOWORD(wParam) && pTimer->bKilled == false) {
                    // 判断定时消息是否应该发送，这里可以看到 DuiLib 是如何封装并通知控件的
                    TEventUI event = { 0 };             // 定义一个 TEventUI 结构实例
                    event.Type = UIEVENT_TIMER;            // 消息类型属于 定时消息
                    event.pSender = pTimer->pSender;     // 发送消息的控件 
                    event.dwTimestamp = ::GetTickCount();
                    event.ptMouse = m_ptLastMousePos;    // 鼠标最后的位置
                    event.wKeyState = MapKeyState();    // 系统按键的状态
                    event.wParam = pTimer->nLocalID;    // 消息的标识 ID
                    event.lParam = lParam;                // 原来的内容
                    pTimer->pSender->Event(event);         // 控件调用处理上面的消息
                    break;
                }
            }
        }
        break;
    default:
        break;
    }

    return false;
}
```

## CControlUI 所有控件子类

这个是实现控件时都要继承的基类，定义了一些基本的属性和方法，这些内容基本过一遍源码即可，相对来说也比较好理解。想要实现自定义控件的时候，最好是了解一下各个函数的作用，自定义的控件需不需要覆盖，这些都是要考虑的。

下面我们就接着上面的内容继续看下控件的消息机制。

```c++
// 从 CPaintManager 过来的消息，这个函数就作为入口
void CControlUI::Event(TEventUI& event)
{
    if( OnEvent(&event) ) DoEvent(event);
}

// OnEvent 是个 CEventSource 的实例， 而这个 CEventSource 又是什么东西呢
CEventSource OnEvent;

// CEventSource 是一个类，可以看到它有个指针数组，没猜错的话应该就是注册消息回调相关的了
class DUILIB_API CEventSource
{
    typedef bool (*FnType)(void*);
public:
    ~CEventSource();
    operator bool();
    void operator+= (const CDelegateBase& d); // add const for gcc
    void operator+= (FnType pFn);
    void operator-= (const CDelegateBase& d);
    void operator-= (FnType pFn);
    bool operator() (void* param);
protected:
    CDuiPtrArray m_aDelegates;
};

// 我们继续看上面 OnEvent(&event) 的调用，实际上调用了这个函数
bool CEventSource::operator() (void* param) 
{
    // 这里实际上就是遍历了数组，数组保存的内容是一个 CDelegateBase 指针，重载+=时添加的
    for( int i = 0; i < m_aDelegates.GetSize(); i++ ) {
        CDelegateBase* pObject = static_cast<CDelegateBase*>(m_aDelegates[i]);
        if( pObject && !(*pObject)(param) ) return false;
    }
    return true;
}

// 试着搜索了一下，发现并没有地方用到这个变量，但它自带的demo里是有用到的，可以看看用法
log_button->OnEvent += MakeDelegate(&OnLogoButtonEvent);
// 一个Button实例，添加了消息回调，回调函数如下，和上面对应上了
static bool OnLogoButtonEvent(void* event) {
    if( ((TEventUI*)event)->Type == UIEVENT_BUTTONDOWN ) {
        CControlUI* pButton = ((TEventUI*)event)->pSender;
        if( pButton != NULL ) {
            CListContainerElementUI* pListElement = (CListContainerElementUI*)(pButton->GetTag());
            if( pListElement != NULL ) pListElement->DoEvent(*(TEventUI*)event);
        }
    }
    return true;
}

// 回到一开始我们再看它调用，OnEvent 只要没有失败，还是会继续执行 DoEvent 的
// 那我们继续再看 DoEvent 里面的实现
void CControlUI::DoEvent(TEventUI& event)
{
    // .... 省略其他一些事件处理函数，这里我们继续看定时消息的处理
    if( event.Type == UIEVENT_TIMER )
    {
        // 这里突然又开始调用 CPaintManagerUI 的函数，看来消息的真正处理函数还是在 CPaintManagerUI 里面管理
        m_pManager->SendNotify(this, DUI_MSGTYPE_TIMER, event.wParam, event.lParam);
        return;
    }
    if( m_pParent != NULL ) m_pParent->DoEvent(event);
}

// SendNotify 有个重载函数，我们直接看实现的这个
void CPaintManagerUI::SendNotify(TNotifyUI& Msg, bool bAsync /*= false*/, bool bEnableRepeat /*= true*/)
{
    Msg.ptMouse = m_ptLastMousePos;
    Msg.dwTimestamp = ::GetTickCount();
    if( m_bUsedVirtualWnd )
    {    // 这里判断有没有使用虚窗口，如果有的话把消息结构加上虚窗口标识
        Msg.sVirtualWnd = Msg.pSender->GetVirtualWnd();
    }

    if( !bAsync ) {
        if( Msg.pSender != NULL ) {
            // 判断消息发送窗口 OnNotify 变量有没有绑定回调，有的话则调用（和前面 OnEvent 一样）
            if( Msg.pSender->OnNotify ) Msg.pSender->OnNotify(&Msg);
        }
        // m_aNotifiers 是 INotifyUI 接口类型指针的数组，也是通过 AddNotifier 注册
        for( int i = 0; i < m_aNotifiers.GetSize(); i++ ) {
            static_cast<INotifyUI*>(m_aNotifiers[i])->Notify(Msg);
        }
    }
    else {
        // ...
        TNotifyUI *pMsg = new TNotifyUI;
        if (m_bUsedVirtualWnd) pMsg->sVirtualWnd = Msg.sVirtualWnd;
        pMsg->pSender = Msg.pSender;
        pMsg->sType = Msg.sType;
        pMsg->wParam = Msg.wParam;
        pMsg->lParam = Msg.lParam;
        pMsg->ptMouse = Msg.ptMouse;
        pMsg->dwTimestamp = Msg.dwTimestamp;
        m_aAsyncNotify.Add(pMsg);
        // 这里是异步调用，直接发送 WM_APP + 1 消息稍后处理
        PostAsyncNotify();
    }
}

// 最后我们再回到 WindowImplBase 窗口类
class DUILIB_API WindowImplBase
    : public CWindowWnd
        , public CNotifyPump // 消息泵，实现虚窗口消息转发，实现声明消息宏转发
        , public INotifyUI // 实现 Notify 接口
        , public IMessageFilterUI
        , public IDialogBuilderCallback
    {}

// 在 OnCrate 窗口初始化函数里面，把当前 INotifyUI 注册到 CPaintManagerUI 中去，那么 SendNotify 时就会收到通知
m_PaintManager.AddNotifier(this);
// 该窗口收到回调信息，再转发到 CNotifyPump 虚窗口中去，CNotifyPump 里面实现宏定义消息的调用
void WindowImplBase::Notify(TNotifyUI& msg)
{
    return CNotifyPump::NotifyPump(msg);
}

```

## CNotifyPump 消息泵的实现

该类就负责实现 DuiLib 中类似 MFC 的宏定义消息，可定义点击按钮事件的回调函数或者其他的，下面来看看它的实现。

```c++
// 这里就是由 WindowImplBase 类转发进来的消息
void CNotifyPump::NotifyPump(TNotifyUI& msg)
{
    ///遍历虚拟窗口
    if( !msg.sVirtualWnd.IsEmpty() ){
        // 如果该消息来自虚拟窗口，则转发到对应的虚拟窗口的 CNotifyPump 处理函数中
        for( int i = 0; i< m_VirtualWndMap.GetSize(); i++ ) {
            if( LPCTSTR key = m_VirtualWndMap.GetAt(i) ) {
                if( _tcsicmp(key, msg.sVirtualWnd.GetData()) == 0 ) {
                    CNotifyPump* pObject = static_cast<CNotifyPump*>(m_VirtualWndMap.Find(key, false));
                    if( pObject && pObject->LoopDispatch(msg) )
                        return;
                }
            }
        }
    }
    //遍历主窗口，下面消息真正的分发处理
    LoopDispatch( msg );
}

// 我们先看看这个类中宏定义的内容
struct DUI_MSGMAP
{
    const DUI_MSGMAP* (PASCAL* pfnGetBaseMap)(); // 函数指针返回一个当前类型的结构体指针
    const DUI_MSGMAP_ENTRY* lpEntries; // 指向 DUI_MSGMAP_ENTRY 数组的指针
};
struct DUI_MSGMAP_ENTRY //定义一个结构体，来存放消息信息
{
    CDuiString sMsgType;          // DUI消息类型
    CDuiString sCtrlName;         // 控件名称
    UINT       nSig;              // 标记函数指针类型
    DUI_PMSG   pfn;               // 指向函数的指针
};

// DUI_DECLARE_MESSAGE_MAP 头文件中声明的宏内容，为了好看，直接就转成类的形式查看
class CNotifyPump {
private:                                                                  
    static const DUI_MSGMAP_ENTRY _messageEntries[]; // 一个存储消息处理函数的数组
protected:                                                                
    static const DUI_MSGMAP messageMap; // 一个 DUI_MSGMAP 的变量
    static const DUI_MSGMAP* PASCAL _GetBaseMessageMap(); 
    virtual const DUI_MSGMAP* GetMessageMap() const; 
}
// DUI_BASE_BEGIN_MESSAGE_MAP(theClass)
const DUI_MSGMAP* PASCAL CNotifyPump::_GetBaseMessageMap() { 
    return NULL;   // 如果是子类定义：这个为基类的 &baseClass::messageMap
}
const DUI_MSGMAP* CNotifyPump::GetMessageMap() const {
    return &CNotifyPump::messageMap; 
}
UILIB_COMDAT const DUI_MSGMAP CNotifyPump::messageMap = // 初始化为指向两个成员变量
    { &CNotifyPump::_GetBaseMessageMap, &CNotifyPump::_messageEntries[0] };
UILIB_COMDAT const DUI_MSGMAP_ENTRY CNotifyPump::_messageEntries[] = {
// DUI_END_MESSAGE_MAP() 
    { _T(""), _T(""), DuiSig_end, (DUI_PMSG)0 }
};

bool CNotifyPump::LoopDispatch(TNotifyUI& msg)
{
    const DUI_MSGMAP_ENTRY* lpEntry = NULL;
    const DUI_MSGMAP* pMessageMap = NULL;
    // GetMessage 是虚函数，获取真正的 messgeMap 地址
    for(pMessageMap = GetMessageMap(); pMessageMap!=NULL; pMessageMap = (*pMessageMap->pfnGetBaseMap)())
    {
        // pMessageMap 是当前类的 messageMap 指针，(*pMessageMap->pfnGetBaseMap)() 获取的是基类的 messageMap 指针
        // CNotifyPump 作为基类 (*pMessageMap->pfnGetBaseMap)() 返回的是 NULL
        ASSERT(pMessageMap != (*pMessageMap->pfnGetBaseMap)());
        // 循环遍历数组，找到合适的回调函数
        if ((lpEntry = DuiFindMessageEntry(pMessageMap->lpEntries,msg)) != NULL)
        {
            goto LDispatch;
        }
    }
    return false; // 没找到直接返回不处理

LDispatch:
    union DuiMessageMapFunctions mmf;
    mmf.pfn = lpEntry->pfn;

    bool bRet = false;
    int nSig;
    nSig = lpEntry->nSig;
    switch (nSig)
    {
    default:
        ASSERT(FALSE);
        break;
    case DuiSig_lwl:
        (this->*mmf.pfn_Notify_lwl)(msg.wParam,msg.lParam);
        bRet = true;
        break;
    case DuiSig_vn:
        (this->*mmf.pfn_Notify_vn)(msg);
        bRet = true;
        break;
    }
    return bRet;
}
// 以上，终于把所有的消息响应的内容搞定了
```

## 总结

通过上面的学习，基本上 DuiLib 里面的消息循环内容就全部学完了，怎么样，你学废了吗？

再次汇总总结一下所有消息的流程：

```c++
CPaintManagerUI::MessageLoop()
    |- CPaintManagerUI::TranslateMessage(&msg) 
        |- IMessageFilterUI::MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, bool& bHandled) = 0; // bool AddPreMessageFilter(IMessageFilterUI* pFilter);
        |- CWindowWnd::__WndProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
            |- WindowImplBase::HandleMessage(UINT uMsg, WPARAM wParam, LPARAM lParam)
                |- WindowImplBase::HandleCustomMessage(UINT uMsg, WPARAM wParam, LPARAM lParam, BOOL& bHandled)
                |- CPaintManagerUI::MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, LRESULT& lRes)
                    |- IMessageFilterUI::MessageHandler(UINT uMsg, WPARAM wParam, LPARAM lParam, bool& bHandled) = 0; // bool AddMessageFilter(IMessageFilterUI* pFilter);
                    |- CControlUI::Event(TEventUI& event)
                        |- CControlUI::OnEvent
                        |- CControlUI::DoEvent(TEventUI& event)
                            |- CPaintManagerUI::SendNotify(CControlUI* pControl, LPCTSTR pstrMessage, WPARAM wParam /*= 0*/, LPARAM lParam /*= 0*/, bool bAsync /*= false*/, bool bEnableRepeat /*= true*/)
                                |- WindowImplBase::Notify(TNotifyUI& msg); // INotifyUI::Notify(TNotifyUI& msg) = 0;
                                    |- CNotifyPump::NotifyPump(TNotifyUI& msg);
```

## 其他

**DllMain** 入口函数，Windows 在加载动态库的时候会查找并执行该函数，作为调用的依据，和 main 函数的一样。

**SubclassWindow** 简单讲就是用自定义的窗口过程替换原有的窗口过程，用自定义的窗口过程来处理该窗口的消息响应。窗口子类化技术最大的特点就是能够截取 Windows的消息。

**BOOL EnableWindow(  HWND hWnd,  BOOL bEnable )** 使能窗口的鼠标和键盘输入的消息。

**IsIconic** 判断窗口是否最小化。
