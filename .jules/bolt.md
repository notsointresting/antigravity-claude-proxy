## 2026-05-07 - Array Allocation Optimization on Hot Paths
**Learning:** Sequential `.map().filter()` chains and `.sort()` on arrays during hot paths (like candidate selection in account strategies) cause unnecessary intermediate array allocations, resulting in excessive garbage collection overhead.
**Action:** Replace chained array methods with single-pass `for` loops, combining classification, filtering, and maximum tracking (e.g., O(N) max score tracking instead of O(N log N) sorting) to minimize allocations and improve performance on hot paths.
