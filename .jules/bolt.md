## 2026-04-03 - Optimizing Map/Filter Chains in HybridStrategy

**Learning:** V8 engine array methods like `.map().filter()` create intermediate arrays which increase garbage collection pressure, especially on hot paths like token selection where this is executed per-request.

**Action:** Replace chained `.map().filter()` calls with a single-pass `for` loop that avoids temporary array allocations. Apply this pattern to any method on the critical path to reduce GC overhead.
