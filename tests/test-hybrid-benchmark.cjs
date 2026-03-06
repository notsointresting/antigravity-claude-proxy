const { performance } = require('perf_hooks');

const DEFAULT_WEIGHTS = {
    health: 2,
    tokens: 5,
    quota: 3,
    lru: 0.1
};

class HybridStrategyOld {
    #healthTracker;
    #tokenBucketTracker;
    #quotaTracker;
    #weights;

    constructor() {
        this.#weights = { ...DEFAULT_WEIGHTS };
        this.#healthTracker = { isUsable: () => true };
        this.#tokenBucketTracker = { hasTokens: () => true };
        this.#quotaTracker = { isQuotaCritical: () => false };
    }

    isAccountUsable(account, modelId) { return true; }

    getCandidates(accounts, modelId) {
        const candidates = accounts
            .map((account, index) => ({ account, index }))
            .filter(({ account }) => {
                if (!this.isAccountUsable(account, modelId)) {
                    return false;
                }
                if (!this.#healthTracker.isUsable(account.email)) {
                    return false;
                }
                if (!this.#tokenBucketTracker.hasTokens(account.email)) {
                    return false;
                }
                const effectiveThreshold = account.modelQuotaThresholds?.[modelId]
                    ?? account.quotaThreshold
                    ?? undefined;
                if (this.#quotaTracker.isQuotaCritical(account, modelId, effectiveThreshold)) {
                    return false;
                }
                return true;
            });

        if (candidates.length > 0) {
            return { candidates, fallbackLevel: 'normal' };
        }
        return { candidates: [], fallbackLevel: 'normal' };
    }
}

class HybridStrategyNew {
    #healthTracker;
    #tokenBucketTracker;
    #quotaTracker;
    #weights;

    constructor() {
        this.#weights = { ...DEFAULT_WEIGHTS };
        this.#healthTracker = { isUsable: () => true };
        this.#tokenBucketTracker = { hasTokens: () => true };
        this.#quotaTracker = { isQuotaCritical: () => false };
    }

    isAccountUsable(account, modelId) { return true; }

    getCandidates(accounts, modelId) {
        const candidates = [];

        for (let index = 0; index < accounts.length; index++) {
            const account = accounts[index];
            if (!this.isAccountUsable(account, modelId)) {
                continue;
            }
            if (!this.#healthTracker.isUsable(account.email)) {
                continue;
            }
            if (!this.#tokenBucketTracker.hasTokens(account.email)) {
                continue;
            }
            const effectiveThreshold = account.modelQuotaThresholds?.[modelId]
                ?? account.quotaThreshold
                ?? undefined;
            if (this.#quotaTracker.isQuotaCritical(account, modelId, effectiveThreshold)) {
                continue;
            }
            candidates.push({ account, index });
        }

        if (candidates.length > 0) {
            return { candidates, fallbackLevel: 'normal' };
        }
        return { candidates: [], fallbackLevel: 'normal' };
    }
}

const accounts = Array.from({ length: 50 }, (_, i) => ({ email: `test${i}@example.com` }));

const oldStrat = new HybridStrategyOld();
const newStrat = new HybridStrategyNew();

const iters = 10000;

let start = performance.now();
for (let i = 0; i < iters; i++) {
    oldStrat.getCandidates(accounts, 'model-id');
}
let end = performance.now();
console.log(`Old getCandidates: ${end - start} ms`);

start = performance.now();
for (let i = 0; i < iters; i++) {
    newStrat.getCandidates(accounts, 'model-id');
}
end = performance.now();
console.log(`New getCandidates: ${end - start} ms`);
