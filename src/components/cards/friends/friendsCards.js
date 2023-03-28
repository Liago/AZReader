import { Actions } from './buttons/actions';
import { isEmpty } from "lodash";
import { useSelector } from "react-redux";
import { IconQuestion } from "../../ui/icons/icon-question";
import { FriendsButton } from './buttons/friends';
import { IconMail } from '../../ui/icons/icon-mail';

export const FriendsCards = ({ nickname, email, uuid, onAskFriendship, onActionRequest }) => {
	const { sharing, request } = useSelector(state => state.user);

	const friendButton = () => {
		if (isEmpty(sharing) && isEmpty(request))
			return (
				<button
					onClick={() => onAskFriendship(email, uuid)}
					className="py-1 px-3 text-gray-500"
				>
					<IconMail className="h-6 w-6 text-gray-500" />
				</button>
			)

		if (request && isEmpty(sharing))
			return (
				<button
					onClick={() => onAskFriendship(email, uuid)}
					className="py-1 px-3 text-gray-500"
				>
					<IconQuestion className="h-6 w-6 text-gray-500" />
				</button>
			)



		return (
			sharing.map(item => {
				console.log('item :>> ', item);
				if (!item.status && item.requestBy.uuid === uuid) {
					return (
						<Actions
							key={item.sentOn}
							item={item}
							onActionRequest={onActionRequest}
						/>
					)
				} else if (item.status && item.requestBy.uuid === uuid) {
					return (
						<FriendsButton
							key={item.sentOn}
						/>
					)

				}


				return (
					<button
						key={item.sentOn}
						onClick={() => onAskFriendship(email, uuid)}
						className="py-1 px-3"
					>
						<IconQuestion className="h-6 w-6 text-gray-500" />
					</button>
				)
			})
		)
	}


	return (
		<div className="mx-2 p-2 border rounded-sm shadow ">
			<div className="flex items-center justify-between space-x-5">
				<div className="flex items-center flex-1 min-w-0">
					{
						/* <img
						src="https://d34u8crftukxnk.cloudfront.net/slackpress/prod/sites/6/SlackLogo_CompanyNews_SecondaryAubergine_Hero.jpg?d=500x500&amp;f=fill" className="flex-shrink-0 object-cover rounded-full btn- w-10 h-10" /> */
					}
					<div className="">
						<p className="text-lg font-bold text-gray-800 ">{nickname}</p>
						<p className="text-gray-600 text-md">{email}</p>
					</div>
				</div>
				<div className="flex items-center space-x-6">{friendButton()}</div>
			</div>
		</div >
	)
}
