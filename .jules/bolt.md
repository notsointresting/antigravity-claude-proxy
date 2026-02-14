## 2026-02-12 - [Performance: Signature Cache Bound]
**Learning:** `Map` objects in Node.js grow indefinitely unless explicitly cleared. For long-running servers, even small caches like signature stores can become memory leaks over time.
**Action:** Always implement a size limit (e.g., FIFO eviction) on caches that store user-generated or traffic-dependent data.
