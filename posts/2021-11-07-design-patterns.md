---
title: 设计模式
description: 根据《HeadFirst 设计模式》一书提取，方便后面回顾记忆。
date: 2021-11-07
---

> 根据《HeadFirst 设计模式》一书提取，方便后面回顾记忆。

## 1. **策略模式**

定义算法族，分别封装起来，让它们之间可以互相替换，此模式让算法的变化独立于使用算法的客户。

比如有个定义走路方式的虚基类，具体实现由各个子类实现，有个把该虚基类指针或引用作为成员变量的类如人，那么人如何走路的呢可以由具体的走路子类来指定，重要的是走路方式可以在运行时变化。

## 2. **观察者模式**

在对象之间定义一对多的依赖，这样一来，当一个对象改变状态，依赖它的对象都会收到通知，并自动更新。

简单的一对多关系，被观察者自身含有一些状态变化，观察者如果需要这些状态变化就可以把自身注册到被观察者（主题）身上，那么主题自身的状态发生改变时就可以通知已注册的观察者们。

## 3. **装饰者模式**

动态地将责任附加到对象上。想要扩展功能，装饰者提供有别于继承地另一种选择。

一个商品子类定义了cost()和getDescription()虚基类，有两种饮料继承该子类，比如咖啡和奶茶，又有一个组件继承该虚基类，并把getDescription()定于为纯虚函数，然后就有加糖/加奶等具体的装饰者继续改虚基类，糖/奶类里面包含一个商品的子类指针或者引用，这样咖啡加糖加奶就可以层层嵌套，哪怕加双份糖也可以new 两个糖子类并把咖啡的指针或引用传进去即可。获取价格时就是本身cost加上传进来的指针或引用的cost。

## 4. **工厂方法模式**

定义了一个创建对象的接口，但由子类决定要实例化的类是哪一个。工厂方法让类把实例化推迟到子类。

有一个基类，有两个函数一个orderPizza(string)(实现)，一个createPizza(string)(纯虚函数)，不同地区点pizza时获取的是该地区特色的pizza，所有不同的子类都继承该基类，并具体实现了createPizza，由于制作pizza的流程一样的，所以orderPizza不用变，这时候，new不同的子类调用orderPizza()时就会根据具体的子类实例化一个具体的pizza。

## 5. **抽象工厂模式**

提供一个接口，用于创建相关或依赖对象的家族，而不需要明确指定具体类。

定义一个基类，里面有获取各个辅料的接口。不同地区继承该基类实现自己的子类，调用获取辅料的接口时就会返回该地区特色的这种辅料。比如制作pizza时需要各种辅料，new Pizza的时候就需要把获取辅料的指针或引用传进去，其实pizza基类里面是不知道获取的真正辅料是什么，不同的createPizza子类会new真正的辅料子类。

## 6. **单件模式**

确保一个类只有一个实例，并提供全局访问点。

把构造函数声明为private，声明自己类的指针，静态函数获取唯一实例。急切实例化：在定义时即初始化变量，虽然保证唯一但是可能会没有使用这个变量而造成资源浪费；双重检查加锁：第一判断指针为空，上锁再次检查一次是否为空，如果为空才真正的实例化变量。

## 7. **命令模式**

将“请求”封装成对象，以便使用不同的请求、队列或者日志来参数化其他对象。命令模式也支持可撤销的操作。

主要是有个纯虚Commnad类，里面有excute()执行函数和undo()撤销函数。具体需要执行什么命令通过继承这个类实现其真正的excute()/undo()，每个按钮绑定到特定的Command中，同时，Command也可以集成一个命令宏，用于执行一连串的命令。

## 8. **适配器模式**

将一个类的接口，转换成客户期望另一个接口。适配器让原本不兼容的类可以合作无间。

就像港版iPhone的充电器，就要买个转接口才能用。不如你一个火鸡类，想要被现有调用鸭子类接口的函数使用，那么，你就需要一个适配器类，把鸭子类的接口转接调用火鸡类接口。有两种实现方式：1. 组合（需要一个火鸡实例，调用鸭子接口时就会委托给火鸡） 2. 继承（直接将鸭子方法的调用，转接到调用火鸡的方法）

## 9. **外观模式**

提供了一个统一的接口，用来访问子系统中的一群接口。外观定义了一个高层接口，让子接口更容易使用。

好像家庭影院一样，你看电影的时候，先打开电视机，打开音响，打开播放机，关闭窗帘等等，如果你使用外观模式，你就可以定义一个类，给出两个方法，一个watchMovie，一个是turnoffMovie，这样，你就只要两个操作，就可以让执行一系列的动作，这就是统一的一个接口调用子系统中的一群接口。

## 10. **模板方法模式**

在一个方法中定义一个算法的骨架，而将一些步骤延迟到子类中。模板方法使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。

比如泡咖啡和泡茶，它们的动作中间有一大部分是重复的，那么就可以把这重复的定义在一个基类里，不一样的定义为虚函数，让子类具体来实现它具体的方法。这样，当你调用基类makeDrink()，它根据子类给你提供你真正要的饮料。就类似算法中的排序一样，你自己定义的类也可以调用标准库里的排序算法，但是你要实现一个operator<操作符。

## 11. **迭代器模式**

提供一种方法顺序访问一个聚合对象中的各个元素，而又不暴露其内部的表示。

如果你有不同的类，但它们拥有相同的子元素并且是用不同的容器保存，当你想遍历所有元素的时候，可以声明一个迭代器虚类，然后为不同的容器实现`hasNext()`/`next()`接口，即可使用相同的方法遍历不同的容器里面的元素。

## 12. **组合模式**

允许你将对象组成树形结构来表现“整体/部分”的层次结构。组合能让客户以一致的方式处理个别对象和对象组合。

组合的理解，就是一个树。可以包含许多节点或者子树的集合。

## 13. **状态模式**

允许对象在内部状态改变时改变它的行为，对象看起来好像修改了它的类。

联想糖果机的状态转换。

## 14. **代理模式**

为另一个对象提供一个替身或占位符以控制对这个对象的访问。

ICE是代理模式最好的实现了。

## 15. **复合模式**

复合模式结合两个或以上的模式，组成一个解决方案，解决一再发生的一般性问题。

MVC（model - view - controller）模式最好的体现。