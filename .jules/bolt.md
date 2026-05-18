
## $(date +%Y-%m-%d) - Prevent Excessive Array Allocations on Hot Paths
**Learning:** In highly-frequented strategy evaluation logic (like `HybridStrategy#getCandidates`), chaining multiple `.map().filter()` calls can iterate through the candidates list multiple times, creating intermediate array objects along the way. Additionally, sorting mapped arrays with `.sort()` incurs O(n log n) overhead when we only care about finding the single highest-scored item.
**Action:** Always replace chained array iterators on hot paths with a single-pass `for` loop that evaluates conditions and bins candidates simultaneously. Likewise, replace `.sort()` with a simple linear scan when finding the max/min item, dramatically reducing CPU overhead and garbage collection pressure.
