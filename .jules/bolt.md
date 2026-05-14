
## 2026-05-14 - Replace `.map().filter().sort()` chains with single-pass `for` loops
**Learning:** In the `selectAccount` hot path (running on every request), combining sorting and filtering via array method chaining (like `.map().filter()`) allocates huge amounts of intermediate arrays, creating heavy GC pressure.
**Action:** When finding optimal candidates, avoid constructing arrays and mapping elements. Instead, use single-pass `for` loops and track state directly.
