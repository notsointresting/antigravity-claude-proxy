## 2024-05-19 - Avoid O(n log n) sorting on hot paths
**Learning:** In `HybridStrategy`, calculating scores and selecting the best account was using `.map()` and `.sort()` on all candidates, which is O(n log n) and allocates new arrays, causing GC pressure. On a hot path where this is called for every request, this adds unnecessary overhead.
**Action:** Replaced it with a single-pass `for` loop to find the best candidate in O(n) time and minimal memory allocation.
