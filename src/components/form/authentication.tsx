import React, { useState, useEffect } from "react";

import { supabase } from "../../store/rest";

import { useCustomToast } from "../../hooks/useIonToast";

export const Auth: React.FC = () => {
	const showToast = useCustomToast();
	const [loading, setLoading] = useState<boolean>(false);
	const [email, setEmail] = useState<string>("");
	const [otpSent, setOtpSent] = useState<boolean>(false);
	const [otp, setOtp] = useState<string>("");
	const [cooldown, setCooldown] = useState<number>(0);

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
		if (cooldown > 0) {
			showToast({
				message: `Please wait ${cooldown} seconds before requesting a new code`,
				color: "danger",
			});
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
					showToast({
						message: `Too many requests. Please try again later`,
						color: "danger",
					});
					setCooldown(60); // Set a 60-second cooldown
				} else {
					throw error;
				}
			} else {
				setOtpSent(true);
				setCooldown(60); // Set a 60-second cooldown after successful send
				showToast({
					message: `Check your email for the login code!`,
					color: "danger",
				});
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				showToast({
					message: error.message,
					color: "danger",
				});
			} else {
				showToast({
					message: `An unknown error occurred!`,
					color: "danger",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setLoading(true);
			const { error } = await supabase.auth.verifyOtp({
				email,
				token: otp,
				type: "email",
			});
			if (error) throw error;
			showToast({
				message: `Successfully logged in!`,
				color: "success",
			});
			// Here you might want to redirect the user or update the app state
		} catch (error: unknown) {
			if (error instanceof Error) {
				showToast({
					message: error.message,
					color: "danger",
				});
			} else {
				showToast({
					message: `An unknown error occurred!`,
					color: "danger",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{otpSent ? "Enter OTP" : "Sign in to your account"}</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{!otpSent ? (
						<form className="space-y-6" onSubmit={handleSendOtp}>
							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700">
									Email address
								</label>
								<div className="mt-1">
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									/>
								</div>
							</div>

							<div>
								<button
									type="submit"
									disabled={loading || cooldown > 0}
									className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
										loading || cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
									}`}
								>
									{loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send login code"}
								</button>
							</div>
						</form>
					) : (
						<form className="space-y-6" onSubmit={handleVerifyOtp}>
							<div>
								<label htmlFor="otp" className="block text-sm font-medium text-gray-700">
									Enter OTP
								</label>
								<div className="mt-1">
									<input
										id="otp"
										name="otp"
										type="text"
										required
										value={otp}
										onChange={(e) => setOtp(e.target.value)}
										className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									/>
								</div>
							</div>

							<div>
								<button
									type="submit"
									disabled={loading}
									className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
										loading ? "opacity-50 cursor-not-allowed" : ""
									}`}
								>
									{loading ? "Verifying..." : "Verify OTP"}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};

interface User {
	id: string;
	email?: string;
	// Aggiungi qui altre proprietà dell'utente se necessario
}

interface Session {
	user: User;
}

interface AccountProps {
	session: Session;
}

export const Account: React.FC<AccountProps> = ({ session }) => {
	const [loading, setLoading] = useState<boolean>(true);
	const [username, setUsername] = useState<string | null>(null);
	const showToast = useCustomToast();

	useEffect(() => {
		getProfile();
	}, [session]);

	const getProfile = async () => {
		try {
			setLoading(true);
			const { user } = session;

			let { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single();

			if (error) {
				if (error.code === "PGRST204") {
					// Profilo non trovato, lo creiamo
					const { data: newProfile, error: insertError } = await supabase
						.from("profiles")
						.insert({ id: user.id, username: user?.email?.split("@")[0] })
						.single();

					if (insertError) throw insertError;
					data = newProfile;
				} else {
					throw error;
				}
			}

			setUsername(data?.username || user?.email?.split("@")[0]);
		} catch (error) {
			console.error("Error fetching profile:", error);
			showToast({
				message: "Error fetching profile. Please try again",
				color: "danger",
			});
		} finally {
			setLoading(false);
		}
	};

	const updateProfile = async ({ username }: { username: string }) => {
		try {
			setLoading(true);
			const { user } = session;

			const updates = {
				id: user.id,
				username,
				updated_at: new Date().toISOString(),
			};

			let { error } = await supabase.from("profiles").upsert(updates);

			if (error) throw error;
			setUsername(username);
		} catch (error) {
			console.error("Error updating profile:", error);
			showToast({
				message: "Error updating profile. Please try again.",
				color: "danger",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto mt-10 bg-white shadow-md rounded-lg p-6">
			<div className="mb-4">
				<label htmlFor="username" className="block text-sm font-medium text-gray-700">
					Name
				</label>
				<input
					id="username"
					type="text"
					value={username || ""}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
					className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				/>
			</div>
			<div className="flex justify-between">
				<button
					onClick={() => username && updateProfile({ username })}
					disabled={loading}
					className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
						loading ? "opacity-50 cursor-not-allowed" : ""
					}`}
				>
					{loading ? "Loading ..." : "Update"}
				</button>
				<button
					onClick={() => supabase.auth.signOut()}
					className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
				>
					Sign Out
				</button>
			</div>
		</div>
	);
};
