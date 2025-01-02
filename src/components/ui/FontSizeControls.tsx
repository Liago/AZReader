import { useState } from "react";
import { useDispatch } from "react-redux";
import { IonActionSheet, IonButton, IonIcon } from "@ionic/react";

import { textOutline } from "ionicons/icons";

export const FontSizeControls = () => {
	const [isOpen, setIsOpen] = useState(false);
	const dispatch = useDispatch();
	// const fontSize = useSelector((state: RootState) => state.app.fontSize);

	return (
		<>
			<IonActionSheet
				isOpen={isOpen}
				onDidDismiss={() => setIsOpen(false)}
				buttons={[
					{
						text: "Diminuisci carattere",
						handler: () => {
							dispatch({ type: "DECREASE_FONT_SIZE" });
						},
					},
					{
						text: "Aumenta carattere",
						handler: () => {
							dispatch({ type: "INCREASE_FONT_SIZE" });
						},
					},
					{
						text: "Cancel",
						role: "cancel",
					},
				]}
			/>

			<IonButton fill="clear" onClick={() => setIsOpen(true)}>
				<IonIcon icon={textOutline} className="w-6 h-6 text-gray-700" />
			</IonButton>
		</>
	);
};

export default FontSizeControls;
