import { IonItem, IonLabel, IonList, IonRadio, IonRadioGroup, IonToggle } from "@ionic/react"
import { useDispatch, useSelector } from "react-redux";
import { onSortingBy, onSortingDirection } from "../../store/actions";

import { debounce } from "lodash";

export const SortList = ({ setShowModal }) => {
	const dispatch = useDispatch();
	const { sort } = useSelector(state => state.app);

	const onChangeSort = (e) => {
		dispatch(onSortingBy(e.target.value))
		setShowModal(false)
	};
	const onChangeDirection = () => {
		dispatch(onSortingDirection(!sort.asc))
		setShowModal(false)
	};

	const debouncedOnChangeSort = debounce(onChangeSort, 750);
	const debouncedOnChangeDirection = debounce(onChangeDirection, 750);

	return (
		<>
			<IonList>
				<IonItem>
					<IonLabel>Ordinamento</IonLabel>
					ASC
					<IonToggle
						enableOnOffLabels={true}
						checked={!sort?.asc}
						onIonChange={debouncedOnChangeDirection}
					></IonToggle>
					DESC
				</IonItem>
			</IonList>
			<IonList inset={true}>
				<IonRadioGroup
					value={sort?.by}
					onIonChange={debouncedOnChangeSort}
				>
					<IonItem>
						<IonLabel>Data Pubblicazione</IonLabel>
						<IonRadio slot="end" value="date_published"></IonRadio>
					</IonItem>
					<IonItem>
						<IonLabel>Data Inserimento</IonLabel>
						<IonRadio slot="end" value="savedOn"></IonRadio>
					</IonItem>
				</IonRadioGroup>
			</IonList>
		</>
	)
}