
## 2024-03-13 - [Optimize cleanCacheControl]
**Learning:** Unconditional `.map()` loops over large arrays (like chat histories) create unnecessary GC pressure if no modifications are actually required, especially when deep-cloning objects. `cleanCacheControl` was allocating new objects for every block in a message array even when no `cache_control` properties existed.
**Action:** Implement "fast path" identity checks (e.g., using `Array.some()`) returning the original array when modifications are unnecessary. This preserves referential identity and reduces GC overhead for unmodified deep arrays.
