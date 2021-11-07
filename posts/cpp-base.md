---
title: 基础 C++
description: C++ 相关基础知识问答，带你深入了解 C++。
date: 2021-09-16
---

## 基础部分

### 1. extern

#### 1. extern “C”

C++语言支持函数重载，C语言不支持函数重载，函数被C\++编译器编译后在库中的名字与C语言的不同，C语言只导出函数名，C\++会连同参数一起导出函数名，导致C\++编译器找不到C的函数名。用 extern “C” 关键字，就可以告诉C\++编译器用C方式的导出符号去连接程序。

> 例子：假设函数void foo(int x, int y);
>
> 该函数被C编译器编译后在库中的名字为：_foo
>
> 该函数被C++编译器编译后在库中的名字为:\_foo\_int_int

#### 2. extern 变量

声明函数或全局变量的作用范围的关键字，其声明的函数和变量可以在本模块或其他模块中使用，记住它是一个声明不是定义!也就是说B模块(编译单元)要是引用模块(编译单元)A中定义的全局变量或函数时，它只要包含A模块的头文件即可,在编译阶段，模块B虽然找不到该函数或变量，但它不会报错，它会在连接时从模块A生成的目标代码中找到此函数。

#### 3. 关于 `extern` 详细讨论，[看这里](http://www.cnblogs.com/yc_sunniwell/archive/2010/07/14/1777431.html)

### 2. volatile

 `volatile` 关键字是一种类型修饰符，用它声明的类型变量表示可以被某些编译器未知的因素更改，比如：操作系统、硬件或者其它线程等。遇到这个关键字声明的变量，编译器对访问该变量的代码就不再进行优化，从而可以提供对特殊地址的稳定访问。声明时语法：int volatile vInt; 当要求使用 `volatile` 声明的变量的值的时候，系统总是重新从它所在的内存读取数据，即使它前面的指令刚刚从该处读取过数据。而且读取的数据立刻被保存。

 ```c++
volatile int *p = /* ... */;
int a, b;
a = *p;
b = *p;

/*********************
若忽略 volatile，那么 p 就只是一个「指向 int 类型的指针」。
这样一来，a = *p; 和 b = *p; 两句，就只需要从内存中读取一次就够了。
因为从内存中读取一次之后，CPU 的寄存器中就已经有了这个值；把这个值直接复用就可以了。
这样一来，编译器就会做优化，把两次访存的操作优化成一次。
这样做是基于一个假设：我们在代码里没有改变 p 指向内存地址的值，那么这个值就一定不会发生改变。

此处说的「读取内存」，包括了读取 CPU 缓存和读取计算机主存。

然而，由于 MMIP（Memory mapped I/O）的存在，这个假设不一定是真的。
例如说，假设 p 指向的内存是一个硬件设备。
这样一来，从 p 指向的内存读取数据可能伴随着可观测的副作用：硬件状态的修改。
此时，代码的原意可能是将硬件设备返回的连续两个 int 分别保存在 a 和 b 当中。
这种情况下，编译器的优化就会导致程序行为不符合预期了。
 **********************/
 ```

 关于 `volatile` 的讨论，[看这里](https://liam0205.me/2018/01/18/volatile-in-C-and-Cpp/)

### 3. static

#### 1. 隐藏

当我们同时编译多个文件时，所有未加`static`前缀的全局变量和函数都具有全局可见性。参考`extern`变量在其他文件引用全局变量。

如果加了`static`，就会对其它源文件隐藏。利用这一特性可以在不同的文件中定义同名函数和同名变量，而不必担心命名冲突。`static`可以用作函数和变量的前缀，对于函数来讲，`static`的作用仅限于隐藏，而对于变量，`static`还有下面两个作用。

#### 2. 保持变量内容的持久

存储在静态数据区的变量会在程序刚开始运行时就完成初始化，也是唯一的一次初始化。共有两种变量存储在静态存储区：全局变量和`static`变量，只不过和全局变量比起来，`static`可以控制变量的可见范围(如在某个函数内声明)，说到底`static`还是用来隐藏的。

#### 3. 默认初始化为0

在静态数据区，内存中所有的字节默认值都是0x00，某些时候这一特点可以减少程序员的工作量。比如初始化一个稀疏矩阵，我们可以一个一个地把所有元素都置0，然后把不是0的几个元素赋值。如果定义成静态的，就省去了一开始置0的操作。再比如要把一个字符数组当字符串来用，但又觉得每次在字符数组末尾加‘\0’太麻烦。如果把字符串定义成静态的，就省去了这个麻烦，因为那里本来就是‘\0’。

注意，虽然内存会被初始化为 0，但构造函数对于全局静态变量来说会在程序开始前调用，静态局部变量则会在程序第一次运行到该处时才会进行初始化并且只能初始化一次。

#### 4. C++重用了这个关键字，并赋予它与前面不同的第三种含义：表示属于一个类而不是属于此类的任何特定对象的变量和函数

- 1. 一个类中可以有一个或多个静态成员变量，所有的对象都共享这些静态成员变量，都可以引用它。`static`成员变量不占用对象的内存，而是在所有对象之外开辟内存，即使不创建对象也可以访问。

- 2. `static`成员变量和普通`static`变量一样，都在内存分区中的全局数据区分配内存，到程序结束时才释放。这就意味着，`static`成员变量不随对象的创建而分配内存，也不随对象的销毁而释放内存。而普通成员变量在对象创建时分配内存，在对象销毁时释放内存。

- 3. 静态成员变量必须初始化，而且只能在类体外进行。例如：`int Student::m_total = 10;`初始化时可以赋初值，也可以不赋值。如果不赋值，那么会被默认初始化为 0。全局数据区的变量都有默认的初始值 0，而动态数据区（堆区、栈区）变量的默认值是不确定的，一般认为是垃圾值。

- 4. 静态成员变量既可以通过对象名访问，也可以通过类名访问，但要遵循 private、protected 和 public 关键字的访问权限限制。当通过对象名访问时，对于不同的对象，访问的是同一份内存。

### 4. 全局变量、静态全局变量、静态局部变量和局部变量

1. 按存储区域分，全局变量、静态全局变量和静态局部变量都存放在内存的静态存储区域，局部变量存放在内存的栈区。

2. 按作用域分，全局变量在整个工程文件内都有效；静态全局变量只在定义它的文件内有效；静态局部变量只在定义它的函数内有效，只是程序仅分配一次内存，函数返回后，该变量不会消失；局部变量在定义它的函数内有效，但是函数返回后失效。

### 5. const

#### 1. 定义常量

`const`修饰变量，以下两种定义形式在本质上是一样的。它的含义是：`const`修饰的类型为TYPE的变量value是不可变的。

```c++
TYPE const ValueName = value; 
const TYPE ValueName = value;
```

关于指针中使用`const`：

- 1. 指针本身是常量不可变`char* const pContent;`
- 2. 指针所指向的内容是常量不可变`const char *pContent;`
- 3. 两者都不可变`const char* const pContent;`
- 4. 还有其中区别方法，沿着`*`号划一条线：如果`const`位于`*`的左侧，则`const`就是用来修饰指针所指向的变量，即指针指向为常量；
如果`const`位于`*`的右侧，`const`就是修饰指针本身，即指针本身是常量。

> 定义指针变量里`*`读作“指针指向”

#### 2. 函数中使用`const`(保护被修饰的东西)

- 1. 传递过来的参数在函数内不可以改变

```c++
void function(const int Var);
```

- 2. 参数指针所指内容为常量不可变

```c++
void function(const char* Var);
```

- 3. 参数指针本身为常量不可变

```c++
void function(char* const Var);
```

- 4. 参数为引用，为了增加效率同时防止修改。修饰引用参数时：

```c++
void function(const Class& Var); //引用参数在函数内不可以改变
void function(const TYPE& Var); //引用参数在函数内为常量不可变
```

> 只有引用的const传递可以传递一个临时对象,因为临时对象都是const属性, 且是不可见的,他短时间存在一个局部域中,所以不能使用指针,只有引用的const传递能够捕捉到这个家伙.

#### 3. 类中使用`const`

- 1. 修饰成员变量

```c++
//const修饰类的成员变量，表示成员常量，不能被修改，同时它只能在初始化列表中赋值。
class A
{ 
    …
    const int nValue;         //成员常量不能被修改
    …
    A(int x): nValue(x) { } ; //只能在初始化列表中赋值
} 
```

- 2. 修饰成员函数

`const`修饰类的成员函数，则该成员函数不能修改类中任何非const成员函数。一般写在函数的最后来修饰。

```c++
class A
{ 
    …
    void function()const; //常成员函数, 它不改变对象的成员变量.也不能调用类中任何非const成员函数。
}
```

> 对于const类对象/指针/引用，只能调用类的const成员函数，因此，const修饰成员函数的最重要作用就是限制对于const对象的使用。
>
>a. const成员函数不被允许修改它所在对象的任何一个数据成员。（`mutable`修饰的成员变量除外）
>
>b. const成员函数能够访问对象的const成员，而其他成员函数不可以。

- 3. `const`修饰类对象/对象指针/对象引用

const修饰类对象表示该对象为常量对象，其中的任何成员都不能被修改。对于对象指针和对象引用也是一样。

const修饰的对象，该对象的任何非const成员函数都不能被调用，因为任何非const成员函数会有修改成员变量的企图。

```c++
class AAA
{ 
    void func1(); 
    void func2() const; 
} 
const AAA aObj; 
aObj.func1(); //×
aObj.func2(); //正确

const AAA* aObj = new AAA(); 
aObj-> func1(); //×
aObj-> func2(); //正确
```

#### 4. 便于类型检查(当define用时)

const常量有数据类型，而宏常量没有数据类型。编译器可以对前者进行类型安全检查，而对后者只进行字符替换，没有类型安全检查，并且在字符替换时可能会产生意料不到的错误

#### 5. 可以节省空间，避免不必要的内存分配

const定义常量从汇编的角度来看，只是给出了对应的内存地址，而不是象#define一样给出的是立即数，所以，const定义的常量在程序运行过程中只有一份拷贝，而#define定义的常量在内存中有若干个拷贝

```c++
#define PI 3.14159         //常量宏
const doulbe Pi=3.14159;  //此时并未将Pi放入ROM中
......
double i=Pi;   //此时为Pi分配内存，以后不再分配！
double I=PI;  //编译期间进行宏替换，分配内存
double j=Pi;  //没有内存分配
double J=PI;  //再进行宏替换，又一次分配内存！
```

### 6. new/delete 和 malloc/free

1. malloc/free是C/C\++语言的**标准库函数**，new/delete是C\++的**运算符**。它们都可用于申请动态内存和释放内存。但是new能够自动分配空间大小，而malloc需要计算字节数。
2. 对于**非内部数据类型**的对象而言，光用maloc/free无法满足动态对象的要求。**对象在创建的同时要自动执行构造函数，对象在消亡之前要自动执行析构函数。**由于malloc/free是库函数而不是运算符，不在编译器控制权限之内，不能够把执行构造函数和析构函数的任务强加于malloc/free。因此C\++语言需要一个能**完成动态内存分配和初始化工作的运算符new**，以及一个能**完成清理与释放内存工作的运算符delete**。注意new/delete不是库函数。---简而言之 new/delete能进行对对象进行构造和析构函数的调用进而对内存进行更加详细的工作，而malloc/free不能。
3. **new是类型安全的，而malloc不是**，比如：

    int* p = new float[2]; // 编译时指出错误

    int\* p = malloc(2\*sizeof(float)); // 编译时无法指出错误

    new operator 由两步构成，分别是 operator new（分配内存，可单独调用获得void*，可重载） 和 construct（构造函数，由编译器决定）

    **new (buffer)** Widget(Size); // 在指定内存地址buffer内调用构造函数

    pw->~Widget();// 析构pw所指的Widget对象

4. malloc分配失败时，返回的是空指针。1993年前，c++一直要求在内存分配失败时operator  new要返回0，现在则是要求operator  new抛出std::bad_alloc异常。

- 既然new/delete的功能完全覆盖了malloc/free，为什么C\++还保留malloc/free呢？因为C\++程序经常要调用C函数，而C程序只能用malloc/free管理动态内存。如果用free释放“new创建的动态对象”，那么该对象因无法执行析构函数而可能导致程序出错。如果用delete释放“malloc申请的动态内存”，理论上讲程序不会出错，但是该程序的可读性很差。所以new/delete，malloc/free必须配对使用。

### 7. 引用与指针

1. 引用必须被初始化（一定代表某个对象），指针不必。
2. 引用初始化以后不能被改变，指针可以改变所指的对象。
3. 不存在指向空值的引用，但是存在指向空值的指针。（PS：使用引用前不需测试其有效性，因而效率更高）

### 8. C++类成员函数和成员变量的存储方式

1. 所有的函数都是存放在代码区的，不管是全局函数还是成员函数。其中静态成员函数和一般成员函数的区别就是没有 this 指针。
2. 如果类是空类（没有成员变量）编译器会给它一个字节来填充。如果只有静态成员变量也是一个字节大小。**静态成员变量和静态成员函数是类的一部分，而不是对象的一部分!**
3. 如果类中含有虚函数，那么它会生成一个虚函数表的指针__vfptr，在类对象最开始的内存数据中（4字节）。
4. 除了以上的情况类的大小等于类中所有成员变量的大小之和。（注意内存对齐的情况，最大对齐字节跟内置类型的最大字节有关，int为4字节，double为8字节）

```c++
class CTest
{
public:
    CTest(){}
    ~CTest(){}

    static int i;
    int j;           // 4 字节
    char b;          // 1 字节
};
// 理论上这个类应该只有5个字节大小，但由于内存对齐，实际大小是8字节
// 如果 j 是double类型的话，实际大小为16字节
// 还会跟变量的顺序有关， char/int/char[5] 16字节，char/char[5]/int 12字节
```

### 9. `static_cast`，`dynamic_cast`，`const_cast`，`reinterpret_cast`

#### 1. **const_cast**

通常用来将对象的常量性转除。也是唯一有此能力的C+\+-style转型操作符。

```c++
class CSomeClass  
{  
    public:  
        void DisplayMembers();//应该为const但确不是，假设CSomeClass归第三方库所有，你无法修改这时候const_cast就用上了      
}  
void DisplayAllData(const CSomeClass& mData)  
{  
    CSomeClass& refData = const_cast<CSomeClass&>(mData);//先去除常量性   
    mData.DisplayMembers();  
} 
```

#### 2. **static_cast**

用来强迫隐式转换，例如将 non-const 对象转为 const 对象，或将 int 转为 double 等等。它也可以用来执行上述多种转换的反向转换，例如将 void* 指针转为 typed 指针，将 pointer-to-base 转为 pointer-to-derived 。但它无法将 const 转为 non-const，这个只有 const_cast 才办得到。

```c++
CBase* pBase = new CDerived();  
CDerived *pDerived = static_cast<CDerived*>(pBase);  
//static_cast实现了基本的编译阶段检查，确保指针被转换为相关的类型，该转换编译器会发出错误
CUnrelated* pUnrelated = static_cast<CUnrelated *>(pBase);  
```

#### 3. **dynamic_cast**

主要用来执行“安全向下转型”，也就是用来决定某对象是否归属继承体系中的某个类型（`无法应用在缺乏虚函数的类型身上`）。也就是说你可以利用 dynamic_cast ，将“指向 base class objects 的 pointers 或 references”转型为“指向 derived class objects 的 pointers 或 references”，并得知转型是否成功。如果转型失败，会以一个 null 指针（当转型对象是指针）或一个 exception（当转型对象是 reference）表现出来。它是唯一无法由旧式语法执行的动作，也是唯一可能耗费重大运行成本的转型动作。

> 与静态类型转换相反，转换在运行阶段，可检查dynamic_cast的操作结果以判断类型的转换成功

```c++
CBase* pBase = new CDerived();  
CDerived* pDerived = dynamic_cast<CDerived*>(pBase);  
if(pDerived) //检查类型是否转换成功
    pDerived->CallDerivedClassFunction();  
```

#### 4. **reinterpret_cast**

意图执行低级转型，实际动作（及结果）可能取决于编译器，这也就表示它不可移植。例如将一个 pointer to int 转型为一个 int 。这一类转型在低级代码以外很少见。

> 与c风格的转换最为接近的类型转换运算符，它让程序员能够将一种类型转换为另一种类型，不管他们是否相关，所以要尽量避免使用，避免产生类型的不安全

```c++
#include <iostream>  
using namespace std;  
class A  
{  
    public:  
    A(){ma = 1;mb = 2;}  
    void fun(){ printf("%d,%d",ma,mb); }  
    private:  
        int ma;  
        int mb;  
};  
class B{  
public:  
    B(){ mc = 3;}  
    void fun(){ printf("%d",mc); }  
private:  
    int mc;  
};  
int main()  
{  
    A a;  
    A *pa = &a;  
    B *pb = reinterpret_cast<B *>(pa);//有的题目这里为：B *p = (*)(&a); 两个不想关的类指针的转换  
    pb->fun();//结果输出1,pb指向对象的首地址，fun来打印mc,mc距离对象的首地址的偏移为0，于是打印了对象a首地址偏移为0的值，即为ma的值
    return 0;  
}
```

#### 5. 旧式转型

(T)expression //将expression转型为T

T(expression) //将expression转型为T

新式转型更好，原因：

容易在代码中被辨识出来，因而得以简化“找出类型系统在哪个地点被破坏”的过程。
各转型动作的目标愈窄化，编译器愈可能诊断出错误的运用。举个例子，如果你打算将常量性（constness）去掉，除非使用新式转型中的 const_cast 否则无法通过编译。

### 10. 请你说一说strcpy和strlen

逐字节拷贝，遇到 '\0' 时停止。

逐字节计算，遇到 '\0' 时停止。

### 11. virtual

C++中的虚函数的作用主要是实现了多态的机制。关于多态，简而言之就是用父类型别的指针指向其子类的实例，然后通过父类的指针调用实际子类的成员函数。

对C++ 了解的人都应该知道虚函数（Virtual Function）是通过一张虚函数表（Virtual Table）来实现的。简称为V-Table。在这个表中，主是要一个类的虚函数的地址表，这张表解决了继承、覆盖的问题，保证其容真实反应实际的函数。这样，在有虚函数的类的实例中这个表被分配在了这个实例的内存中，所以，当我们用父类的指针来操作一个子类的时候，这张虚函数表就显得由为重要了，它就像一个地图一样，指明了实际所应该调用的函数。因此有必要知道虚函数在内存中的分布。

typeinfo 一般会是虚函数表的第一个元素。

当调用一个虚函数时，首先通过对象内存中的vptr找到虚函数表vtbl，接着通过vtbl找到对应虚函数的实现区域并进行调用。其中被执行的代码必须和调用函数的对象的动态类型相一致。编译器需要做的就是如何高效的实现提供这种特性。不同编译器实现细节也不相同。大多数编译器通过虚表vtbl（virtual table）和虚表指针vptr（virtual table pointer）来实现的。 当一个类声明了虚函数或者继承了虚函数，这个类就会有自己的vtbl。vtbl核心就是一个函数指针数组，有的编译器用的是链表，不过方法都是差不多。vtbl数组中的每一个元素对应一个函数指针指向该类的一个虚函数，同时该类的每一个对象都会包含一个vptr，vptr指向该vtbl的地址。

单继承的情况下只有一个虚函数表的指针，多继承的情况下则会有多个虚函数表的指针。

虚函数表创建时机是在编译期间。编译期间编译器就为每个类确定好了对应的虚函数表里的内容。所以在程序运行时，编译器会把虚函数表的首地址赋值给虚函数表指针，所以，这个虚函数表指针就有值了。

构造函数不能为虚函数：因为在创建对象时会调用构造函数，构造函数在这时初始化对象的虚表指针。如果构造函数是虚函数，那么意味着对象必须要通过虚表指针去调用构造函数，但是在调用构造函数之前，虚表指针还没被赋值，这就出现了矛盾。

一个父类写了一个 virtual 函数，如果子类覆盖它的函数不加 virtual，也能实现多态，只是这样阅读性不高。

虚拟继承：虚拟继承是多重继承中特有的概念。虚拟基类是为解决多重继承而出现的。如:类D继承自类B1、B2，而类B1、B2都继承自类A，因此在类D中两次出现类A中的变量和函数。为了节省内存空间，可以将B1、B2对A的继承定义为虚拟继承，而A就成了虚拟基类。

由于有了间接性和共享性两个特征，所以决定了虚继承体系下的对象在访问时必然会在时间和空间上与一般情况有较大不同。

1. 时间：在通过继承类对象访问虚基类对象中的成员（包括数据成员和函数成员）时，都必须通过某种间接引用来完成，这样会增加引用寻址时间（就和虚函数一样），其实就是调整this指针以指向虚基类对象，只不过这个调整是运行时间接完成的。
2. 空间：由于共享所以不必要在对象内存中保存多份虚基类子对象的拷贝，这样较之多继承节省空间。虚拟继承与普通继承不同的是，虚拟继承可以防止出现菱形继承时，一个派生类中同时出现了两个基类的子对象。也就是说，为了保证这一点，在虚拟继承情况下，基类子对象的布局是不同于普通继承的。因此，它需要多出一个指向基类子对象的指针。

```cpp
#include <iostream>

class A {
public:
  virtual ~A() {}
  virtual void foo() { std::cout << "A::foo()" << std::endl; }
  long long aa = 111;
};

class B : virtual public A {
public:
  virtual void foo() { std::cout << "B::foo()" << std::endl; }
  long long bb = 222;
};

class C : public A {
public:
  virtual void foo() { std::cout << "C::foo()" << std::endl; }
  long long cc = 333;
};
// 其中 sizeof(B) = 32, sizeof(A) = 24
// B 内存分布为：b[0]:虚函数表指针 b[1]:222 b[2]:虚继承A指针 b[3]:111
// C 内存分布为：c[0]:虚函数表指针 c[1]:222 c[2]:111
```

### 12. 异常

构造函数可以抛出异常

1. 构造函数中抛出异常，会导致析构函数不能被调用，但对象本身已申请到的内存资源会被系统释放（已申请到资源的内部成员变量会被系统依次逆序调用其析构函数）。
2. 因为析构函数不能被调用，所以可能会造成内存泄露或系统资源未被释放。
3. 构造函数中可以抛出异常，但必须保证在构造函数抛出异常之前，把系统资源释放掉，防止内存泄露。

析构函数不能抛出异常

1. 如果析构函数抛出异常，则异常点之后的程序不会执行，如果析构函数在异常点之后执行了某些必要的动作比如释放某些资源，则这些动作不会执行，会造成诸如资源泄漏的问题。
2. 通常异常发生时，c++的机制会调用已经构造对象的析构函数来释放资源，此时若析构函数本身也抛出异常，则前一个异常尚未处理，又有新的异常，会造成程序崩溃的问题。
3. 当在某一个析构函数中会有一些可能（哪怕是一点点可能）发生异常时，那么就必须要把这种可能发生的异常完全封装在析构函数内部，决不能让它抛出函数之外。

### 13. 数组和指针的区别

1. 数组要么在全局数据区被创建，要么在栈上被创建；指针可以随时指向任意类型的内存块；
2. 修改内容上的差别：

    ```cpp
    char a[] = “hello”;
    a[0] = ‘X’;
    char *p = “world”; // 注意p 指向常量字符串
    p[0] = ‘X’; // 编译器不能发现该错误，运行时错误
    ```

3. 用运算符sizeof 可以计算出数组的容量（字节数）。sizeof(p),p 为指针得到的是一个指针变量的字节数，而不是p所指的内存容量。C++/C语言没有办法知道指针所指的内存容量，除非在申请内存时记住它。注意当数组作为函数的参数进行传递时，该数组自动退化为同类型的指针。

## 高级部分

### 1. 请你来写个函数在main函数执行前先运行

```c++
// It runs when a shared library is loaded, typically during program startup.
__attribute__((constructor)) void before()
{
    printf("before main\n");
}

// The destructor runs when the shared library is unloaded, typically at program exit.
__attribute__((destructor)) void after()
{
    printf("after");
}
```

### 2. RAII

RAII（Resource Acquisition Is Initialization）,也称直译为“资源获取就是初始化”，是C++语言的一种管理资源、避免泄漏的机制。C++标准保证任何情况下，已构造的对象最终会销毁，即它的析构函数最终会被调用。 RAII 机制就是利用了C++的上述特性,在需要获取使用资源RES的时候，构造一个临时对象(T)，在其构造T时获取资源，在T生命期控制对RES的访问使之始终保持有效，最后在T析构的时候释放资源。以达到安全管理资源对象，避免资源泄漏的目的。

资源的使用一般经历三个步骤a.获取资源 b.使用资源 c.销毁资源，但是资源的销毁往往是程序员经常忘记的一个环节，所以程序界就想如何在程序员中让资源自动销毁呢？c++之父给出了解决问题的方案：RAII，它充分的利用了C++语言局部对象自动销毁的特性来控制资源的生命周期

整个RAII过程总结四个步骤：

1. 设计一个类封装资源
2. 在构造函数中初始化
3. 在析构函数中执行销毁操作
4. 使用时声明一个该对象的类

典型例子：lock_guard, shared_ptr, unique_ptr

### 3. RTTI

运行时类型识别 RTTI (Run-Time Type Identification)，主要通过 typeid 和 dynamic_cast 来实现。

#### 1. typeid 运算符

typeid 表达式为左值表达式，指代一个具有静态存储期的，多态类型 std::type_info 或某个其派生类型的 const 限定版本类型的对象。

在所有情况下，typeid 都忽略顶层的 cv 限定符（即 typeid(T) == typeid(const T)）。

若 typeid 的操作数为类类型或到类类型的引用，则该类类型不得为不完整类型。

若对处于构造和销毁过程中的对象（在构造函数或析构函数之内，包括构造函数的初始化器列表或默认成员初始化器）使用 typeid，则此 typeid 所指代的 std::type_info 对象表示正在构造或销毁的类，即便它不是最终派生类。

当应用于多态类型的表达式时，typeid 表达式的求值可能涉及运行时开销（虚表查找），其他情况下 typeid 表达式都在编译时解决。

typeid 所指代的对象的析构函数是否在程序结束时执行是未指明的。

不保证同一类型上的 typeid 表达式的所有求值都指代同一个 std::type_info 实例，不过这些 type_info 对象的 std::type_info::hash_code 相同，其 std::type_index 也相同。

```cpp
const std::type_info& ti1 = typeid(A);
const std::type_info& ti2 = typeid(A);
 
assert(&ti1 == &ti2); // 不保证
assert(ti1.hash_code() == ti2.hash_code()); // 保证
assert(std::type_index(ti1) == std::type_index(ti2)); // 保证
```

#### 2. std::type_info 对象

类 type_info 保有一个类型的实现指定信息，包括类型的名称和比较二个类型相等的方法或相对顺序。这是 typeid 运算符所返回的类。

type_info 既不满足可复制构造 (CopyConstructible) 也不满足可复制赋值 (CopyAssignable) 。

```cpp
class _LIBCPP_EXCEPTION_ABI _LIBCPP_TYPE_INFO_VTABLE_POINTER_AUTH type_info
{
  type_info& operator=(const type_info&);
  type_info(const type_info&);

 protected:
    typedef __type_info_implementations::__impl __impl;

    __impl::__type_name_t __type_name;

    _LIBCPP_INLINE_VISIBILITY
    explicit type_info(const char* __n)
      : __type_name(__impl::__string_to_type_name(__n)) {}

public:
    _LIBCPP_AVAILABILITY_TYPEINFO_VTABLE
    virtual ~type_info();

    _LIBCPP_INLINE_VISIBILITY
    const char* name() const _NOEXCEPT
    {
      return __impl::__type_name_to_string(__type_name);
    }

    _LIBCPP_INLINE_VISIBILITY
    bool before(const type_info& __arg) const _NOEXCEPT
    {
      return __impl::__lt(__type_name, __arg.__type_name);
    }

    _LIBCPP_INLINE_VISIBILITY
    size_t hash_code() const _NOEXCEPT
    {
      return __impl::__hash(__type_name);
    }

    _LIBCPP_INLINE_VISIBILITY
    bool operator==(const type_info& __arg) const _NOEXCEPT
    {
      return __impl::__eq(__type_name, __arg.__type_name);
    }

    _LIBCPP_INLINE_VISIBILITY
    bool operator!=(const type_info& __arg) const _NOEXCEPT
    { return !operator==(__arg); }
};
```

#### 3. std::type_index 类（C++11引入）

type_index 类是一个围绕 std::type_info 的包装类，它可用作关联与无序关联容器的索引。它与 type_info 对象的关系通过一个指针维系，故而 type_index 为可复制构造 (CopyConstructible) 且为可复制赋值 (CopyAssignable) 。

```cpp
class _LIBCPP_TEMPLATE_VIS type_index
{
    const type_info* __t_;
public:
    _LIBCPP_INLINE_VISIBILITY
    type_index(const type_info& __y) _NOEXCEPT : __t_(&__y) {}

    _LIBCPP_INLINE_VISIBILITY
    bool operator==(const type_index& __y) const _NOEXCEPT
        {return *__t_ == *__y.__t_;}
    _LIBCPP_INLINE_VISIBILITY
    bool operator!=(const type_index& __y) const _NOEXCEPT
        {return *__t_ != *__y.__t_;}
    _LIBCPP_INLINE_VISIBILITY
    bool operator< (const type_index& __y) const _NOEXCEPT
        {return  __t_->before(*__y.__t_);}
    _LIBCPP_INLINE_VISIBILITY
    bool operator<=(const type_index& __y) const _NOEXCEPT
        {return !__y.__t_->before(*__t_);}
    _LIBCPP_INLINE_VISIBILITY
    bool operator> (const type_index& __y) const _NOEXCEPT
        {return  __y.__t_->before(*__t_);}
    _LIBCPP_INLINE_VISIBILITY
    bool operator>=(const type_index& __y) const _NOEXCEPT
        {return !__t_->before(*__y.__t_);}

    _LIBCPP_INLINE_VISIBILITY
    size_t hash_code() const _NOEXCEPT {return __t_->hash_code();}
    _LIBCPP_INLINE_VISIBILITY
    const char* name() const _NOEXCEPT {return __t_->name();}
};
```

#### 4. dynamic_cast

dynamic_cast 只能用作有虚函数的类型转换。正如我们所知道的，多态的实现依赖于虚函数和继承，更本质的说就是依赖于虚表指针，一般情况下，虚表指针（_vptr）都位于对象的首地址，指向一个虚表(_table)，而虚表中的内容则是虚函数的地址。

如果dynamic_cast转换指针类型失败，则返回0；如果转换引用类型失败，则抛出一个bad_cast类型的异常。

#### 5. RTTI

为了能够在运行时获取对象类型的type_info信息，C++增加了两个运算符：typeid 和 dynamic_cast 两个运算符；

RTTI就是为每个类型增加一个type_info对象；如果是虚拟机制（即存在虚函数），则type_info对象的指针就放在了vtable中的第一个槽位；

typeid的作用是返回一个type_info对象的引用，如果是非多态对象或者是基本数据类型，就会返回静态类型所对应的type_info对象。

真正奇特的地方在于，对于存在继承关系的对象，也就是为了支持dynamic_cast运算符，RTTI必须维护一棵继承树，来确认是否存在is-a关系，这就联系到了dynamic_cast运算符的使用时，如果存在is-a关系时可以正常转换的原因，而更关键的是，dynamic_cast比较的对象的真正类型，而这个真正的类型就是通过访问 vtable 来获取 type_info的，所以，真正支持dynamic_cast运算符的是RTTI。

[参考链接](https://blog.csdn.net/bitboss/article/details/53574236)

### 4. 如何判断线程死锁？

参考链接 [C++如何判断一个程序是 死锁 还是 死循环，如何进行问题定位与分析
](https://blog.csdn.net/LearnLHC/article/details/115594187)

在《Windows核心编程》一书中 “9.8.6 使用等待链遍历API来检测死锁”，其中有提到如何判断线程是否发生死锁。

Windows 提供了一组新的等待链遍历(Wait Chain Traversal, WCT) API，这些函数可以让我们列出所有的锁，并检测进程内部，甚至是进程之间的死锁。

“等待链”的定义：一条等待链是一个序列，在这个序列中线程和同步对象交替出现，每个线程等待它后面的对象，而该对象却为等待链中更后面的线程所占用。

我们可以在这里看到书中提供的例子，如何检测线程是否发生死锁：[09-LockCop.exe](https://github.com/cggos/windows_via_cpp/tree/master/09-LockCop)

### 5. 实现一个读写锁？

```cpp
class RWLock {
// 简单的思路如下，实现细节自己补充即可
public:
    void RLock() {} // rcond.wait
    void RUnlock() {}
    void WLock() {} // wcond.wait
    void WUnlock() {}
private:
    long r_nums = 0; // 当前多少个读锁在使用
    long w_nums = 0; // 当前多少个写锁在使用（一般只能为1个）
    long r_waits = 0;// 当前多少个读锁在等待，没写锁在等时 rcond.notify_all
    long w_waits = 0;// 当前多少个写锁在等待，有写锁在等时先调用 wcond.notify_one
    std::mutex m;
    std::condition_variable rcond;
    std::condition_variable wcond;
};
```

### 6. 类成员函数在成员初始化列表和在构造函数体内完成初始化有什么区别

看下面的案例：

```cpp
class Word {
    string  _name;
    int     _cnt;
public:
    Word() {
        _name = 0;
        _cnt = 0;
    }
};
```

Word 的构造函数被编译器解析后可能会是下面这样：

```cpp
// C++ 伪码
Word::Word() {
    // 调用 string 的默认构造函数
    _name.string::string();
    // 产生临时性对象
    string temp = string(0);
    // 拷贝 _name
    _name.string::operator=(temp);
    // 摧毁临时性对象
    temp.string::~string();
    _cnt = 0;
}
```

如果使用的的成员初始化列表进行初始化的结果又会是什么样的呢？

```cpp
class Word {
    string  _name;
    int     _cnt;
public:
    Word() : _name(0) {
        _cnt = 0;
    }
};


// C++ 伪码
Word::Word() {
    _name.string::string(0);
    _cnt = 0;
}
```

看出区别了吗，明显后面的操作效率更高。

另外需要注意的是，类成员变量的初始化顺序跟**成员初始化列表**没有关系，跟类成员变量的声明顺序有关，编译器会根据变量的声明顺序在构造函数内插入初始化操作。

### 7. C++内存泄漏如何排查？

使用工具 varglind, mtrace 排查

VS： crt，vld
