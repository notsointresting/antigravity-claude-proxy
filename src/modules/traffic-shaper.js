/**
 * Traffic Shaper Module
 *
 * Implements a "Human Speed Limit" for request processing.
 * Prevents bursty traffic by queuing concurrent requests and executing them
 * with a minimum delay, simulating a human reading/typing pause.
 *
 * Supports per-key (account) concurrency to allow parallel requests across
 * multiple accounts while maintaining sequential pauses for each account.
 */

import { logger } from '../utils/logger.js';
import { sleep, generateJitter } from '../utils/helpers.js';

class TrafficShaper {
    constructor() {
        this.queues = new Map(); // key -> Array<Function(resolve)>
        this.processing = new Set(); // keys currently holding lock
        this.lastRequestTimes = new Map(); // key -> timestamp

        // Minimum delay between requests (ms) - resembles "thinking/reading" time
        this.minDelayMs = 3000;
        this.jitterMs = 2000;
    }

    /**
     * Acquire lock for a key (account). Waits if busy, then waits for delay.
     * @param {string} key - Account identifier (e.g. email)
     */
    async acquire(key) {
        // 1. Wait for lock if someone else holds it
        if (this.processing.has(key)) {
            await new Promise((resolve) => {
                let queue = this.queues.get(key);
                if (!queue) {
                    queue = [];
                    this.queues.set(key, queue);
                }
                queue.push(resolve);
            });
        }

        // 2. Take lock
        this.processing.add(key);

        // 3. Enforce delay based on last usage
        const lastTime = this.lastRequestTimes.get(key) || 0;
        const now = Date.now();
        const timeSinceLast = now - lastTime;

        // Random delay: 3s to 5s (Gaussian centered at 4s)
        // Use generateJitter to mimic natural human variance
        const meanDelay = this.minDelayMs + (this.jitterMs / 2);
        const requiredDelay = meanDelay + generateJitter(this.jitterMs);

        const waitTime = Math.max(0, requiredDelay - timeSinceLast);

        if (waitTime > 0) {
            logger.debug(`[TrafficShaper] Enforcing speed limit for ${key}: waiting ${Math.round(waitTime)}ms`);
            await sleep(waitTime);
        }
    }

    /**
     * Release lock for a key. Updates last usage time and wakes up next waiter.
     * @param {string} key - Account identifier
     */
    release(key) {
        this.lastRequestTimes.set(key, Date.now());

        const queue = this.queues.get(key);
        if (queue && queue.length > 0) {
            const next = queue.shift();
            // Pass lock ownership to next waiter
            // Note: We don't remove from this.processing because the next task is now the owner
            next();
        } else {
            // No one waiting, release the lock entirely
            this.processing.delete(key);
        }
    }

    /**
     * Enqueue a task to be executed with traffic shaping for a specific key
     * @param {string|Function} key - Account identifier OR task (for legacy single-queue usage)
     * @param {Function} [task] - Async function to execute (required if key is string)
     * @returns {Promise<any>} Result of the task
     */
    async enqueue(key, task) {
        // Handle legacy call signature (task only) -> use default key
        if (typeof key === 'function') {
            task = key;
            key = 'default';
        }

        await this.acquire(key);
        try {
            return await task();
        } finally {
            this.release(key);
        }
    }

    /**
     * Get current status for monitoring
     */
    getStatus() {
        return {
            processing: Array.from(this.processing),
            queues: Array.from(this.queues.entries()).map(([k, q]) => ({ key: k, length: q.length }))
        };
    }
}

// Export singleton
export const trafficShaper = new TrafficShaper();
