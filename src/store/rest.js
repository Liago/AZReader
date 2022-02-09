import { wrappedApi } from "../common/api";
import { store } from "./store";
import { endpoint, api_keys } from "../config/environment.ts";

const { FIREBASE_API_KEY } = api_keys;
const { UseLazyApi, UseLazyServerApi } = wrappedApi({ store });

export const getArticledParsed = (url) => UseLazyApi('GET', `parser?url=${url}`);

export const savePostToDb = () => {
	const { tokenApp } = store.getState().app;
	return UseLazyServerApi('POST', `post.json?auth=${tokenApp}`)
};

export const getPostFromDb = () => {
	const { tokenApp } = store.getState().app
	return UseLazyServerApi('GET', `post.json?auth=${tokenApp}`)
};

export const registerUser = () => UseLazyServerApi('POST', 'users.json');

export const saveReadingList = () => UseLazyServerApi('POST', 'readingList.json');

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
