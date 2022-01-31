import { wrappedApi } from "../common/api";
import { store } from "./store";
import { endpoint, FIREBASE_API_KEY } from "../config/appSettings";


const { UseApi, UseLazyApi, UseLazyAuthApi } = wrappedApi({ store });

export const getArticledParsed = (url) => UseLazyApi('GET', `parser?url=${url}`);

export const signUpHandler = () => UseLazyAuthApi('POST', `v1/accounts:signUp?key=${FIREBASE_API_KEY}`)


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
}