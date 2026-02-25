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
    const {
        isNetworkError,
        getGotScrapingOptions,
        getPlatformUserAgent,
        getAntigravityDbPath,
        getPlatformEnum
    } = await import('../src/utils/helpers.js');

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
    // Test Group: Memoization
    // =========================================================================
    console.log('\n── Memoization & Output Consistency ────────────────────────');

    test('getGotScrapingOptions returns object and maintains reference', () => {
        const opt1 = getGotScrapingOptions();
        const opt2 = getGotScrapingOptions();

        assertTrue(typeof opt1 === 'object', 'Should return an object');
        assertTrue(Array.isArray(opt1.browsers), 'Should have browsers array');
        assertTrue(opt1 === opt2, 'Should return exact same object reference (memoized)');
    });

    test('getPlatformUserAgent returns string and maintains value', () => {
        const ua1 = getPlatformUserAgent();
        const ua2 = getPlatformUserAgent();

        assertTrue(typeof ua1 === 'string', 'Should return a string');
        assertTrue(ua1.length > 0, 'Should not be empty');
        assertTrue(ua1 === ua2, 'Should return exact same string value');
    });

    test('getAntigravityDbPath returns string and maintains value', () => {
        const path1 = getAntigravityDbPath();
        const path2 = getAntigravityDbPath();

        assertTrue(typeof path1 === 'string', 'Should return a string');
        assertTrue(path1.includes('Antigravity'), 'Should contain project folder name');
        assertTrue(path1 === path2, 'Should return exact same path string');
    });

    test('getPlatformEnum returns number and maintains value', () => {
        const enum1 = getPlatformEnum();
        const enum2 = getPlatformEnum();

        assertTrue(typeof enum1 === 'number', 'Should return a number');
        assertTrue(enum1 >= 0 && enum1 <= 3, 'Should be a valid platform enum (0-3)');
        assertTrue(enum1 === enum2, 'Should return exact same number');
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
