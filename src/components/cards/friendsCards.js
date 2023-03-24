export const FriendsCards = ({ nickname, email, onAskFriendship }) => {
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
				<div className="flex items-center space-x-6">
					<button
						onClick={onAskFriendship}
						className="bg-gray-800 pt-2 pr-6 pb-2 pl-6 text-lg font-medium text-gray-100 transition-all duration-200 hover:bg-gray-700 rounded-lg"
					>
						Chiedi
					</button>
				</div>
			</div>
		</div >
	)
}
