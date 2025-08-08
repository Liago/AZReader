import React, { useEffect, useState } from "react";
import { IonContent, IonPage, IonSpinner, IonText, IonButton, IonCard, IonCardContent, useIonRouter } from "@ionic/react";
import { useAuth } from "@context/auth/AuthContext";
import { useCustomToast } from "@hooks/useIonToast";

const AuthConfirmPage: React.FC = () => {
	const router = useIonRouter();
	const { user, loading: authLoading } = useAuth();
	const showToast = useCustomToast();
	
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [confirmationType, setConfirmationType] = useState<string | null>(null);
	
	console.log('AuthConfirmPage rendered - URL:', window.location.href);
	console.log('AuthConfirmPage - User state:', { user: !!user, authLoading });

	// Handle URL parameters and confirmation
	useEffect(() => {
		const handleEmailConfirmation = async () => {
			try {
				console.log('Starting email confirmation process...');
				
				// Parse URL parameters
				const searchParams = new URLSearchParams(window.location.search);
				const token_hash = searchParams.get('token_hash');
				const type = searchParams.get('type');
				const access_token = searchParams.get('access_token');
				const refresh_token = searchParams.get('refresh_token');
				const expires_at = searchParams.get('expires_at');
				const expires_in = searchParams.get('expires_in');
				
				console.log('URL parameters:', {
					token_hash: !!token_hash,
					type,
					access_token: !!access_token,
					refresh_token: !!refresh_token,
					expires_at,
					expires_in
				});
				
				// Check if we have required parameters
				if (!token_hash && !access_token) {
					console.error('Missing required authentication parameters');
					setError('Invalid confirmation link. Missing required parameters.');
					setIsLoading(false);
					return;
				}
				
				setConfirmationType(type || 'unknown');
				
				// Handle token-based confirmation (email verification)
				if (token_hash && type) {
					console.log('Processing token_hash confirmation...');
					
					// Import supabase directly for this confirmation
					const { supabase } = await import('@common/supabase');
					
					const { data, error: verifyError } = await supabase.auth.verifyOtp({
						token_hash,
						type: type as any // Supabase handles the type validation
					});
					
					if (verifyError) {
						console.error('Token verification failed:', verifyError);
						setError(`Verification failed: ${verifyError.message}`);
						setIsLoading(false);
						return;
					}
					
					console.log('Token verification successful:', data);
					setSuccess(true);
					
					// Show success message
					showToast({
						message: type === 'signup' ? 'Email verified successfully! Welcome to AZReader!' : 'Email confirmed successfully!',
						color: 'success',
						duration: 4000
					});
					
				} 
				// Handle direct session parameters (OAuth callbacks)
				else if (access_token && refresh_token) {
					console.log('Processing direct session parameters...');
					
					const { supabase } = await import('@common/supabase');
					
					// Set session directly
					const { data, error: sessionError } = await supabase.auth.setSession({
						access_token,
						refresh_token
					});
					
					if (sessionError) {
						console.error('Session setup failed:', sessionError);
						setError(`Session setup failed: ${sessionError.message}`);
						setIsLoading(false);
						return;
					}
					
					console.log('Session setup successful:', data);
					setSuccess(true);
					
					showToast({
						message: 'Successfully signed in! Welcome to AZReader!',
						color: 'success',
						duration: 4000
					});
				}
				
				setIsLoading(false);
				
				// Redirect to home after short delay
				setTimeout(() => {
					console.log('Redirecting to home...');
					router.push('/home', 'root', 'replace');
				}, 2000);
				
			} catch (err) {
				console.error('Email confirmation error:', err);
				const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during confirmation';
				setError(errorMessage);
				setIsLoading(false);
				
				showToast({
					message: `Confirmation failed: ${errorMessage}`,
					color: 'danger',
					duration: 6000
				});
			}
		};
		
		handleEmailConfirmation();
	}, [router, showToast]);
	
	// Handle manual retry
	const handleRetry = () => {
		setError(null);
		setSuccess(false);
		setIsLoading(true);
		// Trigger re-run of confirmation
		window.location.reload();
	};
	
	// Handle manual redirect to home
	const goToHome = () => {
		router.push('/home', 'root', 'replace');
	};
	
	// Get confirmation type display name
	const getConfirmationTypeDisplay = (type: string | null): string => {
		switch (type) {
			case 'signup': return 'Email Verification';
			case 'email_change': return 'Email Change Confirmation';
			case 'recovery': return 'Password Reset';
			case 'invite': return 'Invitation Acceptance';
			default: return 'Email Confirmation';
		}
	};

	return (
		<IonPage>
			<IonContent className="ion-padding" fullscreen>
				<div className="ion-padding" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
					<IonCard style={{ maxWidth: '400px', width: '100%' }}>
						<IonCardContent className="ion-text-center">
							{/* Loading State */}
							{isLoading && (
								<>
									<IonSpinner name="crescent" style={{ width: '60px', height: '60px', margin: '20px auto' }} />
									<h2>Processing {getConfirmationTypeDisplay(confirmationType)}</h2>
									<IonText color="medium">
										<p>Please wait while we confirm your email...</p>
									</IonText>
								</>
							)}
							
							{/* Success State */}
							{success && !isLoading && (
								<>
									<div style={{ fontSize: '60px', color: 'var(--ion-color-success)', margin: '20px 0' }}>✅</div>
									<h2>{getConfirmationTypeDisplay(confirmationType)} Successful!</h2>
									<IonText color="success">
										<p>Your email has been confirmed successfully.</p>
									</IonText>
									<IonText color="medium">
										<p>You will be redirected to the home page in a moment...</p>
									</IonText>
									<IonButton 
										expand="block" 
										onClick={goToHome}
										className="ion-margin-top"
									>
										Go to Home
									</IonButton>
								</>
							)}
							
							{/* Error State */}
							{error && !isLoading && (
								<>
									<div style={{ fontSize: '60px', color: 'var(--ion-color-danger)', margin: '20px 0' }}>❌</div>
									<h2>Confirmation Failed</h2>
									<IonText color="danger">
										<p>{error}</p>
									</IonText>
									<div className="ion-margin-top">
										<IonButton 
											expand="block" 
											onClick={handleRetry}
											color="primary"
											className="ion-margin-bottom"
										>
											Try Again
										</IonButton>
										<IonButton 
											expand="block" 
											fill="outline"
											onClick={goToHome}
										>
											Go to Home
										</IonButton>
									</div>
								</>
							)}
						</IonCardContent>
					</IonCard>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default AuthConfirmPage;
