---
layout: post
title: Communicating with function signatures in C++
categories: C++
comments: true
---

How you write your function signatures in C++ tells the user a lot about what the function will do how it will treat the ownership of the arguments. However, as with all aspects of programming, there are good ways and bad ways to write function signatures.
Before we start, we won't be addressing the `const` qualifier for functions. These have the simple effect of letting the user know that the underlying object will remain logically constant. We also will only consider one parameter in each signature and try to extrapolate from there. Furthermore, return values won't be addressed, but many of the same comments about parameters are also valid for return values.
Each example signature uses one of three types of parameter:
1. **Basic types.** Basic types are the types that are intrinsic to C++ such as `int`, `float`, `double`, `char` and `bool`. Basic types will be represented with `int`, but can be extrapolated to all basic types.
2. **Objects.** Objects are a collection of basic types typically with their own functions. For our considerations, they are just more expensive to copy than basic types. Objects will simply be represented with `Object`.
3. **Smart pointers.** Smart pointers need special consideration when it comes to copying. Smart pointers will represented with their respective types; `std::unique_ptr<Object>` and `std::shared_ptr<Object>`.

Let's start of with the good ways that nobody is going to dispute. All following signatures are the *interface* (ie. in the header).

## Good inoffensive function signatures

### *Pass-by-value* function signatures

```cpp
void f(int x);
void f(Object x);
```

With these signatures, you tell the user that the function will copy the arguments passed to it effectively conveying sole ownership of the copied value to the function.

When copying basic types, the function can do anything it wants to the values and the user won't have to worry if their own copies will be changed. However, objects may contain references to other values and the user still needs to pay attention to the values referred to. Furthermore, copying objects can be expensive, and, if you're only going to look at the object but not alter it, then you can use the following:

### *Pass-by-reference*/*-pointer* (`const`) for objects

```cpp 
void f(const Object &x);
void f(const Object *x);
```

With these signatures, you tell the user that the function will be referring directly to the value that the user also has, but you won't be altering it or trying to own it. Just one caveat here, you might prefer the usage of *pass-by-reference* over *pass-by-pointer* here just to make it crystal clear that the function doesn't care about ownership. On the other hand, classes in an inheritance hierarchy are sometimes passed by pointer to the most relevant abstract class. 

If you want to own the value passed, then you'll need smart pointers.

### Pass smart pointers by value

```cpp
void f(std::shared_ptr<Object> x);
void f(std::unique_ptr<Object> x);
```

With these signatures, you tell the user that the function will keep a reference to the value that they pass and that it may edit it at its leisure. With `std::shared_ptr` the user may care about whether the value changes, but with the `std::unique_ptr` you become the sole owner so, after the user hands off the ownership, their part is done. If you only ever want to be updated on the state of the value then use:

```cpp
void f(std::shared_ptr<const Object> x);
```

A `std::shared_ptr<Object>` will convert naturally to a `std::shared_ptr<const Object>`.

And that's it! The usage of other function signatures might cause some debate about their intent and various levels of caution are required for their use. In each case, there are completely valid cases for their use, but with increasing probability, they are to be avoided. Let's take a look.

## Somewhat iffy function signatures

### *Pass-by-reference*/*-pointer* function signatures

```
void f(int &x);
void f(int *x);
void f(Object &x);
void f(Object *x);
```

The reason these function signatures are to be avoided is because their intent is unclear. This kind of signature often means you want to:
1. have *out* parameters,
2. have *in/out* parameters or
3. set an argument to `true` on success (also an *out* parameter but handled differently when refactoring).

Let's consider each case and what we can do instead.

#### 1. *out* parameters

*Out* parameters are considered bad practice in general. It isn't immediately obvious whether they are *in/out* or just *out*. Sure, you can document that, but wouldn't you rather let the compiler control that for you. If you have a single *out* parameter, then consider returning it instead or, if you have multiple *out* parameters, then use a tuple.

```cpp
int f();
Object f();
std::tuple<int, Object> f();
```

If you want to allow the user to read the value of a member object then return a `const` reference or a smart pointer to share or transfer ownership.

```cpp
const Object &f();
std::shared_ptr<Object> f();
std::unique_ptr<Object> f();
```

#### 2. Returning a success state

A special case of the *out* parameters is returning the success state. There are two function signatures that are commonly used to return a success state, both of which should be discouraged.

```cpp
int f(bool &success);
bool f(int &x)
```

In this case, consider returning a `std::optional`. This makes it much clearer that the return value may not be valid.

```cpp
std::optional<int> f();
```

#### 3. *in/out* parameters

*In/out* parameters can be considered bad practice for the same reasons as *out* parameters, but furthermore they may be an indication you are breaking encapsulation. If you find that you are consistently needing the same *in/out* parameter to alter an object, consider making the functions members of that object.

```cpp
class Object {
public:
  void f();
}
```

#### Usage in the standard library

There is one glaringly obvious example from the standard library where this kind of function signature is used and is considered completely acceptable.

```cpp
ostream &operator<<(ostream &out, const Object &x);
```

However, it could be argued that this implementation is purely for the syntactic sugar and the same effect could have been achieved with:

```cpp
std::string Object::toString();
ostream::write(const std::string &out);
```

In most cases, you probably don't need the syntactic sugar and it's probably best avoided anyway until you have a mature and stable code base.

## Bad function signatures

Finally we move onto the bad function signatures. If you are using these, there's a high probability you need to reconsider what you're trying to achieve.

### `const`ing parameters that convey sole ownership 

```cpp
void f(const int);
void f(const Object);
void f(const std::shared_ptr<Object> x);
void f(const std::unique_ptr<Object> x); 
void f(std::unique_ptr<const Object> x);
```

These signatures are pointless (as declarations). At the same time you're taking sole ownership of the object, you promise the user you'll never change it. Once ownership is handed over, the user no longer cares what happens to the object. For the basic types parameters, consider making them `const` in the definition, but not in the declaration. For the `const std::shared_ptr`, there's a chance you meant to `const` the object, not the pointer. Finally, just pass the `std::unique_ptr` by value.

### *Pass-by-reference*/*-pointer*  (`const`) for base types

```cpp
void f(const int &x);
void f(const int *x);
```

You've made the user *pass-by-reference*/*pass-by-pointer* a base type, which costs the same as passing by value, but at the same time told them you're not going to alter it, so they don't need to care what happend to the value. Just let them *pass-by-value* and maybe declare the parameter `const` in the definition.

### *Pass-by-reference*/*-pointer* for smart pointers (`const` and non-`const`) 

```cpp
void f(std::shared_ptr<Object> *x);
void f(std::shared_ptr<Object> &x);
void f(std::unique_ptr<Object> *x);
void f(std::unique_ptr<Object> &x);
void f(const std::shared_ptr<Object> *x);
void f(const std::shared_ptr<Object> &x);
void f(const std::unique_ptr<Object> *x);
void f(const std::unique_ptr<Object> &x); 
```

If you're doing this, you're probably just confused. Unless you want to alter the smart pointer itself, there's no benefit to forcing the user to wrap their objects in smart pointers (if they weren't already) before calling your function. Additionally, making the smart pointer `const` probably wasn't your intention. You probably wanted to make the object `const`. These signatures can be re-written to improve their flexibility.

```cpp
void f(Object *x);
void f(Object &x);
void f(const Object *x);
void f(const Object &x);
```

Furthermore, remember what was said about *in/out* parameters earlier. The top two signatures can probably be further refactored to one of the solutions mentioned above. 

In case you're wondering how to call these functions if your objects are wrapped in smart pointers?

```cpp
void f(const Object &x) {}
std::shared_ptr<Object> x;
f(*x);
```

## Summary

Thorough thought about function signatures can dramatically increase the clarity of your code. C++ allows far more bad function signatures than good ones and many signatures can be re-written to better express what you're trying to achieve. Below is a simplified overview of the possible signatures.

### Basic types

```cpp
void f(int x); // Good
void f(int *x); // Iffy
void f(int &x); // Iffy
void f(const int x); // Bad
void f(const int *x); // Bad
void f(const int &x); // Bad
```

### Objects
```cpp
void f(Object x); // Good
void f(Object *x); // Iffy
void f(Object &x); // Iffy
void f(const Object x); // Bad
void f(const Object *x); // Good
void f(const Object &x); // Good
```

### Shared pointers
```cpp 
void f(std::shared_ptr<Object> x); // Good
void f(std::shared_ptr<const Object> x); // Good
void f(std::shared_ptr<Object> *x); // Iffy
void f(std::shared_ptr<Object> &x); // Iffy
void f(const std::shared_ptr<Object> x); // Bad
void f(const std::shared_ptr<Object> *x); // Bad
void f(const std::shared_ptr<Object> &x); // Bad
```

### Unique pointers
```cpp 
void f(std::unique_ptr<Object> x); // Good
void f(std::unique_ptr<const Object> x); // Bad
void f(std::unique_ptr<Object> *x); // Iffy
void f(std::unique_ptr<Object> &x); // Iffy
void f(const std::unique_ptr<Object> x); // Bad
void f(const std::unique_ptr<Object> *x); // Bad
void f(const std::unique_ptr<Object> &x); // Bad
```

