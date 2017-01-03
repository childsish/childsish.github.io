---
layout: post
title: Compile igraph with CMake
categories: igraph, C, CLion
comments: true
---

`igraph`<sup>[1][1]</sup> is an excellent graph library for graph theory written in C with bindings for Python and R. Beyond constructing and traversing graphs, it also provides several algorithms for calculating global and local graph properties. Compiling and installing `igraph` is fairly straight-forward using the standard `./configure`, `make`, `make install` commands. However, my current IDE of choice, CLion<sup>[2][2]</sup>, has opted to use CMake<sup>[3][3]</sup> as their build suite of choice. To compile `igraph`-based projects in CLion, I had to write two extra files to tell CMake how to build `igraph`. Currently, they are not complete, but they are functional. As I find any critical parts that are missing, I'll update this page.

The first file is a `CMakeLists.txt`. This is the main file that tells CMake how to compile `igraph`. It consists of the following sections:
1. Checking whether various header files or functions can be found, or if certain C code can be compiled and setting the necessary build variables.
2. Compiling and executing `arithchk` to create `arith.h`.
3. Compiling and linking `igraph` and the provided libraries (`cs`, `f2c`, `lapack`, `plfit` and `prpack`).

The second file is `config.cmake.h.in`. This file simply contains the build variables in a cmake compatible format.

{% gist 92acf361bf17d939a971cb19f5ffa344 %}

To use these files, simply drop them into the main igraph directory.

[1]: http://igraph.org
[2]: https://www.jetbrains.com/clion/
[3]: https://cmake.org/
