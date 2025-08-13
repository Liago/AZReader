import React from 'react';
import DiscoverTab from '@components/DiscoverTab';
import { useHistory } from 'react-router-dom';
import type { Post } from '@store/slices/postsSlice';

const DiscoverPage: React.FC = () => {
  const history = useHistory();

  const handleArticleClick = (article: Post) => {
    history.push(`/article/${article.id}`);
  };

  return (
    <DiscoverTab 
      onArticleClick={handleArticleClick}
      className="discover-page"
    />
  );
};

export default DiscoverPage;