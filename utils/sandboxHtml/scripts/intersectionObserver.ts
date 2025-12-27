/**
 * Intersection Observer Enhancement Script
 *
 * Provides enhanced IntersectionObserver with tracking, debugging,
 * and helper utilities for lazy loading and infinite scroll.
 */

/**
 * Generate the intersection observer enhancement script for the sandbox
 */
export function getIntersectionObserverScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // INTERSECTION OBSERVER ENHANCEMENT
    // Tracking, debugging, and utilities for visibility detection
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Store for tracking observers
      var observerRegistry = new Map();
      var observerId = 0;
      var observerStats = {
        created: 0,
        disconnected: 0,
        active: 0,
        callbacks: 0
      };

      // Store original IntersectionObserver
      var OriginalIntersectionObserver = window.IntersectionObserver;

      // Check if IntersectionObserver is supported
      if (!OriginalIntersectionObserver) {
        console.warn('[IntersectionObserver] Not supported in this browser');
        window.__SANDBOX_INTERSECTION__ = { supported: false };
        return;
      }

      // Enhanced IntersectionObserver with tracking
      function EnhancedIntersectionObserver(callback, options) {
        var id = ++observerId;
        var self = this;
        var observedElements = new Set();
        var callbackCount = 0;

        // Wrap callback for tracking
        var wrappedCallback = function(entries, observer) {
          callbackCount++;
          observerStats.callbacks++;

          // Log visibility changes in debug mode
          if (window.__SANDBOX_INTERSECTION__?.debug) {
            entries.forEach(function(entry) {
              var target = entry.target;
              var selector = target.id ? '#' + target.id :
                            target.className ? '.' + String(target.className).split(' ')[0] :
                            target.tagName.toLowerCase();
              console.log('[IntersectionObserver] ' + selector + ' ' +
                         (entry.isIntersecting ? 'entered' : 'left') +
                         ' viewport (' + Math.round(entry.intersectionRatio * 100) + '%)');
            });
          }

          try {
            callback(entries, observer);
          } catch (e) {
            console.error('[IntersectionObserver] Callback error:', e.message);
          }
        };

        // Create the actual observer
        var observer = new OriginalIntersectionObserver(wrappedCallback, options);

        // Track creation
        observerStats.created++;
        observerStats.active++;

        // Store in registry
        observerRegistry.set(id, {
          id: id,
          observer: observer,
          options: options,
          elements: observedElements,
          callbackCount: function() { return callbackCount; },
          created: Date.now()
        });

        // Override observe method
        var originalObserve = observer.observe.bind(observer);
        observer.observe = function(target) {
          observedElements.add(target);
          return originalObserve(target);
        };

        // Override unobserve method
        var originalUnobserve = observer.unobserve.bind(observer);
        observer.unobserve = function(target) {
          observedElements.delete(target);
          return originalUnobserve(target);
        };

        // Override disconnect method
        var originalDisconnect = observer.disconnect.bind(observer);
        observer.disconnect = function() {
          observedElements.clear();
          observerStats.disconnected++;
          observerStats.active--;
          observerRegistry.delete(id);
          return originalDisconnect();
        };

        // Add custom properties
        observer.__id__ = id;
        observer.__getStats__ = function() {
          return {
            id: id,
            elementCount: observedElements.size,
            callbackCount: callbackCount
          };
        };

        return observer;
      }

      // Copy static properties
      EnhancedIntersectionObserver.prototype = OriginalIntersectionObserver.prototype;

      // Replace global IntersectionObserver
      window.IntersectionObserver = EnhancedIntersectionObserver;

      // Lazy load helper - creates an observer for lazy loading images/content
      function createLazyLoader(options) {
        var defaultOptions = {
          root: null,
          rootMargin: '50px',
          threshold: 0.01
        };
        var mergedOptions = Object.assign({}, defaultOptions, options);

        var loadedElements = new Set();

        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting && !loadedElements.has(entry.target)) {
              loadedElements.add(entry.target);

              // Handle data-src for images
              if (entry.target.dataset.src) {
                entry.target.src = entry.target.dataset.src;
                entry.target.removeAttribute('data-src');
              }

              // Handle data-srcset
              if (entry.target.dataset.srcset) {
                entry.target.srcset = entry.target.dataset.srcset;
                entry.target.removeAttribute('data-srcset');
              }

              // Handle data-background
              if (entry.target.dataset.background) {
                entry.target.style.backgroundImage = 'url(' + entry.target.dataset.background + ')';
                entry.target.removeAttribute('data-background');
              }

              // Add loaded class
              entry.target.classList.add('lazy-loaded');

              // Dispatch custom event
              entry.target.dispatchEvent(new CustomEvent('lazyload', {
                bubbles: true,
                detail: { element: entry.target }
              }));

              // Unobserve after loading
              observer.unobserve(entry.target);
            }
          });
        }, mergedOptions);

        return {
          observe: function(element) {
            if (!loadedElements.has(element)) {
              observer.observe(element);
            }
          },
          disconnect: function() {
            observer.disconnect();
          },
          getLoadedCount: function() {
            return loadedElements.size;
          }
        };
      }

      // Infinite scroll helper
      function createInfiniteScroll(options) {
        var config = {
          container: options.container || document.documentElement,
          threshold: options.threshold || 0.8,
          onLoadMore: options.onLoadMore || function() {},
          sentinel: options.sentinel
        };

        var loading = false;
        var hasMore = true;

        // Create or use sentinel element
        var sentinel = config.sentinel;
        if (!sentinel) {
          sentinel = document.createElement('div');
          sentinel.className = 'infinite-scroll-sentinel';
          sentinel.style.height = '1px';
          if (config.container.appendChild) {
            config.container.appendChild(sentinel);
          }
        }

        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting && !loading && hasMore) {
              loading = true;

              Promise.resolve(config.onLoadMore()).then(function(result) {
                loading = false;
                if (result === false) {
                  hasMore = false;
                  observer.disconnect();
                }
              }).catch(function(e) {
                loading = false;
                console.error('[InfiniteScroll] Load error:', e.message);
              });
            }
          });
        }, {
          root: config.container === document.documentElement ? null : config.container,
          threshold: config.threshold
        });

        observer.observe(sentinel);

        return {
          setHasMore: function(value) { hasMore = value; },
          isLoading: function() { return loading; },
          disconnect: function() { observer.disconnect(); }
        };
      }

      // Viewport visibility tracker
      function createVisibilityTracker(elements, callback) {
        var visibilityState = new Map();

        var observer = new IntersectionObserver(function(entries) {
          var changes = [];

          entries.forEach(function(entry) {
            var wasVisible = visibilityState.get(entry.target) || false;
            var isVisible = entry.isIntersecting;

            if (wasVisible !== isVisible) {
              visibilityState.set(entry.target, isVisible);
              changes.push({
                element: entry.target,
                isVisible: isVisible,
                ratio: entry.intersectionRatio
              });
            }
          });

          if (changes.length > 0) {
            callback(changes);
          }
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

        elements.forEach(function(el) {
          observer.observe(el);
          visibilityState.set(el, false);
        });

        return {
          add: function(element) {
            observer.observe(element);
            visibilityState.set(element, false);
          },
          remove: function(element) {
            observer.unobserve(element);
            visibilityState.delete(element);
          },
          getVisibility: function(element) {
            return visibilityState.get(element) || false;
          },
          disconnect: function() {
            observer.disconnect();
            visibilityState.clear();
          }
        };
      }

      // Expose API
      window.__SANDBOX_INTERSECTION__ = {
        supported: true,
        debug: false,

        // Get observer statistics
        getStats: function() {
          return {
            created: observerStats.created,
            disconnected: observerStats.disconnected,
            active: observerStats.active,
            totalCallbacks: observerStats.callbacks
          };
        },

        // Get active observers
        getActiveObservers: function() {
          var result = [];
          observerRegistry.forEach(function(info) {
            result.push({
              id: info.id,
              elementCount: info.elements.size,
              callbackCount: info.callbackCount(),
              age: Date.now() - info.created
            });
          });
          return result;
        },

        // Create lazy loader
        createLazyLoader: createLazyLoader,

        // Create infinite scroll
        createInfiniteScroll: createInfiniteScroll,

        // Create visibility tracker
        createVisibilityTracker: createVisibilityTracker,

        // Enable debug mode
        enableDebug: function() {
          this.debug = true;
          console.log('[IntersectionObserver] Debug mode enabled');
        },

        // Disable debug mode
        disableDebug: function() {
          this.debug = false;
        },

        // Disconnect all observers
        disconnectAll: function() {
          observerRegistry.forEach(function(info) {
            info.observer.disconnect();
          });
          observerRegistry.clear();
          observerStats.active = 0;
        }
      };

      console.log('[Sandbox] Intersection Observer enhancement initialized');
    })();
  `;
}
