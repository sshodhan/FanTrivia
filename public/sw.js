// Hawktrivia Service Worker
const CACHE_NAME = 'hawktrivia-v1'
const STATIC_CACHE = 'hawktrivia-static-v1'
const DYNAMIC_CACHE = 'hawktrivia-dynamic-v1'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, clonedResponse))
          }
          return response
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              return caches.match('/offline.html')
            })
        })
    )
    return
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached and update in background
          fetchAndCache(request)
          return cachedResponse
        }

        // Not in cache, fetch from network
        return fetchAndCache(request)
      })
      .catch(() => {
        // If both fail for images, return placeholder
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#1a3a5c" width="100" height="100"/><text fill="#69BE28" x="50" y="55" font-size="12" text-anchor="middle">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          )
        }
      })
  )
})

// Helper function to fetch and cache
async function fetchAndCache(request) {
  const response = await fetch(request)

  // Only cache successful responses
  if (response.status === 200) {
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())
  }

  return response
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Queue trivia answers when offline
  if (event.data && event.data.type === 'QUEUE_ANSWER') {
    queueAnswer(event.data.answer)
  }
})

// Answer queue for offline mode
const answerQueue = []

function queueAnswer(answer) {
  answerQueue.push({
    ...answer,
    timestamp: Date.now()
  })
  console.log('[SW] Answer queued for sync:', answer)
}

// Background sync for queued answers
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-answers') {
    event.waitUntil(syncQueuedAnswers())
  }
})

async function syncQueuedAnswers() {
  while (answerQueue.length > 0) {
    const answer = answerQueue.shift()

    try {
      const response = await fetch('/api/trivia/daily/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answer)
      })

      if (!response.ok) {
        // Put back in queue if failed
        answerQueue.unshift(answer)
        break
      }

      console.log('[SW] Synced queued answer')
    } catch (error) {
      // Put back in queue and try again later
      answerQueue.unshift(answer)
      throw error
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
