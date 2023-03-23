import { IconAllElements, IconList } from "../icons";

const ActionList = ({ onSetFeedHandler, renderAddUserMenuItem, user, addUsers }) => {
	return (
		<aside className="w-64" aria-label="Sidebar">
			<div className="px-3 py-4 overflow-y-auto rounded bg-gray-50">
				<ul className="space-y-2 font-[lato]">
					<li>
						<div className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
							<IconAllElements className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
							<span className="text-sm" onClick={() => onSetFeedHandler('Personal')}>I miei articoli</span>
						</div>
					</li>
					<li>
						<div target="_blank" className="flex gap-3 items-center p-2 text-base font-normal text-gray-900 rounded-lg">
							<IconList className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
							<span onClick={() => onSetFeedHandler('All')} className="text-sm">
								Tutti gli articoli</span>
						</div>
					</li>
					{renderAddUserMenuItem(user, addUsers)}
				</ul>
			</div>
		</aside>
	)
}
export default ActionList;
