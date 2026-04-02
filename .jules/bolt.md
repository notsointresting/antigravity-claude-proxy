## 2023-10-27 - Fast path for SSE parsing
**Learning:** Using `buffer.split('\n')` in a hot SSE parsing loop causes intermediate array allocations, resulting in memory spikes and excessive garbage collection pauses for large payloads.
**Action:** Replace `buffer.split('\n')` with a `while` loop using `buffer.indexOf('\n')` and `buffer.slice()` for manual string chunking to avoid intermediate array allocations.
