import { useForm } from "react-hook-form";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close } from "ionicons/icons";

import { signUpHandler } from '../../store/rest'
import { useEffect } from "react";



const AuthenticationForm = ({ onDismiss }) => {
	const { register, handleSubmit, watch, formState: { errors } } = useForm();
	const [signUp, {data: response, loading, error}] = signUpHandler();
	
	const onSubmit = data => {
		console.log(data);
		data['returnSecureToken'] = true;
		signUp(data)
	}

	useEffect(() => {
		if (!response) return;
		console.log('response :>> ', response);
	},[response])

	useEffect(() => {
		if (!error) return;

		console.log('errore API', error)
	},[error])

	// console.log(watch("email")); // watch input value by passing the name of it

	const renderForm = () => {
		return (
			<form onSubmit={handleSubmit(onSubmit)}>

				<div className="shadow overflow-hidden sm:rounded-md">
					<div className="px-4 py-5 bg-white sm:p-6">
						<div className="grid grid-cols-6 gap-6">
							<div className="col-span-6 sm:col-span-3">
								<label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
									email
								</label>
								<input
									type="email"
									name="first-name"
									id="first-name"
									autoComplete="given-name"
									className="bg-white border border-indigo-200 mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
									{...register("email", { required: true })}
								/>
							</div>

							<div className="col-span-6 sm:col-span-3">
								<label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
									password
								</label>
								<input
									type="password"
									name="last-name"
									id="last-name"
									autoComplete="family-name"
									className="bg-white border border-indigo-200 mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
									{...register("password", { required: true })}
								/>
							</div>
						</div>
					</div>
				</div>

				{errors.exampleRequired && <span>This field is required</span>}
				<button
					type="submit"
					className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Invia
				</button>
			</form>
		);
	}

	return (
		<IonContent>
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Post parser</IonTitle>
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