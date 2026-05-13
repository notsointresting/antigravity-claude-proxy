## 2026-05-13 - Optimize array operations on hot paths
**Learning:** When finding the optimal or highest-scored element in a collection on a hot path, avoid constructing an intermediate mapped array and calling `.sort()` (which is O(n log n)).
**Action:** Instead, track the best candidate during a single-pass `for` loop to eliminate unnecessary memory allocations and GC pressure.
