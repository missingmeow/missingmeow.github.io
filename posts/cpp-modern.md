---
title: 现代 C++
description: C++ 高级特性说明及使用方法，带你快速上手使用高级 C++。
date: 2021-07-08
---

## C++11

### nullptr

`nullptr`主要是为了替代`NULL`。`nullptr`的类型为 `nullptr_t`，能够隐式的转换为任何指针或成员指针的类型，也能和他们进行相等或者不等的比较。

### constexpr

`constexpr`让用户显式的声明函数或对象构造函数在编译器会成为常数。

```c++
constexpr int fibonacci(const int n) {
    return n == 1 || n == 2 ? 1 : fibonacci(n-1)+fibonacci(n-2);
}

char arr[fibonacci(5)]; // 合法
```

### auto

`auto` 关键字进行类型推导。不能用于函数传参。

```c++
// 不用类型推导之前
for(vector<int>::const_iterator itr = vec.cbegin(); itr != vec.cend(); ++itr)
// 使用auto后
for(auto itr = vec.cbegin(); itr != vec.cend(); ++itr);
```

### decltype

`decltype` 关键字是为了解决`auto`关键字只能对变量进行类型推导的缺陷而出现的。

**注意如果对象的名字带有括号，那么它会被当做通常的左值表达式，从而 decltype(x) 和 decltype((x)) 通常是不同的类型。**

在难以或不可能以标准写法进行声明的类型时，decltype 很有用，例如 lambda 相关类型或依赖于模板形参的类型。

```c++
auto x = 1;
auto y = 2;
decltype(x+y) z;

struct A { double x; };
const A* a;
decltype(a->x) y;       // y 的类型是 double（其声明类型）
decltype((a->x)) z = y; // z 的类型是 const double&（左值表达式）

// 函数模板
template<typename T, typename U>
auto add(T x, U y) -> decltype(x+y) {
    return x+y;
}
```

### 区间迭代

```c++
int array[] = {1,2,3,4,5};
for(auto &x : array) {
    std::cout << x << std::endl;
}
```

使用新版特性便利元素的前后对比：

```c++
std::vector<int> arr(5, 100);
for(std::vector<int>::iterator i = arr.begin(); i != arr.end(); ++i) {
    std::cout << *i << std::endl;
}
// & 启用了引用, 如果没有则对 arr 中的元素只能读取不能修改
for(auto &i : arr) {    
    std::cout << i << std::endl;
}
```

### std::initializer_list

允许构造函数或其他函数像参数一样使用初始化列表。

```c++
#include <initializer_list>

// 构造函数
class Magic {
public:
    Magic(std::initializer_list<int> list)
    {
        for(auto& i : list)
        {}
    }
};

Magic magic = {1,2,3,4,5};

std::vector<int> v = {1, 2, 3, 4};

// 普通函数
void foo(std::initializer_list<int> list);

foo({1,2,3});
```

### 类型别名

通常我们使用`typedef`定义别名的语法是：`typedef 原名称 新名称`;C++11使用`using`引入了下面这种形式的写法，并且同时支持对传统`typedef`相同的功效：

```c++
typedef int (*process)(void *);  // 定义了一个返回类型为 int，参数为 void* 的函数指针类型，名字叫做 process
using process = void(*)(void *); // 同上, 更加直观
using NewType = SuckType<std::vector, std::string>;
using vecIter = std::vector<int>::const_iterator;
```

### 委托构造与继承构造

C++ 11引入了委托构造的概念，这使得构造函数可以在同一个类中一个构造函数调用另一个构造函数，从而达到简化代码的目的。在传统C++ 中，构造函数如果需要继承是需要将参数一一传递的，这将导致效率低下。C++ 11利用关键字`using`引入了继承构造函数的概念。

```c++
class Base {
public:
    int value1;
    int value2;
    Base() {
        value1 = 1;
    }
    Base(int value) : Base() { // 委托 Base() 构造函数
        value2 = 2;
    }
};
class Subclass : public Base {
public:
    using Base::Base;          // 继承构造
};
int main() {
    Subclass s(3);
    std::cout << s.value1 << std::endl;
    std::cout << s.value2 << std::endl;
}
```

### override

当重载虚函数时，引入 `override` 关键字将显式的告知编译器进行重载，编译器将检查基函数是否存在这样的虚函数，否则将无法通过编译。

```c++
struct Base {
    virtual void foo(int);
};
struct SubClass: Base {
    virtual void foo(int) override; // 合法
    virtual void foo(float) override; // 非法, 父类没有此虚函数
};
```

### final

`final` 则是为了防止类被继续继承以及终止虚函数继续重载引入的。 官方定义：指定某个虚函数不能在子类中被覆盖，或者某个类不能被子类继承。

```c++
struct Base {
    virtual void foo() final;
};

struct SubClass1 final: Base {
};              // 合法

struct SubClass2 : SubClass1 {
};              // 非法, SubClass1 已 final

struct SubClass3: Base {
    void foo(); // 非法, foo 已 final
};
```

### lambda表达式

```cpp
[捕获列表](参数列表) mutable(可选) 异常属性 -> 返回类型 {
    // 函数体
}
```

Lambda 里面的实现细节，其实是编译器为我们创建了一个类，这个类重载了()，让我们可以像调用函数一样使用。

```cpp
// User Code
[](template& ele) { ele.op(); }
// Complier generated
class _SomeCompilerGeneratedName_ {
public:
    void operator() (template& ele) const {
        ele.op();
    }
}
```

对于捕获变量的 Lambda 的表达式来说，编译器在创建类的时候，通过成员函数的形式保存了需要捕获的变量。

```cpp
// User Code
[&total, offset](x& ele) { total += ele.get() + offset; }
// Compiler generated
class _SomeCompilerGeneratedName_ {
public:
    _SomeCompilerGeneratedName_(int& total, int offset) : total_(total), offset_(offset) {}
    void operator() (x& ele) const {
        total_ += ele.get() + offset_;
    }
private:
    int& total_;
    int offset_;
}
```

参考链接：[这里](https://www.cnblogs.com/diegodu/p/9377438.html)，[这里](https://blog.csdn.net/freshui/article/details/55098799)

### std::function

类模板 std::function 是通用多态函数封装器。 std::function 的实例能存储、复制及调用任何可复制构造 (CopyConstructible) 的可调用 (Callable) 目标——函数、 lambda 表达式、 bind 表达式或其他函数对象，还有指向成员函数指针和指向数据成员指针。

存储的可调用对象被称为 std::function 的目标。若 std::function 不含目标，则称它为空。调用空 std::function 的目标导致抛出 std::bad_function_call 异常。

std::function 满足可复制构造 (CopyConstructible) 和可复制赋值 (CopyAssignable) 。

std::function 实际上也是一个封装的类，里面有个成员变量，类型为函数指针，保存它管理的函数指针。

```cpp
template<class _Rp, class ..._ArgTypes>
class function<_Rp(_ArgTypes...)>
{
    typedef __function::__value_func<_Rp(_ArgTypes...)> __func;

    __func __f_;
};
```

```c++
#include <functional>
#include <iostream>

int foo(int para) {
    return para;
}

int main() {
    // std::function 包装了一个返回值为 int, 参数为 int 的函数
    std::function<int(int)> func = foo;

    int important = 10;
    std::function<int(int)> func2 = [&](int value) -> int {
        return 1+value+important;
    };
    std::cout << func(10) << std::endl;
    std::cout << func2(10) << std::endl;
}
```

### std::bind/std::placeholder

函数模板 bind 生成 f 的转发调用包装器。调用此包装器等价于以一些绑定到 args 的参数调用 f 。

参数

1. f - 可调用 (Callable) 对象（函数对象、指向函数指针、到函数引用、指向成员函数指针或指向数据成员指针）
2. args - 要绑定的参数列表，未绑定参数为命名空间 std::placeholders 的占位符_1,_2,_3... 所替换

```c++
int foo(int a, int b, int c) {
    ;
}
int main() {
    // 将参数1,2绑定到函数 foo 上，但是使用 std::placeholders::_1 来对第一个参数进行占位
    auto bindFoo = std::bind(foo, std::placeholders::_1, 1,2);
    // 这时调用 bindFoo 时，只需要提供第一个参数即可
    bindFoo(1);
}
```

### std::tuple

关于元组的使用有三个核心的函数：

1. `std::make_tuple`: 构造元组
2. `std::get`: 获得元组某个位置的值
3. `std::tie`: 元组拆包

```cpp
#include <tuple>
#include <iostream>

auto get_student(int id)
{
    // 返回类型被推断为 std::tuple<double, char, std::string>

    if (id == 0)
        return std::make_tuple(3.8, 'A', "张三");
    if (id == 1)
        return std::make_tuple(2.9, 'C', "李四");
    if (id == 2)
        return std::make_tuple(1.7, 'D', "王五");
    return std::make_tuple(0.0, 'D', "null");
    // 如果只写 0 会出现推断错误, 编译失败
}

int main()
{
    auto student = get_student(0);
    std::cout << "ID: 0, "
    << "GPA: " << std::get<0>(student) << ", "
    << "成绩: " << std::get<1>(student) << ", "
    << "姓名: " << std::get<2>(student) << '\n';

    double gpa;
    char grade;
    std::string name;

    // 元组进行拆包
    std::tie(gpa, grade, name) = get_student(1);
    std::cout << "ID: 1, "
    << "GPA: " << gpa << ", "
    << "成绩: " << grade << ", "
    << "姓名: " << name << '\n';
}
```

**std::ignore** 任何值均可赋给而无效果的未指定类型的对象。目的是令 std::tie 在解包 std::tuple 时作为不使用的参数的占位符使用。

下例解包 set.insert() 所返回的 pair ，但只保存布尔值。

```cpp
#include <iostream>
#include <string>
#include <set>
#include <tuple>
 
int main()
{
    std::set<std::string> set_of_str;
    bool inserted = false;
    std::tie(std::ignore, inserted) = set_of_str.insert("Test");
    if (inserted) {
        std::cout << "Value was inserted successfully\n";
    }
}
```

### 智能指针

`std::shared_ptr` 实现了引用计数，它能够记录多少个 `shared_ptr` 共同指向一个对象，从而消除显式的调用 `delete`，当引用计数变为零的时候就会将对象自动删除。

类可继承 `std::enable_shared_from_this`，可直接调用该类中定义的函数`shared_from_this()` 生成一个副本。

```cpp
class Foo : public std::enable_shared_from_this<Foo> {
};
```

`std::unique_ptr` 是一种独占的智能指针，它禁止其他智能指针与其共享同一个对象，从而保证代码的安全：

```cpp
std::unique_ptr<int> pointer = std::make_unique<int>(10); // make_unique 从 C++14 引入
std::unique_ptr<int> pointer2 = pointer; // 非法
std::unique_ptr<int> pointer3 = std::move(pointer); // 合法
```

`std::weak_ptr` 弱引用不会增加引用计数。std::weak_ptr 没有 * 运算符和 -> 运算符，所以不能够对资源进行操作，它的唯一作用就是用于检查 std::shared_ptr 是否存在，其 expired() 方法能在资源未被释放时，会返回 false，否则返回 true。

注意的是我们不能通过weak_ptr直接访问对象的方法，比如B对象中有一个方法 print(),我们不能这样访问，pa->pb_->print(); 英文pb_是一个weak_ptr，应该先把它转化为 shared_ptr,如：shared_ptr p = pa->pb_.lock(); p->print();

### 互斥锁

C++11 提供的互斥类其实不止一个，只不过我们最常用的就是 mutex 而已，我们可以看看还有哪些：

1. `mutex` 类是能用于保护共享数据免受从多个线程同时访问的同步原语。mutex 提供排他性非递归所有权语义：
    - 调用方线程从它成功调用 lock 或 try_lock 开始，到它调用 unlock 为止占有 mutex 。
    - 线程占有 mutex 时，所有其他线程若试图要求 mutex 的所有权，则将阻塞（对于 lock 的调用）或收到 false 返回值（对于 try_lock ）.
    - 调用方线程在调用 lock 或 try_lock 前必须不占有 mutex 。
2. `timed_mutex` 以类似 mutex 的行为， timed_mutex 提供排他性非递归所有权语义。另外， timed_mutex 提供通过 try_lock_for() 和 try_lock_until() 方法试图带时限地要求 timed_mutex 所有权的能力。
3. `recursive_mutex` 类是同步原语，能用于保护共享数据免受从个多线程同时访问。recursive_mutex 提供排他性递归所有权语义：
    - 调用方线程在从它成功调用 lock 或 try_lock 开始的时期里占有 recursive_mutex 。此时期间，线程可以进行对 lock 或 try_lock 的附加调用。所有权的时期在线程调用 unlock 匹配次数时结束。
    - 线程占有 recursive_mutex 时，若其他所有线程试图要求 recursive_mutex 的所有权，则它们将阻塞（对于调用 lock ）或收到 false 返回值（对于调用 try_lock ）。
    - 可锁定 recursive_mutex 次数的最大值是未指定的，但抵达该数后，对 lock 的调用将抛出 std::system_error 而对 try_lock 的调用将返回 false 。
4. `recursive_timed_mutex` 以类似 `std::recursive_mutex` 的方式， recursive_timed_mutex 提供排他性递归所有权语义。另外， recursive_timed_mutex 通过 try_lock_for 与 try_lock_until 方法，提供带时限地试图要求 recursive_timed_mutex 所有权的能力。

```cpp
// 4 种互斥锁都有的方法
lock 锁定互斥，若互斥不可用则阻塞
try_lock 尝试锁定互斥，若互斥不可用则返回
unlock 解锁互斥
// timed_mutex，recursive_timed_mutex 独有的方法
try_lock_for 尝试锁定互斥，若互斥在指定的时限时期中不可用则返回
try_lock_until 尝试锁定互斥，若直至抵达指定时间点互斥不可用则返回
```

### 通用互斥管理

#### 1. std::lock_guard

类 lock_guard 是互斥体包装器，为在作用域块期间占有互斥提供便利 RAII 风格机制。

创建 lock_guard 对象时，它试图接收给定互斥的所有权。控制离开创建 lock_guard 对象的作用域时，销毁 lock_guard 并释放互斥。

lock_guard 类不可复制。

```cpp
void some_operation(const std::string &message) {
    static std::mutex mutex;
    std::lock_guard<std::mutex> lock(mutex);

    // ...操作

    // 当离开这个作用域的时候，互斥锁会被析构，同时unlock互斥锁
    // 因此这个函数内部的可以认为是临界区
}
```

#### 2. std::unique_lock

而`std::unique_lock`则相对于`std::lock_guard`出现的，`std::unique_lock`更加灵活，`std::unique_lock`的对象会以独占所有权（没有其他的 `unique_lock`对象同时拥有某个`mutex`对象的所有权）的方式管理`mutex`对象上的上锁和解锁的操作。所以在并发编程中，推荐使用`std::unique_lock`。

类 unique_lock 是通用互斥包装器，允许延迟锁定、锁定的有时限尝试、递归锁定、所有权转移和与条件变量一同使用。

类 unique_lock 可移动，但不可复制——它满足可移动构造 (MoveConstructible) 和可移动赋值 (MoveAssignable) 但不满足可复制构造 (CopyConstructible) 或可复制赋值 (CopyAssignable) 。

```c++
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mtx;

void block_area() {
    std::unique_lock<std::mutex> lock(mtx);
    //...临界区
}
int main() {
    std::thread thd1(block_area);

    thd1.join();

    return 0;
}
```

#### 3. std::lock

`std::lock` 锁定给定的可锁定 (Lockable) 对象 lock1 、 lock2 、 ... 、 lockn ，用免死锁算法避免死锁。

```cpp
#include <mutex>
#include <thread>
 
struct bank_account {
    explicit bank_account(int balance) : balance(balance) {}
    int balance;
    std::mutex m;
};
 
void transfer(bank_account &from, bank_account &to, int amount)
{
    // 锁定两个互斥而不死锁
    std::lock(from.m, to.m);
    // 保证二个已锁定互斥在作用域结尾解锁
    std::lock_guard<std::mutex> lock1(from.m, std::adopt_lock);
    std::lock_guard<std::mutex> lock2(to.m, std::adopt_lock);
 
// 等价方法：
//    std::unique_lock<std::mutex> lock1(from.m, std::defer_lock);
//    std::unique_lock<std::mutex> lock2(to.m, std::defer_lock);
//    std::lock(lock1, lock2);

// C++17 中可用的较优解法
//        std::scoped_lock lk(from.m, to.m);
 
    from.balance -= amount;
    to.balance += amount;
}
 
int main()
{
    bank_account my_account(100);
    bank_account your_account(50);
 
    std::thread t1(transfer, std::ref(my_account), std::ref(your_account), 10);
    std::thread t2(transfer, std::ref(your_account), std::ref(my_account), 5);
 
    t1.join();
    t2.join();
}
```

看完上面例子，再说说互斥管理中的参数意义：

`std::defer_lock` 、 `std::try_to_lock` 和 `std::adopt_lock` 分别是空结构体标签类型 std::defer_lock_t 、 std::try_to_lock_t 和 std::adopt_lock_t 的实例。

它们用于为 `std::lock_guard` 、 `std::unique_lock` 及 `std::shared_lock` 指定锁定策略。

1. defer_lock_t 不获得互斥的所有权
2. try_to_lock_t 尝试获得互斥的所有权而不阻塞
3. adopt_lock_t 假设调用方线程已拥有互斥的所有权

### std::condition_variable

`std::condition_variable`是为了解决死锁而生的。当互斥操作不够用而引入的。比如，线程可能需要等待某个条件为真才能继续执行，而一个忙等待循环中可能会导致所有其他线程都无法进入临界区使得条件为真时，就会发生死锁。所以，`condition_variable`实例被创建出现主要就是用于唤醒等待线程从而避免死锁。

`std::condition_variable`的`notify_one()`用于唤醒一个线程；`notify_all()`则是通知所有线程。

`condition_variable_any` 类是 `std::condition_variable` 的泛化。相对于只在 `std::unique_lock<std::mutex>` 上工作的 `std::condition_variable` ， `condition_variable_any` 能在任何满足基本可锁定 (BasicLockable) 要求的锁上工作。

```c++
#include <condition_variable>
#include <mutex>
#include <thread>
#include <iostream>
#include <queue>
#include <chrono>

int main()
{
    // 生产者数量
    std::queue<int> produced_nums;
    // 互斥锁
    std::mutex m;
    // 条件变量
    std::condition_variable cond_var;
    // 结束标志
    bool done = false;
    // 通知标志
    bool notified = false;

    // 生产者线程
    std::thread producer([&]() {
        for (int i = 0; i < 5; ++i) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            // 创建互斥锁
            std::unique_lock<std::mutex> lock(m);
            std::cout << "producing " << i << '\n';
            produced_nums.push(i);
            notified = true;
            // 通知一个线程
            cond_var.notify_one();
        }   
        done = true;
        cond_var.notify_one();
    }); 

    // 消费者线程
    std::thread consumer([&]() {
        std::unique_lock<std::mutex> lock(m);
        while (!done) {
            while (!notified) {  // 循环避免虚假唤醒
                cond_var.wait(lock);
            }   
            while (!produced_nums.empty()) {
                std::cout << "consuming " << produced_nums.front() << '\n';
                produced_nums.pop();
            }   
            notified = false;
        }   
    }); 

    producer.join();
    consumer.join();
}
```

### std::future/std::packaged_task

#### 1. std::future

类模板 std::future 提供访问异步操作结果的机制：

- （通过 std::async 、 std::packaged_task 或 std::promise 创建的）异步操作能提供一个 std::future 对象给该异步操作的创建者。
然后，异步操作的创建者能用各种方法查询、等待或从 std::future 提取值。若异步操作仍未提供值，则这些方法可能阻塞。
- 异步操作准备好发送结果给创建者时，它能通过修改链接到创建者的 std::future 的共享状态（例如 std::promise::set_value ）进行。

std::future 里面实现其实也很简单，有个模板状态类的的实例，里面也使用了引用计数，假设 std::future 和 std::promise 里状态类实例是同一个，该状态实例中有三个最基本的变量：互斥锁/条件变量/真正的值变量。当调用 std::future::get() 的时候，会判断值是否有效，如果没有，则会使用条件变量进行阻塞等待。而 std::promise::set_value() 则是把该值变量赋值，并通过条件变量的 notify_all() 来通知 future 返回真正的值。

#### 2. std::shared_future

类模板 std::shared_future 提供访问异步操作结果的机制，类似 std::future ，除了允许多个线程等候同一共享状态。不同于仅可移动的 std::future （故只有一个实例能指代任何特定的异步结果），std::shared_future 可复制而且多个 shared_future 对象能指代同一共享状态。

若每个线程通过其自身的 shared_future 对象副本访问，则从多个线程访问同一共享状态是安全的。

#### 3. std::promise

类模板 std::promise 提供存储值或异常的设施，之后通过 std::promise 对象所创建的 std::future 对象异步获得结果。注意 std::promise 只应当使用一次。

每个 promise 与共享状态关联，共享状态含有一些状态信息和可能仍未求值的结果，它求值为值（可能为 void ）或求值为异常。 promise 可以对共享状态做三件事：

- 使就绪： promise 存储结果或异常于共享状态。标记共享状态为就绪，并解除阻塞任何等待于与该共享状态关联的 future 上的线程。
- 释放： promise 放弃其对共享状态的引用。若这是最后一个这种引用，则销毁共享状态。除非这是 std::async 所创建的未就绪的共享状态，否则此操作不阻塞。
- 抛弃： promise 存储以 std::future_errc::broken_promise 为 error_code 的 std::future_error 类型异常，令共享状态为就绪，然后释放它。

#### 4. std::package_task

类模板 std::packaged_task 包装任何可调用 (Callable) 目标（函数、 lambda 表达式、 bind 表达式或其他函数对象），使得能异步调用它。其返回值或所抛异常被存储于能通过 std::future 对象访问的共享状态中。

正如 std::function ， std::packaged_task 是多态、具分配器的容器：可在堆上或以提供的分配器分配存储的可调用对象。

std::package_task 内部实现主要通过两个成员变量，一个是初始化时需要保存的函数指针，另一个就是使用 promise 实例化的返回值。通过重载 operator() 调用真正的函数指针，把函数指针的返回值通过 promise::set_value 设置进去。

所以 std::package_task::get_future 实际上就是 std::promise::get_future，实现异步读取值与上面的一样。
在封装好要调用的目标后，可以使用`get_future()`来获得一个`std::future`对象，以便之后实施线程同步。

#### 5. std::async

函数模板 async 异步地运行函数 f （潜在地在可能是线程池一部分的分离线程中），并返回最终将保有该函数调用结果的 std::future 。

1. std::launch::async 运行新线程，以异步执行任务
2. std::launch::deferred 调用方线程上首次请求其结果时执行任务（惰性求值）

1) 表现如同以 policy 为 std::launch::async | std::launch::deferred 调用。换言之， f 可能执行于另一线程，或者它可能在查询产生的 std::future 的值时同步运行。

2) 按照特定的执行策略 policy ，以参数 args 调用函数 f ：

- 若设置 async 标志（即 (policy & std::launch::async) != 0 ），则 async 在新的执行线程（初始化所有线程局域对象后）执行可调用对象 f ，如同产出 std::thread(std::forward<F\>(f), std::forward<Args\>(args)...) ，除了若 f 返回值或抛出异常，则于可通过 async 返回给调用方的 std::future 访问的共享状态存储结果。
- 若设置 deferred 标志（即 (policy & std::launch::deferred) != 0 ），则 async 以同 std::thread 构造函数的方式转换 f 与 args... ，但不产出新的执行线程。而是进行惰性求值：在 async 所返回的 std::future 上首次调用非定时等待函数，将导致在当前线程（不必是最初调用 std::async 的线程）中，以 args... （作为右值传递）的副本调用 f （亦作为右值）的副本。将结果或异常置于关联到该 future 的共享状态，然后才令它就绪。对同一 std::future 的所有后续访问都会立即返回结果。
- 若 policy 中设置了 std::launch::async 和 std::launch::deferred 两个标志，则进行异步执行还是惰性求值取决于实现。
- 若 policy 中未设置 std::launch::async 或 std::launch::deferred 或任何实现定义策略标志，则行为未定义。

```cpp
#include <iostream>
#include <future>
#include <thread>
 
int main()
{
    // 来自 packaged_task 的 future
    std::packaged_task<int()> task([](){ return 7; }); // 包装函数
    std::future<int> f1 = task.get_future();  // 获取 future
    std::thread(std::move(task)).detach(); // 在线程上运行
 
    // 来自 async() 的 future
    std::future<int> f2 = std::async(std::launch::async, [](){ return 8; });
 
    // 来自 promise 的 future
    std::promise<int> p;
    std::future<int> f3 = p.get_future();
    std::thread( [&p]{ p.set_value_at_thread_exit(9); }).detach();
 
    std::cout << "Waiting..." << std::flush;
    f1.wait();
    f2.wait();
    f3.wait();
    std::cout << "Done!\nResults are: "
              << f1.get() << ' ' << f2.get() << ' ' << f3.get() << '\n';
}
```

### std::thread/thread_local

`thread_local` 关键词只对声明于命名空间作用域的对象、声明于块作用域的对象及静态数据成员允许。它指示对象拥有线程存储期。它能与 `static` 或 `extern` 结合，以分别指定内部或外部链接（除了静态数据成员始终拥有外部链接），但附加的 `static` 不影响存储期。

**线程存储期:** 对象的存储在线程开始时分配，而在线程结束时解分配。每个线程拥有其自身的对象实例。唯有声明为 `thread_local` 的对象拥有此存储期。 `thread_local` 能与 `static` 或 `extern` 一同出现，以调整链接。

这里有一个很重要的信息，就是 `static thread_local` 和 `thread_local` 声明是等价的，都是指定变量的周期是在线程内部，并且是静态的。

```cpp
#include <iostream>
#include <thread>

static thread_local int x = 0;

void thread_func(const std::string& thread_name) {
    for (int i = 0; i < 3; ++i) {
        x++;
        std::cout << "thread[" << thread_name << "]: x = " << x << std::endl;
    }
    return;
}

int main() {
    std::thread t1(thread_func, "t1");
    std::thread t2(thread_func, "t2");
    t1.join();
    t2.join();
    return 0;
}
// thread[t1]: x = 1
// thread[t1]: x = 2
// thread[t1]: x = 3
// thread[t2]: x = 1
// thread[t2]: x = 2
// thread[t2]: x = 3
```

### call_once/once_flag

类 std::once_flag 是 std::call_once 的辅助类。

传递给多个 std::call_once 调用的 std::once_flag 对象允许那些调用彼此协调，从而只令调用之一实际运行完成。

std::once_flag 既不可复制亦不可移动。

```cpp
template< class Callable, class... Args >
void call_once( std::once_flag& flag, Callable&& f, Args&&... args );
```

准确执行一次可调用 (Callable) 对象 f ，即使同时从多个线程调用。

若对 call_once 的同时调用传递不同的 f ，则调用哪个 f 是未指定的。被选择函数运行于与传递它的 call_once 的调用相同的线程。

即使在从多个线程调用时，也保证函数局域静态对象的初始化仅出现一次，这可能比使用 std::call_once 的等价代码更为高效。

```cpp
#include <iostream>
#include <thread>
#include <mutex>
 
std::once_flag flag1, flag2;
 
void simple_do_once()
{
    std::call_once(flag1, [](){ std::cout << "Simple example: called once\n"; });
}
 
void may_throw_function(bool do_throw)
{
  if (do_throw) {
    std::cout << "throw: call_once will retry\n"; // 这会出现多于一次
    throw std::exception();
  }
  std::cout << "Didn't throw, call_once will not attempt again\n"; // 保证一次
}
 
void do_once(bool do_throw)
{
  try {
    std::call_once(flag2, may_throw_function, do_throw);
  }
  catch (...) {
  }
}
 
int main()
{
    std::thread st1(simple_do_once);
    std::thread st2(simple_do_once);
    std::thread st3(simple_do_once);
    std::thread st4(simple_do_once);
    st1.join();
    st2.join();
    st3.join();
    st4.join();
 
    std::thread t1(do_once, true);
    std::thread t2(do_once, true);
    std::thread t3(do_once, false);
    std::thread t4(do_once, true);
    t1.join();
    t2.join();
    t3.join();
    t4.join();
}

// 可能的输出：
// Simple example: called once
// throw: call_once will retry
// throw: call_once will retry
// Didn't throw, call_once will not attempt again
```

### 右值引用

#### 概念

为了弄清什么是右值引用，我们先来看看什么是左值，什么是右值，什么是引用？

1. 左值：能对表达式取地址、或具名对象/变量。一般指表达式结束后依然存在的持久对象。
2. 右值：不能对表达式取地址，或匿名对象。一般指表达式结束就不再存在的临时对象。
3. 引用：声明具名变量为引用，即既存对象或函数的别名。

左值引用可以看成是左值的的一个别名，表示为 `T&`。右值引用也是同理，表示为 `T&&`。

右值引用是 C++11 中引入的新特性 , 它实现了转移语义和精确传递。它的主要目的有两个方面：

1. 消除两个对象交互时不必要的对象拷贝，节省运算存储资源，提高效率。
2. 能够更简洁明确地定义泛型函数。

右值引用可用于为临时对象延长生存期（注意，到 const 的左值引用也能延长临时对象生存期，但这些对象无法因此被修改）。

#### 将亡值

C++中有“左值”、“右值”的概念，C++11以后，又有了“左值”、“纯右值”、“将亡值”的概念。

下面选取若干典型详细说明左值和纯右值的判断：

1. ++i是左值，i++是右值

    前者，对i加1后再赋给i，最终的返回值就是i，所以，++i的结果是具名的，名字就是i；而对于i++而言，是先对i进行一次拷贝，将得到的副本作为返回结果，然后再对i加1，由于i++的结果是对i加1前i的一份拷贝，所以它是不具名的。假设自增前i的值是6，那么，++i得到的结果是7，这个7有个名字，就是i；而i++得到的结果是6，这个6是i加1前的一个副本，它没有名字，i不是它的名字，i的值此时也是7。可见，++i和i++都达到了使i加1的目的，但两个表达式的结果不同。

2. 解引用表达式*p是左值，取地址表达式&a是纯右值

    &(*p)一定是正确的，因为*p得到的是p指向的实体，&(*p)得到的就是这一实体的地址，正是p的值。由于&(*p)的正确，所以*p是左值。而对&a而言，得到的是a的地址，相当于unsigned int型的字面值，所以是纯右值。

3. a+b、a&&b、a==b都是纯右值

    a+b得到的是不具名的临时对象，而a&&b和a==b的结果非true即false，相当于字面值。

在C++11之前的右值和C++11中的纯右值是等价的。C++11中的将亡值是随着右值引用的引入而新引入的。换言之，“将亡值”概念的产生，是由右值引用的产生而引起的，将亡值与右值引用息息相关。所谓的将亡值表达式，就是下列表达式：

1. 返回右值引用的函数的调用表达式
2. 转换为右值引用的转换函数的调用表达式

在C++11中，我们用左值去初始化一个对象或为一个已有对象赋值时，会调用拷贝构造函数或拷贝赋值运算符来拷贝资源（所谓资源，就是指new出来的东西），而当我们用一个右值（包括纯右值和将亡值）来初始化或赋值时，会调用移动构造函数或移动赋值运算符来移动资源，从而避免拷贝，提高效率。当该右值完成初始化或赋值的任务时，它的资源已经移动给了被初始化者或被赋值者，同时该右值也将会马上被销毁（析构）。也就是说，当一个右值准备完成初始化或赋值任务时，它已经“将亡”了。而上面1）和2）两种表达式的结果都是不具名的右值引用，它们属于右值（关于“不具名的右值引用是右值”这一点，后面还会详细解释）。又因为

- 这种右值是与C++11新生事物——“右值引用”相关的“新右值”
- 这种右值常用来完成移动构造或移动赋值的特殊任务，扮演着“将亡”的角色

所以C++11给这类右值起了一个新的名字——将亡值。

举例：std::move()、tsatic_cast<X&&\>(x)（X是自定义的类，x是类对象，这两个函数常用来将左值强制转换成右值，从而使拷贝变成移动，提高效率）

附注：事实上，将亡值不过是C++11提出的一块晦涩的语法糖。它与纯右值在功能上及其相似，如都不能做操作符的左操作数，都可以使用移动构造函数和移动赋值运算符。当一个纯右值来完成移动构造或移动赋值任务时，其实它也具有“将亡”的特点。一般我们不必刻意区分一个右值到底是纯右值还是将亡值。

这节内容参考链接：[话说C++中的左值、纯右值、将亡值](https://www.cnblogs.com/zpcdbky/p/5275959.html)

#### 引用特点

引用必须被初始化为指代一个有效的对象或函数，不管左值引用还是右值引用也一样。

不存在 `void` 的引用，也不存在引用的引用。

引用不是对象；它们不必占用存储，尽管编译器会在需要实现所需语义（例如，引用类型的非静态数据成员通常会增加类的大小，量为存储内存地址所需）的情况下分配存储。

因为引用不是对象，所以不存在引用的数组，不存在指向引用的指针，不存在引用的引用：

```cpp
int& a[3]; // 错误
int&* p;   // 错误
int& &r;   // 错误
```

#### 引用折叠

通过模板或 typedef 中的类型操作可以构成引用的引用，此时适用引用折叠（reference collapsing）规则：**右值引用的右值引用折叠成右值引用，所有其他组合均折叠成左值引用**：

```cpp
typedef int&  lref;
typedef int&& rref;
int n;
lref&  r1 = n; // r1 的类型是 int&
lref&& r2 = n; // r2 的类型是 int&
rref&  r3 = n; // r3 的类型是 int&
rref&& r4 = 1; // r4 的类型是 int&&
```

#### 转发引用

转发引用是一种特殊的引用，它保持函数实参的值类别，使得 `std::forward` 能用来转发实参。

```cpp
template<class T>
int f(T&& x) {                    // x 是转发引用
    return g(std::forward<T>(x)); // 从而能被转发
}
int main() {
    int i;
    f(i); // 实参是左值，调用 f<int&>(int&), std::forward<int&>(x) 是左值
    f(0); // 实参是右值，调用 f<int>(int&&), std::forward<int>(x) 是右值
}
 
template<class T>
int g(const T&& x); // x 不是转发引用：const T 不是无 cv 限定的
 
template<class T> struct A {
    template<class U>
    A(T&& x, U&& y, int* p); // x 不是转发引用：T 不是构造函数的类型模板形参
                             // 但 y 是转发引用
};
```

```cpp
auto&& vec = foo();       // foo() 可以是左值或右值，vec 是转发引用
auto i = std::begin(vec); // 也可以
(*i)++;                   // 也可以
g(std::forward<decltype(vec)>(vec)); // 转发，保持值类别
 
for (auto&& x: f()) {
  // x 是转发引用；这是使用范围 for 循环最安全的方式
}
 
auto&& z = {1, 2, 3}; // *不是*转发引用（初始化器列表的特殊情形）
```

#### 悬垂引用

尽管引用一旦初始化就始终指代一个有效的对象或函数，但有可能创建一个程序，其中被指代对象的生存期结束而引用仍保持可访问（悬垂（dangling））。访问这种引用是未定义行为。

```cpp
std::string& f()
{
    std::string s = "Example";
    return s; // 退出 s 的作用域：调用其析构函数并解分配其存储
}
 
std::string& r = f(); // 悬垂引用
std::cout << r;       // 未定义行为：从悬垂引用读取
std::string s = f();  // 未定义行为：从悬垂引用复制初始化
```

### 移动构造函数/移动赋值运算符

#### 移动构造函数

类 T 的移动构造函数是非模板构造函数，其首个形参是 T&&、const T&&、volatile T&& 或 const volatile T&&，且无其他形参，或剩余形参均有默认值。

```cpp
类名 ( 类名 && );
类名 ( 类名 && ) = default;
类名 ( 类名 && ) = delete;
```

典型的移动构造函数“窃取”实参曾保有的资源（例如指向动态分配对象的指针，文件描述符，TCP socket，I/O 流，运行的线程，等等），而非复制它们，并使其实参遗留于某个合法但不确定的状态。例如，从 std::string 或从 std::vector 移动可以导致实参被置为空。但是不应依赖此行为。对于某些类型，例如 std::unique_ptr，移动后的状态是完全指定的。

#### 移动赋值运算符

类 T 的移动赋值运算符是名为 operator=的非模板非静态成员函数，它接受恰好一个 T&&、const T&&、volatile T&& 或 const volatile T&& 类型的形参。

```cpp
类名 & 类名 :: operator= ( 类名 && )
类名 & 类名 :: operator= ( 类名 && ) = default;
类名 & 类名 :: operator= ( 类名 && ) = delete;
```

典型的移动赋值运算符“窃取”实参曾保有的资源（例如指向动态分配对象的指针，文件描述符，TCP socket，I/O 流，运行的线程，等等），而非复制它们，并使得实参遗留于某个合法但不确定的状态。例如，从 std::string 或从 std::vector 移动赋值可能导致实参被置空。然而这并不保证会发生。移动赋值与普通赋值相比，其定义较为宽松而非更严格；在完成时，普通赋值必须留下数据的两份副本，而移动赋值只要求留下一份。

### std::move/std::forward

#### move

std::move 用于指示对象 t 可以“被移动”，即允许从 t 到另一对象的有效率的资源传递。

特别是，std::move 生成标识其参数 t 的亡值表达式。它准确地等价于到右值引用类型的 static_cast 。

```cpp
// move 源码
template <class _Tp>
inline _LIBCPP_INLINE_VISIBILITY _LIBCPP_CONSTEXPR
typename remove_reference<_Tp>::type&&
move(_Tp&& __t) _NOEXCEPT
{
    typedef _LIBCPP_NODEBUG_TYPE typename remove_reference<_Tp>::type _Up;
    return static_cast<_Up&&>(__t);
}
// 优化一下就是
template<typename T>
typename remove_reference<T>::type && move(T&& t)
{
    // 可以看到， move 函数其实就是需要返回一个右值引用，而不管传入的是左值引用还是右值引用
    return static_cast<typename remove_reference<T>::type &&>(t);
}
```

#### forward

首先需要知道一个很重要的点，右值引用作为函数参数时，在函数内部它本身就是一个作为一个左值，看下面的代码：

```cpp
void func(int&& r) {}

int a;
int&& ra = std::move(a);
func(ra); // error: an rvalue reference cannot be bound to an lvalue

// 再比如函数调用
void func1(int& l) {
    func(l); // error: an rvalue reference cannot be bound to an lvalue
}
```

std::forward 的作用就是解决上面的问题，进行完美转发。

```cpp
// forward 源码
template <class _Tp>
inline _LIBCPP_INLINE_VISIBILITY _LIBCPP_CONSTEXPR
_Tp&&
forward(typename remove_reference<_Tp>::type& __t) _NOEXCEPT
{
    return static_cast<_Tp&&>(__t);
}

template <class _Tp>
inline _LIBCPP_INLINE_VISIBILITY _LIBCPP_CONSTEXPR
_Tp&&
forward(typename remove_reference<_Tp>::type&& __t) _NOEXCEPT
{
    static_assert(!is_lvalue_reference<_Tp>::value,
                  "can not forward an rvalue as an lvalue");
    return static_cast<_Tp&&>(__t);
}
```

std::move是一个用于提示优化的函数，std::forward是用于模板编程中的，如果不需要编写通用的模板类和函数，可能不怎么用的上它。

一般 std::forward 的用法为：

```cpp
void wrapper(T&& arg) 
{
    // arg 始终是左值
    foo(std::forward<T>(arg)); // 转发为左值或右值，依赖于 T
}
```

再来，讨论一下，一个模板函数如果要保留参数的左右值引用性，为什么应该声明为T&&：

1. 如果声明函数f(T t): 实参会直接进行值传递，失去了引用性。
2. 如果声明函数f(T &t): 根据引用折叠法则，无论T是U&还是U&&，T&的折叠结果都只会是U&，即，这个声明不能用于匹配右值引用实参。
3. 如果声明函数f(T &&t): 如果T为U&，T&&的结果是U&，可以匹配左值实参；如果T为U&&，T&&的结果 是U&&，可以匹配右值实参。又因为T的cv性和U相同，所以这种声明能够保留实参的类型信息。

#### 总结

1. std::move执行到右值的无条件转换。就其本身而言，它没有move任何东西。
2. std::forward只有在它的参数绑定到一个右值上的时候，它才转换它的参数到一个右值。
3. std::move和std::forward只不过就是执行类型转换的两个函数；std::move没有move任何东西，std::forward没有转发任何东西。在运行期，它们没有做任何事情。它们没有产生需要执行的代码，一byte都没有。
4. std::forward<\T>() 不仅可以保持左值或者右值不变，同时还可以保持const、Lreference、Rreference、validate等属性不变；

注意，在使用 std::move 时，你只需向它传递一个参数（rhs.s）即可，而 std::forward 还需要指定一个模板参数（ std::string ），你不需要为它（模板参数）指定引用类型，因为这（它是一个右值）已经是约定俗成的东西了。因此使用 std::move 比 std::forward 更方便，还能避免错误的类型参数导致的行为异常（例如：传入 std::string& 将导致成员变量 s 被拷贝构造，而不是移动构造）。

```cpp
#include <iostream>
#include <memory>
#include <utility>
 
struct A {
    A(int&& n) { std::cout << "rvalue overload, n=" << n << "\n"; }
    A(int& n)  { std::cout << "lvalue overload, n=" << n << "\n"; }
};
 
class B {
public:
    template<class T1, class T2, class T3>
    B(T1&& t1, T2&& t2, T3&& t3) :
        a1_{std::forward<T1>(t1)},
        a2_{std::forward<T2>(t2)},
        a3_{std::forward<T3>(t3)}
    {
    }
 
private:
    A a1_, a2_, a3_;
};
 
template<class T, class U>
std::unique_ptr<T> make_unique1(U&& u)
{
    return std::unique_ptr<T>(new T(std::forward<U>(u)));
    // return std::unique_ptr<T>(new T(std::move(u)));
}
 
template<class T, class... U>
std::unique_ptr<T> make_unique2(U&&... u)
{
    return std::unique_ptr<T>(new T(std::forward<U>(u)...));
    // return std::unique_ptr<T>(new T(std::move(u)...));
}
 
int main()
{   
    auto p1 = make_unique1<A>(2); // 右值
    int i = 1;
    auto p2 = make_unique1<A>(i); // 左值
 
    std::cout << "B\n";
    auto t = make_unique2<B>(2, i, 3);
}
```

### explicit

explicit用来防止由构造函数定义的隐式转换。

这个关键字只能用在类构造函数。它的作用是不能进行隐式转换。

要明白它的作用，首先要了解隐式转换：可以用单个实参来调用的构造函数定义了从形参类型到该类类型的一个隐式转换。

例如:

```cpp
class things
{
public:
    things(const std::string& name =""):
        m_name(name),height(0),weight(10){}
    int CompareTo(const things & other);
    std::string m_name;
    int height;
    int weight;
};
```

这里things的构造函数可以只用一个实参完成初始化。所以可以进行一个隐式转换，像下面这样：

```cpp
things a;
................ //在这里被初始化并使用。
std::string str ="book_1";
//由于可以隐式转换，所以可以下面这样使用
int result = a.CompareTo(str);
```

这段程序使用一个string类型对象作为实参传给things的CompareTo函数。这个函数本来是需要一个tings对象作为实参。现在编译器使用string str来构造并初始化一个 things对象，新生成的临时的things对象被传递给CompareTo函数，并在离开这段函数后被析构。

这种行为的正确与否取决于业务需要。假如你只是想测试一下a的重量与10的大小之比，这么做也许是方便的。但是假如在CompareTo函数中还涉及到了要除以初始化为0的height属性，那么这么做可能就是错误的。需要在构造tings之后更改height属性不为0。所以要限制这种隐式类型转换。

那么这时候就可以通过将构造函数声明为explicit，来防止隐式类型转换。

explicit关键字只能用于类内部的构造函数声明上，而不能用在类外部的函数定义上。现在things类像这样：

```cpp
class things
{
public:
    explicit things(const std::string&name =""):
        m_name(name),height(0),weight(0){}
    int CompareTo(const things & other);
    std::string m_name;
    int height;
    int weight;
};
```

这时你仍然可以通过显示使用构造函数完成上面的类型转换：

```cpp
things a;
................//在这里被初始化并使用。
std::string nm ="book_1";
//显示使用构造函数
int result = a.CompareTo(things(nm));
```

### 函数 = default/delete

如果类已经定义了有参数的构造函数，默认编译器是不会再自动生成默认构造函数，通过 = default 可以让编译器帮你自动生成默认构造函数。

如果你不需要某个函数，只要在函数后面 = delete 即可，编译即会禁止该函数代表的行为，如赋值等。

```cpp
class A {
public:
    A(int);

    A() = default;

    void* operator new (std::size_t) = delete;
    A& operator = (const &A) = delete;
};
```

### long long/char16_t/char32_t

`long long` - 目标类型将有至少 64 位的宽度。

`char16_t` - UTF-16 字符表示的类型，要求大到足以表示任何 UTF-16 编码单元（ 16 位）。它与 std::uint_least16_t 具有相同的大小、符号性和对齐，但它是独立的类型。

`char32_t` - UTF-32 字符表示的类型，要求大到足以表示任何 UTF-32 编码单元（ 32 位）。它与 std::uint_least32_t 具有相同的大小、符号性和对齐，但它是独立的类型。

### 字符串字面量

1. " 串字符序列 "

    窄多字节字符串字面量。无前缀字符串字面量的类型是 const char[N]，其中 N 是以执行窄编码的编码单元计的字符串的大小，包含空终止符。
2. L" 串字符序列 "

    宽字符串字面量。L"..." 字符串字面量的类型是 const wchar_t[N]，其中 N 是以执行宽编码的编码单元计的字符串的大小，包含空终止符。
3. u8" 串字符序列 " (C++11 起)

    UTF-8 编码的字符串字面量。u8"..." 字符串字面量的类型是 const char[N] (C++20 前)const char8_t[N] (C++20 起)，其中 N 是以 UTF-8 编码单元计的字符串的大小，包含空终止符。
4. u" 串字符序列 " (C++11 起)

    UTF-16 编码的字符串字面量。u"..." 字符串字面量的类型是 const char16_t[N]，其中 N 是以 UTF-16 编码单元计的字符串的大小，包含空终止符。
5. U" 串字符序列 " (C++11 起)

    UTF-32 编码的字符串字面量。U"..." 字符串字面量的类型是 const char32_t[N]，其中 N 是以 UTF-32 编码单元计的字符串的大小，包含空终止符。
6. 前缀(可选) R"分隔符( 原始字符 )分隔符" (C++11 起)

    原始字符串字面量。用于避免转义任何字符。分隔符间的任何内容都成为字符串的一部分。若存在 前缀 则具有与上述相同的含义。

### 变参数模板

模板形参包是接受零或更多模板实参（非类型、类型或模板）的模板形参。函数模板形参包是接受零或更多函数实参的函数形参。

至少有一个形参包的模板被称作变参模板。

```cpp
template<typename... Ts> void func(Ts... args){
    const int size = sizeof...(args) + 2;
    int res[size] = {1,args...,2};
    // 因为初始化器列表保证顺序，所以这可用于按顺序对包的每个元素调用函数：
    int dummy[sizeof...(Ts)] = { (std::cout << args, 0)... };
}
```

## C++14

### std::shared_timed_mutex

shared_timed_mutex 类是能用于保护数据免受多个线程同时访问的同步原语。与其他促进排他性访问的互斥类型相反，拥有二个层次的访问：

1. 共享 - 多个线程能共享同一互斥的所有权。
2. 排他性 - 仅一个线程能占有互斥。

共享互斥通常用于多个读线程能同时访问同一资源而不导致数据竞争，但只有一个写线程能访问的情形。

以类似 timed_mutex 的行为， shared_timed_mutex 提供通过 try_lock_for() 、 try_lock_until() 、 try_lock_shared_for() 、 try_lock_shared_until() 方法，试图带时限地要求 shared_timed_mutex 所有权的能力。

### std::shared_lock

类 shared_lock 是通用共享互斥所有权包装器，允许延迟锁定、定时锁定和锁所有权的转移。锁定 shared_lock ，会以共享模式锁定关联的共享互斥（ std::unique_lock 可用于以排他性模式锁定）。

shared_lock 类可移动，但不可复制——它满足可移动构造 (MoveConstructible) 与可移动赋值 (MoveAssignable) 的要求，但不满足可复制构造 (CopyConstructible) 或可复制赋值 (CopyAssignable) 。

```cpp
#include <mutex>
#include <shared_mutex>
 
class R
{
    mutable std::shared_timed_mutex mut;
    /* 数据 */
public:
    R& operator=(const R& other)
    {
        // 要求排他性所有权以写入 *this
        std::unique_lock<std::shared_timed_mutex> lhs(mut, std::defer_lock);
        // 要求共享所有权以读取 other
        std::shared_lock<std::shared_timed_mutex> rhs(other.mut, std::defer_lock);
        std::lock(lhs, rhs);
        /* 赋值数据 */
        return *this;
    }
};
 
int main() {
    R r;
}
```

## C++17

### std::shared_mutex

shared_mutex 类是一个同步原语，可用于保护共享数据不被多个线程同时访问。与便于独占访问的其他互斥类型不同，shared_mutex 拥有二个访问级别：

- 共享 - 多个线程能共享同一互斥的所有权。
- 独占性 - 仅一个线程能占有互斥。

若一个线程已获取独占性锁（通过 lock 、 try_lock ），则无其他线程能获取该锁（包括共享的）。

仅当任何线程均未获取独占性锁时，共享锁能被多个线程获取（通过 lock_shared 、 try_lock_shared ）。

在一个线程内，同一时刻只能获取一个锁（共享或独占性）。

共享互斥体在能由任何数量的线程同时读共享数据，但一个线程只能在无其他线程同时读写时写同一数据时特别有用。

```cpp
#include <iostream>
#include <mutex>  // 对于 std::unique_lock
#include <shared_mutex>
#include <thread>
 
class ThreadSafeCounter {
 public:
  ThreadSafeCounter() = default;
 
  // 多个线程/读者能同时读计数器的值。
  unsigned int get() const {
    std::shared_lock<std::shared_mutex> lock(mutex_);
    return value_;
  }
 
  // 只有一个线程/写者能增加/写线程的值。
  void increment() {
    std::unique_lock<std::shared_mutex> lock(mutex_);
    value_++;
  }
 
  // 只有一个线程/写者能重置/写线程的值。
  void reset() {
    std::unique_lock<std::shared_mutex> lock(mutex_);
    value_ = 0;
  }
 
 private:
  mutable std::shared_mutex mutex_;
  unsigned int value_ = 0;
};
 
int main() {
  ThreadSafeCounter counter;
 
  auto increment_and_print = [&counter]() {
    for (int i = 0; i < 3; i++) {
      counter.increment();
      std::cout << std::this_thread::get_id() << ' ' << counter.get() << '\n';
 
      // 注意：写入 std::cout 实际上也要由另一互斥同步。省略它以保持示例简洁。
    }
  };
 
  std::thread thread1(increment_and_print);
  std::thread thread2(increment_and_print);
 
  thread1.join();
  thread2.join();
}
 
// 解释：下列输出在单核机器上生成。 thread1 开始时，它首次进入循环并调用 increment() ，
// 随后调用 get() 。然而，在它能打印返回值到 std::cout 前，调度器将 thread1 置于休眠
// 并唤醒 thread2 ，它显然有足够时间一次运行全部三个循环迭代。再回到 thread1 ，它仍在首个
// 循环迭代中，它最终打印其局部的计数器副本的值，即 1 到 std::cout ，再运行剩下二个循环。
// 多核机器上，没有线程被置于休眠，且输出更可能为递增顺序。
```

### std::scoped_lock

类 scoped_lock 是提供便利 RAII 风格机制的互斥包装器，它在作用域块的存在期间占有一或多个互斥。

创建 scoped_lock 对象时，它试图取得给定互斥的所有权。控制离开创建 scoped_lock 对象的作用域时，析构 scoped_lock 并释放互斥。若给出数个互斥，则使用免死锁算法，如同以 std::lock 。

scoped_lock 类不可复制。

### std::filesystem

新增的文件标准库，对文件的操作从未有过的简单。一些常用的函数如下：

1. absolute 组成一个绝对路径
2. copy 复制文件或目录
3. copy_file 复制文件内容
4. copy_symlink 复制一个符号链接
5. create_directory 创建新目录
6. create_directories 创建新目录
7. current_path 返回或设置当前工作目录
8. exists 检查路径是否指代既存的文件系统对象
9. file_size 返回文件的大小
10. permissions 修改文件访问权限
11. remove 移除一个文件或空目录
12. remove_all 移除一个文件或递归地移除一个目录及其所有内容
13. rename 移动或重命名一个文件或目录
14. resize_file 以截断或填充零更改一个常规文件的大小
15. is_directory 检查给定的路径是否表示一个目录
16. is_empty 检查给定的路径是否表示一个空文件或空目录

还有一些使用的类：

1. path 表示路径
2. directory_entry 目录条目
3. directory_iterator 指向目录内容的迭代器
4. recursive_directory_iterator 指向一个目录及其子目录的内容的迭代器
5. file_status 表示文件类型及权限
6. space_info 关于文件系统上空闲及可用空间的信息

### std::reduce

该函数模板与 std::accumulate 使用方式基本一致，都是对一个范围内的元素求和。

但 reduce 多了个执行策略可以选择：

```cpp
// 定义于头文件 <execution>
class sequenced_policy { /* unspecified */ }; //(1) (C++17 起)
class parallel_policy { /* unspecified */ }; //(2) (C++17 起)
class parallel_unsequenced_policy { /* unspecified */ }; //(3) (C++17 起)
class unsequenced_policy { /* unspecified */ }; //(4) (C++20 起)
```

1. 以该执行策略类型为一种独有类型，对并行算法重载消歧义，并要求并行算法的执行可以不并行化。以此策略调用（通常以 std::execution::seq 指定）的并行算法中，元素访问函数的调用在调用方线程中是非确定顺序的。
2. 以该执行策略类型为一种独有类型，对并行算法重载消歧义，并指示并行算法的执行可以并行化。以此策略调用（通常以 std::execution::par 指定）的并行算法中，元素访问函数的调用允许在调用方线程，或由库隐式创建的线程中执行，以支持并行算法执行。任何执行于同一线程中的这种调用彼此间是非确定顺序的，
3. 以该执行策略类型为一种独有类型，对并行算法重载消歧义，并指示并行算法的执行可以并行化、向量化，或在线程间迁移（例如用亲窃取的调度器）。容许以此策略调用的并行算法中的元素访问函数调用在未指定线程中以无序方式执行，并相对于每个线程中的另一调用无顺序。
4. 以该执行策略类型为一种独有类型，对并行算法重载消歧义，并指示可将算法的指向向量化，例如在单个线程上使用在多个数据项上操作的指令指执行。

![img](https://pic4.zhimg.com/80/v2-93efa2ed72b75b42c7f386d1d126f883_1440w.jpg)

使用特定的执行策略可以实现并行运算。

```cpp
#include <iostream>
#include <chrono>
#include <vector>
#include <numeric>
#include <execution>
 
int main()
{
    std::vector<double> v(10'000'007, 0.5);
 
    {
        auto t1 = std::chrono::high_resolution_clock::now();
        double result = std::accumulate(v.begin(), v.end(), 0.0);
        auto t2 = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> ms = t2 - t1;
        std::cout << std::fixed << "std::accumulate result " << result
                  << " took " << ms.count() << " ms\n";
    }
 
    {
        auto t1 = std::chrono::high_resolution_clock::now();
        double result = std::reduce(std::execution::par, v.begin(), v.end());
        auto t2 = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> ms = t2 - t1;
        std::cout << "std::reduce result "
                  << result << " took " << ms.count() << " ms\n";
    }
}
// 可能的输出：
// std::accumulate result 5000003.50000 took 12.7365 ms
// std::reduce result 5000003.50000 took 5.06423 ms
```
