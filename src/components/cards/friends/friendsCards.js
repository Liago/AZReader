import { Actions } from './buttons/actions';
import { filter, isEmpty, isNil } from "lodash";
import { useSelector } from "react-redux";
import { IconQuestion } from "../../ui/icons/icon-question";
import { FriendsButton } from './buttons/friends';
import { IconMail } from '../../ui/icons/icon-mail';

export const FriendsCards = ({ nickname, email, uuid, onAskFriendship, onActionRequest }) => {
	const { sharing, request } = useSelector(state => state.user);
	const { user: currentUser } = useSelector(state => state.user?.credentials);

	const friendButton = () => {

		console.log('user :>> ', email);
		let isRequestFromMe = filter(sharing, item => item.requestFrom.uuid === uuid)
		console.log('isRequestFromMe :>> ', isRequestFromMe);
		
		let isRequestToMe = filter(request, item => item.requestTo.uuid === currentUser.id)
		console.log('isRequestToMe :>> ', isRequestToMe);
console.log('=========');








		if (isEmpty(sharing) && isEmpty(request))
			return (
				<button
					onClick={() => onAskFriendship(email, uuid)}
					className="py-1 px-3 text-gray-500"
				>
					<IconMail className="h-6 w-6 text-gray-500" />
				</button>
			)


		console.log('What I have in share to/from :>> ', {
			requestFromMe: request,
			requestToMe: sharing
		});


		let _isRequestFromMe = filter(sharing, item => item.requestFrom.uuid === uuid)
		let _isRequestToMe = filter(request, item => item.requestTo.uuid === currentUser.id)
		// console.log('isRequestFromMe :>> ', isRequestFromMe);
		// console.log('isRequestToMe :>> ', isRequestToMe);


		if (!isEmpty(isRequestFromMe))
			return (
				sharing.map(item => {
					if (item.requestFrom.uuid !== uuid)
						return (
							<button
								key={item.sentOn}
								onClick={() => onAskFriendship(email, uuid)}
								className="py-1 px-3"
							>
								<IconMail className="h-6 w-6 text-gray-500" />
							</button>
						)

					console.log('item.status :>> ', item.status);


					if (item.status)
						return <FriendsButton key={item.sentOn} />

					if (isNil(item.status))
						return <Actions
							key={item.sentOn}
							item={item}
							onActionRequest={onActionRequest}
						/>


				})
			)



		return !isEmpty(isRequestToMe)
			? (
				request.map(item => {
					if (!item.status && item.requestTo.uuid === uuid) {
						return <IconQuestion className="h-6 w-6 text-yellow-500" />

					} else if (item.status && item.requestFrom.uuid === uuid) {
						return <FriendsButton key={item.sentOn} />
					}


					// return (
					// 	<button
					// 		key={item.sentOn}
					// 		onClick={() => onAskFriendship(email, uuid)}
					// 		className="py-1 px-3"
					// 	>
					// 		<IconMail className="h-6 w-6 text-gray-500" />
					// 	</button>
					// )
				})
			)
			: (
				<button
					onClick={() => onAskFriendship(email, uuid)}
					className="py-1 px-3"
				>
					<IconMail className="h-6 w-6 text-gray-500" />
				</button>
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
