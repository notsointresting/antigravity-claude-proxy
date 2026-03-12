## 2026-03-12 - [Optimize HybridStrategy#getCandidates]
**Learning:** In hot path routing logic (e.g., account selection strategies), chaining Array methods like .map() and .filter() across multiple fallback passes creates excessive intermediate array allocations and object instantiation, leading to measurable GC pause pressure.
**Action:** Replaced chained array methods with a single-pass for loop in HybridStrategy#getCandidates, categorizing accounts into respective fallback arrays simultaneously. This reduces complexity from O(4n) to O(n) and improves readability.
