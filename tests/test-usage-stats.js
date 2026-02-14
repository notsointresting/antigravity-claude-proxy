import usageStats from '../src/modules/usage-stats.js';
import assert from 'assert';

async function testUsageStats() {
    console.log('Testing UsageStats tracking...');

    // Track some requests
    usageStats.track('claude-3-5-sonnet-20241022');
    usageStats.track('claude-3-5-sonnet-20241022');
    usageStats.track('gemini-1.5-pro');

    const history = usageStats.getHistory();
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const key = now.toISOString();

    assert(history[key], 'Current hour should exist in history');

    // The keys depend on getShortName implementation
    // claude-3-5-sonnet-20241022 -> 3-5-sonnet-20241022
    // gemini-1.5-pro -> 1.5-pro

    assert.strictEqual(history[key].claude['3-5-sonnet-20241022'], 2, 'Should have 2 Claude Sonnet requests');
    assert.strictEqual(history[key].gemini['1.5-pro'], 1, 'Should have 1 Gemini Pro request');
    assert.strictEqual(history[key]._total, 3, 'Total should be 3');

    console.log('✓ Tracking works');

    console.log('Testing family and short name extraction...');
    assert.strictEqual(usageStats.getFamily('claude-opus'), 'claude');
    assert.strictEqual(usageStats.getFamily('gemini-pro'), 'gemini');
    assert.strictEqual(usageStats.getFamily('gpt-4'), 'other');

    assert.strictEqual(usageStats.getShortName('claude-opus', 'claude'), 'opus');
    assert.strictEqual(usageStats.getShortName('gemini-1.5-flash', 'gemini'), '1.5-flash');
    assert.strictEqual(usageStats.getShortName('gpt-4', 'other'), 'gpt-4');

    console.log('✓ Extraction works');
}

testUsageStats().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
