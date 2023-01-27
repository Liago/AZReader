import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonToast } from "@ionic/react";
import { close } from "ionicons/icons";
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { setUserToken } from "../../store/actions";

import moment from 'moment';
import { userLogin, userRegistration } from "../../common/firestore";



const AuthenticationForm = ({ onDismiss }) => {
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const [signMode, setSignMode] = useState('SIGNIN');
	const [showToast, dismissToast] = useIonToast();

	const validationSchema = Yup.object().shape({
		password: Yup.string()
			.required('Password is required')
			.min(6, 'Password must be at least 6 characters'),
		confirmPassword: Yup.string()
			.required('Confirm Password is required')
			.oneOf([Yup.ref('password')], 'Passwords must match')

	});
	const formOptions = { resolver: yupResolver(validationSchema) };
	const { register, handleSubmit, formState: { errors } } = useForm(signMode === 'SIGNUP' && formOptions);

	const onSubmit = data => {
		const { email, password } = data;

		if (signMode === 'SIGNUP') {
			userRegistration(email, password)
				.then(response => onDismiss(response))
		} else {
			userLogin(email, password)
				.then(response => {
					console.log('response', response)
					if (!response.success) setError(response.code)

					saveUserInfo(response.data)
					onDismiss();
				})
		}
	}

	const saveUserInfo = (response) => {
		const tokenExpiresAt = moment().add(response.stsTokenManager.expirationTime, 'seconds').unix();

		dispatch(setUserToken({
			user: {
				mail: response.email,
				id: response.uid,
				meta: response.metadata
			},
			token: response.stsTokenManager.accessToken,
			expiration: tokenExpiresAt
		}))
	}

	useEffect(() => {
		if (!error) return;

		let _error = error.replace('auth/wrong-password', 'utenza o password errata')

		showToast({
			message: _error,
			color: "danger",
			duration: 5000,
			onDidDismiss: () => dismissToast
		})


	}, [error])

	const switchSigningMode = () => {
		signMode === 'SIGNIN'
			? setSignMode('SIGNUP')
			: setSignMode('SIGNIN')
	}

	const renderPassowrdCheck = () => {
		if (signMode === 'SIGNIN') return;

		return (
			<div className="col-span-6 sm:col-span-3">
				<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
					Confirm your password
				</label>
				<input
					type="password"
					name="confirmPassword"
					id="confirmPassword"
					autoComplete="confirmPassword"
					className="bg-white border border-indigo-200 mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"
					{...register("confirmPassword", { required: true })}
				/>
				<div className="text-xs text-red-500 font-bold">{errors.confirmPassword?.message}</div>
			</div>
		)
	}

	const renderForm = () => {
		return (
			<form onSubmit={handleSubmit(onSubmit)}>

				<div className="overflow-hidden sm:rounded-md p-3">
					<div className="px-4 py-5 bg-white sm:p-6">
						<div className="grid grid-cols-6 gap-6">
							<div className="col-span-6 sm:col-span-3">
								<label htmlFor="email" className="block text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									type="email"
									name="email"
									id="email"
									autoComplete="email"
									className="bg-white border border-indigo-200 mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"
									{...register("email", { required: true })}
								/>
							</div>

							<div className="col-span-6 sm:col-span-3">
								<label htmlFor="password" className="block text-sm font-medium text-gray-700">
									Password
								</label>
								<input
									type="password"
									name="password"
									id="password"
									autoComplete="password"
									className="bg-white border border-indigo-200 mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2"
									{...register("password", { required: true })}
								/>
								<div className="text-xs text-red-500 font-bold">{errors.password?.message}</div>
							</div>
							{renderPassowrdCheck()}
						</div>
					</div>
				</div>

				{errors.exampleRequired && <span>This field is required</span>}

				<div className="p-4 text-center">
					<button
						type="submit"
						className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						{signMode === 'SIGNIN' ? 'Login' : 'Invia'}
					</button>
				</div>
				<div className="p-4 text-center">
					<button
						type="button"
						className="text-sm text-slate-800"
						onClick={switchSigningMode}
					>
						Crea nuovo account
					</button>
				</div>
			</form>
		);
	}

	/*
	<div class="flex justify-center self-center  z-10">
				<div class="p-12 bg-white mx-auto rounded-3xl w-96 ">
					<div class="mb-7">
						<h3 class="font-semibold text-2xl text-gray-800">Sign In </h3>
						<p class="text-gray-400">Don'thave an account? <a href="#"
							class="text-sm text-purple-700 hover:text-purple-700">Sign Up</a></p>
					</div>
					<div class="space-y-6">
						<div class="">
							<input class=" w-full text-sm  px-4 py-3 bg-gray-200 focus:bg-gray-100 border  border-gray-200 rounded-lg focus:outline-none focus:border-purple-400" type="" placeholder="Email" />
						</div>


						<div class="relative" x-data="{ show: true }">
							<input placeholder="Password" class="text-sm text-gray-200 px-4 py-3 rounded-lg w-full bg-gray-200 focus:bg-gray-100 border border-gray-200 focus:outline-none focus:border-purple-400" />
							<div class="flex items-center absolute inset-y-0 right-0 mr-3  text-sm leading-5">

								<svg
									class="h-4 text-purple-700" fill="none" xmlns="http://www.w3.org/2000/svg"
									viewbox="0 0 576 512">
									<path fill="currentColor"
										d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z">
									</path>
								</svg>

								<svg
									class="h-4 text-purple-700" fill="none" xmlns="http://www.w3.org/2000/svg"
									viewbox="0 0 640 512">
									<path fill="currentColor"
										d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z">
									</path>
								</svg>

							</div>
						</div>


						<div class="flex items-center justify-between">

							<div class="text-sm ml-auto">
								<a href="#" class="text-purple-700 hover:text-purple-600">
									Forgot your password?
								</a>
							</div>
						</div>
						<div>
							<button type="submit" class="w-full flex justify-center bg-purple-800  hover:bg-purple-700 text-gray-100 p-3  rounded-lg tracking-wide font-semibold  cursor-pointer transition ease-in duration-500">
								Sign in
							</button>
						</div>
						<div class="flex items-center justify-center space-x-2 my-5">
							<span class="h-px w-16 bg-gray-100"></span>
							<span class="text-gray-300 font-normal">or</span>
							<span class="h-px w-16 bg-gray-100"></span>
						</div>
						<div class="flex justify-center gap-5 w-full ">

							<button type="submit" class="w-full flex items-center justify-center mb-6 md:mb-0 border border-gray-300 hover:border-gray-900 hover:bg-gray-900 text-sm text-gray-500 p-3  rounded-lg tracking-wide font-medium  cursor-pointer transition ease-in duration-500">
								<svg class="w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" /><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" /><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" /><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" /></svg>
								<span>Google</span>
							</button>

						</div>
					</div>
				</div>
			</div>
	*/

	return (
		<IonContent>
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Authentication</IonTitle>
						<IonButtons slot="end">
							<IonButton
								onClick={onDismiss}
							>
								<IonIcon slot="icon-only" icon={close} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen>
					{renderForm()}
				</IonContent>
			</IonPage>
		</IonContent>
	)
}
export default AuthenticationForm;