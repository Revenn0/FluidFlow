/**
 * Fetch Mocking Script
 *
 * Intercepts fetch and XMLHttpRequest calls in the sandbox
 * to provide mock data for API calls, preventing CORS errors
 * and enabling realistic app prototyping.
 */

/**
 * Generate the fetch mocking script for the sandbox
 */
export function getFetchMockingScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // FETCH MOCKING SYSTEM
    // Intercepts fetch/XHR to provide mock responses
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Store original implementations
      const originalFetch = window.fetch;
      const originalXHR = window.XMLHttpRequest;

      // Mock data registry - can be extended by user code
      window.__SANDBOX_MOCKS__ = {
        // Default mock responses for common API patterns
        responses: new Map(),

        // Delay simulation (ms)
        defaultDelay: 100,

        // Whether to log mock matches
        debug: false,

        // Register a mock response
        register: function(urlPattern, response, options) {
          options = options || {};
          this.responses.set(urlPattern, {
            response: response,
            status: options.status || 200,
            headers: options.headers || { 'Content-Type': 'application/json' },
            delay: options.delay !== undefined ? options.delay : this.defaultDelay
          });
          if (this.debug) console.log('[MockAPI] Registered:', urlPattern);
        },

        // Find matching mock for a URL
        findMock: function(url) {
          // Exact match first
          if (this.responses.has(url)) {
            return this.responses.get(url);
          }

          // Pattern matching (supports * wildcard and :param)
          for (const [pattern, mock] of this.responses) {
            // Convert pattern to regex
            // /api/users/:id -> /api/users/[^/]+
            // /api/* -> /api/.*
            const regexPattern = pattern
              .replace(/:[^/]+/g, '[^/]+')
              .replace(/\\*/g, '.*');

            const regex = new RegExp('^' + regexPattern + '$');
            if (regex.test(url)) {
              if (this.debug) console.log('[MockAPI] Pattern match:', pattern, '->', url);
              return mock;
            }
          }

          return null;
        },

        // Clear all mocks
        clear: function() {
          this.responses.clear();
        }
      };

      // ─────────────────────────────────────────────────────────
      // DEFAULT MOCK DATA GENERATORS
      // ─────────────────────────────────────────────────────────

      // Generate realistic mock data based on endpoint patterns
      function generateMockData(url, method) {
        const urlLower = url.toLowerCase();

        // User/Auth endpoints
        if (urlLower.includes('/user') || urlLower.includes('/auth') || urlLower.includes('/me')) {
          return {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            role: 'user',
            createdAt: new Date().toISOString()
          };
        }

        // Products/Items endpoints
        if (urlLower.includes('/product') || urlLower.includes('/item')) {
          const products = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: 'Product ' + (i + 1),
            price: Math.floor(Math.random() * 100) + 10,
            description: 'A great product for your needs',
            image: 'https://picsum.photos/seed/' + (i + 1) + '/200/200',
            category: ['Electronics', 'Clothing', 'Home', 'Sports'][i % 4],
            rating: (Math.random() * 2 + 3).toFixed(1),
            stock: Math.floor(Math.random() * 100)
          }));

          // Single product request (has ID in URL)
          if (/\\/\\d+$/.test(url) || /\\/[a-f0-9-]{36}$/i.test(url)) {
            return products[0];
          }
          return { data: products, total: products.length, page: 1, limit: 10 };
        }

        // Posts/Articles endpoints
        if (urlLower.includes('/post') || urlLower.includes('/article') || urlLower.includes('/blog')) {
          const posts = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: 'Blog Post ' + (i + 1),
            excerpt: 'This is a summary of the blog post content...',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            author: { id: 1, name: 'John Doe' },
            publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
            tags: ['technology', 'design', 'development'].slice(0, (i % 3) + 1),
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 20)
          }));

          if (/\\/\\d+$/.test(url)) return posts[0];
          return { data: posts, total: posts.length };
        }

        // Comments endpoints
        if (urlLower.includes('/comment')) {
          const comments = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            text: 'This is comment number ' + (i + 1),
            author: { id: i + 1, name: 'User ' + (i + 1) },
            createdAt: new Date(Date.now() - i * 3600000).toISOString()
          }));
          return { data: comments, total: comments.length };
        }

        // Orders/Cart endpoints
        if (urlLower.includes('/order') || urlLower.includes('/cart')) {
          return {
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            items: [
              { productId: 1, name: 'Product 1', quantity: 2, price: 29.99 },
              { productId: 2, name: 'Product 2', quantity: 1, price: 49.99 }
            ],
            total: 109.97,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
        }

        // Categories/Tags endpoints
        if (urlLower.includes('/categor') || urlLower.includes('/tag')) {
          return {
            data: [
              { id: 1, name: 'Electronics', slug: 'electronics', count: 42 },
              { id: 2, name: 'Clothing', slug: 'clothing', count: 38 },
              { id: 3, name: 'Home & Garden', slug: 'home-garden', count: 25 },
              { id: 4, name: 'Sports', slug: 'sports', count: 31 }
            ]
          };
        }

        // Search endpoints
        if (urlLower.includes('/search')) {
          return {
            results: [
              { id: 1, type: 'product', title: 'Search Result 1', url: '/product/1' },
              { id: 2, type: 'post', title: 'Search Result 2', url: '/post/2' },
              { id: 3, type: 'product', title: 'Search Result 3', url: '/product/3' }
            ],
            total: 3,
            query: 'example'
          };
        }

        // Notifications endpoints
        if (urlLower.includes('/notification')) {
          return {
            data: [
              { id: 1, type: 'info', message: 'Welcome to the app!', read: false, createdAt: new Date().toISOString() },
              { id: 2, type: 'success', message: 'Your order has been shipped', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
            ],
            unreadCount: 1
          };
        }

        // Settings/Config endpoints
        if (urlLower.includes('/setting') || urlLower.includes('/config')) {
          return {
            theme: 'light',
            language: 'en',
            notifications: true,
            emailUpdates: false
          };
        }

        // Stats/Analytics endpoints
        if (urlLower.includes('/stat') || urlLower.includes('/analytic') || urlLower.includes('/dashboard')) {
          return {
            visitors: 1234,
            pageViews: 5678,
            bounceRate: 42.5,
            avgSessionDuration: 245,
            topPages: [
              { path: '/', views: 1000 },
              { path: '/products', views: 750 },
              { path: '/about', views: 500 }
            ],
            chartData: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
              value: Math.floor(Math.random() * 500) + 100
            }))
          };
        }

        // Default: return success for mutations, empty array for GET
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          return { success: true, message: 'Operation completed successfully', id: Math.floor(Math.random() * 1000) };
        }
        if (method === 'DELETE') {
          return { success: true, message: 'Deleted successfully' };
        }

        // Generic list response
        return { data: [], total: 0, page: 1, limit: 10 };
      }

      // ─────────────────────────────────────────────────────────
      // FETCH INTERCEPTOR
      // ─────────────────────────────────────────────────────────

      window.fetch = async function(input, init) {
        init = init || {};
        const url = typeof input === 'string' ? input : input.url;
        const method = (init.method || 'GET').toUpperCase();

        // Skip data URLs and blob URLs
        if (url.startsWith('data:') || url.startsWith('blob:')) {
          return originalFetch.apply(this, arguments);
        }

        // Check for registered mock
        const mock = window.__SANDBOX_MOCKS__.findMock(url);

        if (mock) {
          // Use registered mock
          await new Promise(resolve => setTimeout(resolve, mock.delay));

          const responseData = typeof mock.response === 'function'
            ? mock.response(url, init)
            : mock.response;


          return new Response(JSON.stringify(responseData), {
            status: mock.status,
            headers: mock.headers
          });
        }

        // Check if this is an API call (not a CDN/static resource)
        const isApiCall =
          url.includes('/api/') ||
          url.includes('/v1/') ||
          url.includes('/v2/') ||
          url.includes('/graphql') ||
          (url.startsWith('http') && !url.includes('esm.sh') && !url.includes('unpkg.com') && !url.includes('cdn.'));

        if (isApiCall) {
          // Generate mock response
          const delay = window.__SANDBOX_MOCKS__.defaultDelay;
          await new Promise(resolve => setTimeout(resolve, delay));

          const mockData = generateMockData(url, method);


          return new Response(JSON.stringify(mockData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Pass through to original fetch for CDN resources
        try {
          return await originalFetch.apply(this, arguments);
        } catch (err) {
          // If fetch fails (CORS, network), return a mock response

          const mockData = generateMockData(url, method);
          return new Response(JSON.stringify(mockData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      };

      // ─────────────────────────────────────────────────────────
      // XMLHttpRequest INTERCEPTOR
      // ─────────────────────────────────────────────────────────

      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;

        let method = 'GET';
        let url = '';

        xhr.open = function(m, u) {
          method = m;
          url = u;
          return originalOpen.apply(this, arguments);
        };

        xhr.send = function(body) {
          // Check if this is an API call
          const isApiCall =
            url.includes('/api/') ||
            url.includes('/v1/') ||
            url.includes('/v2/') ||
            (url.startsWith('http') && !url.includes('esm.sh') && !url.includes('unpkg.com'));

          if (isApiCall) {
            // Mock the XHR response
            const mockData = generateMockData(url, method);

            setTimeout(() => {
              Object.defineProperty(xhr, 'readyState', { value: 4 });
              Object.defineProperty(xhr, 'status', { value: 200 });
              Object.defineProperty(xhr, 'statusText', { value: 'OK' });
              Object.defineProperty(xhr, 'responseText', { value: JSON.stringify(mockData) });
              Object.defineProperty(xhr, 'response', { value: JSON.stringify(mockData) });


              if (xhr.onreadystatechange) xhr.onreadystatechange();
              if (xhr.onload) xhr.onload();
            }, window.__SANDBOX_MOCKS__.defaultDelay);

            return;
          }

          return originalSend.apply(this, arguments);
        };

        return xhr;
      };

      // Copy static properties
      window.XMLHttpRequest.UNSENT = 0;
      window.XMLHttpRequest.OPENED = 1;
      window.XMLHttpRequest.HEADERS_RECEIVED = 2;
      window.XMLHttpRequest.LOADING = 3;
      window.XMLHttpRequest.DONE = 4;

    })();
  `;
}
