
## 2026-03-20 - [Optimize Array Map/Filter Chains in Hot Paths]
**Learning:** Chaining `.map().filter()` iteratively across arrays evaluates full arrays multiple times and creates unnecessary short-lived objects. In `HybridStrategy.#getCandidates`, we were checking fallback conditions sequentially, evaluating full array operations over and over.
**Action:** Replace `Array.map().filter()` chains with a single-pass `for` loop to track primary candidates and multiple potential fallback branches synchronously in a single iteration. This reduces object allocations and processing cycles on critical path operations.
