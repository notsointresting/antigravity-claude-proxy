## $(date +%Y-%m-%d) - Optimize account filtering in HybridStrategy
**Learning:** Chaining \`.map().filter()\` constructs intermediate arrays which increase garbage collection pressure and CPU overhead on hot paths.
**Action:** Replace \`.map().filter()\` chains with single-pass \`for\` loops in performance-critical methods like \`#getCandidates\`, especially those called frequently per-request.
