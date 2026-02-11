import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { Readable } from 'stream';
import { gotScraping } from 'got-scraping';
import { config } from '../config.js';

/**
 * Shared Utility Functions
 *
 * General-purpose helper functions used across multiple modules.
 */

/**
 * Get the package version from package.json
 * @param {string} [defaultVersion='1.0.0'] - Default version if package.json cannot be read
 * @returns {string} The package version
 */
export function getPackageVersion(defaultVersion = '1.0.0') {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const packageJsonPath = path.join(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || defaultVersion;
    } catch {
        return defaultVersion;
    }
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration (e.g., "1h23m45s")
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h${minutes}m${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m${secs}s`;
    }
    return `${secs}s`;
}


/**
 * Sleep for specified milliseconds
 * @param {number} ms - Duration to sleep in milliseconds
 * @returns {Promise<void>} Resolves after the specified duration
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network error (transient)
 * @param {Error} error - The error to check
 * @returns {boolean} True if it is a network error
 */
export function isNetworkError(error) {
    const msg = error.message.toLowerCase();
    return (
        msg.includes('fetch failed') ||
        msg.includes('network error') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('socket hang up') ||
        msg.includes('timeout')
    );
}

/**
 * Throttled fetch that applies a configurable delay before each request
 * Only applies delay when requestThrottlingEnabled is true
 * Uses got-scraping for browser mimicry (TLS/HTTP2) and supports jitter.
 * @param {string|URL} url - The URL to fetch
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function throttledFetch(url, options = {}) {
    if (config.requestThrottlingEnabled) {
        const baseDelay = config.requestDelayMs || 200;
        if (baseDelay > 0) {
            // Apply jitter (randomized delay) to mimic human behavior
            // ±20% variation (e.g., 200ms -> 160ms to 240ms)
            const jitter = generateJitter(baseDelay * 0.4);
            const delay = Math.max(0, baseDelay + jitter);
            await sleep(delay);
        }
    }

    // Normalize headers for got-scraping
    let headers = options.headers;
    if (headers && typeof headers.entries === 'function') {
        headers = Object.fromEntries(headers.entries());
    }

    // Use got-scraping to mimic a browser (Chrome) which matches the Electron environment of VS Code
    // This provides the correct TLS fingerprint and HTTP/2 support
    const stream = gotScraping.stream({
        url: url.toString(),
        method: options.method || 'GET',
        headers: headers,
        body: options.body,
        throwHttpErrors: false,
        http2: true,
        // Mimic Chrome (common for Electron apps like VS Code)
        headerGeneratorOptions: {
            browsers: [{ name: 'chrome', minVersion: 110 }],
            devices: ['desktop'],
            locales: ['en-US'],
            operatingSystems: ['windows', 'macos', 'linux']
        }
    });

    return new Promise((resolve, reject) => {
        stream.on('response', (response) => {
            // Convert got stream response to standard Fetch API Response
            // This maintains compatibility with the rest of the application
            const fetchResponse = new Response(Readable.toWeb(stream), {
                status: response.statusCode,
                statusText: response.statusMessage,
                headers: new Headers(response.headers)
            });
            resolve(fetchResponse);
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Generate random jitter for backoff timing using Gaussian distribution (Box-Muller transform)
 * Prevents all clients from retrying at the exact same moment after errors.
 * @param {number} maxJitterMs - Maximum jitter range (result will be ±maxJitterMs/2)
 * @returns {number} Random jitter value between -maxJitterMs/2 and +maxJitterMs/2
 */
export function generateJitter(maxJitterMs) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Use standard deviation such that ~95% of values fall within the range
    // stdev = range / 4
    const stdev = maxJitterMs / 4;
    return z * stdev;
}
