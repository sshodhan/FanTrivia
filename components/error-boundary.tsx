'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Don't worry, your progress is saved.
            </p>
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-card rounded-lg text-left">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
interface ErrorFallbackProps {
  error?: Error | null
  reset?: () => void
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🦅</div>
        <h2 className="text-xl font-bold text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {reset && (
          <Button onClick={reset} size="sm">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}

// Simple error display component
export function ErrorMessage({
  message,
  onRetry,
  className = ''
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <p className="text-destructive mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Retry
        </Button>
      )}
    </div>
  )
}
