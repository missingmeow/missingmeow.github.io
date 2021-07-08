---
title: C++11/14/17/20 新特性
description: C++ 高级特性说明及使用方法，带你快速上手使用高级 C++。
date: 2021-07-08
---

## C++11

### 1. nullptr

`nullptr`主要是为了替代`NULL`。`nullptr`的类型为 `nullptr_t`，能够隐式的转换为任何指针或成员指针的类型，也能和他们进行相等或者不等的比较。

### 2. constexpr

`constexpr`让用户显式的声明函数或对象构造函数在编译器会成为常数。

```c++
constexpr int fibonacci(const int n) {
    return n == 1 || n == 2 ? 1 : fibonacci(n-1)+fibonacci(n-2);
}

char arr[fibonacci(5)]; // 合法
```

### 3. auto

`auto`关键字进行类型推导。不能用于函数传参。

```c++
// 不用类型推导之前
for(vector<int>::const_iterator itr = vec.cbegin(); itr != vec.cend(); ++itr)
// 使用auto后
for(auto itr = vec.cbegin(); itr != vec.cend(); ++itr);
```

### 4. decltype

`decltype`关键字是为了解决`auto`关键字只能对变量进行类型推导的缺陷而出现的。

```c++
auto x = 1;
auto y = 2;
decltype(x+y) z;

// 函数模板
template<typename T, typename U>
auto add(T x, U y) -> decltype(x+y) {
    return x+y;
}
```

### 5. 区间迭代

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

### 6. std::initializer_list

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

### 7. 类型别名模板

通常我们使用`typedef`定义别名的语法是：`typedef 原名称 新名称`;C++11使用`using`引入了下面这种形式的写法，并且同时支持对传统`typedef`相同的功效：

```c++
typedef int (*process)(void *);  // 定义了一个返回类型为 int，参数为 void* 的函数指针类型，名字叫做 process
using process = void(*)(void *); // 同上, 更加直观
using NewType = SuckType<std::vector, std::string>;
using vecIter = std::vector<int>::const_iterator;
```

### 8. 委托构造与继承构造

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

### 9. override

当重载虚函数时，引入`override`关键字将显式的告知编译器进行重载，编译器将检查基函数是否存在这样的虚函数，否则将无法通过编译。

```c++
struct Base {
    virtual void foo(int);
};
struct SubClass: Base {
    virtual void foo(int) override; // 合法
    virtual void foo(float) override; // 非法, 父类没有此虚函数
};
```

### 10. final

`final`则是为了防止类被继续继承以及终止虚函数继续重载引入的。

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

### 11. Lambda表达式

```c++
[捕获列表](参数列表) mutable(可选) 异常属性 -> 返回类型 {
    // 函数体
}
```

### 12. std::function

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

### 13. std::bind/std::placeholder

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

### 14. std::move

```c++
#include <iostream> // std::cout
#include <utility>  // std::move
#include <vector>   // std::vector
#include <string>   // std::string

int main() {

    std::string str = "Hello world.";
    std::vector<std::string> v;

    // 将使用 push_back(const T&), 即产生拷贝行为
    v.push_back(str);
    // 将输出 "str: Hello world."
    std::cout << "str: " << str << std::endl;

    // 将使用 push_back(const T&&), 不会出现拷贝行为
    // 而整个字符串会被移动到 vector 中，所以有时候 std::move 会用来减少拷贝出现的开销
    // 这步操作后, str 中的值会变为空
    v.push_back(std::move(str));
    // 将输出 "str: "
    std::cout << "str: " << str << std::endl;

    return 0;
}
```

### 15. std::tuple

关于元组的使用有三个核心的函数：

1. `std::make_tuple`: 构造元组
2. `std::get`: 获得元组某个位置的值
3. `std::tie`: 元组拆包

```c++
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

### 16. 智能指针

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

### 17. std::thread

### 18. std::mutex

C++11 为互斥量提供了一个RAII语法的模板类`std::lock_gurad`。RAII在不失代码简洁性的同时，很好的保证了代码的异常安全性。

```c++
void some_operation(const std::string &message) {
    static std::mutex mutex;
    std::lock_guard<std::mutex> lock(mutex);

    // ...操作

    // 当离开这个作用域的时候，互斥锁会被析构，同时unlock互斥锁
    // 因此这个函数内部的可以认为是临界区
}
```

而`std::unique_lock`则相对于`std::lock_guard`出现的，`std::unique_lock`更加灵活，`std::unique_lock`的对象会以独占所有权（没有其他的 `unique_lock`对象同时拥有某个`mutex`对象的所有权）的方式管理`mutex`对象上的上锁和解锁的操作。所以在并发编程中，推荐使用`std::unique_lock`。

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

### 19. std::future/std::packaged_task

`std::future`则是提供了一个访问异步操作结果的途径。`std::packaged_task`可以用来封装任何可以调用的目标，从而用于实现异步的调用。

```c++
#include <iostream>
#include <future>
#include <thread>

int main()
{
    // 将一个返回值为7的 lambda 表达式封装到 task 中
    // std::packaged_task 的模板参数为要封装函数的类型
    std::packaged_task<int()> task([](){return 7;});
    // 获得 task 的 future
    std::future<int> result = task.get_future();    // 在一个线程中执行 task
    std::thread(std::move(task)).detach();    std::cout << "Waiting...";
    result.wait();
    // 输出执行结果
    std::cout << "Done!" << std:: endl << "Result is " << result.get() << '\n';
}
```

在封装好要调用的目标后，可以使用`get_future()`来获得一个`std::future`对象，以便之后实施线程同步。

### 20. std::condition_variable

`std::condition_variable`是为了解决死锁而生的。当互斥操作不够用而引入的。比如，线程可能需要等待某个条件为真才能继续执行，而一个忙等待循环中可能会导致所有其他线程都无法进入临界区使得条件为真时，就会发生死锁。所以，`condition_variable`实例被创建出现主要就是用于唤醒等待线程从而避免死锁。`std::condition_variable`的`notify_one()`用于唤醒一个线程；`notify_all()`则是通知所有线程。

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

### 21. thread_local

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
