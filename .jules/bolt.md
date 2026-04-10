## 2026-04-10 - Account Selection Map Overhead
**Learning:** Using chained `.map().filter()` over large arrays of accounts in critical selection paths (like `BaseStrategy.getUsableAccounts` and `HybridStrategy.#getCandidates`) causes significant intermediate array allocation and garbage collection overhead. Since this is a hot path called for every request, the performance impact adds up.
**Action:** Always use single-pass `for` loops on hot paths when evaluating and categorizing elements, especially when chained operations are completely unnecessary and can be done simultaneously.
