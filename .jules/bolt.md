## 2024-05-15 - Optimize HybridStrategy Account Filtering
**Learning:** Chaining `.map().filter()` creates unnecessary intermediate array allocations, causing GC pressure on hot paths like account selection.
**Action:** Replaced chained array operations with a single-pass `for` loop that categorizes elements directly into target arrays, reducing allocations and overall time complexity.
