import { addDoc, collection, doc, getDocs, query, updateDoc } from "@firebase/firestore";
import { db } from '../firestore';

const shareCollection = collection(db, 'share_requests');

const executeQuery = async (query) => {
	const querySnapshot = await getDocs(query);
	const queryResponse = querySnapshot.docs.map(item => ({ ...item.data(), id: item.id }));
	return queryResponse;
}

export const saveShareRequestToFirestore = async (payload) => {
	return await addDoc(shareCollection, payload)
}

export const getRequestsList = async () => {
	const shareQuery = query(shareCollection);
	return executeQuery(shareQuery);
};

export const updateShareRequest = async (docId, payload) => {
	const shareDoc = doc(db, "share_requests", docId);
	return await updateDoc(shareDoc, payload);
}