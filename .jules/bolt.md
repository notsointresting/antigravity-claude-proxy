## 2026-05-23 - Avoid Chained Array Methods on Hot Paths
**Learning:** Chaining array methods like `.map().filter().sort()` inside frequently called loops (e.g., scoring candidates) leads to severe performance bottlenecks due to excessive intermediate array allocations and O(N log N) sorting overhead.
**Action:** Replace map/filter/sort chains with single-pass `for` loops on hot paths. Maintain collections like `normal`, `quota`, `emergency`, and `lastResort` explicitly, and find maximum values manually via traversal instead of sorting.
