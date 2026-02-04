/**
 * Global activity context tracker for error logging
 *
 * This allows us to track which adventure/activity a user is in
 * and which modal is open when an error occurs, making debugging much easier.
 */

let currentActivityContext: string | null = null
let currentModalContext: { type: string; isOpen: boolean } | null = null

/**
 * Set the current activity context globally
 * Call this whenever the user navigates to a new activity
 */
export function setActivityContext(activityName: string | null) {
  currentActivityContext = activityName

  // Log activity changes for debugging
  if (typeof window !== "undefined") {
    console.log("[v0][ActivityContext] Set to:", activityName)
  }
}

/**
 * Set the current modal context globally
 * Call this whenever a modal opens or closes
 */
export function setModalContext(modalType: string, isOpen: boolean) {
  currentModalContext = isOpen ? { type: modalType, isOpen } : null

  // Log modal changes for debugging
  if (typeof window !== "undefined") {
    console.log("[v0][ModalContext] Set to:", currentModalContext)
  }
}

/**
 * Get the current activity context
 * Returns null if no activity is set
 */
export function getActivityContext(): string | null {
  return currentActivityContext
}

/**
 * Get the current modal context
 * Returns null if no modal is open
 */
export function getModalContext(): { type: string; isOpen: boolean } | null {
  return currentModalContext
}

/**
 * Get a human-readable activity name for error logs
 */
export function getActivityDisplayName(activity: string | null): string {
  if (!activity) return "Unknown Activity"

  const displayNames: Record<string, string> = {
    menu: "Home Menu",
    numbers: "Number Intuition",
    division: "Long Division",
    decimals: "Decimals (Simple)",
    "decimals-full": "Decimals (Full)",
    "decimal-labs": "Decimal Labs",
    "decimal-practice": "Decimal Practice",
    fractions: "Fraction Intuition",
    coach: "Math Coach",
    store: "Reward Store",
    feed: "Activity Feed",
  }

  return displayNames[activity] || activity
}

/**
 * Get a human-readable modal name for error logs
 */
export function getModalDisplayName(modalType: string): string {
  const displayNames: Record<string, string> = {
    whiteboard: "Whiteboard Modal",
    "puzzle-viewer": "Puzzle Viewer Modal",
    settings: "Settings Modal",
    coach: "Math Coach Modal",
  }

  return displayNames[modalType] || `${modalType} Modal`
}

/**
 * Get complete context for error logging including activity and modal state
 */
export function getCompleteErrorContext(): {
  activity: string | null
  activityDisplayName: string
  modal: { type: string; isOpen: boolean } | null
  modalDisplayName: string | null
} {
  const activity = getActivityContext()
  const modal = getModalContext()

  return {
    activity,
    activityDisplayName: getActivityDisplayName(activity),
    modal,
    modalDisplayName: modal ? getModalDisplayName(modal.type) : null,
  }
}
