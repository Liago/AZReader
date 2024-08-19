import { createClient } from "@supabase/supabase-js";

import { wrappedApi } from "../common/api";
import { store } from "./store";
import { endpoint, api_keys, supabaseDb } from "../config/environment.ts";

const { FIREBASE_API_KEY } = api_keys;
const { UseLazyApi, UseLazyServerApi, UseApi } = wrappedApi({ store });

export const getArticledParsed = (url) => UseLazyApi('GET', `parser?url=${url}`);


const supabaseUrl = supabaseDb.SUPA_URL;
const supabaseAnonKey = supabaseDb.SUPA_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);





export async function insertPost(postData) {
	const now = new Date().toISOString()

	const { data, error } = await supabase
		.from('posts')
		.insert({
			...postData,
			savedOn: now
		})
		.select()

	if (error) {
		console.error('Errore durante l\'inserimento del post:', error)
		throw error
	}

	console.log('Post inserito con successo:', data)
	return data
}













export const registerUser = () => UseLazyServerApi('POST', 'users.json');
export const saveReadingList = () => {
	const { tokenApp } = store.getState().app
	return UseLazyServerApi('POST', `readingList.json?auth=${tokenApp}`)
};
export const getTagsHandler = () => {
	const { tokenApp } = store.getState().app
	return UseApi('GET', `tags.json?auth=${tokenApp}`)
};
export const saveTagsHandler = () => {
	const { tokenApp } = store.getState().app
	return UseLazyServerApi('POST', `tags.json?auth=${tokenApp}`)
};




export const fetchSignUp = async (data, mode) => {
	const { email, password, returnSecureToken } = data;
	let url = mode === 'SIGNUP'
		? 'signUp'
		: 'signInWithPassword'
	return await fetch(`${endpoint.firebase_auth}/v1/accounts:${url}?key=${FIREBASE_API_KEY}`, {
		method: 'POST',
		body: JSON.stringify({
			email: email,
			password: password,
			returnSecureToken: returnSecureToken
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	}).then(response => {
		if (response.ok) {
			return response.json()
		} else {
			return response.json().then(data => {
				const { error } = data
				error['ok'] = false
				return error
			})
		}
	})
};
