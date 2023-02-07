export const Button = ({ clickHandler, label }) => {
	return (
		<button
			className="rounded-md mx-1 bg-indigo-600 px-2 py-1 text-xs font-semibold  text-white shadow-sm"
			onClick={clickHandler}
		>
			{label}
		</button>
	)
}