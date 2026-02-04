'use client'

const PUSH_SUBSCRIPTION_KEY = 'hawktrivia_push_subscription'

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(teamId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    const granted = await requestNotificationPermission()
    if (!granted) {
      return null
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // In production, get VAPID public key from server
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
    }

    // Store subscription locally
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription.toJSON()))

    // Send subscription to server
    await registerPushSubscription(teamId, subscription)

    return subscription
  } catch (error) {
    console.error('Error subscribing to push:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(teamId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // Remove from server
      await unregisterPushSubscription(teamId)

      // Clear local storage
      localStorage.removeItem(PUSH_SUBSCRIPTION_KEY)
    }

    return true
  } catch (error) {
    console.error('Error unsubscribing from push:', error)
    return false
  }
}

/**
 * Register push subscription with server
 */
async function registerPushSubscription(
  teamId: string,
  subscription: PushSubscription
): Promise<void> {
  try {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team_id: teamId,
        subscription: subscription.toJSON()
      })
    })
  } catch (error) {
    console.error('Error registering push subscription:', error)
  }
}

/**
 * Unregister push subscription from server
 */
async function unregisterPushSubscription(teamId: string): Promise<void> {
  try {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        team_id: teamId
      })
    })
  } catch (error) {
    console.error('Error unregistering push subscription:', error)
  }
}

/**
 * Show a local notification (for immediate feedback)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    })
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
