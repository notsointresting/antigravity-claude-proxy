## 2026-04-17 - Avoid .map().filter() chaining on hot paths
**Learning:** Chaining `.map().filter()` during hot paths (like account selection in `HybridStrategy` and `BaseStrategy`) forces JavaScript to allocate multiple intermediate array objects (especially `[{ account, index }]` objects) which causes excessive GC pressure and noticeable latency during heavy loads.
**Action:** Always replace `.map().filter()` chains with a pre-allocated array (or simple single-pass `for` loop pushing to a single array) in hot paths to minimize dynamic memory allocation and improve selection speed.
