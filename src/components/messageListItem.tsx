import { IonItem, IonItemOption, IonItemOptions, IonItemSliding } from "@ionic/react";
import PostItem from "./ui/NewsItem";
import "./MessageListItem.css";
import moment from "moment";
import { Post } from "@common/interfaces";
import { useCallback } from "react";

interface PostItemProps {
	source: string;
	title: string;
	subtitle: string;
	date: string;
	imageUrl: string;
	excerpt: string;
	preview: string;
	published: string;
}

interface MessageListItemProps {
	post: Post;
	isLocal: boolean;
	postId: string;
	deletePost: (id: string) => void;
	onOpenArticle: (post: Post) => void;
}

const MessageListItem: React.FC<MessageListItemProps> = ({ post, isLocal, postId, deletePost, onOpenArticle }) => {
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
		...post,
		source: post.domain || post.source || "",
		title: post.title || "",
		subtitle: post.subtitle || "",
		date: post.date_published || "",
		imageUrl: post.lead_image_url || post.topImage || "https://placehold.co/100x100",
		excerpt: post.excerpt || "",
		preview: post.preview || "",
		published: moment(post.date_published || Date.now()).format("MMM DD"),
	};

	return (
		<IonItemSliding>
			<IonItem lines="none" className="py-3 border-b border-gray-200" onClick={handleOpenArticle}>
				<PostItem {...postItemProps} />
			</IonItem>
			<IonItemOptions>
				<IonItemOption color="danger" onClick={() => deletePost(post.id)}>
					Delete
				</IonItemOption>
			</IonItemOptions>
		</IonItemSliding>
	);
};

export default MessageListItem;
