import { createClient } from "@supabase/supabase-js";
import { wrappedApi } from "@common/api";
import { supabaseDb } from "../config/environment";
import { PostData, UseLazyApiReturn, ArticleParseResponse, TagsResponse } from "@common/interfaces";
import { store } from "./store";
import { PlatformHelper } from "@utility/platform-helper";

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

export const useTagsHandler = (): UseLazyApiReturn<TagsResponse[]> => {
	const { tokenApp } = store.getState().app;
	return useLazyApi<TagsResponse[]>("GET", `tags.json?auth=${tokenApp}`);
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
