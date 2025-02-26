import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/auth-js/dist/module/lib/types";
import { getPostCommentsCount, getPostComments, addComment, updateComment, deleteComment, getHierarchicalComments } from "@store/rest";

export interface CommentProfile {
	username: string | null;
	avatar_url: string | null;
	email?: string | null;
	user_id?: string;
}

export interface Comment {
	id: string;
	comment: string;
	created_at: string;
	updated_at: string | null;
	user_id: string;
	parent_id: string | null;
	profiles: CommentProfile;
}

export interface CommentWithReplies extends Comment {
	replies: CommentWithReplies[];
}

interface UsePostCommentsReturn {
	comments: Comment[];
	organizedComments: CommentWithReplies[];
	commentsCount: number;
	isLoading: boolean;
	error: Error | null;
	addNewComment: (comment: string, parentId?: string) => Promise<void>;
	updateExistingComment: (commentId: string, comment: string) => Promise<void>;
	deleteExistingComment: (commentId: string) => Promise<void>;
	refreshComments: () => Promise<void>;
}

export const usePostComments = (postId: string, session: Session | null): UsePostCommentsReturn => {
	const [comments, setComments] = useState<Comment[]>([]);
	const [organizedComments, setOrganizedComments] = useState<CommentWithReplies[]>([]);
	const [commentsCount, setCommentsCount] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	// Debug: Verifica se postId e session esistono
	useEffect(() => {
		console.log("usePostComments hook:", { postId, sessionExists: !!session, userId: session?.user?.id });
	}, [postId, session]);

	// Funzione per organizzare i commenti in una struttura gerarchica
	const organizeCommentsHierarchy = useCallback((flatComments: Comment[]): CommentWithReplies[] => {
		const commentMap: Record<string, CommentWithReplies> = {};
		const rootComments: CommentWithReplies[] = [];

		// Prima pass: popola la mappa dei commenti
		flatComments.forEach((comment) => {
			commentMap[comment.id] = {
				...comment,
				replies: [],
			};
		});

		// Seconda pass: organizza la gerarchia
		flatComments.forEach((comment) => {
			// Usiamo l'asserzione di tipo per comunicare a TypeScript che questo commento esiste
			const commentWithReplies = commentMap[comment.id] as CommentWithReplies;

			if (comment.parent_id && comment.parent_id in commentMap) {
				// Asserzione di tipo anche per il commento padre
				const parentComment = commentMap[comment.parent_id] as CommentWithReplies;
				parentComment.replies.push(commentWithReplies);
			} else {
				// È un commento principale
				rootComments.push(commentWithReplies);
			}
		});

		return rootComments;
	}, []);

	const fetchComments = useCallback(async () => {
		if (!postId) {
			console.error("fetchComments: postId mancante");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			console.log("Recupero commenti per postId:", postId);

			// Versione originale: ottiene commenti piatti
			const fetchedComments = await getPostComments(postId);
			console.log("Commenti recuperati:", fetchedComments);

			// I commenti già arrivano con il profilo collegato dalla funzione getPostComments
			const typedComments: Comment[] = Array.isArray(fetchedComments)
				? fetchedComments.map((comment: any) => ({
						id: comment.id,
						comment: comment.comment || "",
						created_at: comment.created_at,
						updated_at: comment.updated_at,
						user_id: comment.user_id,
						parent_id: comment.parent_id,
						profiles: {
							username: comment.profiles?.username || null,
							avatar_url: comment.profiles?.avatar_url || null,
							email: comment.profiles?.email || null,
							user_id: comment.user_id || null,
						},
				  }))
				: [];

			setComments(typedComments);

			// Organizziamo anche i commenti in struttura gerarchica
			const organized = organizeCommentsHierarchy(typedComments);
			setOrganizedComments(organized);
		} catch (err) {
			console.error("Error fetching comments:", err);
			setError(err instanceof Error ? err : new Error("Failed to fetch comments"));
		} finally {
			setIsLoading(false);
		}
	}, [postId, organizeCommentsHierarchy]);

	const fetchCommentsCount = useCallback(async () => {
		if (!postId) {
			console.error("fetchCommentsCount: postId mancante");
			return;
		}

		try {
			console.log("Recupero conteggio commenti per postId:", postId);
			const count = await getPostCommentsCount(postId);
			console.log("Conteggio commenti:", count);
			setCommentsCount(count);
		} catch (err) {
			console.error("Error fetching comments count:", err);
			// Non impostiamo l'errore qui per non bloccare la visualizzazione dei commenti
		}
	}, [postId]);

	const addNewComment = async (comment: string, parentId?: string) => {
		console.log("addNewComment chiamato con:", { comment, parentId, postId });

		if (!postId) {
			const errorMsg = "postId mancante";
			console.error(errorMsg);
			setError(new Error(errorMsg));
			return;
		}

		if (!session?.user) {
			const errorMsg = "User must be logged in to comment";
			console.error(errorMsg);
			setError(new Error(errorMsg));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			console.log("Chiamata a addComment con:", {
				postId,
				userId: session.user.id,
				comment,
				parentId,
			});

			const result = await addComment(postId, session.user.id, comment, parentId);
			console.log("Risultato addComment:", result);

			await Promise.all([fetchComments(), fetchCommentsCount()]);
		} catch (err) {
			console.error("Error adding comment:", err);
			setError(err instanceof Error ? err : new Error("Failed to add comment"));
			throw err; // Rilanciamo l'errore per gestirlo nel componente
		} finally {
			setIsLoading(false);
		}
	};

	const updateExistingComment = async (commentId: string, comment: string) => {
		if (!session?.user) {
			const errorMsg = "User must be logged in to update comments";
			console.error(errorMsg);
			setError(new Error(errorMsg));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await updateComment(commentId, session.user.id, comment);
			console.log("Risultato updateComment:", result);
			await fetchComments();
		} catch (err) {
			console.error("Error updating comment:", err);
			setError(err instanceof Error ? err : new Error("Failed to update comment"));
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const deleteExistingComment = async (commentId: string) => {
		if (!session?.user) {
			const errorMsg = "User must be logged in to delete comments";
			console.error(errorMsg);
			setError(new Error(errorMsg));
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await deleteComment(commentId, session.user.id);
			console.log("Risultato deleteComment:", result);
			await Promise.all([fetchComments(), fetchCommentsCount()]);
		} catch (err) {
			console.error("Error deleting comment:", err);
			setError(err instanceof Error ? err : new Error("Failed to delete comment"));
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const refreshComments = useCallback(async () => {
		if (!postId) {
			console.error("refreshComments: postId mancante");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await Promise.all([fetchComments(), fetchCommentsCount()]);
		} catch (err) {
			console.error("Error refreshing comments:", err);
			setError(err instanceof Error ? err : new Error("Failed to refresh comments"));
		} finally {
			setIsLoading(false);
		}
	}, [fetchComments, fetchCommentsCount, postId]);

	// Carica i commenti all'inizializzazione e quando cambia postId
	useEffect(() => {
		if (postId) {
			console.log("Inizializzazione commenti per postId:", postId);
			refreshComments();
		}
	}, [postId, refreshComments]);

	return {
		comments,
		organizedComments,
		commentsCount,
		isLoading,
		error,
		addNewComment,
		updateExistingComment,
		deleteExistingComment,
		refreshComments,
	};
};
