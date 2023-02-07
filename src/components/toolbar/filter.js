import { IonItem, IonLabel, IonList, IonRadio, IonRadioGroup } from "@ionic/react"
import { debounce } from "lodash";

export const FilterList = ({ sortOption }) => {

	const onChange = (e) => sortOption(e.target.value);
	const debouncedOnChange = debounce(onChange, 500);

	return (
		<IonList inset={true}>
			<IonRadioGroup
				value="userEmail"
				onClick={debouncedOnChange}
			>
				<IonItem>
					<IonLabel>Fonte</IonLabel>
					<IonRadio slot="end" value="domain"></IonRadio>
				</IonItem>
				<IonItem>
					<IonLabel>Utente</IonLabel>
					<IonRadio slot="end" value="userEmail"></IonRadio>
				</IonItem>
			</IonRadioGroup>
		</IonList>
	)
}