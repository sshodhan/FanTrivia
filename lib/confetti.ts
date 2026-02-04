'use client'

import confetti from 'canvas-confetti'

// Seahawks colors
const SEAHAWKS_COLORS = ['#002244', '#69BE28', '#A5ACAF', '#FFFFFF']

/**
 * Fire confetti for correct answers and achievements
 */
export function fireConfetti(options?: {
  colors?: string[]
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
}) {
  const colors = options?.colors || SEAHAWKS_COLORS

  confetti({
    particleCount: options?.particleCount || 100,
    spread: options?.spread || 70,
    origin: options?.origin || { y: 0.6 },
    colors,
    disableForReducedMotion: true
  })
}

/**
 * Fire confetti from both sides for big achievements
 */
export function fireBigConfetti() {
  const count = 200
  const defaults = {
    colors: SEAHAWKS_COLORS,
    disableForReducedMotion: true
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  // Fire from left
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0, y: 0.7 }
  })

  // Fire from right
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 1, y: 0.7 }
  })

  // Fire from center
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    origin: { y: 0.7 }
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    origin: { y: 0.7 }
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    origin: { y: 0.7 }
  })
}

/**
 * Fire streak confetti (smaller, repeated bursts)
 */
export function fireStreakConfetti(streakCount: number) {
  const intensity = Math.min(streakCount, 5)

  for (let i = 0; i < intensity; i++) {
    setTimeout(() => {
      confetti({
        particleCount: 20 + (i * 10),
        spread: 50 + (i * 10),
        origin: { y: 0.7 },
        colors: SEAHAWKS_COLORS,
        disableForReducedMotion: true
      })
    }, i * 100)
  }
}

/**
 * Fire gold confetti for completion
 */
export function fireCompletionConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    disableForReducedMotion: true
  }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: SEAHAWKS_COLORS
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: SEAHAWKS_COLORS
    })
  }, 250)
}
