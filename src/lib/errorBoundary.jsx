import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Terjadi Kesalahan</h1>
            <p className="text-gray-600 text-sm mb-6">
              {this.state.error?.message || 'Aplikasi mengalami kesalahan yang tidak terduga. Coba refresh halaman.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
                <RefreshCw size={16} className="mr-1" /> Refresh
              </Button>
              <Button className="flex-1 bg-primary" onClick={this.resetError}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}