## 2026-06-01 - O(N) max-finding over array map-sort
**Learning:** Found a hot-path optimization opportunity in `src/account-manager/strategies/hybrid-strategy.js`. The codebase was using an `O(N log N)` `array.map().sort()` chain just to find the element with the maximum score.
**Action:** Replaced `.map().sort()` with a single-pass `O(N)` `for` loop to find the best candidate. This eliminates the array allocation overhead from `.map()` and avoids unnecessary full sorting operations. Always prefer single-pass scanning for max/min finding on collections.
