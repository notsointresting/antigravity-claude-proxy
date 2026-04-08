## 2024-04-08 - Optimized Account Selection Strategy Filtering
**Learning:** Chaining `.map().filter()` in hot code paths like `HybridStrategy.#getCandidates` and `BaseStrategy.getUsableAccounts` creates intermediate arrays that increase garbage collection overhead.
**Action:** Replace map/filter chains with single-pass `for` loops and pre-allocated arrays where possible to avoid unnecessary memory allocation, especially when called frequently during API requests.
