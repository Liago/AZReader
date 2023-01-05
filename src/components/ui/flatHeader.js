const FlatHeader = ({dismiss, title, platforms}) => {

	const height = () => {
		return platforms === 'android' ? 'h-12' : 'h-28'
	}

	return (
		<header className={`w-full shadow-lg bg-white items-center absolute ${height()} z-40`}>
			<div className="relative z-20 flex flex-col justify-end h-full px-3 pb-2 mx-auto flex-center">
				<div className="relative items-center pl-1 flex w-full lg:max-w-68 sm:pr-2 sm:ml-0">
					<div className="container relative left-0 z-50 flex w-3/4 h-full">
						<p className="font-bold text-2xl truncate">{title}</p>
					</div>
					<div className="relative p-1 flex items-center justify-end w-1/4 ml-5 mr-4 sm:mr-0 sm:right-auto">
						<button className="text-black" onClick={dismiss}>chiudi</button>
					</div>
				</div>
			</div>
		</header>
	)
}

export default FlatHeader;