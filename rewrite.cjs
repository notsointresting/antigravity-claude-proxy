const fs = require('fs');

const filepath = 'src/account-manager/strategies/hybrid-strategy.js';
let content = fs.readFileSync(filepath, 'utf8');

const searchRegex = /\#getCandidates\(accounts, modelId\) \{\s*const candidates = accounts[\s\S]*?return \{ candidates: \[\], fallbackLevel: 'normal' \};\n    \}/;

const replaceWith = `#getCandidates(accounts, modelId) {
        const candidates = [];
        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];

            // Basic usability check
            if (!this.isAccountUsable(account, modelId)) {
                continue;
            }

            // Health score check
            if (!this.#healthTracker.isUsable(account.email)) {
                continue;
            }

            // Token availability check
            if (!this.#tokenBucketTracker.hasTokens(account.email)) {
                continue;
            }

            // Quota availability check (exclude critically low quota)
            // Threshold priority: per-model > per-account > global > default
            const effectiveThreshold = account.modelQuotaThresholds?.[modelId] ?? account.quotaThreshold ?? (config.globalQuotaThreshold || undefined);
            if (this.#quotaTracker.isQuotaCritical(account, modelId, effectiveThreshold)) {
                logger.debug(\`[HybridStrategy] Excluding \${account.email}: quota critically low for \${modelId} (threshold: \${effectiveThreshold ?? 'default'})\`);
                continue;
            }

            candidates.push({ account, index });
        }

        if (candidates.length > 0) {
            return { candidates, fallbackLevel: 'normal' };
        }

        // If no candidates after quota filter, fall back to all usable accounts
        // (better to use critical quota than fail entirely)
        const fallback = [];
        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            if (!this.isAccountUsable(account, modelId)) continue;
            if (!this.#healthTracker.isUsable(account.email)) continue;
            if (!this.#tokenBucketTracker.hasTokens(account.email)) continue;
            fallback.push({ account, index });
        }

        if (fallback.length > 0) {
            logger.warn('[HybridStrategy] All accounts have critical quota, using fallback');
            return { candidates: fallback, fallbackLevel: 'quota' };
        }

        // Emergency fallback: bypass health check when ALL accounts are unhealthy
        // This prevents "Max retries exceeded" when health scores are too low
        const emergency = [];
        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            if (!this.isAccountUsable(account, modelId)) continue;
            if (!this.#tokenBucketTracker.hasTokens(account.email)) continue;
            emergency.push({ account, index });
        }

        if (emergency.length > 0) {
            logger.warn('[HybridStrategy] EMERGENCY: All accounts unhealthy, using least bad account');
            return { candidates: emergency, fallbackLevel: 'emergency' };
        }

        // Last resort: bypass BOTH health AND token bucket checks
        // Only check basic usability (not rate-limited, not disabled)
        const lastResort = [];
        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            // Only check if account is usable (not rate-limited, not disabled)
            if (!this.isAccountUsable(account, modelId)) continue;
            lastResort.push({ account, index });
        }

        if (lastResort.length > 0) {
            logger.warn('[HybridStrategy] LAST RESORT: All accounts exhausted, using any usable account');
            return { candidates: lastResort, fallbackLevel: 'lastResort' };
        }

        return { candidates: [], fallbackLevel: 'normal' };
    }`;

content = content.replace(searchRegex, replaceWith);
fs.writeFileSync(filepath, content);
