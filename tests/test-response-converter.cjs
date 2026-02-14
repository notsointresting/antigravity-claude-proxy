/**
 * Unit tests for Response Converter
 *
 * Validates the functionality of convertGoogleToAnthropic in src/format/response-converter.js
 */

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║             RESPONSE CONVERTER TEST SUITE                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Dynamic imports for ESM modules
    const { convertGoogleToAnthropic } = await import('../src/format/response-converter.js');

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
            if (e.stack) {
                // console.log(e.stack.split('\n').slice(0, 3).join('\n'));
            }
            failed++;
        }
    }

    function assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message || 'Expected values to be equal'}:
                Actual:   ${JSON.stringify(actual)}
                Expected: ${JSON.stringify(expected)}`);
        }
    }

    function assertDeepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(`${message || 'Expected objects to be deep equal'}:
                Actual:   ${actualStr}
                Expected: ${expectedStr}`);
        }
    }

    function assertTrue(value, message = '') {
        if (!value) {
            throw new Error(message || 'Expected true but got false');
        }
    }

    // =========================================================================
    // Test Group: Basic Text Conversion
    // =========================================================================
    console.log('\n── Basic Text Conversion ───────────────────────────────────');

    test('converts simple text response', () => {
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [{ text: 'Hello, how can I help you today?' }]
                    },
                    finishReason: 'STOP'
                }
            ],
            usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5
            }
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');

        assertEqual(result.type, 'message');
        assertEqual(result.role, 'assistant');
        assertEqual(result.model, 'gemini-3-flash');
        assertEqual(result.stop_reason, 'end_turn');
        assertDeepEqual(result.content, [{ type: 'text', text: 'Hello, how can I help you today?' }]);
        assertEqual(result.usage.input_tokens, 10);
        assertEqual(result.usage.output_tokens, 5);
    });

    test('handles response wrapper', () => {
        const googleResponse = {
            response: {
                candidates: [{ content: { parts: [{ text: 'Wrapped response' }] } }]
            }
        };
        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');
        assertDeepEqual(result.content, [{ type: 'text', text: 'Wrapped response' }]);
    });

    // =========================================================================
    // Test Group: Thinking Blocks
    // =========================================================================
    console.log('\n── Thinking Blocks ─────────────────────────────────────────');

    test('converts thinking blocks with signatures', () => {
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: 'I am thinking...',
                                thought: true,
                                thoughtSignature: 'sig_123456789012345678901234567890123456789012345678901234567890'
                            },
                            {
                                text: 'Here is the result.'
                            }
                        ]
                    }
                }
            ]
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');

        assertEqual(result.content.length, 2);
        assertEqual(result.content[0].type, 'thinking');
        assertEqual(result.content[0].thinking, 'I am thinking...');
        assertEqual(result.content[0].signature, 'sig_123456789012345678901234567890123456789012345678901234567890');
        assertEqual(result.content[1].type, 'text');
        assertEqual(result.content[1].text, 'Here is the result.');
    });

    // =========================================================================
    // Test Group: Tool Calls
    // =========================================================================
    console.log('\n── Tool Calls ──────────────────────────────────────────────');

    test('converts tool calls', () => {
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                functionCall: {
                                    name: 'get_weather',
                                    args: { location: 'San Francisco' },
                                    id: 'call_123'
                                }
                            }
                        ]
                    }
                }
            ]
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');

        assertEqual(result.content.length, 1);
        assertEqual(result.content[0].type, 'tool_use');
        assertEqual(result.content[0].name, 'get_weather');
        assertDeepEqual(result.content[0].input, { location: 'San Francisco' });
        assertEqual(result.content[0].id, 'call_123');
        assertEqual(result.stop_reason, 'tool_use');
    });

    test('generates ID for tool call if missing', () => {
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [{ functionCall: { name: 'test_tool', args: {} } }]
                    }
                }
            ]
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');
        assertTrue(result.content[0].id.startsWith('toolu_'));
    });

    test('handles thoughtSignature in tool calls', () => {
        const sig = 'sig_'.padEnd(60, 'x');
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                functionCall: { name: 'test_tool', args: {} },
                                thoughtSignature: sig
                            }
                        ]
                    }
                }
            ]
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');
        assertEqual(result.content[0].thoughtSignature, sig);
    });

    // =========================================================================
    // Test Group: Image Data
    // =========================================================================
    console.log('\n── Image Data ──────────────────────────────────────────────');

    test('converts inline image data', () => {
        const googleResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                inlineData: {
                                    mimeType: 'image/png',
                                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                                }
                            }
                        ]
                    }
                }
            ]
        };

        const result = convertGoogleToAnthropic(googleResponse, 'gemini-3-flash');

        assertEqual(result.content.length, 1);
        assertEqual(result.content[0].type, 'image');
        assertEqual(result.content[0].source.type, 'base64');
        assertEqual(result.content[0].source.media_type, 'image/png');
        assertEqual(result.content[0].source.data, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    });

    // =========================================================================
    // Test Group: Stop Reasons
    // =========================================================================
    console.log('\n── Stop Reasons ────────────────────────────────────────────');

    test('maps STOP to end_turn', () => {
        const result = convertGoogleToAnthropic({ candidates: [{ finishReason: 'STOP' }] }, 'm');
        assertEqual(result.stop_reason, 'end_turn');
    });

    test('maps MAX_TOKENS to max_tokens', () => {
        const result = convertGoogleToAnthropic({ candidates: [{ finishReason: 'MAX_TOKENS' }] }, 'm');
        assertEqual(result.stop_reason, 'max_tokens');
    });

    test('maps TOOL_USE finish reason to tool_use', () => {
        const result = convertGoogleToAnthropic({ candidates: [{ finishReason: 'TOOL_USE' }] }, 'm');
        assertEqual(result.stop_reason, 'tool_use');
    });

    // =========================================================================
    // Test Group: Usage Metadata
    // =========================================================================
    console.log('\n── Usage Metadata ──────────────────────────────────────────');

    test('subtracts cached tokens from input tokens', () => {
        const googleResponse = {
            usageMetadata: {
                promptTokenCount: 1000,
                cachedContentTokenCount: 400,
                candidatesTokenCount: 50
            }
        };

        const result = convertGoogleToAnthropic(googleResponse, 'm');

        assertEqual(result.usage.input_tokens, 600);
        assertEqual(result.usage.cache_read_input_tokens, 400);
        assertEqual(result.usage.output_tokens, 50);
    });

    // =========================================================================
    // Test Group: Edge Cases
    // =========================================================================
    console.log('\n── Edge Cases ──────────────────────────────────────────────');

    test('handles empty candidates', () => {
        const result = convertGoogleToAnthropic({ candidates: [] }, 'm');
        assertEqual(result.content.length, 1);
        assertEqual(result.content[0].type, 'text');
        assertEqual(result.content[0].text, '');
    });

    test('handles missing usageMetadata', () => {
        const result = convertGoogleToAnthropic({ candidates: [] }, 'm');
        assertEqual(result.usage.input_tokens, 0);
        assertEqual(result.usage.output_tokens, 0);
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
