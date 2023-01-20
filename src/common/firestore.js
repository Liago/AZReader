import { initializeApp } from "firebase/app";
import {
	getFirestore,
	query,
	orderBy,
	onSnapshot,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	doc,
	serverTimestamp,
	arrayUnion,
	deleteDoc
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
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
const db = getFirestore(app)
const postsCol = collection(db, 'posts');

export const authenticateAnonymously = () => {
	return signInAnonymously(getAuth(app));
};

export const getPostList = async () => {
	const postsSnapshot = await getDocs(postsCol);
	const postsList = postsSnapshot.docs.map(post => ({ ...post.data(), id: post.id }));
	return postsList;
}

export const savePostToFirestore = async (post) => {
	if (!post.date_published) post['date_published'] = moment().format();
	return await addDoc(postsCol, post);
}

export const updatePostToFirestore = async (postId, payload) => {
	const postDoc = doc(db, 'posts', postId);
	return await updateDoc(postDoc, payload);
}

export const deletePostFromFirestore = async (postId) => {
	const postDoc = doc(db, 'posts', postId);
	return await deleteDoc(postDoc);
}




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