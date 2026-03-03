
## 2026-03-03 - [Array map+filter vs direct loop performance]
**Learning:** `Array.map().filter()` chains create intermediate arrays and objects, causing significant garbage collection pressure and CPU overhead on hot paths. A benchmark showed a direct `for` loop was ~4.4x faster for object mapping and filtering in this codebase's JavaScript engine.
**Action:** When filtering and mapping collections on critical hot paths (like `HybridStrategy.#getCandidates` which runs on *every request*), use a direct `for` loop to build the final array instead of chaining array methods.
