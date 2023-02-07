import { useState } from "react";
import { IonButtons } from "@ionic/react"

import { SheetModal } from "../modals/sheetModal"
import { Button } from "../ui/buttons"
import { SortList } from "./sort";
import { FilterList } from "./filter";

export const FilterAndSort = () => {
	const [showModal, setShowModal] = useState(false);
	const [filter, setFilter] = useState(null);

	const onFilter = () => {
		setShowModal(true)
		setFilter('filter');
	}

	const onSort = () => {
		setShowModal(true)
		setFilter('sort');
	}

	const onFilterOption = (value) => {
		console.log('filter :>> ', value);
	}

	const renderContent = () => {
		return filter === 'sort'
			? <SortList setShowModal={setShowModal} />
			: <FilterList sortOption={onFilterOption} />
	}

	return (
		<>
			<IonButtons>
				<Button
					clickHandler={onSort}
					label="Sort"
				/>
				<Button
					clickHandler={onFilter}
					label="Filter"
				/>
			</IonButtons>
			<SheetModal
				showModal={showModal}
				setShowModal={setShowModal}
				id="filter-modal"
			>
				{renderContent()}
			</SheetModal>
		</>
	)
}