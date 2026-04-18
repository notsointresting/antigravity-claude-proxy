## 2026-04-18 - Optimize Array Allocations in Hot Paths
**Learning:** Chained array methods like `.map().filter()` or `.filter().every()` on arrays of objects (like accounts) create multiple intermediate arrays and closures, which causes significant garbage collection overhead and prevents short-circuiting on hot paths.
**Action:** Replaced chained methods with single-pass `for` loops and `Set` where unique values were needed. Also moved `Date.now()` outside loops to avoid redundant system calls. Found measurable improvements using local benchmark scripts.
