import { createClient } from "@supabase/supabase-js";
import { wrappedApi } from "@common/api";
import { supabaseDb } from "../config/environment";
import { PostData, UseLazyApiReturn, ArticleParseResponse, TagsResponse } from "@common/interfaces";
import { store } from "./store";
import { PlatformHelper } from "@utility/platform-helper";
import { useEffect } from "react";

const { useLazyApi } = wrappedApi();

// Supabase setup
const supabaseUrl = supabaseDb.SUPA_URL;
const supabaseAnonKey = supabaseDb.SUPA_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funzione di utility per preparare l'URL
const prepareUrl = (inputUrl: string): string => {
	try {
		// Decodifica solo se l'URL contiene caratteri codificati
		if (inputUrl.includes("%")) {
			return encodeURIComponent(decodeURIComponent(inputUrl));
		}
		return encodeURIComponent(inputUrl);
	} catch (e) {
		console.warn("Error processing URL:", e);
		return encodeURIComponent(inputUrl);
	}
};

export const useArticleParsed = (url: string): UseLazyApiReturn<ArticleParseResponse> => {
	return useLazyApi<ArticleParseResponse>("GET", `parser?url=${prepareUrl(url)}`, {
		useParserEndpoint: true,
		useCapacitorHttp: PlatformHelper.isNative(),
	});
};

export const useTagsHandler = () => {
	const { tokenApp } = store.getState().app;
	const [fetchTags, response] = useLazyApi<TagsResponse[]>("GET", `tags.json?auth=${tokenApp}`);

	useEffect(() => {
		fetchTags();
	}, []);

	return response;
};

export const useTagsSaver = (): UseLazyApiReturn<{ success: boolean }> => {
	const { tokenApp } = store.getState().app;
	return useLazyApi<{ success: boolean }>("POST", `tags/save?auth=${tokenApp}`);
};

export async function insertPost(postData: PostData) {
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from("posts")
		.insert({
			...postData,
			savedOn: now,
		})
		.select();

	if (error) {
		console.error("Errore durante l'inserimento del post:", error);
		throw error;
	}
	console.log("Post inserito con successo:", data);
	return data;
}

export async function deletePost(postId: string) {
	const { data, error } = await supabase.from("posts").delete().match({ id: postId });

	if (error) {
		console.error("Errore durante la cancellazione del post:", error);
		throw error;
	}
	console.log("Post cancellato con successo:", postId);
	return data;
}

export async function getPostLikesCount(postId: string) {
	const { data, error } = await supabase.rpc("get_post_likes_count", { post_id: postId });

	if (error) throw error;
	return data || 0;
}

export async function checkUserLike(postId: string, userId: string) {
	const { data, error } = await supabase.from("posts_likes").select("id").eq("post_id", postId).eq("user_id", userId).single();

	if (error && error.code !== "PGRST116") throw error;
	return !!data;
}

export async function addLike(postId: string, userId: string) {
	const { data, error } = await supabase
		.from("posts_likes")
		.insert({
			post_id: postId,
			user_id: userId,
		})
		.select();

	if (error) throw error;
	return data;
}

export async function removeLike(postId: string, userId: string) {
	const { data, error } = await supabase.from("posts_likes").delete().eq("post_id", postId).eq("user_id", userId);

	if (error) throw error;
	return data;
}

export async function getPostCommentsCount(postId: string) {
	// Utilizzo di count() invece di rpc per maggiore compatibilità
	const { count, error } = await supabase
		.from("posts_comments")
		.select("*", { count: "exact", head: true })
		.eq("post_id", postId)
		.is("deleted_at", null);

	if (error) throw error;
	return count || 0;
}

interface Profile {
	id: string;
	username: string | null;
	avatar_url: string | null;
	email: string | null;
}

interface ProfileMap {
	[key: string]: Profile;
}

/**
 * Recupera tutti i commenti di un post, inclusi i dati dell'utente che ha commentato
 * e organizzati in modo da facilitare la visualizzazione gerarchica.
 *
 * @param postId L'ID del post di cui recuperare i commenti
 * @returns Array di commenti con profili utente collegati
 */
export async function getPostComments(postId: string) {
	// Modifichiamo la query per evitare l'uso della relazione implicita
	const { data, error } = await supabase
		.from("posts_comments")
		.select(
			`
      id,
      comment,
      created_at,
      updated_at,
      user_id,
      parent_id,
      post_id
    `
		)
		.eq("post_id", postId)
		.is("deleted_at", null)
		.order("created_at", { ascending: true });

	if (error) throw error;

	// Se abbiamo dei commenti, recuperiamo i profili utente separatamente
	if (data && data.length > 0) {
		// Raccogliamo tutti gli ID utente unici
		const userIdSet = new Set<string>();
		data.forEach((comment) => {
			if (comment.user_id) {
				userIdSet.add(comment.user_id);
			}
		});

		const userIds = Array.from(userIdSet);

		// Recuperiamo i profili per questi utenti, includendo anche l'email
		const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, username, avatar_url, email").in("id", userIds);

		if (profilesError) {
			console.error("Errore nel recupero dei profili:", profilesError);
			// Non blocchiamo l'esecuzione, ma usiamo profili di fallback
		}

		// Recuperiamo anche gli utenti stessi per ottenere le loro email
		const { data: users, error: usersError } = await supabase.from("users").select("id, email").in("id", userIds);

		if (usersError) {
			console.error("Errore nel recupero degli utenti:", usersError);
		}

		// Creiamo un dizionario per una rapida ricerca dei profili
		const profilesMap: ProfileMap = {};
		if (profiles) {
			profiles.forEach((profile: Profile) => {
				profilesMap[profile.id] = profile;
			});
		}

		// Aggiungiamo le informazioni dell'email dagli utenti
		if (users) {
			users.forEach((user: any) => {
				if (user.id) {
					// Aggiorniamo profilesMap in modo type-safe
					profilesMap[user.id] = {
						...(profilesMap[user.id] || { id: user.id, username: null, avatar_url: null }),
						email: user.email || profilesMap[user.id]?.email || null,
					};
				}
			});
		}

		// Aggiungiamo le informazioni del profilo a ciascun commento
		return data.map((comment) => ({
			...comment,
			profiles: profilesMap[comment.user_id] || {
				username: null,
				avatar_url: null,
				email: null,
			},
		}));
	}

	return data || [];
}

/**
 * Aggiungi un nuovo commento ad un post.
 * Se viene specificato un parentId, il commento sarà considerato una risposta
 * al commento indicato.
 *
 * @param postId L'ID del post a cui aggiungere il commento
 * @param userId L'ID dell'utente che sta commentando
 * @param comment Il contenuto del commento
 * @param parentId Opzionale: l'ID del commento a cui si sta rispondendo
 * @returns Il commento aggiunto
 */
export async function addComment(postId: string, userId: string, comment: string, parentId?: string) {
	console.log(`Aggiunta commento - postId: ${postId}, userId: ${userId}, parentId: ${parentId || "nessun parent"}`);

	const commentData = {
		post_id: postId,
		user_id: userId,
		comment,
		parent_id: parentId || null, // Assicuriamoci che sia null se non specificato
	};

	const { data, error } = await supabase.from("posts_comments").insert(commentData).select().single();

	if (error) {
		console.error("Errore durante l'aggiunta del commento:", error);
		throw error;
	}

	console.log("Commento aggiunto con successo:", data);
	return data;
}

export async function updateComment(commentId: string, userId: string, comment: string) {
	const { data, error } = await supabase
		.from("posts_comments")
		.update({
			comment,
			updated_at: new Date().toISOString(),
		})
		.eq("id", commentId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deleteComment(commentId: string, userId: string) {
	// Utilizzando il soft delete (aggiornamento del campo deleted_at)
	const { data, error } = await supabase
		.from("posts_comments")
		.update({
			deleted_at: new Date().toISOString(),
		})
		.eq("id", commentId)
		.eq("user_id", userId)
		.select();

	if (error) throw error;
	return data;
}

/**
 * Recupera le risposte dirette a un commento specifico
 *
 * @param commentId L'ID del commento di cui recuperare le risposte
 * @returns Array di commenti che sono risposte al commento indicato
 */
export async function getCommentReplies(commentId: string) {
	const { data, error } = await supabase
		.from("posts_comments")
		.select("*")
		.eq("parent_id", commentId)
		.is("deleted_at", null)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data || [];
}

/**
 * Recupera tutti i commenti di un post organizzati in struttura gerarchica
 *
 * @param postId L'ID del post di cui recuperare i commenti
 * @returns Oggetto con commenti principali e le loro risposte
 */
export async function getHierarchicalComments(postId: string) {
	// Prima ottieni tutti i commenti con i profili associati
	const allComments = await getPostComments(postId);

	// Organizza i commenti in una struttura gerarchica
	const rootComments: any[] = [];
	const commentMap: Record<string, any> = {};

	// Prima pass: crea la mappa di tutti i commenti per referenza rapida
	allComments.forEach((comment) => {
		commentMap[comment.id] = {
			...comment,
			replies: [],
		};
	});

	// Seconda pass: organizza i commenti in struttura ad albero
	allComments.forEach((comment) => {
		if (comment.parent_id && commentMap[comment.parent_id]) {
			// È una risposta, aggiungila al commento genitore
			commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
		} else {
			// È un commento radice, aggiungilo all'array principale
			rootComments.push(commentMap[comment.id]);
		}
	});

	return {
		rootComments,
		allComments,
		totalCount: allComments.length,
	};
}
