import { addDoc, collection } from "@firebase/firestore";
import { db } from '../firestore';

const shareCollection = collection(db, 'share_requests');

export const saveShareRequestToFirestore = async (payload) => {
	return await addDoc(shareCollection, payload)
}