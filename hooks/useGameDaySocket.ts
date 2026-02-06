'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { QuestionWithoutAnswer, LeaderboardEntry } from '@/lib/database.types'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ''

// Socket events
export interface GameDayEvents {
  // Server -> Client
  question_start: {
    question: QuestionWithoutAnswer
    question_index: number
    total_questions: number
    server_time: number
  }
  question_end: {
    correct_answer_index: number
    explanation?: string
    stats: {
      total_answers: number
      answer_distribution: number[]
      average_time_ms: number
    }
  }
  leaderboard_update: {
    leaderboard: LeaderboardEntry[]
    timestamp: number
  }
  game_paused: {
    timestamp: number
  }
  game_resumed: {
    timestamp: number
    time_remaining_ms: number
  }
  game_ended: {
    final_leaderboard: LeaderboardEntry[]
    winner: LeaderboardEntry | null
  }
  connection_count: {
    count: number
  }
  error: {
    message: string
  }
}

// Client -> Server
export interface ClientEvents {
  join_game: {
    team_id: string
    team_name: string
  }
  submit_answer: {
    question_id: string
    answer_index: number
    time_taken_ms: number
  }
  leave_game: {}
}

interface GameDaySocketState {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  currentQuestion: QuestionWithoutAnswer | null
  questionIndex: number
  totalQuestions: number
  serverTime: number
  isPaused: boolean
  isGameEnded: boolean
  leaderboard: LeaderboardEntry[]
  lastAnswerResult: {
    correct_answer_index: number
    explanation?: string
  } | null
  participantCount: number
}

interface GameDaySocketActions {
  connect: (teamId: string, teamName: string) => void
  disconnect: () => void
  submitAnswer: (questionId: string, answerIndex: number, timeTakenMs: number) => void
}

export function useGameDaySocket(): GameDaySocketState & GameDaySocketActions {
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const [state, setState] = useState<GameDaySocketState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    serverTime: 0,
    isPaused: false,
    isGameEnded: false,
    leaderboard: [],
    lastAnswerResult: null,
    participantCount: 0
  })

  // Connect to socket server
  const connect = useCallback((teamId: string, teamName: string) => {
    if (socketRef.current?.connected) return

    // If no socket URL configured, live game is unavailable
    if (!SOCKET_URL) {
      console.warn('Socket URL not configured, live game unavailable')
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionError: 'Live game not available - Socket URL not configured'
      }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }))

    const socket = io(SOCKET_URL, {
      auth: {
        team_id: teamId,
        team_name: teamName
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected')
      reconnectAttemptsRef.current = 0
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionError: null
      }))

      // Join the game room
      socket.emit('join_game', { team_id: teamId, team_name: teamName })
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setState(prev => ({
        ...prev,
        isConnected: false
      }))
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      reconnectAttemptsRef.current++

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          connectionError: 'Failed to connect to game server'
        }))
      }
    })

    // Game events
    socket.on('question_start', (data: GameDayEvents['question_start']) => {
      setState(prev => ({
        ...prev,
        currentQuestion: data.question,
        questionIndex: data.question_index,
        totalQuestions: data.total_questions,
        serverTime: data.server_time,
        lastAnswerResult: null,
        isPaused: false
      }))
    })

    socket.on('question_end', (data: GameDayEvents['question_end']) => {
      setState(prev => ({
        ...prev,
        lastAnswerResult: {
          correct_answer_index: data.correct_answer_index,
          explanation: data.explanation
        }
      }))
    })

    socket.on('leaderboard_update', (data: GameDayEvents['leaderboard_update']) => {
      setState(prev => ({
        ...prev,
        leaderboard: data.leaderboard
      }))
    })

    socket.on('game_paused', () => {
      setState(prev => ({
        ...prev,
        isPaused: true
      }))
    })

    socket.on('game_resumed', () => {
      setState(prev => ({
        ...prev,
        isPaused: false
      }))
    })

    socket.on('game_ended', (data: GameDayEvents['game_ended']) => {
      setState(prev => ({
        ...prev,
        isGameEnded: true,
        leaderboard: data.final_leaderboard,
        currentQuestion: null
      }))
    })

    socket.on('connection_count', (data: GameDayEvents['connection_count']) => {
      setState(prev => ({
        ...prev,
        participantCount: data.count
      }))
    })

    socket.on('error', (data: GameDayEvents['error']) => {
      console.error('Socket error:', data.message)
      setState(prev => ({
        ...prev,
        connectionError: data.message
      }))
    })
  }, [])

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_game', {})
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setState({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      serverTime: 0,
      isPaused: false,
      isGameEnded: false,
      leaderboard: [],
      lastAnswerResult: null,
      participantCount: 0
    })
  }, [])

  // Submit answer
  const submitAnswer = useCallback((
    questionId: string,
    answerIndex: number,
    timeTakenMs: number
  ) => {
    if (!socketRef.current?.connected) {
      console.error('Cannot submit answer: not connected')
      return
    }

    socketRef.current.emit('submit_answer', {
      question_id: questionId,
      answer_index: answerIndex,
      time_taken_ms: timeTakenMs
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    submitAnswer
  }
}
