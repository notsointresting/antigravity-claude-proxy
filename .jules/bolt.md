## 2024-04-15 - Fast loop for Strategy filter
**Learning:** `BaseStrategy.getUsableAccounts` and `HybridStrategy.#getCandidates` use `.map().filter()` pattern which allocates extra intermediate arrays. Using a `for` loop in `#getCandidates` speeds up the filtering process because it eliminates unnecessary memory allocations when processing candidate accounts.
**Action:** Replace `Array.map().filter()` with a single-pass `for` loop to avoid intermediate array allocations in hot paths like candidate evaluation, ensuring speed.
