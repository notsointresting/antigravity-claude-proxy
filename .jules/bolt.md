
## 2024-05-18 - Single-Pass Loop Optimizations
**Learning:** Using chained `.map().filter()` array operations on hot paths (like candidate selection in Hybrid Strategy) creates unnecessary intermediate wrapper objects (like `{ account, index }`), placing excessive pressure on the garbage collector. Replacing them with single-pass `for` loops is a simple way to optimize performance while maintaining identical logical outputs.
**Action:** Always prefer pre-allocating arrays and single-pass `for` loops to filter and map data simultaneously, specifically when handling array transformations on execution-heavy critical paths.
