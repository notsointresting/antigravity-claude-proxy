import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { homedir, platform } from 'os';
import { Readable } from 'stream';
import { gotScraping } from 'got-scraping';
import { config } from '../config.js';
import { logger } from './logger.js';

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

    // Retry configuration
    // We handle 5xx errors and network errors here to improve robustness for OAuth/Telemetry
    // Note: 429 is deliberately excluded to let upstream logic handle account switching
    const MAX_RETRIES = 2;
    const RETRY_DELAY_BASE = 1000;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
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
                headerGeneratorOptions: getGotScrapingOptions()
            });

            const response = await new Promise((resolve, reject) => {
                stream.on('response', (res) => {
                    // Convert got stream response to standard Fetch API Response
                    // This maintains compatibility with the rest of the application
                    const fetchResponse = new Response(Readable.toWeb(stream), {
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: new Headers(res.headers)
                    });
                    resolve(fetchResponse);
                });

                stream.on('error', (err) => {
                    reject(err);
                });
            });

            // Check if we should retry based on status (500, 502, 503, 504)
            // If it's the last attempt, just return the response (let caller handle 5xx)
            if (attempt < MAX_RETRIES && [500, 502, 503, 504].includes(response.status)) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response;

        } catch (error) {
            lastError = error;
            const isRetryableStatus = error.message.startsWith('HTTP 5');
            const isNetwork = isNetworkError(error);

            if (attempt < MAX_RETRIES && (isRetryableStatus || isNetwork)) {
                // Exponential backoff with jitter
                const backoff = RETRY_DELAY_BASE * Math.pow(2, attempt);
                const jitter = generateJitter(backoff * 0.5);
                const delay = Math.max(500, backoff + jitter);

                logger.warn(`[throttledFetch] Retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms: ${error.message}`);
                await sleep(delay);
                continue;
            }

            throw lastError;
        }
    }
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

/**
 * Get got-scraping options for current platform
 * Ensures TLS fingerprint matches the OS
 * @returns {Object} Header generator options
 */
export function getGotScrapingOptions() {
    let os = 'windows'; // Default
    switch (process.platform) {
        case 'darwin': os = 'macos'; break;
        case 'linux': os = 'linux'; break;
        case 'win32': os = 'windows'; break;
    }

    return {
        browsers: [{ name: 'chrome', minVersion: 110 }],
        devices: ['desktop'],
        locales: ['en-US'],
        operatingSystems: [os]
    };
}

/**
 * Get the Antigravity database path based on the current platform.
 * - macOS: ~/Library/Application Support/Antigravity/...
 * - Windows: ~/AppData/Roaming/Antigravity/...
 * - Linux/other: ~/.config/Antigravity/...
 * @returns {string} Full path to the Antigravity state database
 */
export function getAntigravityDbPath() {
    const home = homedir();
    switch (platform()) {
        case 'darwin':
            return path.join(home, 'Library/Application Support/Antigravity/User/globalStorage/state.vscdb');
        case 'win32':
            return path.join(home, 'AppData/Roaming/Antigravity/User/globalStorage/state.vscdb');
        default: // linux, freebsd, etc.
            return path.join(home, '.config/Antigravity/User/globalStorage/state.vscdb');
    }
}

/**
 * Generate platform-specific User-Agent string.
 * Returns a generic VS Code User-Agent to mimic legitimate traffic.
 * @returns {string} User-Agent string
 */
export function getPlatformUserAgent() {
    const os = platform();
    // Default to a recent stable VS Code version
    const vscodeVer = '1.87.2';
    const chromeVer = '118.0.5993.159';
    const electronVer = '27.2.3';

    if (os === 'darwin') {
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVer} Chrome/${chromeVer} Electron/${electronVer} Safari/537.36`;
    } else if (os === 'win32') {
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVer} Chrome/${chromeVer} Electron/${electronVer} Safari/537.36`;
    } else {
        return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVer} Chrome/${chromeVer} Electron/${electronVer} Safari/537.36`;
    }
}

/**
 * Get the platform enum value based on the current OS.
 * Reference: Antigravity binary analysis - google.internal.cloud.code.v1internal.ClientMetadata.Platform
 * @returns {number} Platform enum value (0: UNSPECIFIED, 1: WINDOWS, 2: LINUX, 3: MACOS)
 */
export function getPlatformEnum() {
    switch (platform()) {
        case 'darwin': return 3; // MACOS
        case 'win32': return 1; // WINDOWS
        case 'linux': return 2; // LINUX
        default: return 0; // UNSPECIFIED
    }
}

/**
 * Get the model family from model name (dynamic detection, no hardcoded list).
 * @param {string} modelName - The model name from the request
 * @returns {'claude' | 'gemini' | 'unknown'} The model family
 */
export function getModelFamily(modelName) {
    const lower = (modelName || '').toLowerCase();
    if (lower.includes('claude')) return 'claude';
    if (lower.includes('gemini')) return 'gemini';
    return 'unknown';
}

/**
 * Check if a model supports thinking/reasoning output.
 * @param {string} modelName - The model name from the request
 * @returns {boolean} True if the model supports thinking blocks
 */
export function isThinkingModel(modelName) {
    const lower = (modelName || '').toLowerCase();
    // Claude thinking models have "thinking" in the name
    if (lower.includes('claude') && lower.includes('thinking')) return true;
    // Gemini thinking models: explicit "thinking" in name, OR gemini version 3+
    if (lower.includes('gemini')) {
        if (lower.includes('thinking')) return true;
        // Check for gemini-3 or higher (e.g., gemini-3, gemini-3.5, gemini-4, etc.)
        const versionMatch = lower.match(/gemini-(\d+)/);
        if (versionMatch && parseInt(versionMatch[1], 10) >= 3) return true;
    }
    return false;
}

/**
 * Get the default account configuration path.
 * @returns {string} Default path to accounts.json
 */
export function getDefaultAccountConfigPath() {
    return path.join(homedir(), '.config/antigravity-proxy/accounts.json');
}

/**
 * Get the default usage history path.
 * @returns {string} Default path to usage-history.json
 */
export function getDefaultUsageHistoryPath() {
    return path.join(homedir(), '.config/antigravity-proxy/usage-history.json');
}
