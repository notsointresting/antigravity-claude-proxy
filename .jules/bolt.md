
## 2024-05-15 - Array map/filter chains in hot paths create GC pressure
**Learning:** Chaining `.map().filter()` over large or frequently accessed arrays creates intermediate objects that need to be garbage-collected, which is especially problematic in hot loops like candidate selection strategies.
**Action:** Replace map/filter chains with a single-pass `for` loop that evaluates all conditions and pushes results into pre-allocated arrays to avoid redundant iterations and intermediate object allocations.
