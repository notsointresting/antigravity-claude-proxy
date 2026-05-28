## 2026-05-28 - Replace intermediate array mappings on hot paths with single-pass loops
**Learning:** Found that finding optimal candidate elements used an intermediate array mapping and an O(n log n) sort, leading to unnecessary memory allocations and garbage collection overhead.
**Action:** Replace intermediate array mappings on hot paths with single-pass loops.
