import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorPage from '../pages/ErrorPage';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
		errorInfo: null
	};

	public static getDerivedStateFromError(error: Error): State {
		// Aggiorna lo stato così il prossimo render mostrerà l'UI di fallback
		return { hasError: true, error, errorInfo: null };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Puoi loggare l'errore in un servizio di reporting
		console.error('Errore catturato:', error);
		console.error('Stack trace:', errorInfo.componentStack);

		// Aggiorna lo stato con le informazioni sull'errore
		this.setState({
			error,
			errorInfo
		});

		// Qui potresti inviare l'errore a un servizio di logging
		// logErrorToService(error, errorInfo);
	}

	private isNetworkError(error: Error): boolean {
		// Verifica se l'errore è correlato alla rete
		return (
			error.message.includes('network') ||
			error.message.includes('Network') ||
			error.message.includes('fetch') ||
			error.message.includes('connection') ||
			error.name === 'NetworkError' ||
			error.name === 'FetchError' ||
			error.name === 'AbortError'
		);
	}

	public render() {
		if (this.state.hasError) {
			// Personalizza il messaggio di errore in base al tipo di errore
			let errorMessage = 'Si è verificato un errore imprevisto.';

			if (this.state.error instanceof TypeError) {
				errorMessage = 'Si è verificato un errore di tipo. Riprova più tardi.';
			} else if (this.state.error instanceof ReferenceError) {
				errorMessage = 'Si è verificato un errore di riferimento. Riprova più tardi.';
			} else if (this.state.error && this.isNetworkError(this.state.error)) {
				errorMessage = 'Si è verificato un errore di rete. Verifica la tua connessione.';
			}

			return <ErrorPage message={errorMessage} />;
		}

		return this.props.children;
	}
}

export default ErrorBoundary; 