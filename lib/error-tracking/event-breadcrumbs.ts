/**
 * Event Breadcrumbs System
 *
 * Maintains a circular buffer of recent events to provide context when errors occur.
 * Stores the last 50 events and includes them in error reports.
 */

export interface Breadcrumb {
  timestamp: number
  category: "navigation" | "user-action" | "network" | "state-change" | "puzzle" | "error"
  message: string
  data?: Record<string, unknown>
}

class BreadcrumbManager {
  private breadcrumbs: Breadcrumb[] = []
  private maxBreadcrumbs = 50

  addBreadcrumb(category: Breadcrumb["category"], message: string, data?: Record<string, unknown>) {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      data,
    }

    this.breadcrumbs.push(breadcrumb)

    // Keep only the last maxBreadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  getBreadcrumbs(count = 20): Breadcrumb[] {
    // Return the last 'count' breadcrumbs
    return this.breadcrumbs.slice(-count)
  }

  clear() {
    this.breadcrumbs = []
  }
}

// Global instance
const breadcrumbManager = new BreadcrumbManager()

// Export functions
export function addBreadcrumb(category: Breadcrumb["category"], message: string, data?: Record<string, unknown>) {
  breadcrumbManager.addBreadcrumb(category, message, data)
}

export function getBreadcrumbs(count?: number): Breadcrumb[] {
  return breadcrumbManager.getBreadcrumbs(count)
}

export function clearBreadcrumbs() {
  breadcrumbManager.clear()
}
