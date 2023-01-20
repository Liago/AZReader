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
import moment from "moment";

const firebaseConfig = {
	apiKey: "AIzaSyA632E4gGYfpSpHkmTN54PMtmbrPMV6otM",
	authDomain: "ezreader-91cdd.firebaseapp.com",
	databaseURL: "https://ezreader-91cdd.firebaseio.com",
	projectId: "ezreader-91cdd",
	storageBucket: "ezreader-91cdd.appspot.com",
	messagingSenderId: "745384371074",
	appId: "1:745384371074:web:f93f1e2adadb7ea0c7259b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app)
const postsCol = collection(db, 'posts');

export const authenticateAnonymously = () => {
	return signInAnonymously(getAuth(app));
};

export const getPostList = async () => {
	const postsSnapshot = await getDocs(postsCol);
	const postsList = postsSnapshot.docs.map(post => ({...post.data(), id: post.id}));
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

export const deletePostFromFirestore = async (postId) =>  {
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