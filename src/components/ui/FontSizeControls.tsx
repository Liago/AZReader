import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IonButton, IonIcon, IonPopover } from "@ionic/react";

import { textOutline } from "ionicons/icons";

import { RootState } from "@store/reducers";
import { decreaseFontSize, increaseFontSize } from "@store/actions";

const FontSizeControls = () => {
	const [popoverOpen, setPopoverOpen] = useState(false);
	const dispatch = useDispatch();
	const fontSize = useSelector((state: RootState) => state.app.fontSize);

	return (
		<>
			<IonPopover isOpen={popoverOpen} onDidDismiss={() => setPopoverOpen(false)} className="p-2">
				<div className="flex items-center space-x-3 p-2">
					<button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => dispatch(decreaseFontSize())}>
						A-
					</button>
					<span className="text-sm text-gray-600">{fontSize}</span>
					<button onClick={() => dispatch(increaseFontSize())} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
						A+
					</button>
				</div>
			</IonPopover>

			<IonButton fill="clear" onClick={() => setPopoverOpen(true)}>
				<IonIcon icon={textOutline} className="w-6 h-6 text-gray-700" />
			</IonButton>
		</>
	);
};

export default FontSizeControls;