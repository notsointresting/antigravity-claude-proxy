## 2026-03-09 - [Reduce Object Allocation Overhead in HybridStrategy Selection]
**Learning:** Chained `.map().filter()` array methods in hot paths (like candidate selection loops in `HybridStrategy`) create significant garbage collection pressure due to intermediate array allocation and repeated iterations over candidate subsets.
**Action:** Always favor direct `for` loops combined with early-exits (`continue`) to minimize object allocations and GC overhead on high-frequency candidate filtering logic.
