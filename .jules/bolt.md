## 2026-05-10 - O(n log n) sorting on hot paths is bad
**Learning:** Building mapped arrays to evaluate multiple conditions and then sorting them is expensive for hot paths like strategy candidate selection.
**Action:** Replace `Array.map().filter()` chains with single-pass `for` loops, and replace mapped array sorts with O(n) linear scans tracking the `best` element and its score.
