import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IonActionSheet, IonButton, IonIcon, IonPopover } from "@ionic/react";

import { textOutline } from "ionicons/icons";

import { RootState } from "@store/reducers";
import { decreaseFontSize, increaseFontSize } from "@store/actions";

export const FontSizeControls = () => {
	const [isOpen, setIsOpen] = useState(false);
	const dispatch = useDispatch();
	const fontSize = useSelector((state: RootState) => state.app.fontSize);

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
