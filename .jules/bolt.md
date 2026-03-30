## 2026-03-30 - [Optimize cleanCacheControl array traversals]
**Learning:** Found deep nested iterative map operations in hot paths causing performance issues and garbage creation in `cleanCacheControl`, `restoreThinkingSignatures` and `filterUnsignedThinkingBlocks` in `src/format/thinking-utils.js`. The functions modified arrays even when no structural changes were needed.
**Action:** Implemented fast-path evaluations to skip deep cloning overhead when arrays don't require modification, significantly reducing garbage collection pressure and saving cpu cycles.
