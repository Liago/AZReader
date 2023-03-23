import { IconAddUsers } from "../../icons"

const AddUserMenu = ({ addUsers }) => {
	return (
		<li className="border-t-2 border-red-500">
			<div target="_blank" className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
				<IconAddUsers className="h-6 w-6 text-red-500" />
				<span onClick={addUsers} className="text-sm">
					aggiungi utenti
				</span>
			</div>
		</li>
	)
}
export default AddUserMenu;
