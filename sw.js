// AV Classes Coaching Center - Service Worker
const CACHE_NAME = 'av-classes-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://ik.imagekit.io/dy4ku1v0z/Favicon%20/Picsart_25-11-20_09-01-16-761.jpg',
  'https://i.postimg.cc/0j9TqyDQ/IMG-20251027-WA0000.jpg'
];

// Install Event
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker Installed');
        return self.skipWaiting();
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker Activated');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Check if valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(error => {
            console.error('❌ Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            // You can return a custom offline page here
            return new Response('🔌 You are offline. Please check your internet connection.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background Sync for Form Submissions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background Sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get pending submissions from IndexedDB
    const pendingSubmissions = await getPendingSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch(submission.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        });

        if (response.ok) {
          console.log('✅ Background sync successful');
          await removePendingSubmission(submission.id);
        }
      } catch (error) {
        console.error('❌ Background sync failed:', error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync error:', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New update from AV Classes',
    icon: 'https://ik.imagekit.io/dy4ku1v0z/Favicon%20/Picsart_25-11-20_09-01-16-761.jpg',
    badge: 'https://ik.imagekit.io/dy4ku1v0z/Favicon%20/Picsart_25-11-20_09-01-16-761.jpg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Website'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AV Classes', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(windowClients => {
        // Check if window is already open
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});

// Periodic Background Sync (for newer browsers)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-update') {
      event.waitUntil(updateContent());
    }
  });
}

async function updateContent() {
  try {
    console.log('🔄 Periodic content update check');
    // Check for new content updates
    // You can implement content update logic here
  } catch (error) {
    console.error('❌ Periodic sync error:', error);
  }
}

// Helper functions for IndexedDB (for background sync)
function getPendingSubmissions() {
  return new Promise((resolve) => {
    // Implement your IndexedDB logic here
    resolve([]);
  });
}

function removePendingSubmission(id) {
  return new Promise((resolve) => {
    // Implement your IndexedDB logic here
    resolve();
  });
}

// Message Event (communication from main thread)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({version: '2.0.0'});
  }
});

console.log('🎓 AV Classes Service Worker Loaded');
