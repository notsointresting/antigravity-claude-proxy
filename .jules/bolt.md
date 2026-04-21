## 2025-02-12 - Eliminate chained map().filter() with intermediate wrapper objects
**Learning:** In hot paths (like checking account availability and candidate selection per request in `BaseStrategy` and `HybridStrategy`), chaining `.map().filter()` which produces intermediate wrapper objects (like `{ account, index }`) causes excessive garbage collection pressure.
**Action:** Replace these chains with single-pass `for` loops that push evaluated items directly to the final array(s) or categorize them synchronously.
