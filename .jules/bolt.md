## 2024-04-06 - Prevent Memory Spikes in SSE Parsing
**Learning:** Parsing large streaming SSE payloads using `buffer.split('\n')` creates numerous intermediate array allocations on every chunk, leading to significant garbage collection pressure and memory spikes.
**Action:** Always use a single-pass `while` loop with `buffer.indexOf('\n')` and `buffer.slice()` for continuous string parsing of streams (like Server-Sent Events) to avoid dynamic array resizing and unnecessary memory allocations.
