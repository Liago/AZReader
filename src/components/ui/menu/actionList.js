import { useSelector } from "react-redux";
import { IconAllElements, IconList } from "../icons";
import IconUsers from "../icons/icon-users";

import { isEmpty } from "lodash";


const ActionList = ({ onSetFeedHandler, renderAddUserMenuItem, user, addUsers, onSearchFriends }) => {
	const { sharing } = useSelector(state => state.user);

	const requestSharingBadge = () => {
		if (isEmpty(sharing)) return;

		return <div className="text-xs font-semibold bg-green-500 py-1 px-2 rounded text-white">Nuovo!</div>
	}


	return (
		<aside className="w-64" aria-label="Sidebar">
			<div className="px-3 py-4 overflow-y-auto rounded bg-gray-50">
				<ul className="space-y-2 font-[lato]">
					<li>
						<div className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
							<IconAllElements className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
							<span
								className="text-sm"
								onClick={() => onSetFeedHandler('Personal')}
							>
								I miei articoli
							</span>
						</div>
					</li>
					<li>
						<div target="_blank" className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
							<IconList className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
							<span
								className="text-sm"
								onClick={() => onSetFeedHandler('All')}
							>
								Tutti gli articoli
							</span>
						</div>
					</li>
					<li>
						<div target="_blank" className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
							<IconUsers className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
							<span
								className="text-sm"
								onClick={onSearchFriends}
							>
								Cerca amici
							</span>
							{requestSharingBadge()}
						</div>

					</li>
					{renderAddUserMenuItem(user, addUsers)}
				</ul>
			</div>
		</aside>
	)
}
export default ActionList;
