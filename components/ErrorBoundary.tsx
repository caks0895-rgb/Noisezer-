'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 bg-red-50 text-red-700 rounded-md">
          <h2 className="text-lg font-bold">Terjadi kesalahan pada aplikasi</h2>
          <p>Mohon muat ulang halaman atau hubungi dukungan jika masalah berlanjut.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
