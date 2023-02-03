import { initializeApp } from "firebase/app";
import { Capacitor } from '@capacitor/core';
import {
	getFirestore, query, orderBy, onSnapshot,
	collection, getDocs, addDoc, updateDoc,
	doc, serverTimestamp, arrayUnion, deleteDoc,
	writeBatch
} from "firebase/firestore";
import {
	getAuth, signInAnonymously, createUserWithEmailAndPassword,
	signInWithEmailAndPassword, sendEmailVerification, indexedDBLocalPersistence,
	initializeAuth
} from "firebase/auth";
import { api_keys, firebase } from "../config/environment";
import moment from "moment";


const firebaseConfig = {
	apiKey: api_keys.FIREBASE_API_KEY,
	authDomain: firebase.AUTH_DOMAIN,
	databaseURL: firebase.DB_URL,
	projectId: firebase.PROJECT_ID,
	storageBucket: firebase.STORAGE_BUCKET,
	messagingSenderId: firebase.SENDER_ID,
	appId: firebase.APP_ID,
};

const app = initializeApp(firebaseConfig);
if (Capacitor.isNativePlatform)
	initializeAuth(app, { persistence: indexedDBLocalPersistence });

const auth = getAuth(app);
const db = getFirestore(app);
const postsCollection = collection(db, 'posts');


export { auth }

const executeQuery = async (query) => {
	const querySnapshot = await getDocs(query);
	const queryResponse = querySnapshot.docs.map(post => ({ ...post.data(), id: post.id }));
	console.log('queryResponse :>> ', queryResponse);
	return queryResponse;
}


export const userLogin = async (email, password) => {
	console.log('signInWithEmailAndPassword started', { email: email, password: password })
	try {
		return await signInWithEmailAndPassword(auth, email, password)
			.then((response) => {
				console.log('success!', { data: response.user })
				return { success: true, data: response.user }
			}).catch(err => {
				return { success: false, message: err.message, code: err.code }
			})
	} catch (err) {
		console.log('err :>> ', err);
	}
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

export const getPostList = async (field, order) => {
	const postsQuery = query(postsCollection, orderBy(field, order));
	return executeQuery(postsQuery);
};

export const savePostToFirestore = async (post) => {
	if (!post.date_published) post['date_published'] = moment().format();
	return await addDoc(postsCollection, post);
}

export const updatePostToFirestore = async (postId, payload) => {
	const postDoc = doc(db, 'posts', postId);
	return await updateDoc(postDoc, payload);
}

export const deletePostFromFirestore = async (postId) => {
	const postDoc = doc(db, 'posts', postId);
	return await deleteDoc(postDoc);
}

export const batchEditing = async () => {
	const batch = writeBatch(db);
	// const nycRef = doc(db, "posts", '3EEeF5T5tSU0PL35LRye');

	// console.log('nycRef :>> ', nycRef);
	// batch.update(nycRef, {"savedBy": "7815BcDJ1sc7WRqfnbIQfMr7Tmc2"});
	// await batch.commit();

	getPostList('date_published', 'asc')
		.then((resp) => {
			resp.forEach(async (doc) => {
				// doc.data() contains the document data
				console.log('id', doc.id);
				const postRef = doc(db, "posts", doc.id);
				batch.update(postRef, { "savedBy": "7815BcDJ1sc7WRqfnbIQfMr7Tmc2" });
				await batch.commit()
			});
		});

}








export const authenticateAnonymously = () => {
	return signInAnonymously(getAuth(app));
};

export const getGroceryListItems = (groceryListId) => {
	const itemsColRef = collection(db, 'groceryLists', groceryListId, 'items')
	return getDocs(itemsColRef)
}

export const streamGroceryListItems = (groceryListId, snapshot, error) => {
	const itemsColRef = collection(db, 'groceryLists', groceryListId, 'items')
	const itemsQuery = query(itemsColRef, orderBy('created'))
	return onSnapshot(itemsQuery, snapshot, error);
};

export const addUserToGroceryList = (userName, groceryListId, userId) => {
	const groceryDocRef = doc(db, 'groceryLists', groceryListId)
	return updateDoc(groceryDocRef, {
		users: arrayUnion({
			userId: userId,
			name: userName
		})
	});
};

export const addGroceryListItem = (item, groceryListId, userId) => {
	return getGroceryListItems(groceryListId)
		.then(querySnapshot => querySnapshot.docs)
		.then(groceryListItems => groceryListItems.find(groceryListItem => groceryListItem.data().name.toLowerCase() === item.toLowerCase()))
		.then((matchingItem) => {
			if (!matchingItem) {
				const itemsColRef = collection(db, 'groceryLists', groceryListId, 'items')
				return addDoc(itemsColRef, {
					name: item,
					created: serverTimestamp(),
					createdBy: userId
				});
			}
			throw new Error('duplicate-item-error');
		});
};
export const createGroceryList = (userName, userId) => {
	const groceriesColRef = collection(db, 'groceryLists')
	return addDoc(groceriesColRef, {
		created: serverTimestamp(),
		createdBy: userId,
		users: [{
			userId: userId,
			name: userName
		}]
	});
};