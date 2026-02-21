/**
 * Unit Test - Endpoint Selector
 *
 * Verifies that the endpoint selector correctly prioritizes working endpoints.
 */

const assert = require('assert');

// Dynamically import the module under test and constants
async function runTest() {
    console.log('Running Endpoint Selector tests...');

    const { getPreferredEndpoints, markEndpointSuccess, resetPreferredEndpoint } = await import('../src/cloudcode/endpoint-selector.js');
    const { ANTIGRAVITY_ENDPOINT_FALLBACKS } = await import('../src/constants.js');

    // Test 1: Initial state (default order)
    console.log('Test 1: Initial state');
    resetPreferredEndpoint();
    let endpoints = getPreferredEndpoints();
    assert.deepStrictEqual(endpoints, ANTIGRAVITY_ENDPOINT_FALLBACKS, 'Initial endpoints should match default fallback order');
    assert.strictEqual(endpoints[0], ANTIGRAVITY_ENDPOINT_FALLBACKS[0], 'First endpoint should be default');

    // Test 2: Mark second endpoint as success
    console.log('Test 2: Mark second endpoint as success');
    const secondEndpoint = ANTIGRAVITY_ENDPOINT_FALLBACKS[1];
    markEndpointSuccess(secondEndpoint);

    endpoints = getPreferredEndpoints();
    assert.strictEqual(endpoints[0], secondEndpoint, 'First endpoint should be the one marked success');
    assert.strictEqual(endpoints.length, ANTIGRAVITY_ENDPOINT_FALLBACKS.length, 'Should return same number of endpoints');
    assert.ok(endpoints.includes(ANTIGRAVITY_ENDPOINT_FALLBACKS[0]), 'Should include original first endpoint');

    // Test 3: Mark first endpoint as success (restore default)
    console.log('Test 3: Restore default');
    const firstEndpoint = ANTIGRAVITY_ENDPOINT_FALLBACKS[0];
    markEndpointSuccess(firstEndpoint);

    endpoints = getPreferredEndpoints();
    assert.strictEqual(endpoints[0], firstEndpoint, 'First endpoint should be back to default');
    assert.deepStrictEqual(endpoints, ANTIGRAVITY_ENDPOINT_FALLBACKS, 'Should match default order again');

    // Test 4: Invalid endpoint (should ignore)
    console.log('Test 4: Invalid endpoint');
    markEndpointSuccess('https://invalid-endpoint.com');
    endpoints = getPreferredEndpoints();
    assert.strictEqual(endpoints[0], firstEndpoint, 'Should not switch to invalid endpoint');

    console.log('All tests passed!');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
