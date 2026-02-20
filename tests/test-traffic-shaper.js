/**
 * Test Traffic Shaper
 */

import { trafficShaper } from '../src/modules/traffic-shaper.js';
import { sleep } from '../src/utils/helpers.js';
import assert from 'assert';

// Adjust shaper for testing (faster)
trafficShaper.minDelayMs = 500;
trafficShaper.jitterMs = 100;

async function runTest() {
    console.log('Starting Traffic Shaper Test...');

    const start = Date.now();
    const results = [];

    // Test 1: Sequential for same key
    console.log('Test 1: Sequential for same key');
    const p1 = trafficShaper.enqueue('key1', async () => {
        console.log('Task 1 executing');
        results.push({ id: 1, key: 'key1', time: Date.now() });
        return 1;
    });

    const p2 = trafficShaper.enqueue('key1', async () => {
        console.log('Task 2 executing');
        results.push({ id: 2, key: 'key1', time: Date.now() });
        return 2;
    });

    await Promise.all([p1, p2]);

    // Check ordering
    assert.strictEqual(results[0].id, 1);
    assert.strictEqual(results[1].id, 2);

    const diff1 = results[1].time - results[0].time;
    console.log(`Diff 1-2 (same key): ${diff1}ms`);
    assert(diff1 >= 500, 'Task 2 (key1) should wait for delay');

    // Test 2: Parallel for different keys
    console.log('Test 2: Parallel for different keys');
    const start2 = Date.now();
    const p3 = trafficShaper.enqueue('key2', async () => {
        console.log('Task 3 executing');
        results.push({ id: 3, key: 'key2', time: Date.now() });
        await sleep(100); // simulate work
        return 3;
    });

    const p4 = trafficShaper.enqueue('key3', async () => {
        console.log('Task 4 executing');
        results.push({ id: 4, key: 'key3', time: Date.now() });
        await sleep(100);
        return 4;
    });

    await Promise.all([p3, p4]);

    // Both should start almost immediately relative to start2
    // because they are fresh keys with no history
    const diff3 = results[2].time - start2;
    const diff4 = results[3].time - start2;

    console.log(`Task 3 start delay: ${diff3}ms`);
    console.log(`Task 4 start delay: ${diff4}ms`);

    // Allow small overhead (e.g. 200ms)
    assert(diff3 < 200, 'Task 3 (key2) should start immediately');
    assert(diff4 < 200, 'Task 4 (key3) should start immediately');

    // Also check that they ran in parallel (their start times are close)
    const parallelDiff = Math.abs(results[2].time - results[3].time);
    console.log(`Parallel start diff: ${parallelDiff}ms`);
    assert(parallelDiff < 100, 'Tasks 3 and 4 should start in parallel');

    console.log('Traffic Shaper Test PASSED');
}

runTest().catch(err => {
    console.error('Test FAILED:', err);
    process.exit(1);
});
