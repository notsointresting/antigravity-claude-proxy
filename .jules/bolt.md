## 2023-11-20 - Array.map().filter() overhead in hot paths
**Learning:** Chaining `Array.map().filter()` or similar operations that map over all accounts (like in `BaseStrategy.getUsableAccounts` or `HybridStrategy.#getCandidates`) creates intermediate arrays and extra GC pressure. This is a hot path called for *every* API request when finding accounts. In a system tracking lots of accounts, this adds up.
**Action:** Replace `accounts.map(...).filter(...)` with single-pass `for` loops or `reduce` to prevent intermediate array allocations.
