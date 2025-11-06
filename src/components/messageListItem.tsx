import { IonItem, IonItemOption, IonItemOptions, IonItemSliding } from "@ionic/react";
import PostItem from "./ui/NewsItem";
import "./MessageListItem.css";
import moment from "moment";
import { Post } from "@common/interfaces";
import { useCallback } from "react";
import { usePostLikes } from "@hooks/usePostLikes";
import { usePostComments } from "@hooks/usePostComments";
import { Trash2 } from "lucide-react";

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

	const handleOpenArticle = useCallback(() => {
		onOpenArticle(post);
	}, [post, onOpenArticle]);

	// Transform post data to match PostItem props
	const postItemProps: PostItemProps = {
		source: post.domain || post.source || "",
		title: post.title || "",
		subtitle: post.subtitle || "",
		date: post.date_published || "",
		imageUrl: post.lead_image_url || post.topImage || "https://placehold.co/600x400/f8fafc/e2e8f0?text=AZReader",
		excerpt: post.excerpt || "",
		preview: post.preview === "true" || post.preview === true,
		published: moment(post.date_published || Date.now()).format("DD MMM"),
		likes_count: likesCount || 0,
		comments_count: commentsCount || 0,
		showEngagementMetrics
	};

	return (
		<IonItemSliding className="rounded-lg overflow-hidden shadow-card mb-3 bg-white">
			<IonItem
				lines="none"
				className="py-4 px-1"
				onClick={handleOpenArticle}
				detail={false}
			>
				<PostItem {...postItemProps} />
			</IonItem>
			<IonItemOptions side="end">
				<IonItemOption
					color="danger"
					onClick={() => deletePost()}
					className="flex items-center justify-center"
				>
					<Trash2 size={20} />
					<span className="ml-1 text-sm">Elimina</span>
				</IonItemOption>
			</IonItemOptions>
		</IonItemSliding>
	);
};

export default MessageListItem;
