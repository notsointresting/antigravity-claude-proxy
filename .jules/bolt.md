## 2025-05-27 - Optimized Account Selection Hot Paths
**Learning:** Found multiple instances of chained `.map().filter()` array methods and an O(N log N) `.sort()` inside the high-traffic `selectAccount` and `#getCandidates` methods of `HybridStrategy` and `BaseStrategy`. These create heavy garbage collection pressure due to intermediate array allocation.
**Action:** Replaced them with single-pass `for` loops, completely eliminating temporary array overhead and finding max element in O(N) time. Will watch for similar map+filter chaining in hot paths throughout this specific architecture.
