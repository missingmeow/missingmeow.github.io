---
title: C++ 协程实现
description: 了解 C++ 协程实现，千万级别的并发不再是梦。
date: 2021-07-09
---

## context 初体验

```cpp
#include <stdio.h>
#include <unistd.h>
#define _XOPEN_SOURCE
#include <ucontext.h>
 
int main(int argc, const char *argv[]) {
    ucontext_t context;
 
    getcontext(&context);
    puts("Hello world");
    sleep(1);
    setcontext(&context);
    return 0;
}
```

上面的程序很简单，首先定义了一个保存上下文的结构体变量 `context`，调用 `getcontext` 函数获取当前的上下文内容，保存到 `context` 变量中，打印输出 Hello World，然后再设置一下上下文的内容。

不知道输出结果有没有猜对呢，没错，就是一直不断的输出 Hello World。下面我们来看看 context 相关的具体内容。

## ucontext_t 结构体

`uconext_t` 是一个结构体，里面定义了保存上下文所需要的所有内容，我们来看一下 macOS 系统头文件中它的定义：

```cpp
_STRUCT_UCONTEXT
{
  int                     uc_onstack;
  __darwin_sigset_t       uc_sigmask;     /* signal mask used by this context */
  _STRUCT_SIGALTSTACK     uc_stack;       /* stack used by this context */
  _STRUCT_UCONTEXT        *uc_link;       /* pointer to resuming context */
  __darwin_size_t         uc_mcsize;      /* size of the machine context passed in */
  _STRUCT_MCONTEXT        *uc_mcontext;   /* pointer to machine specific context */
#ifdef _XOPEN_SOURCE
  _STRUCT_MCONTEXT        __mcontext_data;
#endif /* _XOPEN_SOURCE */
};

/* user context */
typedef _STRUCT_UCONTEXT        ucontext_t;     /* [???] user context */
```

我们挑几个重要的变量来说明一下：

1. `uc_link`: 当当前上下文运行终止时系统会恢复`uc_link`指向的上下文。注意，如果该值为空，则当前上下文执行完后线程会直接退出。
2. `uc_sigmask`: 为该上下文中的阻塞信号集合。
3. `uc_stack`: 为该上下文中使用的栈。
4. `uc_mcontext`: 保存的上下文的特定机器表示，包括调用线程的特定寄存器等，其实现方式依赖于底层运行的系统架构，是平台、硬件相关的。

## context 函数

跟上下文相关的函数一共只有 4 个，下面我们分别来看看吧。

### getcontext

```cpp
int getcontext(ucontext_t *ucp);
```

该函数的作用是把当前的上下文保存到 ucp 所指向的内容空间中。

### setcontext

```cpp
int setcontext(const ucontext_t *ucp);
```

这个函数的作用是将当前程序执行切换到参数ucp所指向的上下文状态中。

`setcontext` 的上下文 `ucp` 应该通过 `getcontext` 或者 `makecontext` 取得，如果调用成功则不返回。

如果上下文是通过调用 `getcontext` 取得，程序会继续执行这个调用。如果上下文是通过调用 `makecontext` 取得,程序会调用 `makecontext` 函数的第二个参数指向的函数，如果 `func` 函数返回，则恢复 `makecontext` 第一个参数指向的上下文第一个参数指向的上下文 `context_t` 中指向的 `uc_link`。如果 `uc_link` 为 `NULL`，则线程退出。

```cpp
// 通过修改一开始的例子，我们再来看看
#include <iostream>
#include <unistd.h>
#define _XOPEN_SOURCE
#include <ucontext.h>

static ucontext_t context;

void func() {
  getcontext(&context);
  std::cout << "hello world" << std::endl;
  sleep(1);
}

int main(int argc, const char* argv[]) {
  func();
  ucontext_t main;
  setcontext(&context);
  std::cout << "ok\n";
  return 0;
}
```

```sh
 ~/Projects/helloworld $ ./a.out           
hello world
hello world
ok
```

```cpp
// 再做一点简单的修改
#include <iostream>
#include <unistd.h>

#define _XOPEN_SOURCE
#include <ucontext.h>

static ucontext_t context;

void func() {
  std::cout << "hello world" << std::endl;
  sleep(1);
}

int main(int argc, const char* argv[]) {
  char stack[128 * 1024];
  getcontext(&context);
  context.uc_link = nullptr;
  context.uc_stack.ss_sp = stack;
  context.uc_stack.ss_size = 128 * 1024;
  makecontext(&context, func, 0);
  // setcontext(&context);
  ucontext_t main;
  swapcontext(&main, &context);
  std::cout << "ok\n";
  return 0;
}
// 从输出中发现，不管是 setcontext 还是 swapcontext 都不会输出 ok
```

### makecontext

```cpp
void makecontext(ucontext_t *ucp, void (*func)(), int argc, ...);
```

`makecontext` 修改通过 `getcontext` 取得的上下文 `ucp` (这意味着调用 `makecontext` 前必须先调用 `getcontext`)。然后给该上下文指定一个栈空间 `ucp->stack`，设置后继的上下文 `ucp->uc_link`。

当上下文通过 `setcontext` 或者 `swapcontext` 激活后，执行 `func` 函数，`argc` 为 `func` 的参数个数，后面是 `func` 的参数序列。当 `func` 执行返回后，继承的上下文被激活，如果继承上下文为 `NULL` 时，线程退出。

### swapcontext

```cpp
int swapcontext(ucontext_t *oucp, ucontext_t *ucp);
```

保存当前上下文到 `oucp` 结构体中，然后激活 `upc` 上下文。可以简单的把 `swapcontext = getcontext + setcontext`。

如果执行成功，getcontext 返回 0，setcontext 和 swapcontext不返回；如果执行失败，getcontext, setcontext, swapcontext 返回 -1，并设置对应的errno.

简单说来，getcontext 获取当前上下文，setcontext 设置当前上下文，swapcontext 切换上下文，makecontext 创建一个新的上下文。

## 进阶

当你把协程相关的基础知识都弄懂弄透后，就可以开始着手协程库的事情，进一步学习请继续学习参考链接中的内容。

## 参考链接

1. [ucontext-人人都可以实现的简单协程库](https://blog.csdn.net/qq910894904/article/details/41911175)
2. [云风基于C的协程库源码分析](https://www.jianshu.com/p/c4de909fee75)
