import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

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
    <div className="flex items-start w-full">
      <div className="flex-1 pr-3 min-w-0">
        <p className="text-xs font-montserrat uppercase text-gray-600">{source}</p>
        <h2
          className="font-lato text-lg font-black mt-1 leading-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p
          className="font-open_sans text-xs text-gray-500 leading-snug mt-1 whitespace-normal break-words"
          dangerouslySetInnerHTML={{ __html: excerpt }}
        />
        {isPreview && <span className="text-xs font-medium text-gray-400 mt-1 block">PREVIEW</span>}
        
        {showEngagementMetrics && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Heart size={16} className="text-red-500" />
              <span className="text-xs font-medium">{likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} className="text-blue-500" />
              <span className="text-xs font-medium">{comments_count}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-4">
        {published && <span className="text-xs font-bold text-gray-400 mt-1">{published}</span>}
        <img
          src={imageUrl}
          className="w-20 h-20 object-cover rounded"
          alt={title}
        />
      </div>
    </div>
  );
};

export default NewsItem; 