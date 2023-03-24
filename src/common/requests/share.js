import { addDoc, collection, getDocs, query } from "@firebase/firestore";
import { db } from '../firestore';

const shareCollection = collection(db, 'share_requests');

const executeQuery = async (query) => {
	const querySnapshot = await getDocs(query);
	const queryResponse = querySnapshot.docs.map(user => ({ ...user.data() }));
	return queryResponse;
}

export const saveShareRequestToFirestore = async (payload) => {
	return await addDoc(shareCollection, payload)
}

export const getRequestsList = async () => {
	const shareQuery = query(shareCollection);
	return executeQuery(shareQuery);
};
