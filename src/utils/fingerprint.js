/**
 * Device Fingerprint Generator for Rate Limit Mitigation
 *
 * Generates randomized device fingerprints to help distribute API usage
 * across different apparent device identities.
 *
 * Based on: https://github.com/NoeFabris/opencode-antigravity-auth
 */

import crypto from 'crypto';
import { IDE_TYPE, PLATFORM, PLUGIN_TYPE, ANTIGRAVITY_VERSION } from '../constants.js';

const OS_VERSIONS = {
    darwin: ['10.15.7', '11.6.8', '12.6.3', '13.5.2', '14.2.1', '14.5'],
    win32: ['10.0.19041', '10.0.19042', '10.0.19043', '10.0.22000', '10.0.22621', '10.0.22631'],
    linux: ['5.15.0', '5.19.0', '6.1.0', '6.2.0', '6.5.0', '6.6.0']
};

const ARCHITECTURES = ['x64', 'arm64'];

// VS Code versions for User-Agent generation
const VSCODE_VERSIONS = ['1.85.1', '1.86.0', '1.87.2', '1.88.1', '1.89.0'];
const ELECTRON_VERSIONS = ['25.9.8', '27.2.3', '28.2.1', '29.3.0'];
const CHROME_VERSIONS = ['114.0.5735.289', '118.0.5993.159', '120.0.6099.291', '122.0.6261.111'];

const SDK_CLIENTS = [
    'google-cloud-sdk vscode_cloudshelleditor/0.1',
    'google-cloud-sdk vscode/1.86.0',
    'google-cloud-sdk vscode/1.87.0',
    'google-cloud-sdk intellij/2024.1',
    'google-cloud-sdk android-studio/2024.1'
];

/**
 * Maximum number of fingerprint versions to keep in history
 */
export const MAX_FINGERPRINT_HISTORY = 5;

/**
 * Pick a random item from an array
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDeviceId() {
    return crypto.randomUUID();
}

function generateSessionToken() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a randomized device fingerprint.
 * Each fingerprint represents a unique "device" identity.
 * @returns {Object} Fingerprint object
 */
export function generateFingerprint() {
    const platform = randomFrom(['darwin', 'win32', 'linux']);
    const arch = randomFrom(ARCHITECTURES);
    const osVersion = randomFrom(OS_VERSIONS[platform] || OS_VERSIONS.linux);

    let matchingPlatform;
    if (platform === 'darwin') matchingPlatform = PLATFORM.MACOS;
    else if (platform === 'win32') matchingPlatform = PLATFORM.WINDOWS;
    else if (platform === 'linux') matchingPlatform = PLATFORM.LINUX;
    else matchingPlatform = PLATFORM.UNSPECIFIED;

    // Generate realistic User-Agent for VS Code
    const vscodeVersion = randomFrom(VSCODE_VERSIONS);
    const electronVersion = randomFrom(ELECTRON_VERSIONS);
    const chromeVersion = randomFrom(CHROME_VERSIONS);

    let userAgent;
    if (platform === 'darwin') {
        userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X ${osVersion.replace(/\./g, '_')}) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVersion} Chrome/${chromeVersion} Electron/${electronVersion} Safari/537.36`;
    } else if (platform === 'win32') {
        userAgent = `Mozilla/5.0 (Windows NT ${osVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVersion} Chrome/${chromeVersion} Electron/${electronVersion} Safari/537.36`;
    } else {
        userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/${vscodeVersion} Chrome/${chromeVersion} Electron/${electronVersion} Safari/537.36`;
    }

    return {
        deviceId: generateDeviceId(),
        sessionToken: generateSessionToken(),
        userAgent: userAgent,
        apiClient: randomFrom(SDK_CLIENTS),
        clientMetadata: {
            ideType: IDE_TYPE.ANTIGRAVITY, // Use numeric enum
            platform: matchingPlatform,
            pluginType: PLUGIN_TYPE.GEMINI,
            osVersion: osVersion,
            arch: arch,
            sqmId: `{${crypto.randomUUID().toUpperCase()}}`
        },
        quotaUser: `device-${crypto.randomBytes(8).toString('hex')}`,
        createdAt: Date.now()
    };
}

/**
 * Build HTTP headers from a fingerprint object.
 * These headers are used to identify the "device" making API requests.
 * @param {Object} fingerprint - The fingerprint object
 * @returns {Object} Headers object
 */
export function buildFingerprintHeaders(fingerprint) {
    if (!fingerprint) {
        return {};
    }

    return {
        'User-Agent': fingerprint.userAgent,
        'X-Goog-Api-Client': fingerprint.apiClient,
        'Client-Metadata': JSON.stringify(fingerprint.clientMetadata),
        'X-Goog-QuotaUser': fingerprint.quotaUser,
        'X-Client-Device-Id': fingerprint.deviceId
    };
}

/**
 * Update fingerprint userAgent to current version if outdated.
 * Extracts platform/arch from existing userAgent and rebuilds with current version.
 * @param {Object} fingerprint
 * @returns {Object} Updated fingerprint
 */
export function updateFingerprintVersion(fingerprint) {
    // If the fingerprint uses the old antigravity/ format, replace it with a new one
    if (fingerprint && fingerprint.userAgent && fingerprint.userAgent.startsWith('antigravity/')) {
        // Generate a new fingerprint to get a modern User-Agent
        // We keep the deviceId and quotaUser to maintain identity continuity
        const newFingerprint = generateFingerprint();
        return {
            ...fingerprint,
            userAgent: newFingerprint.userAgent,
            clientMetadata: newFingerprint.clientMetadata
        };
    }
    return fingerprint;
}
