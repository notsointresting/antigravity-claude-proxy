## 2024-11-20 - [Avoid .map().filter() chaining on hot paths]
**Learning:** Chaining `.map().filter()` over collections creates intermediate arrays and wrappers that trigger excessive garbage collection and object allocation on hot paths like account candidate evaluation (`getUsableAccounts`, `HybridStrategy.#getCandidates`).
**Action:** Use single-pass `for` loops instead to evaluate conditions and build result arrays simultaneously without intermediate objects.
