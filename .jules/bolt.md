## 2026-04-14 - [Performance Improvement] Replace `map().filter()` chains with single-pass loops
**Learning:** Chaining `Array.map()` and `Array.filter()` creates intermediate arrays and causes unnecessary array allocations, increasing garbage collection pressure, particularly on hot paths like account strategy selection.
**Action:** Replace `Array.map().filter()` chains with single-pass `for` loops, combining multiple operations and conditionally pushing to pre-allocated or grouped arrays to minimize garbage collection overhead.
