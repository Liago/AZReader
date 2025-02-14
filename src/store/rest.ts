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