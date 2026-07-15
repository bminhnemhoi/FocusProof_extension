/**
 * FocusProof – Error Boundary
 * Catches React rendering errors and shows a fallback UI.
 * Prevents the entire popup from crashing on unexpected errors.
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { logError } from '@/utils/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FocusProof] UI Error:', error, info.componentStack);
    // Ghi nhận lỗi UI để theo dõi (tiêu chí error logging)
    void logError('popup:react', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-icon">⚠️</div>
          <h2 className="error-boundary-title">Đã xảy ra lỗi</h2>
          <p className="error-boundary-message">
            {this.state.error?.message ?? 'Lỗi không xác định'}
          </p>
          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            type="button"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
