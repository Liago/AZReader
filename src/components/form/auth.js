import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close } from "ionicons/icons";
import { useForm } from "react-hook-form";


const AuthenticationForm = () => {
	const { register, handleSubmit, watch, formState: { errors } } = useForm();
	const onSubmit = data => console.log(data);

	console.log(watch("example")); // watch input value by passing the name of it

	const renderForm = () => {
		return (
			<form onSubmit={handleSubmit(onSubmit)}>

				<input
					className="p-4"
					{...register("email", { required: true })}
				/>
				<input
					className="p-4"
					{...register("password", { required: true })}
				/>

				{errors.exampleRequired && <span>This field is required</span>}
				<input type="submit" />
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
							<IonButton>
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