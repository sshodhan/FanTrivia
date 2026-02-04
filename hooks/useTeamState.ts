'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDeviceFingerprint, generateSessionToken } from '@/lib/fingerprint'
import type { Team } from '@/lib/database.types'

const STORAGE_KEYS = {
  team: 'hawktrivia_team',
  token: 'hawktrivia_token',
  todayPlayed: 'hawktrivia_today_played',
  playedDate: 'hawktrivia_played_date'
}

interface TeamStateData {
  team: Team | null
  teamToken: string | null
  isLoading: boolean
  error: string | null
  todayPlayed: boolean
  deviceFingerprint: string | null
}

interface TeamStateActions {
  registerTeam: (name: string, imageUrl?: string, isPresetImage?: boolean) => Promise<{ success: boolean; error?: string }>
  updateTeam: (updates: { name?: string; image_url?: string; is_preset_image?: boolean }) => Promise<{ success: boolean; error?: string }>
  clearTeamState: () => void
  markTodayPlayed: () => void
  refreshTeamState: () => Promise<void>
}

export function useTeamState(): TeamStateData & TeamStateActions {
  const [state, setState] = useState<TeamStateData>({
    team: null,
    teamToken: null,
    isLoading: true,
    error: null,
    todayPlayed: false,
    deviceFingerprint: null
  })

  // Initialize from localStorage
  useEffect(() => {
    async function initTeamState() {
      try {
        // Get device fingerprint
        const fingerprint = await getDeviceFingerprint()

        // Load stored data
        const storedTeam = localStorage.getItem(STORAGE_KEYS.team)
        const storedToken = localStorage.getItem(STORAGE_KEYS.token)
        const storedTodayPlayed = localStorage.getItem(STORAGE_KEYS.todayPlayed)
        const storedPlayedDate = localStorage.getItem(STORAGE_KEYS.playedDate)

        let team: Team | null = null
        let todayPlayed = false

        // Check if played today
        const today = new Date().toISOString().split('T')[0]
        if (storedPlayedDate === today && storedTodayPlayed === 'true') {
          todayPlayed = true
        } else if (storedPlayedDate !== today) {
          // Reset for new day
          localStorage.removeItem(STORAGE_KEYS.todayPlayed)
          localStorage.removeItem(STORAGE_KEYS.playedDate)
        }

        if (storedTeam && storedToken) {
          team = JSON.parse(storedTeam) as Team

          // Validate with server (optional, for sync)
          try {
            const response = await fetch('/api/teams/state', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            })

            if (response.ok) {
              const data = await response.json()
              if (data.team) {
                team = data.team
                localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(team))
              }
            } else if (response.status === 401) {
              // Invalid token, clear local data
              localStorage.removeItem(STORAGE_KEYS.team)
              localStorage.removeItem(STORAGE_KEYS.token)
              team = null
            }
          } catch {
            // Network error, use local data
            console.warn('Could not validate with server')
          }
        }

        setState({
          team,
          teamToken: storedToken,
          isLoading: false,
          error: null,
          todayPlayed,
          deviceFingerprint: fingerprint
        })
      } catch (error) {
        console.error('Team state init error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize'
        }))
      }
    }

    initTeamState()
  }, [])

  // Register new team
  const registerTeam = useCallback(async (
    name: string,
    imageUrl?: string,
    isPresetImage?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const fingerprint = state.deviceFingerprint || await getDeviceFingerprint()

      const response = await fetch('/api/teams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_name: name,
          image_url: imageUrl,
          is_preset_image: isPresetImage,
          device_fingerprint: fingerprint
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Registration failed'
        }))
        return { success: false, error: data.error }
      }

      // Store team and token
      localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(data.team))
      localStorage.setItem(STORAGE_KEYS.token, data.session_token)

      setState(prev => ({
        ...prev,
        team: data.team,
        teamToken: data.session_token,
        isLoading: false,
        error: null,
        deviceFingerprint: fingerprint
      }))

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [state.deviceFingerprint])

  // Update team info
  const updateTeam = useCallback(async (
    updates: { name?: string; image_url?: string; is_preset_image?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.teamToken) {
      return { success: false, error: 'Not logged in' }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const response = await fetch('/api/teams/state', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.teamToken}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        setState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: data.error }
      }

      if (data.team) {
        localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(data.team))
        setState(prev => ({
          ...prev,
          team: data.team,
          isLoading: false
        }))
      } else {
        // Update local state with provided updates
        setState(prev => {
          if (!prev.team) return { ...prev, isLoading: false }
          const updatedTeam = { ...prev.team, ...updates }
          localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(updatedTeam))
          return {
            ...prev,
            team: updatedTeam,
            isLoading: false
          }
        })
      }

      return { success: true }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: 'Update failed' }
    }
  }, [state.teamToken])

  // Clear state
  const clearTeamState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.team)
    localStorage.removeItem(STORAGE_KEYS.token)
    localStorage.removeItem(STORAGE_KEYS.todayPlayed)
    localStorage.removeItem(STORAGE_KEYS.playedDate)

    setState(prev => ({
      ...prev,
      team: null,
      teamToken: null,
      todayPlayed: false
    }))
  }, [])

  // Mark today as played
  const markTodayPlayed = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(STORAGE_KEYS.todayPlayed, 'true')
    localStorage.setItem(STORAGE_KEYS.playedDate, today)

    setState(prev => ({ ...prev, todayPlayed: true }))
  }, [])

  // Refresh (re-validate with server)
  const refreshTeamState = useCallback(async () => {
    if (!state.teamToken) return

    try {
      const response = await fetch('/api/teams/state', {
        headers: {
          'Authorization': `Bearer ${state.teamToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.team) {
          localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(data.team))
          setState(prev => ({ ...prev, team: data.team }))
        }
      }
    } catch (error) {
      console.warn('Failed to refresh:', error)
    }
  }, [state.teamToken])

  return {
    ...state,
    registerTeam,
    updateTeam,
    clearTeamState,
    markTodayPlayed,
    refreshTeamState
  }
}

// Legacy export for backward compatibility
export { useTeamState as useTeamSession }
