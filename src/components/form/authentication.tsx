import React, { useState } from "react";
import { IonButton, IonInput, IonItem, IonLabel, IonText, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonGrid, IonRow, IonCol } from "@ionic/react";
import { mail, logoGoogle, logoApple, logoTwitter, keyOutline } from "ionicons/icons";

import { useCustomToast } from "@hooks/useIonToast";
import { useAuth } from "@context/auth/AuthContext";

interface AuthProps {
	initialMode?: 'email' | 'verify';
}

export const Auth: React.FC<AuthProps> = ({ initialMode = 'email' }) => {
	const showToast = useCustomToast();
	const { signInWithOtp, verifyOtp, signInWithGoogle, signInWithApple, signInWithTwitter, loading, error, clearError } = useAuth();
	
	const [mode, setMode] = useState<'email' | 'verify'>(initialMode);
	const [email, setEmail] = useState('');
	const [otpCode, setOtpCode] = useState('');
	const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
	const [isEmailSent, setIsEmailSent] = useState(false);

	// Clear auth errors when switching modes
	const switchMode = (newMode: 'email' | 'verify') => {
		setMode(newMode);
		setValidationErrors({});
		clearError();
		if (newMode === 'email') {
			setOtpCode('');
			setIsEmailSent(false);
		}
	};

	// Form validation
	const validateForm = (): boolean => {
		const errors: { [key: string]: string } = {};

		if (mode === 'email') {
			// Email validation
			if (!email) {
				errors.email = 'Email is required';
			} else if (!/\S+@\S+\.\S+/.test(email)) {
				errors.email = 'Email address is invalid';
			}
		} else if (mode === 'verify') {
			// OTP validation
			if (!otpCode) {
				errors.otp = 'Verification code is required';
			} else if (otpCode.length !== 6) {
				errors.otp = 'Verification code must be 6 digits';
			}
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Handle email submission (send OTP/magic link)
	const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		clearError();
		
		if (!validateForm()) return;

		try {
			const { error } = await signInWithOtp(email);
			if (!error) {
				setIsEmailSent(true);
				setMode('verify');
				showToast({
					message: 'Check your email for the verification code or magic link!',
					color: 'success',
					duration: 5000,
				});
			}
		} catch (err) {
			console.error('Email send error:', err);
		}
	};

	// Handle OTP verification
	const handleOtpVerify = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		clearError();
		
		if (!validateForm()) return;

		try {
			const { error } = await verifyOtp(email, otpCode);
			if (!error) {
				showToast({
					message: 'Successfully logged in!',
					color: 'success',
				});
			}
		} catch (err) {
			console.error('OTP verification error:', err);
		}
	};

	// Resend OTP/Magic Link
	const handleResendCode = async () => {
		clearError();
		
		try {
			const { error } = await signInWithOtp(email);
			if (!error) {
				showToast({
					message: 'New verification code sent!',
					color: 'success',
				});
			}
		} catch (err) {
			console.error('Resend error:', err);
		}
	};

	// Handle OAuth sign-in
	const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'twitter') => {
		clearError();
		
		try {
			let result;
			switch (provider) {
				case 'google':
					result = await signInWithGoogle();
					break;
				case 'apple':
					result = await signInWithApple();
					break;
				case 'twitter':
					result = await signInWithTwitter();
					break;
				default:
					return;
			}

			if (!result.error) {
				showToast({
					message: `Successfully signed in with ${provider}!`,
					color: 'success',
				});
			}
		} catch (err) {
			console.error(`${provider} sign-in error:`, err);
		}
	};

	const getTitle = () => {
		switch (mode) {
			case 'email': return 'Welcome back';
			case 'verify': return 'Check your email';
		}
	};

	const getSubtitle = () => {
		switch (mode) {
			case 'email': return 'Enter your email to get started';
			case 'verify': return `We sent a verification code to ${email}`;
		}
	};

	return (
		<IonGrid className="h-full">
			<IonRow className="h-full ion-justify-content-center ion-align-items-center">
				<IonCol size="12" sizeMd="6" sizeLg="4">
					<IonCard className="ion-padding">
						<IonCardHeader className="ion-text-center">
							<div className="ion-margin-bottom">
								<IonIcon
									icon={mode === 'verify' ? keyOutline : mail}
									style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }}
								/>
							</div>
							<IonCardTitle>{getTitle()}</IonCardTitle>
							<IonText color="medium">
								<p>{getSubtitle()}</p>
							</IonText>
						</IonCardHeader>

						<IonCardContent>
							{/* Error Display */}
							{error && (
								<IonText color="danger" className="ion-margin-bottom">
									<p style={{ fontSize: '14px' }}>{typeof error === 'string' ? error : error.message}</p>
								</IonText>
							)}

							{mode === 'email' && (
								<>
									{/* OAuth Buttons */}
									<div className="ion-margin-bottom">
										<IonButton
											fill="outline"
											expand="block"
											className="ion-margin-bottom"
											onClick={() => handleOAuthSignIn('google')}
											disabled={loading}
										>
											<IonIcon icon={logoGoogle} slot="start" />
											Continue with Google
										</IonButton>
										<IonButton
											fill="outline"
											expand="block"
											className="ion-margin-bottom"
											onClick={() => handleOAuthSignIn('apple')}
											disabled={loading}
										>
											<IonIcon icon={logoApple} slot="start" />
											Continue with Apple
										</IonButton>
										<IonButton
											fill="outline"
											expand="block"
											className="ion-margin-bottom"
											onClick={() => handleOAuthSignIn('twitter')}
											disabled={loading}
										>
											<IonIcon icon={logoTwitter} slot="start" />
											Continue with Twitter
										</IonButton>

										{/* Divider */}
										<div className="ion-text-center ion-margin">
											<IonText color="medium">
												<small>or continue with email</small>
											</IonText>
										</div>
									</div>

									{/* Email Form */}
									<form onSubmit={handleEmailSubmit}>
										<IonItem className="ion-margin-bottom">
											<IonLabel position="stacked">Email</IonLabel>
											<IonInput
												type="email"
												value={email}
												onIonInput={(e) => setEmail(e.detail.value!)}
												placeholder="Enter your email address"
												required
											/>
											{validationErrors.email && (
												<IonText color="danger" style={{ fontSize: '12px' }}>
													{validationErrors.email}
												</IonText>
											)}
										</IonItem>

										<IonButton
											type="submit"
											expand="block"
											disabled={loading}
											className="ion-margin-top"
										>
											{loading ? <IonSpinner name="crescent" /> : 'Continue'}
										</IonButton>
									</form>
								</>
							)}

							{mode === 'verify' && (
								<>
									{/* OTP Form */}
									<form onSubmit={handleOtpVerify}>
										<IonItem className="ion-margin-bottom">
											<IonLabel position="stacked">Verification Code</IonLabel>
											<IonInput
												type="text"
												value={otpCode}
												onIonInput={(e) => setOtpCode(e.detail.value!)}
												placeholder="Enter 6-digit code"
												maxlength={6}
												required
											/>
											{validationErrors.otp && (
												<IonText color="danger" style={{ fontSize: '12px' }}>
													{validationErrors.otp}
												</IonText>
											)}
										</IonItem>

										<IonButton
											type="submit"
											expand="block"
											disabled={loading}
											className="ion-margin-top"
										>
											{loading ? <IonSpinner name="crescent" /> : 'Verify Code'}
										</IonButton>
									</form>

									{/* Resend and back options */}
									<div className="ion-text-center ion-margin-top">
										<IonText color="medium">
											<p>
												Didn't receive a code?{' '}
												<button
													type="button"
													style={{ 
														background: 'none', 
														border: 'none', 
														color: 'var(--ion-color-primary)', 
														textDecoration: 'underline',
														cursor: 'pointer'
													}}
													onClick={handleResendCode}
													disabled={loading}
												>
													Resend
												</button>
											</p>
										</IonText>
									</div>

									<div className="ion-text-center ion-margin-top">
										<IonButton
											fill="clear"
											size="small"
											onClick={() => switchMode('email')}
											disabled={loading}
										>
											← Back to email
										</IonButton>
									</div>
								</>
							)}

							{/* Magic link info */}
							{mode === 'verify' && (
								<div className="ion-text-center ion-margin-top">
									<IonText color="medium">
										<small>
											You can also click the magic link in your email to sign in instantly.
										</small>
									</IonText>
								</div>
							)}
						</IonCardContent>
					</IonCard>
				</IonCol>
			</IonRow>
		</IonGrid>
	);
};

export default Auth;