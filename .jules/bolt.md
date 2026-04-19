
## 2024-05-18 - [Optimization] Eliminate intermediate array allocation in BaseStrategy and HybridStrategy Account Selection
**Learning:** In hot paths like account selection, repeatedly chaining `Array.map().filter()` causes unnecessary multiple iterations over the same collection and creates numerous intermediate arrays that the garbage collector must immediately clean up. This is a common performance bottleneck in node.js.
**Action:** Replace multiple `.map().filter()` chains with a single-pass `for` loop, conditionally appending items to the correct buckets (e.g., fallback, emergency, primary candidates). Evaluate conditions in order of computational cost to allow for early `continue` branching and skip unnecessary evaluations.
