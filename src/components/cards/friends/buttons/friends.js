import { IconLinked } from "../../../ui/icons/icon-linked"

export const FriendsButton = ({ onActionRequest, item }) => {
	return (
		<button
			className="py-1 px-3 text-red-800"
		>
			<IconLinked className="h-6 w-6" />
		</button>
	)
}
