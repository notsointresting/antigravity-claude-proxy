/**
 * Endpoint Selector for Cloud Code
 *
 * Manages the selection of Cloud Code API endpoints with a "sticky" preference
 * for the last known working endpoint. This implements a "Happy Eyeballs" or
 * circuit breaker pattern to avoid latency from failed endpoints.
 */

import { ANTIGRAVITY_ENDPOINT_FALLBACKS } from "../constants.js";
import { logger } from "../utils/logger.js";

// Default to the first endpoint in the fallback list
let preferredEndpoint = ANTIGRAVITY_ENDPOINT_FALLBACKS[0];

/**
 * Get endpoints in order of preference, starting with the last known working one.
 * @returns {string[]} Endpoints sorted by preference
 */
export function getPreferredEndpoints() {
  // If the preferred endpoint is already the first one, return the original list
  // This avoids array allocation in the common case
  if (preferredEndpoint === ANTIGRAVITY_ENDPOINT_FALLBACKS[0]) {
    return ANTIGRAVITY_ENDPOINT_FALLBACKS;
  }

  // Move preferred endpoint to front
  return [
    preferredEndpoint,
    ...ANTIGRAVITY_ENDPOINT_FALLBACKS.filter((e) => e !== preferredEndpoint),
  ];
}

/**
 * Mark an endpoint as successfully used.
 * Updates the preferred endpoint for future requests.
 * @param {string} endpoint - The endpoint URL that worked
 */
export function markEndpointSuccess(endpoint) {
  // Only update if it's different and valid
  if (
    endpoint !== preferredEndpoint &&
    ANTIGRAVITY_ENDPOINT_FALLBACKS.includes(endpoint)
  ) {
    logger.debug(`[CloudCode] Switching preferred endpoint to ${endpoint}`);
    preferredEndpoint = endpoint;
  }
}

/**
 * Reset the preferred endpoint to the default (first in list).
 * Useful for testing or when a hard reset is needed.
 */
export function resetPreferredEndpoint() {
  preferredEndpoint = ANTIGRAVITY_ENDPOINT_FALLBACKS[0];
}

/**
 * Get the currently preferred endpoint.
 * @returns {string} The preferred endpoint URL
 */
export function getPreferredEndpoint() {
  return preferredEndpoint;
}
