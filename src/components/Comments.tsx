import React, { useState, useEffect } from "react";
import {
	IonIcon,
	IonSpinner,
	IonAvatar,
	IonContent,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonFooter,
	useIonModal,
	IonPage,
	IonBadge,
	IonText,
} from "@ionic/react";
import {
	closeOutline,
	sendOutline,
	chatbubblesOutline,
	pencilOutline,
	trashOutline,
	timeOutline,
	heartOutline,
	chatbubbleOutline,
	heartSharp,
} from "ionicons/icons";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Session } from "@supabase/supabase-js"; // Importazione corretta di Session
import { usePostComments, Comment } from "@hooks/usePostComments";
import { useCustomToast } from "@hooks/useIonToast";

interface CommentsProps {
	postId: string;
	session: Session | null;
	isOpen: boolean;
	onClose: () => void;
}

// Componente separato per il contenuto del modale
const CommentsModalContent: React.FC<{
	postId: string;
	session: Session | null;
	onDismiss: () => void;
}> = ({ postId, session, onDismiss }) => {
	const [newComment, setNewComment] = useState("");
	const [editingComment, setEditingComment] = useState<string | null>(null);
	const [editText, setEditText] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
	const showToast = useCustomToast();

	// Hook personalizzato per i commenti
	const { comments, commentsCount, isLoading, error, addNewComment, updateExistingComment, deleteExistingComment } = usePostComments(
		postId,
		session
	);

	useEffect(() => {
		console.log("CommentsModalContent mounted", { postId, sessionId: session?.user?.id });
		// Cleanup
		return () => {
			console.log("CommentsModalContent unmounted");
		};
	}, [postId, session]);

	// Toggle like su un commento
	const toggleLike = (commentId: string) => {
		setLikedComments((prevLiked) => {
			const newLiked = new Set(prevLiked);
			if (newLiked.has(commentId)) {
				newLiked.delete(commentId);
			} else {
				newLiked.add(commentId);
			}
			return newLiked;
		});
	};

	// Invia commento
	const sendComment = () => {
		console.log("Tentativo di inviare commento");

		if (!newComment.trim() || isSending) {
			console.log("Commento vuoto o invio già in corso");
			return;
		}

		if (!session) {
			console.log("Utente non autenticato");
			showToast({
				message: "Devi effettuare l'accesso per commentare",
				color: "warning",
			});
			return;
		}

		console.log("Invio commento:", newComment);
		setIsSending(true);

		addNewComment(newComment)
			.then(() => {
				console.log("Commento aggiunto con successo");
				setNewComment("");
				showToast({
					message: "Commento aggiunto con successo",
					color: "success",
				});
			})
			.catch((err) => {
				console.error("Errore durante l'aggiunta del commento:", err);
				showToast({
					message: "Errore nell'aggiunta del commento",
					color: "danger",
				});
			})
			.finally(() => {
				setIsSending(false);
			});
	};

	// Elimina commento
	const handleDelete = (commentId: string) => {
		if (!session) {
			showToast({
				message: "Devi effettuare l'accesso per eliminare un commento",
				color: "warning",
			});
			return;
		}

		deleteExistingComment(commentId)
			.then(() => {
				showToast({
					message: "Commento eliminato con successo",
					color: "success",
				});
			})
			.catch((err) => {
				console.error("Errore durante l'eliminazione:", err);
				showToast({
					message: "Errore nell'eliminazione del commento",
					color: "danger",
				});
			});
	};

	// Modifica commento
	const handleEdit = (commentId: string) => {
		if (!session) {
			showToast({
				message: "Devi effettuare l'accesso per modificare un commento",
				color: "warning",
			});
			return;
		}

		if (!editText.trim()) {
			showToast({
				message: "Il commento non può essere vuoto",
				color: "warning",
			});
			return;
		}

		updateExistingComment(commentId, editText)
			.then(() => {
				setEditingComment(null);
				setEditText("");
				showToast({
					message: "Commento aggiornato con successo",
					color: "success",
				});
			})
			.catch((err) => {
				console.error("Errore durante l'aggiornamento:", err);
				showToast({
					message: "Errore nell'aggiornamento del commento",
					color: "danger",
				});
			});
	};

	// Ottieni un colore casuale per l'avatar (consistente per lo stesso utente)
	const getColorForUser = (userId: string): string => {
		// Crea un hash semplice dalla stringa userId
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = userId.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Converte il numero del hash in una tonalità HSL (solo tonalità)
		const hue = Math.abs(hash % 360);

		// Restituisce un colore HSL con saturazione e luminosità fisse
		return `hsl(${hue}, 70%, 60%)`;
	};

	// Ottieni le iniziali da una stringa (es. email o username)
	const getInitials = (text: string): string => {
		if (!text) return "?";

		// Se è un'email, prendi la prima parte
		if (text.includes("@")) {
			const name = text.split("@")[0] || ""; // Assicuriamo che name sia almeno una stringa vuota
			// Prendi al massimo due caratteri
			return name.substring(0, 2).toUpperCase();
		}

		// Altrimenti prendi i primi due caratteri
		return text.substring(0, 2).toUpperCase();
	};

	// Renderizza un singolo commento
	const renderComment = (comment: Comment) => {
		const isEditing = editingComment === comment.id;
		const isOwnComment = session?.user?.id === comment.user_id;
		const commentDate = new Date(comment.created_at);
		const isLiked = likedComments.has(comment.id);

		// Utilizziamo l'email dell'utente invece di "Utente anonimo"
		const username =
			comment.profiles.username ||
			comment.profiles.email ||
			(comment.profiles.user_id ? `User_${comment.profiles.user_id.substring(0, 6)}` : "Utente anonimo");

		// Colore dell'avatar basato sull'ID utente
		const avatarColor = getColorForUser(comment.user_id);

		// Iniziali per l'avatar
		const initials = getInitials(username);

		return (
			<div key={comment.id} className="mb-6 relative">
				<div className="flex gap-3">
					{/* Avatar */}
					<div className="flex-shrink-0">
						{comment.profiles.avatar_url ? (
							<IonAvatar className="w-10 h-10 shadow-sm">
								<img src={comment.profiles.avatar_url} alt={username} className="rounded-full object-cover" />
							</IonAvatar>
						) : (
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
								style={{ backgroundColor: avatarColor }}
							>
								{initials}
							</div>
						)}
					</div>

					{/* Contenuto del commento */}
					<div className="flex-grow">
						<div className={`${isOwnComment ? "bg-blue-50" : "bg-gray-50"} p-4 rounded-lg shadow-sm border border-gray-100`}>
							<div className="flex justify-between items-start mb-2">
								<div className="flex flex-col">
									<span className="font-bold text-gray-800">{username}</span>
									<span className="text-xs text-gray-500">
										<IonIcon icon={timeOutline} className="mr-1 align-text-top" />
										{formatDistanceToNow(commentDate, {
											addSuffix: true,
											locale: it,
										})}
									</span>
								</div>
								{isOwnComment && !isEditing && (
									<div className="flex space-x-1">
										<button
											className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
											onClick={() => {
												setEditingComment(comment.id);
												setEditText(comment.comment);
											}}
											aria-label="Modifica commento"
										>
											<IonIcon icon={pencilOutline} style={{ fontSize: "16px" }} />
										</button>
										<button
											className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
											onClick={() => handleDelete(comment.id)}
											aria-label="Elimina commento"
										>
											<IonIcon icon={trashOutline} style={{ fontSize: "16px" }} />
										</button>
									</div>
								)}
							</div>

							{isEditing ? (
								<div>
									<textarea
										value={editText}
										onChange={(e) => setEditText(e.target.value)}
										className="w-full border rounded-lg p-3 mb-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none transition"
										placeholder="Modifica il tuo commento..."
										rows={3}
									/>
									<div className="flex justify-end space-x-2">
										<button
											className="px-4 py-2 text-sm rounded-full border text-gray-700 bg-white hover:bg-gray-50 transition-colors"
											onClick={() => {
												setEditingComment(null);
												setEditText("");
											}}
										>
											Annulla
										</button>
										<button
											className="px-4 py-2 text-sm rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
											onClick={() => handleEdit(comment.id)}
										>
											Salva
										</button>
									</div>
								</div>
							) : (
								<div className="mt-1">
									<p className="text-gray-700 leading-relaxed">{comment.comment}</p>
								</div>
							)}
						</div>

						{/* Info e azioni */}
						{!isEditing && (
							<div className="flex items-center mt-2 text-sm">
								<button
									className={`flex items-center mr-4 ${
										isLiked ? "text-red-500" : "text-gray-500"
									} hover:text-red-500 transition-colors`}
									onClick={() => toggleLike(comment.id)}
								>
									<IonIcon icon={isLiked ? heartSharp : heartOutline} className="mr-1" />
									<span>{isLiked ? "Mi piace" : "Mi piace"}</span>
								</button>
								<button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors">
									<IonIcon icon={chatbubbleOutline} className="mr-1" />
									<span>Rispondi</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<IonPage>
			<IonHeader translucent>
				<IonToolbar className="p-1">
					<IonButtons slot="start">
						<IonButton className="rounded-full" onClick={onDismiss}>
							<IonIcon icon={closeOutline} />
						</IonButton>
					</IonButtons>
					<IonTitle>
						<div className="flex items-center">
							Commenti
							{commentsCount > 0 && (
								<IonBadge color="primary" className="ml-2">
									{commentsCount}
								</IonBadge>
							)}
						</div>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding comments-container">
				{isLoading && (
					<div className="flex flex-col items-center justify-center py-12">
						<IonSpinner name="crescent" color="primary" />
						<p className="mt-4 text-gray-500 font-medium">Caricamento commenti...</p>
					</div>
				)}

				{error && (
					<div className="mx-4 my-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 shadow-sm">
						<p className="font-semibold">Si è verificato un errore</p>
						<p className="text-sm">{error.message}</p>
					</div>
				)}

				{comments.length === 0 && !isLoading && (
					<div className="flex flex-col items-center justify-center text-center py-16">
						<div className="bg-gray-50 rounded-full p-6 mb-4">
							<IonIcon icon={chatbubblesOutline} style={{ fontSize: "40px", color: "#6B7280" }} />
						</div>
						<h3 className="text-xl font-bold text-gray-800">Nessun commento</h3>
						<p className="text-gray-500 mt-2 max-w-xs mx-auto">Sii il primo a commentare questo articolo e inizia una conversazione!</p>
					</div>
				)}

				<div className="space-y-4 pb-24">{comments.map(renderComment)}</div>
			</IonContent>

			<IonFooter className="ion-no-border">
				<div className="border-t bg-white shadow-lg">
					<div className="flex items-center p-3">
						<div className="flex-1 bg-gray-100 rounded-full overflow-hidden flex items-center px-4">
							<textarea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Scrivi un commento..."
								className="bg-transparent w-full text-gray-700 py-2 resize-none outline-none"
								rows={1}
								style={{ minHeight: "44px" }}
							/>
						</div>
						<button
							className="ml-3 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm disabled:opacity-50 disabled:bg-gray-400 transition-colors hover:bg-blue-700"
							onClick={sendComment}
							disabled={!newComment.trim() || isLoading || isSending}
						>
							{isSending ? <IonSpinner name="dots" color="light" /> : <IonIcon icon={sendOutline} />}
						</button>
					</div>
				</div>
			</IonFooter>
		</IonPage>
	);
};

const Comments: React.FC<CommentsProps> = ({ postId, session, isOpen, onClose }) => {
	// Utilizziamo useIonModal hook per creare un modale controllato
	const [presentModal, dismissModal] = useIonModal(CommentsModalContent, {
		postId,
		session,
		onDismiss: () => dismissModal(),
	});

	// Monitoriamo la prop isOpen per aprire/chiudere il modale
	useEffect(() => {
		if (isOpen) {
			console.log("Opening modal with useIonModal");
			presentModal({
				onWillDismiss: () => {
					console.log("Modal will dismiss");
					onClose();
				},
			});
		} else {
			dismissModal();
		}
	}, [isOpen, presentModal, dismissModal, onClose]);

	// Non rendiamo nulla, il modale è gestito da useIonModal
	return null;
};

export default Comments;
