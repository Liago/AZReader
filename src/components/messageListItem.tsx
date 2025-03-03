import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel } from "@ionic/react";
import PostItem from "./ui/NewsItem";
import "./MessageListItem.css";
import moment from "moment";
import { Post } from "@common/interfaces";
import { useCallback } from "react";
import { usePostLikes } from "@hooks/usePostLikes";
import { usePostComments } from "@hooks/usePostComments";

interface PostItemProps {
	source: string;
	title: string;
	subtitle: string;
	date: string;
	imageUrl: string;
	excerpt: string;
	preview: boolean;
	published: string;
	likes_count: number;
	comments_count: number;
	showEngagementMetrics?: boolean;
}

interface MessageListItemProps {
	postId: string;
	post: Post;
	isLocal: boolean;
	deletePost: () => void;
	onOpenArticle: (post: Post) => void;
	showEngagementMetrics?: boolean;
	session?: any;
}

const MessageListItem: React.FC<MessageListItemProps> = ({ 
	postId, 
	post, 
	isLocal, 
	deletePost, 
	onOpenArticle,
	showEngagementMetrics = true,
	session = null
}) => {
	const { likesCount } = usePostLikes(postId, session);
	const { commentsCount } = usePostComments(postId, session);

	const displayLocalDot = (): JSX.Element => {
		if (isLocal) {
			return <div slot="start" className="dot dot-unread"></div>;
		}
		return <div slot="start" className="dot dot-unread"></div>;
	};

	const handleOpenArticle = useCallback(() => {
		onOpenArticle(post);
	}, [post, onOpenArticle]);

	// Transform post data to match PostItem props
	const postItemProps: PostItemProps = {
		source: post.domain || post.source || "",
		title: post.title || "",
		subtitle: post.subtitle || "",
		date: post.date_published || "",
		imageUrl: post.lead_image_url || post.topImage || "https://placehold.co/100x100",
		excerpt: post.excerpt || "",
		preview: post.preview === "true" || post.preview === true,
		published: moment(post.date_published || Date.now()).format("MMM DD"),
		likes_count: likesCount || 0,
		comments_count: commentsCount || 0,
		showEngagementMetrics
	};

	return (
		<IonItemSliding>
			<IonItem lines="none" className="py-3 border-b border-gray-200" onClick={handleOpenArticle}>
				<PostItem {...postItemProps} />
			</IonItem>
			<IonItemOptions>
				<IonItemOption color="danger" onClick={() => deletePost()}>
					Delete
				</IonItemOption>
			</IonItemOptions>
		</IonItemSliding>
	);
};

export default MessageListItem;
