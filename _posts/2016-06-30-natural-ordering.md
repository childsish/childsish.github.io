---
layout: post
title: Natural Ordering
categories: python
---

Sorting chromosome names can be a little frustrating when using the implicit ordering of strings. 

```{python}
chromosomes = ['chr1', 'chr2', 'chr3', 'chr10', 'chr11', 'chr20', 'chr21']
print sorted(chromosomes)
```

```
['chr1', 'chr10', 'chr11', 'chr2', 'chr20', 'chr21', 'chr3']
```

This can be easily fixed by using a key that allows natural ordering (what we expect as humans).

```{python}
import re

regx = re.compile('(\d+)')

def natural_key(item):
    return [int(part) if part.isdigit() else part for part in regx.split(item)]
```

Basically, we split the string into numerical and non-numerical string and convert the numerical string into actual integers. Now any comparison of the numerical parts will result in the comparison of the numerical value and not the string value. This gives us a more intuitive ordering of the chromosome names.

```{python}
print sorted(chromosomes, key=natural_key)
```

```{python}
['chr1', 'chr2', 'chr3', 'chr10', 'chr11', 'chr20', 'chr21']
```

However this comes at a cost. The extra processing takes much more time than a simple sort. Let's define a couple more functions to help the comparison (and to explore other possibilities).

```{python}
def no_key(item):
    return item

def natural_key_tuple(item):
    return tuple(int(part) if part.isdigit() else part for part in regx.split(item))
```

Now we use the python _timeit_ library to benchmark the different possibilities.

```
import timeit

print timeit.timeit('sorted(items)', 'from __main__ import items')
print timeit.timeit('sorted(items, key=no_key)', 'from __main__ import items, no_key')
print timeit.timeit('sorted(items, key=natural_key)', 'from __main__ import items, natural_key')
print timeit.timeit('sorted(items, key=natural_key_tuple)', 'from __main__ import items, natural_key_tuple')
```

```{python}
0.969323151621
2.93165831424
25.1126305945
37.8838585194
``` 

This was tested on a 2.4GHz i7 running Windows 10.
