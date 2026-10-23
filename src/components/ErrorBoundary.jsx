import { Component } from 'react'
export default class ErrorBoundary extends Component {
  constructor(p) {
    super(p)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="muted mt-2 text-sm">
            This demo hit an unexpected error. Reloading usually fixes it.
          </p>
          <button className="btn-m mt-5" onClick={() => location.assign('/')}>
            Reload PathGuard
          </button>
        </div>
      </div>
    )
  }
}
