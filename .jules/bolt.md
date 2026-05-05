## 2024-05-05 - Avoid chained array methods on hot paths
**Learning:** Found significant overhead in account selection hot paths from using chained `Array.map().filter()`. These operations allocate multiple intermediate wrapper objects and arrays, generating excessive garbage collection pressure.
**Action:** Replace `Array.map().filter()` chains with single-pass `for` loops, pre-allocating objects where possible to eliminate intermediate closures and array allocations.
