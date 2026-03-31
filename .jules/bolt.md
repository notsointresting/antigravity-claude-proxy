
## 2024-03-31 - Fast-Path Object Identity Checks over Array.map()
**Learning:** In Node.js applications that process large, deeply nested objects (like chat histories), unconditional `Array.prototype.map()` calls create significant memory allocations and garbage collection pressure, even when simply shallow copying identical items.
**Action:** When filtering or modifying large JSON structures (such as `messages` arrays), implement a fast-path identity check using a `for` loop (or `Array.some()`) to detect if any modification is actually needed. If no elements require changing, return the original array reference immediately to bypass allocations entirely.
