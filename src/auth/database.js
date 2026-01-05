/**
 * SQLite Database Access Module
 * Provides cross-platform database operations for Antigravity state.
 *
 * Uses better-sqlite3 for:
 * - Windows compatibility (no CLI dependency)
 * - Native performance
 * - Synchronous API (simple error handling)
 *
 * Includes auto-rebuild capability for handling Node.js version updates
 * that cause native module incompatibility.
 */

import { createRequire } from 'module';
import { ANTIGRAVITY_DB_PATH } from '../constants.js';
import { isModuleVersionError, attemptAutoRebuild } from '../utils/native-module-helper.js';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);

// Lazy-loaded Database constructor
let Database = null;
let moduleLoadError = null;

/**
 * Load the better-sqlite3 module with auto-rebuild on version mismatch
 * Uses synchronous require to maintain API compatibility
 * @returns {Function} The Database constructor
 * @throws {Error} If module cannot be loaded even after rebuild
 */
function loadDatabaseModule() {
    // Return cached module if already loaded
    if (Database) return Database;

    // Re-throw cached error if previous load failed permanently
    if (moduleLoadError) throw moduleLoadError;

    try {
        Database = require('better-sqlite3');
        return Database;
    } catch (error) {
        if (isModuleVersionError(error)) {
            logger.warn('[Database] Native module version mismatch detected');

            if (attemptAutoRebuild(error)) {
                // Clear require cache and retry
                try {
                    const resolvedPath = require.resolve('better-sqlite3');
                    // Clear the module and all its dependencies from cache
                    clearRequireCache(resolvedPath);

                    Database = require('better-sqlite3');
                    logger.success('[Database] Module reloaded successfully after rebuild');
                    return Database;
                } catch (retryError) {
                    // Rebuild succeeded but reload failed - user needs to restart
                    moduleLoadError = new Error(
                        'Native module rebuild completed. Please restart the server to apply the fix.'
                    );
                    logger.info('[Database] Rebuild succeeded - server restart required');
                    throw moduleLoadError;
                }
            } else {
                moduleLoadError = new Error(
                    'Failed to auto-rebuild native module. Please run manually:\n' +
                    '  npm rebuild better-sqlite3\n' +
                    'Or if using npx, find the package location in the error and run:\n' +
                    '  cd /path/to/better-sqlite3 && npm rebuild'
                );
                throw moduleLoadError;
            }
        }

        // Non-version-mismatch error, just throw it
        throw error;
    }
}

/**
 * Clear a module and its dependencies from the require cache
 * @param {string} modulePath - Resolved path to the module
 */
function clearRequireCache(modulePath) {
    const mod = require.cache[modulePath];
    if (!mod) return;

    // Recursively clear children first
    if (mod.children) {
        for (const child of mod.children) {
            clearRequireCache(child.id);
        }
    }

    // Remove from parent's children
    if (mod.parent && mod.parent.children) {
        const idx = mod.parent.children.indexOf(mod);
        if (idx !== -1) {
            mod.parent.children.splice(idx, 1);
        }
    }

    // Delete from cache
    delete require.cache[modulePath];
}

/**
 * Query Antigravity database for authentication status
 * @param {string} [dbPath] - Optional custom database path
 * @returns {Object} Parsed auth data with apiKey, email, name, etc.
 * @throws {Error} If database doesn't exist, query fails, or no auth status found
 */
export function getAuthStatus(dbPath = ANTIGRAVITY_DB_PATH) {
    const Db = loadDatabaseModule();
    let db;
    try {
        // Open database in read-only mode
        db = new Db(dbPath, {
            readonly: true,
            fileMustExist: true
        });

        // Prepare and execute query
        const stmt = db.prepare(
            "SELECT value FROM ItemTable WHERE key = 'antigravityAuthStatus'"
        );
        const row = stmt.get();

        if (!row || !row.value) {
            throw new Error('No auth status found in database');
        }

        // Parse JSON value
        const authData = JSON.parse(row.value);

        if (!authData.apiKey) {
            throw new Error('Auth data missing apiKey field');
        }

        return authData;
    } catch (error) {
        // Enhance error messages for common issues
        if (error.code === 'SQLITE_CANTOPEN') {
            throw new Error(
                `Database not found at ${dbPath}. ` +
                'Make sure Antigravity is installed and you are logged in.'
            );
        }
        // Re-throw with context if not already our error
        if (error.message.includes('No auth status') || error.message.includes('missing apiKey')) {
            throw error;
        }
        // Check for version mismatch that might have been thrown by loadDatabaseModule
        if (error.message.includes('restart the server') || error.message.includes('auto-rebuild')) {
            throw error;
        }
        throw new Error(`Failed to read Antigravity database: ${error.message}`);
    } finally {
        // Always close database connection
        if (db) {
            db.close();
        }
    }
}

/**
 * Check if database exists and is accessible
 * @param {string} [dbPath] - Optional custom database path
 * @returns {boolean} True if database exists and can be opened
 */
export function isDatabaseAccessible(dbPath = ANTIGRAVITY_DB_PATH) {
    let db;
    try {
        const Db = loadDatabaseModule();
        db = new Db(dbPath, {
            readonly: true,
            fileMustExist: true
        });
        return true;
    } catch {
        return false;
    } finally {
        if (db) {
            db.close();
        }
    }
}

export default {
    getAuthStatus,
    isDatabaseAccessible
};
