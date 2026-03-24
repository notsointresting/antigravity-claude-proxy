
## 2024-03-24 - [HybridStrategy Candidate Selection Optimization]
**Learning:** In hot loops like `HybridStrategy` candidate evaluation and scoring, using chained `.map().filter()` or `.map().sort()` creates intermediate arrays, causing object allocations and CPU overhead from multiple passes.
**Action:** Replace functional array pipelines with single-pass `for` loops in performance-critical sections to eliminate intermediate array allocations and reduce time complexity (e.g., O(n) instead of O(n log n) or O(n*k)).
