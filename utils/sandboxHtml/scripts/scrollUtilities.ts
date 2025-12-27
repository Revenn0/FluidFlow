/**
 * Scroll Utilities Script
 *
 * Provides smooth scrolling, scroll position tracking,
 * scroll-to-element, and scroll-based animations.
 * Works with the sandbox's __app_scroll_container__.
 */

/**
 * Generate the scroll utilities script for the sandbox
 */
export function getScrollUtilitiesScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // SCROLL UTILITIES
    // Smooth scroll, position tracking, scroll-to-element
    // Works with sandbox scroll container
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Get the scroll container (created by bootstrap.ts)
      function getScrollContainer() {
        return document.getElementById('__app_scroll_container__') || document.documentElement;
      }

      // Scroll state
      var scrollState = {
        x: 0,
        y: 0,
        maxX: 0,
        maxY: 0,
        direction: 'none',
        velocity: 0,
        isScrolling: false
      };

      // Scroll listeners
      var scrollListeners = [];
      var scrollEndListeners = [];
      var scrollTimeout = null;

      // Update scroll state
      function updateScrollState() {
        var container = getScrollContainer();
        var prevY = scrollState.y;

        scrollState.x = container.scrollLeft;
        scrollState.y = container.scrollTop;
        scrollState.maxX = container.scrollWidth - container.clientWidth;
        scrollState.maxY = container.scrollHeight - container.clientHeight;

        // Determine direction
        if (scrollState.y > prevY) {
          scrollState.direction = 'down';
        } else if (scrollState.y < prevY) {
          scrollState.direction = 'up';
        }

        scrollState.velocity = Math.abs(scrollState.y - prevY);
      }

      // Initialize scroll listener on container
      function initScrollListener() {
        var container = getScrollContainer();

        container.addEventListener('scroll', function() {
          scrollState.isScrolling = true;
          updateScrollState();

          // Notify listeners
          scrollListeners.forEach(function(callback) {
            try {
              callback(scrollState);
            } catch (e) {
              console.error('[Scroll] Listener error:', e.message);
            }
          });

          // Detect scroll end
          if (scrollTimeout) clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(function() {
            scrollState.isScrolling = false;
            scrollState.direction = 'none';
            scrollState.velocity = 0;

            // Notify scroll end listeners
            scrollEndListeners.forEach(function(callback) {
              try {
                callback(scrollState);
              } catch (e) {
                console.error('[Scroll] End listener error:', e.message);
              }
            });
          }, 150);
        }, { passive: true });
      }

      // Wait for container to be ready
      function waitForContainer(callback) {
        var container = getScrollContainer();
        if (container && container.id === '__app_scroll_container__') {
          callback();
        } else {
          // Retry after a short delay
          setTimeout(function() {
            waitForContainer(callback);
          }, 100);
        }
      }

      // Initialize after container is ready
      waitForContainer(function() {
        initScrollListener();
        updateScrollState();
      });

      // Smooth scroll to position
      function scrollTo(options) {
        var container = getScrollContainer();
        var x = options.x !== undefined ? options.x : container.scrollLeft;
        var y = options.y !== undefined ? options.y : container.scrollTop;
        var behavior = options.behavior || 'smooth';

        container.scrollTo({
          left: x,
          top: y,
          behavior: behavior
        });
      }

      // Scroll to element
      function scrollToElement(element, options) {
        options = options || {};
        var container = getScrollContainer();

        if (typeof element === 'string') {
          element = document.querySelector(element);
        }

        if (!element) {
          console.warn('[Scroll] Element not found');
          return;
        }

        var offset = options.offset || 0;
        var behavior = options.behavior || 'smooth';
        var block = options.block || 'start'; // start, center, end

        // Get element position relative to container
        var containerRect = container.getBoundingClientRect();
        var elementRect = element.getBoundingClientRect();

        var targetY;
        if (block === 'start') {
          targetY = container.scrollTop + (elementRect.top - containerRect.top) - offset;
        } else if (block === 'center') {
          targetY = container.scrollTop + (elementRect.top - containerRect.top) - (container.clientHeight / 2) + (elementRect.height / 2) - offset;
        } else if (block === 'end') {
          targetY = container.scrollTop + (elementRect.bottom - containerRect.bottom) + offset;
        }

        scrollTo({ y: Math.max(0, targetY), behavior: behavior });
      }

      // Scroll to top
      function scrollToTop(behavior) {
        scrollTo({ y: 0, behavior: behavior || 'smooth' });
      }

      // Scroll to bottom
      function scrollToBottom(behavior) {
        var container = getScrollContainer();
        scrollTo({ y: container.scrollHeight, behavior: behavior || 'smooth' });
      }

      // Scroll by amount
      function scrollBy(options) {
        var container = getScrollContainer();
        var x = options.x || 0;
        var y = options.y || 0;
        var behavior = options.behavior || 'smooth';

        container.scrollBy({
          left: x,
          top: y,
          behavior: behavior
        });
      }

      // Get scroll percentage
      function getScrollPercentage() {
        var container = getScrollContainer();
        if (container.scrollHeight <= container.clientHeight) return 100;
        return Math.round((container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100);
      }

      // Check if element is in viewport
      function isInViewport(element, threshold) {
        threshold = threshold || 0;

        if (typeof element === 'string') {
          element = document.querySelector(element);
        }

        if (!element) return false;

        var container = getScrollContainer();
        var containerRect = container.getBoundingClientRect();
        var elementRect = element.getBoundingClientRect();

        return (
          elementRect.top >= containerRect.top - threshold &&
          elementRect.bottom <= containerRect.bottom + threshold &&
          elementRect.left >= containerRect.left - threshold &&
          elementRect.right <= containerRect.right + threshold
        );
      }

      // Lock/unlock scroll
      var scrollLocked = false;
      var savedScrollPosition = 0;

      function lockScroll() {
        if (scrollLocked) return;
        var container = getScrollContainer();
        savedScrollPosition = container.scrollTop;
        container.style.overflow = 'hidden';
        scrollLocked = true;
      }

      function unlockScroll() {
        if (!scrollLocked) return;
        var container = getScrollContainer();
        container.style.overflow = '';
        container.scrollTop = savedScrollPosition;
        scrollLocked = false;
      }

      // Expose API
      window.__SANDBOX_SCROLL__ = {
        // Get scroll container
        getContainer: getScrollContainer,

        // Get current state
        getState: function() {
          updateScrollState();
          return Object.assign({}, scrollState);
        },

        // Get scroll percentage
        getPercentage: getScrollPercentage,

        // Scroll methods
        scrollTo: scrollTo,
        scrollToElement: scrollToElement,
        scrollToTop: scrollToTop,
        scrollToBottom: scrollToBottom,
        scrollBy: scrollBy,

        // Viewport check
        isInViewport: isInViewport,

        // Lock/unlock
        lock: lockScroll,
        unlock: unlockScroll,
        isLocked: function() { return scrollLocked; },

        // Add listeners
        onScroll: function(callback) {
          scrollListeners.push(callback);
          return function() {
            var index = scrollListeners.indexOf(callback);
            if (index > -1) scrollListeners.splice(index, 1);
          };
        },

        onScrollEnd: function(callback) {
          scrollEndListeners.push(callback);
          return function() {
            var index = scrollEndListeners.indexOf(callback);
            if (index > -1) scrollEndListeners.splice(index, 1);
          };
        },

        // Cleanup
        cleanup: function() {
          scrollListeners = [];
          scrollEndListeners = [];
          if (scrollTimeout) clearTimeout(scrollTimeout);
        }
      };

      // Convenience globals
      window.scrollToTop = scrollToTop;
      window.scrollToElement = scrollToElement;

      console.log('[Sandbox] Scroll utilities initialized');
    })();
  `;
}
