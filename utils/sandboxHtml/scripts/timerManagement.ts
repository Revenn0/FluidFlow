/**
 * Timer Management Script
 *
 * Tracks and manages setTimeout/setInterval to prevent memory leaks
 * and allow cleanup when the sandbox is refreshed.
 */

/**
 * Generate the timer management script for the sandbox
 */
export function getTimerManagementScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // TIMER MANAGEMENT SYSTEM
    // Tracks all timers for cleanup and debugging
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Store original timer functions
      var originalSetTimeout = window.setTimeout;
      var originalSetInterval = window.setInterval;
      var originalClearTimeout = window.clearTimeout;
      var originalClearInterval = window.clearInterval;
      var originalRequestAnimationFrame = window.requestAnimationFrame;
      var originalCancelAnimationFrame = window.cancelAnimationFrame;

      // Track active timers
      var activeTimeouts = new Map();
      var activeIntervals = new Map();
      var activeAnimationFrames = new Set();

      // Enhanced setTimeout with tracking
      window.setTimeout = function(callback, delay) {
        if (typeof callback !== 'function') {
          console.warn('[Timer] setTimeout requires a function callback');
          return 0;
        }
        var args = Array.prototype.slice.call(arguments, 2);
        var timerId = originalSetTimeout.apply(window, [function() {
          activeTimeouts.delete(timerId);
          try {
            callback.apply(window, args);
          } catch (e) {
            console.error('[Timer] setTimeout callback error:', e.message);
          }
        }, delay]);

        activeTimeouts.set(timerId, {
          id: timerId,
          delay: delay,
          created: Date.now()
        });

        return timerId;
      };

      // Enhanced setInterval with tracking
      window.setInterval = function(callback, delay) {
        if (typeof callback !== 'function') {
          console.warn('[Timer] setInterval requires a function callback');
          return 0;
        }
        var args = Array.prototype.slice.call(arguments, 2);
        var errorCount = 0;
        var timerId = originalSetInterval.apply(window, [function() {
          try {
            callback.apply(window, args);
            errorCount = 0; // Reset on success
          } catch (e) {
            console.error('[Timer] setInterval callback error:', e.message);
            errorCount++;
            // Auto-clear interval after 3 consecutive errors
            if (errorCount >= 3) {
              console.warn('[Timer] Stopping interval after repeated errors');
              window.clearInterval(timerId);
            }
          }
        }, delay]);

        activeIntervals.set(timerId, {
          id: timerId,
          delay: delay,
          created: Date.now()
        });

        return timerId;
      };

      // Enhanced clearTimeout with tracking
      window.clearTimeout = function(timerId) {
        if (timerId !== undefined && timerId !== null) {
          activeTimeouts.delete(timerId);
          originalClearTimeout.call(window, timerId);
        }
      };

      // Enhanced clearInterval with tracking
      window.clearInterval = function(timerId) {
        if (timerId !== undefined && timerId !== null) {
          activeIntervals.delete(timerId);
          originalClearInterval.call(window, timerId);
        }
      };

      // Enhanced requestAnimationFrame with tracking
      window.requestAnimationFrame = function(callback) {
        if (typeof callback !== 'function') {
          console.warn('[Timer] requestAnimationFrame requires a function callback');
          return 0;
        }
        var frameId = originalRequestAnimationFrame.call(window, function(timestamp) {
          activeAnimationFrames.delete(frameId);
          try {
            callback(timestamp);
          } catch (e) {
            console.error('[Timer] requestAnimationFrame callback error:', e.message);
          }
        });

        activeAnimationFrames.add(frameId);
        return frameId;
      };

      // Enhanced cancelAnimationFrame with tracking
      window.cancelAnimationFrame = function(frameId) {
        if (frameId !== undefined && frameId !== null) {
          activeAnimationFrames.delete(frameId);
          originalCancelAnimationFrame.call(window, frameId);
        }
      };

      // Cleanup all timers
      function cleanupAllTimers() {
        var timeoutCount = activeTimeouts.size;
        var intervalCount = activeIntervals.size;
        var rafCount = activeAnimationFrames.size;

        // Clear all timeouts
        activeTimeouts.forEach(function(info, id) {
          originalClearTimeout.call(window, id);
        });
        activeTimeouts.clear();

        // Clear all intervals
        activeIntervals.forEach(function(info, id) {
          originalClearInterval.call(window, id);
        });
        activeIntervals.clear();

        // Cancel all animation frames
        activeAnimationFrames.forEach(function(id) {
          originalCancelAnimationFrame.call(window, id);
        });
        activeAnimationFrames.clear();

        if (timeoutCount > 0 || intervalCount > 0 || rafCount > 0) {
          console.log('[Timer] Cleaned up ' + timeoutCount + ' timeouts, ' +
                      intervalCount + ' intervals, ' + rafCount + ' animation frames');
        }
      }

      // Register cleanup on page unload
      window.addEventListener('beforeunload', cleanupAllTimers);
      window.addEventListener('pagehide', cleanupAllTimers);

      // Listen for cleanup message from parent
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'CLEANUP_TIMERS') {
          cleanupAllTimers();
        }
      });

      // Expose timer management API
      window.__SANDBOX_TIMERS__ = {
        // Get active timer counts
        getStats: function() {
          return {
            timeouts: activeTimeouts.size,
            intervals: activeIntervals.size,
            animationFrames: activeAnimationFrames.size
          };
        },

        // List active intervals (for debugging)
        listIntervals: function() {
          var list = [];
          activeIntervals.forEach(function(info) {
            list.push({
              id: info.id,
              delay: info.delay,
              age: Date.now() - info.created
            });
          });
          return list;
        },

        // Cleanup all timers manually
        cleanup: cleanupAllTimers,

        // Get original functions (for advanced use)
        originals: {
          setTimeout: originalSetTimeout,
          setInterval: originalSetInterval,
          clearTimeout: originalClearTimeout,
          clearInterval: originalClearInterval,
          requestAnimationFrame: originalRequestAnimationFrame,
          cancelAnimationFrame: originalCancelAnimationFrame
        }
      };

      console.log('[Sandbox] Timer management system initialized');
    })();
  `;
}
