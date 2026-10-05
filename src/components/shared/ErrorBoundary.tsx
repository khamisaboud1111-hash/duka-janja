'use client'

import { useEffect, useState, Component, ReactNode } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Client-side error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { lang } = useLangStore.getState()
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900">
          <div className="w-full max-w-md">
            <ErrorState
              title="Kitu kimekosea"
              description={this.state.error?.message || "Samahani, hitilafu imetokea."}
              retryLabel="Jaribu tena"
              onClick={() => this.setState({ hasError: false, error: null })}
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function withErrorBoundary(children: ReactNode) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}