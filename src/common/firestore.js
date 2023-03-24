import { initializeApp } from "firebase/app";
import { Capacitor } from '@capacitor/core';
import {
	getFirestore, query, orderBy, onSnapshot,
	collection, getDocs, addDoc, updateDoc,
	doc, serverTimestamp, arrayUnion
} from "firebase/firestore";
import { getAuth, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { api_keys, firebase } from "../config/environment";


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

export { auth, db }


// TUTTE FUNZIONI DI TEST
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