
## 2026-05-31 - [Optimize account selection in HybridStrategy]
**Learning:** Finding the maximum or best element in a collection on a hot path by creating an intermediate mapped array and sorting it (`O(n log n)`) introduces unnecessary CPU cycles and memory allocations, leading to increased GC pressure.
**Action:** Replace `candidates.map(...).sort(...)` with a single-pass `for` loop (`O(n)`) that calculates scores and tracks the highest-scoring candidate dynamically without building an intermediate array.
