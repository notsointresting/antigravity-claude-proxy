## 2024-03-08 - HybridStrategy.#getCandidates Object Allocation Optimization
**Learning:** In hot path candidate filtering functions (like `HybridStrategy.#getCandidates`), chaining `Array.map().filter()` leads to excessive array creations and garbage collection overhead. Since this is executed multiple times per request as part of account selection strategy, optimizing it makes routing measurably faster.
**Action:** Replace `Array.map().filter()` with a direct `for` loop that aggregates results into pre-allocated or dynamically sized arrays without creating intermediate wrapper arrays.
