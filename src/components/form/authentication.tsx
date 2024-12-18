import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "../../store/rest";
import { useCustomToast } from "../../hooks/useIonToast";

export const Auth: React.FC = () => {
	const showToast = useCustomToast();
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [otp, setOtp] = useState("");
	const [cooldown, setCooldown] = useState(0);
	const [error, setError] = useState("");

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (cooldown > 0) {
			interval = setInterval(() => {
				setCooldown((prev) => prev - 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [cooldown]);

	const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (cooldown > 0) {
			setError(`Please wait ${cooldown} seconds before requesting a new code`);
			return;
		}

		try {
			setLoading(true);
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: "https://example.com/welcome",
				},
			});

			if (error) {
				if (error.message.includes("rate limit")) {
					setError("Too many requests. Please try again later");
					setCooldown(60);
				} else {
					throw error;
				}
			} else {
				setOtpSent(true);
				setCooldown(60);
				showToast({
					message: "Check your email for the login code!",
					color: "success",
				});
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "An unknown error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		try {
			setLoading(true);
			const { error } = await supabase.auth.verifyOtp({
				email,
				token: otp,
				type: "email",
			});

			if (error) throw error;
			showToast({
				message: "Successfully logged in!",
				color: "success",
			});
		} catch (error) {
			setError(error instanceof Error ? error.message : "An unknown error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="h-full bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
						<Mail className="h-6 w-6 text-indigo-600" />
					</div>
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">{otpSent ? "Enter verification code" : "Welcome back"}</h2>
					<p className="mt-2 text-sm text-gray-600">
						{otpSent ? "Check your email for the verification code" : "Enter your email to receive a one-time password"}
					</p>
				</div>

				{!otpSent ? (
					<form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium text-gray-700">
								Email address
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={`appearance-none relative block w-full px-4 py-3 border ${
									error ? "border-red-300" : "border-gray-300"
								} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors`}
								placeholder="name@example.com"
							/>
							{error && <p className="text-sm text-red-600 mt-1">{error}</p>}
						</div>
						<button
							type="submit"
							disabled={loading || cooldown > 0}
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : cooldown > 0 ? (
								`Resend in ${cooldown}s`
							) : (
								<>
									Send OTP Code
									<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</>
							)}
						</button>
					</form>
				) : (
					<form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
						<div className="space-y-2">
							<label htmlFor="otp" className="text-sm font-medium text-gray-700">
								Verification code
							</label>
							<input
								id="otp"
								type="text"
								required
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								className={`appearance-none relative block w-full px-4 py-3 border ${
									error ? "border-red-300" : "border-gray-300"
								} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors`}
								placeholder="Enter code"
							/>
							{error && <p className="text-sm text-red-600 mt-1">{error}</p>}
						</div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<>
									Verify Code
									<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</>
							)}
						</button>
					</form>
				)}

				<div className="mt-6 text-center">
					<p className="text-xs text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
				</div>
			</div>
		</div>
	);
};

export default Auth;
