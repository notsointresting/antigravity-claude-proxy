/**
 * Hybrid Strategy
 *
 * Smart selection based on health score, token bucket, quota, and LRU freshness.
 * Combines multiple signals for optimal account distribution.
 *
 * Scoring formula:
 *   score = (Health × 2) + ((Tokens / MaxTokens × 100) × 5) + (Quota × 3) + (LRU × 0.1)
 *
 * Filters accounts that are:
 * - Not rate-limited
 * - Not invalid or disabled
 * - Health score >= minUsable
 * - Has tokens available
 * - Quota not critically low (< 5%)
 */

import { BaseStrategy } from './base-strategy.js';
import { HealthTracker, TokenBucketTracker, QuotaTracker } from './trackers/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config.js';

// Default weights for scoring
const DEFAULT_WEIGHTS = {
    health: 2,
    tokens: 5,
    quota: 3,
    lru: 0.1
};

export class HybridStrategy extends BaseStrategy {
    #healthTracker;
    #tokenBucketTracker;
    #quotaTracker;
    #weights;

    /**
     * Create a new HybridStrategy
     * @param {Object} config - Strategy configuration
     * @param {Object} [config.healthScore] - Health tracker configuration
     * @param {Object} [config.tokenBucket] - Token bucket configuration
     * @param {Object} [config.quota] - Quota tracker configuration
     * @param {Object} [config.weights] - Scoring weights
     */
    constructor(config = {}) {
        super(config);
        this.#healthTracker = new HealthTracker(config.healthScore || {});
        this.#tokenBucketTracker = new TokenBucketTracker(config.tokenBucket || {});
        this.#quotaTracker = new QuotaTracker(config.quota || {});
        this.#weights = { ...DEFAULT_WEIGHTS, ...config.weights };
    }

    /**
     * Select an account based on combined health, tokens, and LRU score
     *
     * @param {Array} accounts - Array of account objects
     * @param {string} modelId - The model ID for the request
     * @param {Object} options - Additional options
     * @returns {SelectionResult} The selected account and index
     */
    selectAccount(accounts, modelId, options = {}) {
        const { onSave } = options;

        if (accounts.length === 0) {
            return { account: null, index: 0, waitMs: 0 };
        }

        // Get candidates that pass all filters
        const { candidates, fallbackLevel, reason, waitMs } = this.#getCandidates(accounts, modelId);

        if (candidates.length === 0) {
            // Diagnose why no candidates are available and compute wait time
            logger.warn(`[HybridStrategy] No candidates available: ${reason}`);
            return { account: null, index: 0, waitMs: waitMs || 0 };
        }

        // Score and sort candidates
        const scored = candidates.map(({ account, index }) => ({
            account,
            index,
            score: this.#calculateScore(account, modelId)
        }));

        scored.sort((a, b) => b.score - a.score);

        // Select the best candidate
        const best = scored[0];
        best.account.lastUsed = Date.now();

        // Consume a token from the bucket (unless in lastResort mode where we bypassed token check)
        // Also ensure tokenBucketTracker is defined before calling consume
        if (fallbackLevel !== 'lastResort') {
            this.#tokenBucketTracker.consume(best.account.email);
        }

        if (onSave) onSave();

        // Calculate throttle wait time based on fallback level
        // This prevents overwhelming the API when all accounts are stressed
        let fallbackWaitMs = 0;
        if (fallbackLevel === 'lastResort') {
            // All accounts exhausted - add significant delay to allow rate limits to clear
            fallbackWaitMs = 500;
        } else if (fallbackLevel === 'emergency') {
            // All accounts unhealthy - add moderate delay
            fallbackWaitMs = 250;
        }

        const position = best.index + 1;
        const total = accounts.length;
        const fallbackInfo = fallbackLevel !== 'normal' ? `, fallback: ${fallbackLevel}` : '';
        logger.info(`[HybridStrategy] Using account: ${best.account.email} (${position}/${total}, score: ${best.score.toFixed(1)}${fallbackInfo})`);

        return { account: best.account, index: best.index, waitMs: fallbackWaitMs };
    }

    /**
     * Called after a successful request
     */
    onSuccess(account, modelId) {
        if (account && account.email) {
            this.#healthTracker.recordSuccess(account.email);
        }
    }

    /**
     * Called when a request is rate-limited
     */
    onRateLimit(account, modelId) {
        if (account && account.email) {
            this.#healthTracker.recordRateLimit(account.email);
        }
    }

    /**
     * Called when a request fails
     */
    onFailure(account, modelId) {
        if (account && account.email) {
            this.#healthTracker.recordFailure(account.email);
            // Refund the token since the request didn't complete
            this.#tokenBucketTracker.refund(account.email);
        }
    }

    /**
     * Get candidates that pass all filters in a single pass to avoid O(N) allocation and GC
     * @private
     * @returns {{candidates: Array, fallbackLevel: string, reason?: string, waitMs?: number}} Candidates and fallback level used
     *   fallbackLevel: 'normal' | 'quota' | 'emergency' | 'lastResort'
     */
    #getCandidates(accounts, modelId) {
        const normal = [];
        const quota = [];
        const emergency = [];
        const lastResort = [];

        let unusableCount = 0;
        let unhealthyCount = 0;
        let noTokensCount = 0;
        let criticalQuotaCount = 0;
        const accountsWithoutTokens = [];

        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            const candidate = { account, index };

            // 1. Basic usability check
            if (!this.isAccountUsable(account, modelId)) {
                unusableCount++;
                continue;
            }

            // Usable accounts are at least lastResort candidates
            lastResort.push(candidate);

            // 2. Token check (required for emergency and above)
            if (!this.#tokenBucketTracker.hasTokens(account.email)) {
                noTokensCount++;
                accountsWithoutTokens.push(account.email);
                continue;
            }

            // Usable with tokens are at least emergency candidates
            emergency.push(candidate);

            // 3. Health check (required for quota and above)
            if (!this.#healthTracker.isUsable(account.email)) {
                unhealthyCount++;
                continue;
            }

            // Usable + tokens + healthy are at least quota candidates
            quota.push(candidate);

            // 4. Quota check (required for normal)
            const effectiveThreshold = account.modelQuotaThresholds?.[modelId]
                ?? account.quotaThreshold
                ?? (config.globalQuotaThreshold || undefined);

            if (this.#quotaTracker.isQuotaCritical(account, modelId, effectiveThreshold)) {
                criticalQuotaCount++;
                logger.debug(`[HybridStrategy] Excluding ${account.email}: quota critically low for ${modelId} (threshold: ${effectiveThreshold ?? 'default'})`);
                continue;
            }

            // Normal candidates pass all checks
            normal.push(candidate);
        }

        if (normal.length > 0) {
            return { candidates: normal, fallbackLevel: 'normal' };
        }

        if (quota.length > 0) {
            logger.warn('[HybridStrategy] All accounts have critical quota, using fallback');
            return { candidates: quota, fallbackLevel: 'quota' };
        }

        if (emergency.length > 0) {
            logger.warn('[HybridStrategy] EMERGENCY: All accounts unhealthy, using least bad account');
            return { candidates: emergency, fallbackLevel: 'emergency' };
        }

        if (lastResort.length > 0) {
            logger.warn('[HybridStrategy] LAST RESORT: All accounts exhausted, using any usable account');
            return { candidates: lastResort, fallbackLevel: 'lastResort' };
        }

        // If we reach here, there are no candidates at all.
        // Compute diagnostic reason and wait time directly since we already tallied the counts.
        let waitMs = 0;
        let reason = 'unknown';

        if (noTokensCount > 0 && unusableCount === 0 && unhealthyCount === 0) {
            waitMs = this.#tokenBucketTracker.getMinTimeUntilToken(accountsWithoutTokens);
            reason = `all ${noTokensCount} account(s) exhausted token bucket, waiting for refill`;
        } else {
            const parts = [];
            if (unusableCount > 0) parts.push(`${unusableCount} unusable/disabled`);
            if (unhealthyCount > 0) parts.push(`${unhealthyCount} unhealthy`);
            if (noTokensCount > 0) parts.push(`${noTokensCount} no tokens`);
            if (criticalQuotaCount > 0) parts.push(`${criticalQuotaCount} critical quota`);

            if (parts.length > 0) {
                reason = parts.join(', ');
            }
        }

        return { candidates: [], fallbackLevel: 'normal', reason, waitMs };
    }

    /**
     * Calculate the combined score for an account
     * @private
     */
    #calculateScore(account, modelId) {
        const email = account.email;

        // Health component (0-100 scaled by weight)
        const health = this.#healthTracker.getScore(email);
        const healthComponent = health * this.#weights.health;

        // Token component (0-100 scaled by weight)
        const tokens = this.#tokenBucketTracker.getTokens(email);
        const maxTokens = this.#tokenBucketTracker.getMaxTokens();
        const tokenRatio = tokens / maxTokens;
        const tokenComponent = (tokenRatio * 100) * this.#weights.tokens;

        // Quota component (0-100 scaled by weight)
        const quotaScore = this.#quotaTracker.getScore(account, modelId);
        const quotaComponent = quotaScore * this.#weights.quota;

        // LRU component (older = higher score)
        // Use time since last use in seconds, capped at 1 hour (matches opencode-antigravity-auth)
        const lastUsed = account.lastUsed || 0;
        const timeSinceLastUse = Math.min(Date.now() - lastUsed, 3600000); // Cap at 1 hour
        const lruSeconds = timeSinceLastUse / 1000;
        const lruComponent = lruSeconds * this.#weights.lru; // 0-3600 * 0.1 = 0-360 max

        return healthComponent + tokenComponent + quotaComponent + lruComponent;
    }

    /**
     * Get the health tracker (for testing/debugging)
     * @returns {HealthTracker} The health tracker instance
     */
    getHealthTracker() {
        return this.#healthTracker;
    }

    /**
     * Get the token bucket tracker (for testing/debugging)
     * @returns {TokenBucketTracker} The token bucket tracker instance
     */
    getTokenBucketTracker() {
        return this.#tokenBucketTracker;
    }

    /**
     * Get the quota tracker (for testing/debugging)
     * @returns {QuotaTracker} The quota tracker instance
     */
    getQuotaTracker() {
        return this.#quotaTracker;
    }

}

export default HybridStrategy;
