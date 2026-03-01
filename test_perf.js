const iterations = 10000;
const target = { a: 1, b: { c: 2, d: { e: 3 } }, f: [1,2,3] };
const source = { b: { c: 3, d: { f: 4 } }, g: 5 };
const DENIED_KEYS = ['__proto__', 'constructor', 'prototype'];

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMergeCurrent(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (DENIED_KEYS.includes(key)) return;
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMergeCurrent(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function deepMergeOptimized(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = deepMergeOptimized(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            }
        }
    }
    return output;
}

let start1 = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    deepMergeCurrent(target, source);
}
let end1 = process.hrtime.bigint();

let start2 = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    deepMergeOptimized(target, source);
}
let end2 = process.hrtime.bigint();

console.log('Current deepMerge:', Number(end1 - start1) / 1e6, 'ms');
console.log('Optimized deepMerge:', Number(end2 - start2) / 1e6, 'ms');
