import { IonSpinner } from "@ionic/react";

const LoadingSpinner = () => {
	return (
		<div className="flex absolute center-custom justify-center items-center bg-white bg-opacity-70">
			<IonSpinner name="circular" />
		</div>
	);
};

export default LoadingSpinner;
