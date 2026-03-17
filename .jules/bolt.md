
## 2026-03-17 - Avoid Chained Array Methods on Hot Paths
**Learning:** Chaining `.map().filter()` or evaluating multiple conditions via sequential array iterations creates massive object allocation overhead and excessive garbage collection pauses, especially in critical paths executed frequently (like `HybridStrategy.#getCandidates` during account selection).
**Action:** Replace sequential array manipulations with single-pass `for` loops. By evaluating all logic in one loop and correctly bucketing valid references without allocating intermediate objects for filtered-out items, we get an O(n) algorithmic bound instead of O(k*n) (where k is the number of chained operations or fallback checks) and dramatically reduce memory pressure.
