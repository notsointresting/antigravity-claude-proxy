import {
    cleanCacheControl,
    filterUnsignedThinkingBlocks,
    restoreThinkingSignatures
} from '../src/format/thinking-utils.js';

function assertIdentity(original, result, name) {
    if (original === result) {
        console.log(`✅ ${name}: Identity preserved`);
    } else {
        console.error(`❌ ${name}: Identity NOT preserved`);
        console.log('Original:', JSON.stringify(original));
        console.log('Result:', JSON.stringify(result));
    }
}

// 1. cleanCacheControl
const messages1 = [
    { role: 'user', content: [{ type: 'text', text: 'hello' }] }
];
assertIdentity(messages1, cleanCacheControl(messages1), 'cleanCacheControl (no cache_control)');

const sig = '123456789012345678901234567890123456789012345678901234567890'; // > 50 chars

// 2. filterUnsignedThinkingBlocks
const contents1 = [
    { role: 'user', parts: [{ text: 'hello' }] },
    { role: 'model', parts: [{ thought: true, text: 'think', thoughtSignature: sig }] }
];
assertIdentity(contents1, filterUnsignedThinkingBlocks(contents1), 'filterUnsignedThinkingBlocks (valid blocks, no extra fields)');

// 3. restoreThinkingSignatures
const anthropicContent1 = [
    { type: 'text', text: 'hello' },
    { type: 'thinking', thinking: 'think', signature: sig }
];
assertIdentity(anthropicContent1, restoreThinkingSignatures(anthropicContent1), 'restoreThinkingSignatures (valid blocks, no extra fields)');
