const fs = require('fs');

const filepath = 'src/account-manager/strategies/hybrid-strategy.js';
let content = fs.readFileSync(filepath, 'utf8');

const searchRegex = /#calculateScore\(account, modelId\) {[\s\S]*?return healthComponent \+ tokenComponent \+ quotaComponent \+ lruComponent;\n    }/;

const replaceWith = `#calculateScore(account, modelId) {
        const email = account.email;

        // Health component (0-100 scaled by weight)
        const health = this.#healthTracker.getScore(email);
        const healthComponent = health * this.#weights.health;

        // Token component (0-100 scaled by weight)
        const tokens = this.#tokenBucketTracker.getTokens(email);
        const maxTokens = this.#tokenBucketTracker.getMaxTokens();
        const tokenComponent = ((tokens / maxTokens) * 100) * this.#weights.tokens;

        // Quota component (0-100 scaled by weight)
        const quotaScore = this.#quotaTracker.getScore(account, modelId);
        const quotaComponent = quotaScore * this.#weights.quota;

        // LRU component (older = higher score)
        // Use time since last use in seconds, capped at 1 hour (matches opencode-antigravity-auth)
        const lastUsed = account.lastUsed || 0;
        const timeSinceLastUse = Math.min(Date.now() - lastUsed, 3600000); // Cap at 1 hour
        const lruComponent = (timeSinceLastUse / 1000) * this.#weights.lru; // 0-3600 * 0.1 = 0-360 max

        return healthComponent + tokenComponent + quotaComponent + lruComponent;
    }`;

content = content.replace(searchRegex, replaceWith);
fs.writeFileSync(filepath, content);
