import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { getPostLikesCount, checkUserLike, addLike, removeLike } from "@store/rest";

interface UsePostLikesReturn {
	likesCount: number;
	hasLiked: boolean;
	toggleLike: () => Promise<void>;
	isLoading: boolean;
	error: Error | null;
}

export const usePostLikes = (postId: string, session: Session | null): UsePostLikesReturn => {
	const [likesCount, setLikesCount] = useState<number>(0);
	const [hasLiked, setHasLiked] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const fetchLikesCount = async () => {
		try {
			const count = await getPostLikesCount(postId);
			setLikesCount(count);
		} catch (err) {
			console.error("Error fetching likes count:", err);
			setError(err instanceof Error ? err : new Error("Failed to fetch likes count"));
		}
	};

	const checkCurrentUserLike = async () => {
		if (!session?.user) {
			setHasLiked(false);
			return;
		}

		try {
			const hasUserLiked = await checkUserLike(postId, session.user.id);
			setHasLiked(hasUserLiked);
		} catch (err) {
			console.error("Error checking user like:", err);
			setError(err instanceof Error ? err : new Error("Failed to check user like"));
		}
	};

	const toggleLike = async () => {
		if (!session?.user) {
			setError(new Error("User must be logged in to like posts"));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			if (hasLiked) {
				await removeLike(postId, session.user.id);
				setLikesCount((prev) => prev - 1);
				setHasLiked(false);
			} else {
				await addLike(postId, session.user.id);
				setLikesCount((prev) => prev + 1);
				setHasLiked(true);
			}
		} catch (err) {
			console.error("Error toggling like:", err);
			setError(err instanceof Error ? err : new Error("Failed to toggle like"));
			// Ripristina lo stato precedente in caso di errore
			await fetchLikesCount();
			await checkCurrentUserLike();
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (postId) {
			fetchLikesCount();
			checkCurrentUserLike();
		}
	}, [postId, session?.user?.id]);

	return {
		likesCount,
		hasLiked,
		toggleLike,
		isLoading,
		error,
	};
};
