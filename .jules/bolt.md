## 2026-05-03 - Avoid Array Chaining on Hot Paths
**Learning:** Chaining `.map().filter()` or similar array methods creates intermediate arrays and wrapper objects (like `{ account, index }`) that are quickly discarded, causing unnecessary garbage collection pressure and multiple iterations over the same data. This is especially impactful in high-frequency functions like account selection strategies.
**Action:** Replace chained array methods with single-pass `for` loops in performance-critical paths to avoid intermediate allocations and reduce iteration overhead.
