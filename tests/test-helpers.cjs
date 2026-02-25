/**
 * Unit tests for Utility Helpers
 *
 * Validates the functionality of helper functions in src/utils/helpers.js
 */

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║             UTILITY HELPERS TEST SUITE                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Dynamic imports for ESM modules
    const { isNetworkError, getGotScrapingOptions } = await import('../src/utils/helpers.js');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (e) {
            console.log(`  ✗ ${name}`);
            console.log(`    Error: ${e.message}`);
            failed++;
        }
    }

    function assertTrue(value, message = '') {
        if (!value) {
            throw new Error(message || 'Expected true but got false');
        }
    }

    function assertFalse(value, message = '') {
        if (value) {
            throw new Error(message || 'Expected false but got true');
        }
    }

    // =========================================================================
    // Test Group: isNetworkError()
    // =========================================================================
    console.log('\n── isNetworkError() Detection ──────────────────────────────');

    test('detects "fetch failed"', () => {
        assertTrue(isNetworkError(new Error('fetch failed')));
    });

    test('detects "network error"', () => {
        assertTrue(isNetworkError(new Error('network error')));
    });

    test('detects "econnreset"', () => {
        assertTrue(isNetworkError(new Error('ECONNRESET')));
    });

    test('detects "etimedout"', () => {
        assertTrue(isNetworkError(new Error('ETIMEDOUT')));
    });

    test('detects "socket hang up"', () => {
        assertTrue(isNetworkError(new Error('socket hang up')));
    });

    test('detects "timeout"', () => {
        assertTrue(isNetworkError(new Error('request timeout')));
    });

    test('is case insensitive', () => {
        assertTrue(isNetworkError(new Error('FETCH FAILED')));
        assertTrue(isNetworkError(new Error('Network Error')));
        assertTrue(isNetworkError(new Error('Socket Hang Up')));
    });

    test('does NOT match generic errors', () => {
        assertFalse(isNetworkError(new Error('Internal Server Error')));
        assertFalse(isNetworkError(new Error('404 Not Found')));
        assertFalse(isNetworkError(new Error('JSON Parse Error')));
    });

    test('handles empty or null messages gracefully', () => {
        // Based on implementation, it might throw if error.message is undefined
        // but it calls .toLowerCase() on it.
        // Let's see how it behaves.
        try {
            assertFalse(isNetworkError({ message: '' }));
        } catch (e) {
            throw new Error('Failed to handle empty message: ' + e.message);
        }
    });

    // =========================================================================
    // Test Group: getGotScrapingOptions()
    // =========================================================================
    console.log('\n── getGotScrapingOptions() Structure ───────────────────────');

    test('returns correct structure', () => {
        const options = getGotScrapingOptions();

        // Basic structure check
        assertTrue(Array.isArray(options.browsers), 'browsers should be an array');
        assertTrue(Array.isArray(options.devices), 'devices should be an array');
        assertTrue(Array.isArray(options.locales), 'locales should be an array');
        assertTrue(Array.isArray(options.operatingSystems), 'operatingSystems should be an array');

        // Content check
        assertTrue(options.devices.includes('desktop'), 'devices should include desktop');
        assertTrue(options.locales.includes('en-US'), 'locales should include en-US');
    });

    test('memoization check (referential equality)', () => {
        const options1 = getGotScrapingOptions();
        const options2 = getGotScrapingOptions();

        // If optimization is applied, this should be true (same object reference)
        // Before optimization, this might fail or pass depending on implementation detail,
        // but we want to assert it DOES pass after we optimize.
        assertTrue(options1 === options2, 'Should return the same object reference (memoized)');
    });

    // =========================================================================
    // Summary
    // =========================================================================
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('══════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
        console.error(`❌ ${failed} test(s) failed!`);
        process.exit(1);
    } else {
        console.log('✅ All tests passed!');
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
