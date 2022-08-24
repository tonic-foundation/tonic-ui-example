import { Component, ErrorInfo, ReactNode } from 'react';
import Button from './common/Button';
import Modal, { ModalBody } from './common/Modal';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * If no fallback is provided, this prop optionally sets the label of the
   * default fallback component.
   */
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div tw="h-screen w-screen">
            <Modal visible shouldHandleClose={false}>
              <ModalBody>
                <p>
                  {this.props.fallbackLabel ||
                    'There was an error loading the app.'}
                </p>
                <Button
                  tw="mt-6 w-full bg-down-dark bg-opacity-60 border border-transparent hover:border-down"
                  onClick={() => window.location.replace('/')}
                >
                  Go back
                </Button>
              </ModalBody>
            </Modal>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
