import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close } from "ionicons/icons";
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { setUserToken } from "../../store/actions";
import { fetchSignUp, registerUser } from '../../store/rest'

import moment from 'moment';
import { userRegistration } from "../../common/firestore";



const AuthenticationForm = ({ onDismiss }) => {
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const [signMode, setSignMode] = useState('SIGNIN');
	const [userData, setUserData] = useState();
	const [signUpUser, { data: signUpResponse, error: signUpError }] = registerUser();

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
		if (signMode === 'SIGNUP') {
			userRegistration(data.email, data.password)
				.then(res => {
					console.log('res :>> ', res);
					dispatch(setUserToken(res));
					onDismiss();
				})
		}



		// data['returnSecureToken'] = true;
		// fetchSignUp(data, signMode).then((response) => {
		// 	if (!response.email) {
		// 		setError(response)
		// 	} else {
		// 		signMode === 'SIGNIN'
		// 			? saveUserInfo(response)
		// 			: signUpUser({ user: response.email })
		// 		onDismiss();
		// 	}
		// })
	}

	useEffect(() => {
		if (!signUpResponse) return;

		dispatch(setUserToken({
			user: {
				mail: userData.user,
				id: signUpResponse.name
			},
			token: userData.token
		}))
	}, [signUpResponse])

	const saveUserInfo = (response) => {
		const tokenExpiresAt = moment().add(response.expiresIn, 'seconds').unix();

		dispatch(setUserToken({
			user: {
				mail: response.email,
				id: response.idToken
			},
			token: response.idToken,
			expiration: tokenExpiresAt
		}))
	}


	const renderError = () => {
		if (!error) return;

		return <p>{error.message}</p>
	}

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
				{renderError()}
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