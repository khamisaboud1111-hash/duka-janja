'use client'

import { useEffect, useState, Component, ReactNode } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`SectionErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { lang } = useLangStore.getState()
      return (
        <div className="section">
          <div className="page-container">
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

export default function withSectionErrorBoundary(children: ReactNode, name?: string) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>
}