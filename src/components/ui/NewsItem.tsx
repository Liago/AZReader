import React from 'react';
import { Heart, MessageCircle, Calendar } from 'lucide-react';

interface NewsItemProps {
	source: string;
	title: string;
	subtitle?: string;
	date?: string;
	imageUrl: string;
	excerpt: string;
	preview?: boolean | string;  // Accetta entrambi i tipi per retrocompatibilità
	published?: string;
	likes_count?: number;
	comments_count?: number;
	showEngagementMetrics?: boolean;
}

const NewsItem: React.FC<NewsItemProps> = ({
	source,
	title,
	subtitle,
	date,
	imageUrl,
	excerpt,
	preview = false,
	published,
	likes_count = 0,
	comments_count = 0,
	showEngagementMetrics = true
}) => {
	// Converti preview in boolean
	const isPreview = typeof preview === 'string'
		? preview === 'true'
		: Boolean(preview);

	return (
		<div className="flex items-start w-full group">
			<div className="flex-1 pr-4 min-w-0">
				<div className="flex items-center space-x-2 mb-2">
					<p className="text-xs font-medium text-black uppercase tracking-wide">{source}</p>
					{published && (
						<div className="flex items-center text-black/60">
							<Calendar size={12} className="mr-1" />
							<span className="text-xs">{published}</span>
						</div>
					)}
				</div>

				<h2
					className="font-bold text-base text-black leading-snug mb-2 transition-colors duration-200 group-hover:text-primary"
					dangerouslySetInnerHTML={{ __html: title }}
				/>

				<p
					className="text-xs text-black/70 leading-relaxed whitespace-normal break-words line-clamp-2"
					dangerouslySetInnerHTML={{ __html: excerpt }}
				/>

				{isPreview &&
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black mt-2">
						PREVIEW
					</span>
				}

				{showEngagementMetrics && (
					<div className="flex items-center gap-3 mt-3">
						<div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-white shadow-sm border border-gray-100">
							<Heart size={14} className="text-black mr-1.5 flex-shrink-0" />
							<span className="text-black leading-none">
								{likes_count}
							</span>
						</div>
						<div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-white shadow-sm border border-gray-100">
							<MessageCircle size={14} className="text-black mr-1.5 flex-shrink-0" />
							<span className="text-black leading-none">
								{comments_count}
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="flex-shrink-0">
				<div className="w-20 h-20 overflow-hidden rounded-lg shadow-sm transition-transform duration-200 group-hover:shadow-md">
					<img
						src={imageUrl}
						className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
						alt={title}
					/>
				</div>
			</div>
		</div>
	);
};

export default NewsItem; 