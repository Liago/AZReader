import React, { useState, useRef } from "react";
import {
	IonIcon,
	IonSpinner,
	IonContent,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonFooter,
	IonSkeletonText,
	IonRippleEffect,
	IonModal,
	IonTitle,
	IonBackdrop,
} from "@ionic/react";
import {
	chevronBack,
	ellipsisHorizontal,
	chatbubbleOutline,
	closeOutline,
	send,
	flagOutline,
	shareOutline,
	trashOutline,
	imageOutline,
	happyOutline,
	lockClosedOutline,
} from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { usePostComments, Comment } from "@hooks/usePostComments";
import { useCustomToast } from "@hooks/useIonToast";
import { useSelector } from "react-redux";
import { RootState } from "@store/reducers";

interface CommentsProps {
	postId: string;
	session: Session | null;
	isOpen: boolean;
	onClose: () => void;
}

// Interfaccia per commento con risposte
interface CommentWithReplies extends Comment {
	replies: CommentWithReplies[];
}

// Colori personalizzati per gli avatar
const AVATAR_COLORS = [
	"bg-gradient-to-br from-pink-500 to-rose-500",
	"bg-gradient-to-br from-blue-500 to-indigo-600",
	"bg-gradient-to-br from-amber-400 to-orange-500",
	"bg-gradient-to-br from-emerald-400 to-teal-500",
	"bg-gradient-to-br from-violet-500 to-purple-600",
	"bg-gradient-to-br from-red-500 to-pink-600",
];

// Funzione per generare un colore casuale ma deterministico in base all'email
const getAvatarColorForEmail = (email: string | null | undefined): string => {
	if (!email) return AVATAR_COLORS[0] || '';

	let sum = 0;
	for (let i = 0; i < email.length; i++) {
		sum += email.charCodeAt(i);
	}
	const index = sum % AVATAR_COLORS.length;
	return AVATAR_COLORS[index] || '';
};

const Avatar: React.FC<{
	email: string | null | undefined;
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
}> = ({ email, size = "md", className = "" }) => {
	const { initials } = getAuthorInfo(email);
	const bgColor = getAvatarColorForEmail(email);

	const sizeClasses = {
		xs: "w-6 h-6 text-xs",
		sm: "w-8 h-8 text-sm",
		md: "w-10 h-10 text-base",
		lg: "w-12 h-12 text-lg",
	};

	return (
		<div
			className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold shadow-md ${className}`}
		>
			{initials}
		</div>
	);
};

interface CommentItemProps {
	comment: CommentWithReplies;
	startReply: (id: string, author: string) => void;
	handleDelete: (id: string) => void;
	level?: number;
	session: Session | null;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, startReply, handleDelete, level = 0, session }) => {
	const { authorName } = getAuthorInfo(comment.profiles?.email);
	const timeAgo = getTimeAgo(comment.created_at);
	const [showOptions, setShowOptions] = useState(false);

	// Verifica se il commento è dell'utente corrente
	const isOwnComment = session?.user?.id === comment.user_id;

	return (
		<div className={`${level > 0 ? "pl-6 ml-2 relative" : ""}`}>
			{level > 0 && <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-gray-300 to-gray-200 rounded-full"></div>}

			<div className={`mb-3 ${level === 0 ? "border-b border-gray-100 pb-3" : ""}`}>
				<div className="flex items-start gap-3">
					<Avatar email={comment.profiles?.email} />

					<div className="flex-1 min-w-0 bg-gray-50 rounded-2xl px-4 py-3 shadow-sm">
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center">
								<span className="font-semibold text-gray-900">{authorName}</span>
								{isOwnComment && (
									<span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Tu</span>
								)}
							</div>

							<div className="flex items-center gap-1">
								<span className="text-xs text-gray-400">{timeAgo}</span>
								<button
									className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
									onClick={() => setShowOptions(!showOptions)}
								>
									<IonIcon icon={ellipsisHorizontal} />
								</button>
							</div>
						</div>

						<p className="text-gray-800 text-sm">{comment.comment}</p>

						<div className="mt-2">
							<button
								className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
								onClick={() => startReply(comment.id, authorName)}
							>
								<IonIcon icon={chatbubbleOutline} className="mr-1 text-sm" />
								<span>Rispondi</span>
							</button>
						</div>
					</div>
				</div>

				{/* Menu opzioni */}
				{showOptions && (
					<>
						<IonBackdrop visible={true} tappable={true} stopPropagation={true} onClick={() => setShowOptions(false)} />
						<div className="absolute right-4 mt-2 w-48 bg-white rounded-xl shadow-xl z-10 py-1 overflow-hidden">
							{isOwnComment && (
								<button
									className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 flex items-center font-medium"
									onClick={() => {
										handleDelete(comment.id);
										setShowOptions(false);
									}}
								>
									<IonIcon icon={trashOutline} className="mr-3 text-lg" />
									<span>Elimina</span>
								</button>
							)}
							<button
								className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
								onClick={() => setShowOptions(false)}
							>
								<IonIcon icon={flagOutline} className="mr-3 text-lg" />
								<span>Segnala</span>
							</button>
							<button
								className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
								onClick={() => setShowOptions(false)}
							>
								<IonIcon icon={shareOutline} className="mr-3 text-lg" />
								<span>Condividi</span>
							</button>
						</div>
					</>
				)}
			</div>

			{/* Commenti annidati */}
			{comment.replies?.length > 0 && (
				<div className="mt-2">
					{comment.replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							startReply={startReply}
							handleDelete={handleDelete}
							level={level + 1}
							session={session}
						/>
					))}
				</div>
			)}
		</div>
	);
};

// Componente per loading skeleton
const CommentSkeleton: React.FC = () => (
	<div className="p-4 flex items-start gap-3 animate-pulse">
		<div className="w-10 h-10 rounded-full bg-gray-200"></div>
		<div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
			<div className="flex justify-between items-center mb-3">
				<IonSkeletonText animated style={{ width: "30%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
				<IonSkeletonText animated style={{ width: "10%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
			</div>
			<IonSkeletonText animated style={{ width: "100%", height: "16px", borderRadius: "4px" }}></IonSkeletonText>
			<IonSkeletonText animated style={{ width: "90%", height: "16px", borderRadius: "4px", marginTop: "4px" }}></IonSkeletonText>
			<div className="mt-3">
				<IonSkeletonText animated style={{ width: "20%", height: "12px", borderRadius: "4px" }}></IonSkeletonText>
			</div>
		</div>
	</div>
);

// Componente per quando non ci sono commenti
const NoComments: React.FC<{ session: Session | null }> = ({ session }) => (
	<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
		<div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
			<IonIcon icon={chatbubbleOutline} className="text-gray-400 text-4xl" />
		</div>
		<h3 className="text-xl font-bold text-gray-800 mb-2">Nessun commento</h3>
		<p className="text-gray-500 mb-8 max-w-xs">
			{session
				? "Sii il primo a commentare questo articolo e inizia la conversazione!"
				: "Accedi per essere il primo a commentare questo articolo."}
		</p>
		{!session && (
			<button className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors">
				Accedi per commentare
			</button>
		)}
	</div>
);

// Componente per il contenuto dei commenti
const CommentsContent: React.FC<{
	postId: string;
	session: Session | null;
	onDismiss: () => void;
}> = ({ postId, session, onDismiss }) => {
	const [newComment, setNewComment] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [replyingToAuthor, setReplyingToAuthor] = useState<string>("");
	const [isCommenting, setIsCommenting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const contentRef = useRef<HTMLIonContentElement>(null);
	const showToast = useCustomToast();

	// Prendiamo le credenziali utente dallo store Redux
	const userState = useSelector((state: RootState) => state.user);
	const userEmail = userState.credentials?.email || "";

	const { comments, organizedComments, commentsCount, isLoading, addNewComment, deleteExistingComment } = usePostComments(postId, session);

	// Gestione risposta
	const startReply = (commentId: string, author: string) => {
		setReplyingTo(commentId);
		setReplyingToAuthor(author || "utente");
		setIsCommenting(true);
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const cancelReply = () => {
		setReplyingTo(null);
		setReplyingToAuthor("");
	};

	// Invio commento
	const sendComment = async () => {
		if (!newComment.trim() || isSending) return;

		if (!session) {
			showToast({
				message: "Devi effettuare l'accesso per commentare",
				color: "warning",
			});
			return;
		}

		setIsSending(true);
		try {
			// Utilizziamo l'email dell'utente dallo stato Redux
			await addNewComment(newComment, replyingTo || undefined);
			setNewComment("");
			setReplyingTo(null);
			setReplyingToAuthor("");
			setIsCommenting(false);

			// Scroll to bottom after adding comment
			setTimeout(() => {
				contentRef.current?.scrollToBottom(300);
			}, 300);

			showToast({
				message: "Commento aggiunto con successo",
				color: "success",
				duration: 2000,
			});
		} catch (err) {
			showToast({
				message: "Errore nell'aggiunta del commento",
				color: "danger",
			});
		} finally {
			setIsSending(false);
		}
	};

	// Funzione per eliminare un commento
	const handleDelete = async (commentId: string) => {
		if (!session) return;

		try {
			await deleteExistingComment(commentId);
			showToast({
				message: "Commento eliminato con successo",
				color: "success",
				duration: 2000,
			});
		} catch (err) {
			showToast({
				message: "Errore nell'eliminazione del commento",
				color: "danger",
			});
		}
	};

	const toggleCommentingMode = () => {
		setIsCommenting(!isCommenting);
		if (!isCommenting) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		} else {
			setNewComment("");
			setReplyingTo(null);
			setReplyingToAuthor("");
		}
	};

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar className="px-2">
					<IonButtons slot="start">
						<IonButton className="font-medium" onClick={onDismiss}>
							<IonIcon icon={chevronBack} slot="start" />
							<span className="ml-1">Indietro</span>
						</IonButton>
					</IonButtons>
					<IonTitle className="text-center font-bold">{commentsCount > 0 ? `${commentsCount} commenti` : "Commenti"}</IonTitle>
					{!isCommenting && (
						<IonButtons slot="end">
							<IonButton onClick={toggleCommentingMode} className="text-blue-600">
								<IonIcon icon={chatbubbleOutline} />
							</IonButton>
						</IonButtons>
					)}
				</IonToolbar>
			</IonHeader>

			<IonContent ref={contentRef} className="bg-white ion-padding">
				{isLoading ? (
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<CommentSkeleton key={i} />
						))}
					</div>
				) : comments.length === 0 ? (
					<NoComments session={session} />
				) : (
					<div className="pb-24 space-y-4">
						{organizedComments.map((comment) => (
							<CommentItem key={comment.id} comment={comment} startReply={startReply} handleDelete={handleDelete} session={session} />
						))}
					</div>
				)}
			</IonContent>

			{/* Footer per la modalità commento e risposta */}
			{(isCommenting || replyingTo) && (
				<IonFooter className="ion-no-border shadow-lg">
					{replyingTo && (
						<div className="bg-blue-50 px-4 py-3 flex justify-between items-center border-t border-blue-100">
							<div className="text-sm text-blue-800 flex items-center">
								<span>Rispondi a </span>
								<span className="font-semibold ml-1">{replyingToAuthor}</span>
							</div>
							<button className="p-1 rounded-full bg-blue-100 h-7 w-7 flex items-center justify-center" onClick={cancelReply}>
								<IonIcon icon={closeOutline} className="text-blue-600 text-sm" />
							</button>
						</div>
					)}

					<div className="bg-white px-4 py-3 border-t border-gray-100">
						<div className="flex items-center gap-3">
							<Avatar email={userEmail} size="sm" />

							<div className="flex-1 bg-gray-100 rounded-full flex items-center overflow-hidden pr-2 transition-all focus-within:ring-2 focus-within:ring-blue-300 focus-within:bg-white">
								<input
									ref={inputRef}
									type="text"
									value={newComment}
									onChange={(e) => setNewComment(e.target.value)}
									placeholder={replyingTo ? "Scrivi una risposta..." : "Aggiungi un commento..."}
									className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700"
								/>

								{newComment.trim() && (
									<button
										className={`w-8 h-8 rounded-full flex items-center justify-center ${
											isSending ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700 ion-activatable overflow-hidden"
										}`}
										onClick={sendComment}
										disabled={isSending}
									>
										{isSending ? (
											<IonSpinner name="dots" className="h-4 w-4" />
										) : (
											<>
												<IonIcon icon={send} className="text-white text-sm" />
												<IonRippleEffect />
											</>
										)}
									</button>
								)}
							</div>

							{!newComment.trim() && (
								<div className="flex">
									<button className="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100">
										<IonIcon icon={imageOutline} className="text-xl" />
									</button>
									<button className="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100">
										<IonIcon icon={happyOutline} className="text-xl" />
									</button>
								</div>
							)}
						</div>

						{isCommenting && !replyingTo && (
							<div className="flex justify-between items-center mt-3 px-2">
								<div className="text-xs text-gray-500 flex items-center">
									<IonIcon icon={lockClosedOutline} className="mr-1" />I commenti sono pubblici
								</div>

								<button className="text-xs text-blue-600 font-medium" onClick={toggleCommentingMode}>
									Annulla
								</button>
							</div>
						)}
					</div>
				</IonFooter>
			)}

			{/* FAB per aggiungere commento quando non è attiva la modalità commento */}
			{!isCommenting && !replyingTo && session && (
				<div className="fixed bottom-6 right-6 z-10">
					<button
						onClick={toggleCommentingMode}
						className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center ion-activatable overflow-hidden hover:bg-blue-700 transition-colors"
					>
						<IonIcon icon={chatbubbleOutline} className="text-xl" />
						<IonRippleEffect />
					</button>
				</div>
			)}
		</>
	);
};

// Utility functions
const getTimeAgo = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "ora";
	if (diffMins < 60) return `${diffMins} min fa`;
	if (diffHours < 24) return `${diffHours} ore fa`;
	if (diffDays < 7) return `${diffDays} g fa`;

	// Formatta data per date più vecchie
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

const getAuthorInfo = (email: string | null | undefined) => {
	const safeEmail = email || "";
	let userName = "User";

	if (safeEmail.includes("@")) {
		const parts = safeEmail.split("@");
		if (parts.length > 0 && parts[0]) {
			userName = parts[0];
		}
	}

	let initials = "??";
	if (userName.length >= 2) {
		const firstChar = userName.charAt(0);
		const secondChar = userName.charAt(1);
		initials = (firstChar + secondChar).toUpperCase();
	} else if (userName.length === 1) {
		initials = userName.charAt(0).toUpperCase();
	}

	return { authorName: userName, initials };
};

const Comments: React.FC<CommentsProps> = ({ postId, session, isOpen, onClose }) => {
	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose} className="comments-modal">
			<CommentsContent postId={postId} session={session} onDismiss={onClose} />
		</IonModal>
	);
};

export default Comments;
