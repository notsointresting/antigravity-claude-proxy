
## YYYY-MM-DD - [Fast-Path Identity Optimizations in Array Processing]
**Learning:** Functions like `cleanCacheControl` and `filterUnsignedThinkingBlocks` unconditionally map over arrays and recreate objects, causing massive GC pressure on hot paths (message processing) when no changes were needed.
**Action:** Implemented `Array.some()` identity checks to quickly return the original array reference if no target properties exist, avoiding the overhead of `Array.map()` and dynamic array resizing.
