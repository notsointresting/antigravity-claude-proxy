import {
    cleanCacheControl,
    filterUnsignedThinkingBlocks,
    restoreThinkingSignatures
} from '../src/format/thinking-utils.js';
import { performance } from 'perf_hooks';

// Setup mock data
const createMockMessages = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: [
            { type: 'text', text: 'Some text content here ' + i },
            { type: 'thinking', thinking: 'Some thought process here', signature: '123456789012345678901234567890123456789012345678901234567890' }
        ]
    }));
};

const runBenchmark = () => {
    const iterations = 10000;
    const messages = createMockMessages(100);

    console.log(`Running benchmark for ${iterations} iterations with ${messages.length} messages...`);

    // Clean cache control benchmark
    const startCache = performance.now();
    for (let i = 0; i < iterations; i++) {
        cleanCacheControl(messages);
    }
    const endCache = performance.now();
    console.log(`cleanCacheControl: ${(endCache - startCache).toFixed(2)}ms`);

    // Restore thinking signatures benchmark
    const startRestore = performance.now();
    for (let i = 0; i < iterations; i++) {
        messages.forEach(m => restoreThinkingSignatures(m.content));
    }
    const endRestore = performance.now();
    console.log(`restoreThinkingSignatures: ${(endRestore - startRestore).toFixed(2)}ms`);

    // Memory usage info
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Heap memory used: ${Math.round(used * 100) / 100} MB`);
};

runBenchmark();
