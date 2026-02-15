// Error Boundary Component with Retry System

import { Ionicons } from '@expo/vector-icons';
import React, { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

const MAX_AUTO_RETRY = 2;

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Notify parent
    this.props.onError?.(error, errorInfo);

    // Auto retry for certain errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < MAX_AUTO_RETRY) {
      setTimeout(() => {
        this.handleRetry();
      }, 1000 * (this.state.retryCount + 1));
    }
  }

  shouldAutoRetry(error: Error): boolean {
    // Auto retry for network-related errors
    const retryableErrors = [
      'Network request failed',
      'Failed to fetch',
      'timeout',
      'ECONNREFUSED',
    ];
    
    return retryableErrors.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
    
    this.props.onRetry?.();
  };

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color="#FF3B30" />
            </View>
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>

            {this.state.retryCount > 0 && (
              <Text style={styles.retryInfo}>
                Retry attempt: {this.state.retryCount}/{MAX_AUTO_RETRY}
              </Text>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.errorInfo && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error?.stack}
                </Text>
                <Text style={styles.debugText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    retry: () => void;
  }>;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryInfo: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 24,
    maxHeight: 200,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
