---
layout: post
title: Variadic Templates in C++
categories: C++
comments: true
---

I was having trouble using variadic templates to implement a partite graph class so I decided to post my solution to help anybody else who also might have trouble. I make no claim that this is an optimal solution so any comments for improvement are welcome.

# Partite graphs

First, let's quickly go over what a partite graph is because they aren't really the focus of the post. A k-partite graph is a graph whose vertices can be partitioned into k sets such that no vertex is connected to any other vertex within the same set. Simple right? Here's a picture of a bipartite graph (two partitions):
  
![image of bipartite graph](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Simple-bipartite-graph.svg/240px-Simple-bipartite-graph.svg.png "Bipartite graph")

My problem was very simple. Create a partite graph class that could be defined with an arbitrary number of partitions and use arbitrary types for each partition. I could think of two options that would solve my problem neatly. One option was to have a generic `Type` class that could be downcast with `dynamic_cast` after retrieval from the graph. The other option was to use variadic templates. I chose to go with the second. 

# Variadic templates
 
In C++11, variadic templates are templates that can take an arbitrary number of template arguments. An excellent example is the new `std::tuple` class that acts like a more general version of the `std::pair` class. Using a tuple works much like this:
 
```$cpp
std::tuple<std::string, int, int, double> genomic_feature = std::make_tuple("chr1", 0, 10000, 0.5);
std::tuple<int, std::string, std::string> gene_description = std::make_tuple(0, "KRAS", "Kirsten rat sarcoma")
```

As you can see, you can define any type for the entries in the tuple making it extremely flexible and behave much like you would use Python tuples. Conceptually, they are simple to grasp, but implementing templated classes with variadic template arguments is a little more challenging. Let's take a look at a possible implementation of `tuple` (Some of this material was taken from an excellent post by Eli Bendersky<sup>[1]</sup> - please go read it, it helped me greatly).
 
```$cpp
template <typename... Ts> struct tuple {};
```

That any number of type arguments are accepted are specified by the `...` after the `typename` symbol (alternatively `class`). What we see here is incomplete though. Where do we store the actual values? How do we access the types for each value? To answer these questions you have to go through a process called template list unrolling (or something similar). In more detail, you don't actually directly access an entry in the argument list; rather, you create a nested template structure that terminates when you've reached a desired condition. Let write a more complete `tuple` to demonstrate this.  

```$cpp
template <typename... Ts> struct tuple {};  // same as above

template <class T, class... Ts>
struct tuple<T, Ts...> : tuple<Ts...> {
  T tail;
};
```

Notice that we've created a specialisation of the tuple template. We now have two templates, one that has `Ts...` as a template parameter and the other that has `T` and `Ts...` as template parameters. When resolving a tuple, the template with two parameters is preferred over the template with one. When this happens, a single argument from the argument list becomes `T` and the remaining are used to create a new template specialisation. This occurs recursively until no arguments are left and `Ts...` is the only option and will be empty. Now, we can unravel the argument list. For example, if we specialise the template like this:

```cpp
tuple<double, int, std::string> my_tuple;
```

The unrolling looks like this:

```cpp
struct tuple<double, int, std::string> : tuple<int, std::string> {
    double tail;
}

struct tuple<int, std::string> : tuple<std::string> {
    int tail;
}

struct tuple<std::string> : tuple {
    std::string tail;
}

struct tuple {
}
```

This shows that the first argument of the argument list is peeled off and used to declare the `tail` member. the remaining arguments are used to specialise another class which does the same thing recursively until no arguments are left. The whole process terminates when the base tuple class is reached which does not inherit from any class.

So we now know how the entry values get stored and how the types are determined. But how do we set and get these values? Let's take a look using a real-life example, the partite graph.

# Implementation

Let's give a brief description of the attributes of the partite graph.

* Vertices use identifiers.
* Each identifier maps to the vertex value/type.
* The identifier itself is templated.

With this information the partite graph looks a little like this:

```cpp
// The class declaration
template <typename V, typename... Ts>
PartiteGraph {}

// Partial specialisation of the base template class
template <typename V, typename T, typename... Ts>
PartiteGraph<V, T, Ts...> : PartiteGraph<V, Ts...> {
private:
    std::unordered_map<V, T> _partition;
}
```

So far this is fairly straightforward. `V` is the vertex identifier and `T` is the partition type. Each partition also gets it's own map. If we want to add a vertex to a partition, we now need to add an `add_vertex` function. The signature could look a little like this:

```cpp
template <typename V, typename T, typename... Ts>
PartiteGraph<V, T, Ts...> : PartiteGraph<V, Ts...> {
public:
    void add_vertex(const V &vertex, const T &type) {
        _partition.emplace(vertex, type);
    }
private:
    std::unordered_map<V, T> _partition;
}
```

But that would only work on a single partition. Somehow we need to recurse through the partitions until we hit the right one then call the `add_vertex` method that actually inserts the value. But how will we know when to stop recursing? Here, we introduce the `std::enable_if` struct. `std::enable_if` takes two template arguments, a boolean (or an expression that evaluates at compile-time to a boolean) and the type contained in member `::type` if the first argument is `true`. If the first argument of `std::enable_if` evaluates to false, then the entire function signature is invalid and can not be used. Now we can introduce the partition we want to add to as a template argument, subtract one from the partition number at each recursion until we reach 0 and then switch to using the function that adds to the map.

```$cpp
template <typename V, typename T, typename... Ts>
PartiteGraph<V, T, Ts...> : PartiteGraph<V, Ts...> {
public:
    template <unsigned int partition>
    void add_vertex(const V &vertex, const typename std::enable_if<partition == 0, T> &type) {
        _partition.emplace(vertex, type);
    }
    template <unsigned int partition>
    void add_vertex(const V &vertex, const typename std::enable_if<partition != 0, T> &type) {
        const PartiteGraph<V, Ts...>& graph = *this;
        graph.add_vertex(vertex, type);
    }
private:
    std::unordered_map<V, T> _partition;
}
```

Now when we call `add_vertex`, the template function should unroll at compile time until partition is 0, then the value should be added to the correct partition. But there is still a problem. Unfortunately, the type of `T` changes at each level of recursion. So, somehow we need to know at compile time the type of `T` in the partition we are trying to add to. Here we come back to the `std::tuple` class and another helper struct called `std::tuple_element`. The member `::type` of `std::tuple_element` will give us the type of the element at the given element.
For example:
  
```cpp
std::tuple_element<0, tuple<double, int, std::string>>::type a_double;
std::tuple_element<1, tuple<double, int, std::string>>::type an_int;
std::tuple_element<2, tuple<double, int, std::string>>::type a_string;
```

With this final piece of the puzzle, we can now finish writing the `add_vertex` function.

```$cpp
template <typename V, typename T, typename... Ts>
PartiteGraph<V, T, Ts...> : PartiteGraph<V, Ts...> {
public:
    template <unsigned int partition>
    void add_vertex(const V &vertex, const typename std::enable_if<partition == 0, T> &type) {
        _partition.emplace(vertex, type);
    }
    
    template <unsigned int partition>
    void add_vertex(const V &vertex, const typename std::enable_if<partition != 0, std::tuple_element<partition, std::tuple<T, Ts...>>::type>::type &type) {
        const PartiteGraph<V, Ts...>& graph = *this;
        graph.add_vertex(vertex, type);
    }
private:
    std::unordered_map<V, T> _partition;
}
```

# Additional Material

* std::tuple<sup>[2]</sup>
* std::enable_if<sup>[3]</sup>
* std::tuple_element<sup>[4]</sup>

[1]: http://eli.thegreenplace.net/2014/variadic-templates-in-c/
[2]: http://en.cppreference.com/w/cpp/utility/tuple
[3]: http://en.cppreference.com/w/cpp/types/enable_if
[4]: http://en.cppreference.com/w/cpp/utility/tuple/tuple_element
