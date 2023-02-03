const MiniCards = ({ children }) => {
	return (
		<div className="flex items-start rounded-xl bg-white p-4 shadow-lg">
			<div className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
					<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
			<div className="ml-4">{children}</div>
		</div>
	)
}

export default MiniCards;