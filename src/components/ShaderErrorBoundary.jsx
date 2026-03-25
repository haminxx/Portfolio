import { Component } from 'react'

/**
 * Catches render errors from @react-three/fiber / Canvas so the rest of the desktop still mounts.
 */
export default class ShaderErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[DesktopShaderBackground] disabled:', error?.message, errorInfo?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}
