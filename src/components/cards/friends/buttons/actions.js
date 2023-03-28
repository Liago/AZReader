
export const Actions = ({ onActionRequest, item }) => {
	return (
		<div className="flex flex-col gap-1">
		<button
			className="bg-green-800 py-1 px-3 text-sm font-medium text-gray-100 rounded"
			onClick={() => onActionRequest(item.id, true)}
		>
			Accetta
		</button>
		<button
			className="bg-red-800 py-1 px-3 text-sm font-medium text-gray-100 rounded"
			onClick={() => onActionRequest(item.id, false)}
		>
			Rifiuta
		</button>
		</div>
	)
}
