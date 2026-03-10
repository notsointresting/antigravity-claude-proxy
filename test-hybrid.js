import HybridStrategy from './src/account-manager/strategies/hybrid-strategy.js';
import { performance } from 'perf_hooks';

const strategy = new HybridStrategy();

// Generate dummy accounts
const accounts = Array.from({ length: 1000 }, (_, i) => ({
    email: `test${i}@example.com`,
    lastUsed: Date.now() - Math.random() * 100000,
    modelQuotaThresholds: {
        'model1': 0.1
    }
}));

const runs = 1000;
const start = performance.now();
for (let i = 0; i < runs; i++) {
    strategy.selectAccount(accounts, 'model1');
}
const end = performance.now();
console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
