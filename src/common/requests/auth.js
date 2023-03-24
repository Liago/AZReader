import { createUserWithEmailAndPassword, sendEmailVerification, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firestore';


export const userLogin = async (email, password) => {
	return await signInWithEmailAndPassword(auth, email, password)
		.then((response) => {
			return { success: true, data: response.user }
		}).catch(err => {
			return { success: false, message: err.message, code: err.code }
		})
}

export const userRegistration = async (email, password) => {
	return await createUserWithEmailAndPassword(auth, email, password)
		.then(() => {
			return sendEmailVerification(auth.currentUser)
				.then(() => {
					return { success: true, currentUser: auth.currentUser }
				})
		})
		.catch(err => console.log(err.message))
}

export const authenticateAnonymously = () => {
	return signInAnonymously(auth);
};
