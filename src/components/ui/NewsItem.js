
const PostItem = ({ source, title, subtitle, date, imageUrl, excerpt, preview, published }) => {
	
	return (
		<div className="flex items-start w-full">
			<div className="flex-1 pr-3 min-w-0">
				<p className="text-xs font-montserrat text-gray-600">{source}</p>
				<h2
					className="font-lato text-lg font-black mt-1 leading-tight"
					dangerouslySetInnerHTML={{ __html: title }}></h2>
				<p
					className="font-open_sans text-xs text-gray-500 leading-snug mt-1 whitespace-normal break-words"
					dangerouslySetInnerHTML={{ __html: excerpt }}></p>
				{preview && <span className="text-xs font-medium text-gray-400 mt-1 block">PREVIEW</span>}
			</div>
			<div className="flex flex-col items-end gap-4">
				<span className="text-xs font-bold text-gray-400 mt-1">{published}</span>
				<img
					src={imageUrl}
					className="w-20 h-20 object-cover rounded"
					alt={title}
				/>
			</div>
		</div>
	);
};

export default PostItem