import React, { useState } from "react";
import { IonButton, IonInput, IonItem, IonLabel, IonText, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonGrid, IonRow, IonCol, IonCheckbox } from "@ionic/react";
import { mail, eye, eyeOff, logoGoogle, logoApple, logoTwitter, person, lockClosed } from "ionicons/icons";

import { useCustomToast } from "@hooks/useIonToast";
import { useAuth } from "@context/auth/AuthContext";

interface AuthProps {
	initialMode?: 'login' | 'register';
}

export const Auth: React.FC<AuthProps> = ({ initialMode = 'login' }) => {
	const showToast = useCustomToast();
	const { signUp, signIn, signInWithGoogle, signInWithApple, signInWithTwitter, resetPassword, loading, error, clearError } = useAuth();
	
	const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [name, setName] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

	// Clear auth errors when switching modes
	const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
		setMode(newMode);
		setValidationErrors({});
		clearError();
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setName('');
		setAcceptTerms(false);
	};

	// Form validation
	const validateForm = (): boolean => {
		const errors: { [key: string]: string } = {};

		// Email validation
		if (!email) {
			errors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.email = 'Email address is invalid';
		}

		// Password validation for login and register
		if (mode !== 'forgot') {
			if (!password) {
				errors.password = 'Password is required';
			} else if (password.length < 6) {
				errors.password = 'Password must be at least 6 characters';
			}
		}

		// Additional validation for registration
		if (mode === 'register') {
			if (!name) {
				errors.name = 'Name is required';
			}
			if (!confirmPassword) {
				errors.confirmPassword = 'Please confirm your password';
			} else if (password !== confirmPassword) {
				errors.confirmPassword = 'Passwords do not match';
			}
			if (!acceptTerms) {
				errors.terms = 'You must accept the terms and conditions';
			}
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Handle login
	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		clearError();
		
		if (!validateForm()) return;

		try {
			const { error } = await signIn(email, password);
			if (!error) {
				showToast({
					message: 'Successfully logged in!',
					color: 'success',
				});
			}
		} catch (err) {
			console.error('Login error:', err);
		}
	};

	// Handle registration
	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		clearError();
		
		if (!validateForm()) return;

		try {
			const { error } = await signUp(email, password, { name });
			if (!error) {
				showToast({
					message: 'Registration successful! Please check your email to verify your account.',
					color: 'success',
				});
				// Switch to login mode after successful registration
				switchMode('login');
			}
		} catch (err) {
			console.error('Registration error:', err);
		}
	};

	// Handle forgot password
	const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		clearError();
		
		if (!validateForm()) return;

		try {
			const { error } = await resetPassword(email);
			if (!error) {
				showToast({
					message: 'Password reset email sent! Please check your email.',
					color: 'success',
				});
				switchMode('login');
			}
		} catch (err) {
			console.error('Password reset error:', err);
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
			}
			
			if (result && !result.error) {
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
			case 'login': return 'Welcome back';
			case 'register': return 'Create account';
			case 'forgot': return 'Reset password';
		}
	};

	const getSubtitle = () => {
		switch (mode) {
			case 'login': return 'Sign in to your account';
			case 'register': return 'Create a new account to get started';
			case 'forgot': return 'Enter your email to receive a password reset link';
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
									icon={mode === 'register' ? person : mail}
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

							{/* OAuth Buttons */}
							{mode !== 'forgot' && (
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
							)}

							{/* Email/Password Form */}
							<form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}>
								{/* Name Field (Register Only) */}
								{mode === 'register' && (
									<IonItem className="ion-margin-bottom">
										<IonLabel position="stacked">Full Name</IonLabel>
										<IonInput
											type="text"
											value={name}
											onIonInput={(e) => setName(e.detail.value!)}
											placeholder="Enter your full name"
											required
										/>
									</IonItem>
								)}
								{validationErrors.name && (
									<IonText color="danger">
										<small>{validationErrors.name}</small>
									</IonText>
								)}

								{/* Email Field */}
								<IonItem className="ion-margin-bottom">
									<IonLabel position="stacked">Email</IonLabel>
									<IonInput
										type="email"
										value={email}
										onIonInput={(e) => setEmail(e.detail.value!)}
										placeholder="Enter your email"
										required
									/>
									<IonIcon icon={mail} slot="end" color="medium" />
								</IonItem>
								{validationErrors.email && (
									<IonText color="danger">
										<small>{validationErrors.email}</small>
									</IonText>
								)}

								{/* Password Fields */}
								{mode !== 'forgot' && (
									<>
										<IonItem className="ion-margin-bottom">
											<IonLabel position="stacked">Password</IonLabel>
											<IonInput
												type={showPassword ? 'text' : 'password'}
												value={password}
												onIonInput={(e) => setPassword(e.detail.value!)}
												placeholder="Enter your password"
												required
											/>
											<IonIcon
												icon={showPassword ? eyeOff : eye}
												slot="end"
												color="medium"
												onClick={() => setShowPassword(!showPassword)}
												style={{ cursor: 'pointer' }}
											/>
										</IonItem>
										{validationErrors.password && (
											<IonText color="danger">
												<small>{validationErrors.password}</small>
											</IonText>
										)}

										{/* Confirm Password (Register Only) */}
										{mode === 'register' && (
											<>
												<IonItem className="ion-margin-bottom">
													<IonLabel position="stacked">Confirm Password</IonLabel>
													<IonInput
														type={showConfirmPassword ? 'text' : 'password'}
														value={confirmPassword}
														onIonInput={(e) => setConfirmPassword(e.detail.value!)}
														placeholder="Confirm your password"
														required
													/>
													<IonIcon
														icon={showConfirmPassword ? eyeOff : eye}
														slot="end"
														color="medium"
														onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														style={{ cursor: 'pointer' }}
													/>
												</IonItem>
												{validationErrors.confirmPassword && (
													<IonText color="danger">
														<small>{validationErrors.confirmPassword}</small>
													</IonText>
												)}

												{/* Terms Acceptance */}
												<IonItem lines="none" className="ion-margin-bottom">
													<IonCheckbox
														checked={acceptTerms}
														onIonChange={e => setAcceptTerms(e.detail.checked)}
														slot="start"
													/>
													<IonLabel className="ion-text-wrap">
														<small>I accept the Terms of Service and Privacy Policy</small>
													</IonLabel>
												</IonItem>
												{validationErrors.terms && (
													<IonText color="danger">
														<small>{validationErrors.terms}</small>
													</IonText>
												)}
											</>
										)}
									</>
								)}

								{/* Submit Button */}
								<IonButton
									type="submit"
									expand="block"
									className="ion-margin-top"
									disabled={loading}
								>
									{loading ? (
										<IonSpinner name="crescent" />
									) : (
										<>
											<IonIcon icon={mode === 'register' ? person : mode === 'forgot' ? mail : lockClosed} slot="start" />
											{mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Email'}
										</>
									)}
								</IonButton>
							</form>

							{/* Mode Switch Links */}
							<div className="ion-text-center ion-margin-top">
								{mode === 'login' && (
									<>
										<IonText color="medium">
											<small>Don't have an account? </small>
										</IonText>
										<IonText color="primary" onClick={() => switchMode('register')} style={{ cursor: 'pointer' }}>
											<small><strong>Sign up</strong></small>
										</IonText>
										<br />
										<IonText color="medium" onClick={() => switchMode('forgot')} style={{ cursor: 'pointer' }}>
											<small>Forgot your password?</small>
										</IonText>
									</>
								)}

								{mode === 'register' && (
									<>
										<IonText color="medium">
											<small>Already have an account? </small>
										</IonText>
										<IonText color="primary" onClick={() => switchMode('login')} style={{ cursor: 'pointer' }}>
											<small><strong>Sign in</strong></small>
										</IonText>
									</>
								)}

								{mode === 'forgot' && (
									<>
										<IonText color="medium">
											<small>Remember your password? </small>
										</IonText>
										<IonText color="primary" onClick={() => switchMode('login')} style={{ cursor: 'pointer' }}>
											<small><strong>Sign in</strong></small>
										</IonText>
									</>
								)}
							</div>
						</IonCardContent>
					</IonCard>
				</IonCol>
			</IonRow>
		</IonGrid>
	);
};

export default Auth;
