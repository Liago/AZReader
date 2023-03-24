import { addDoc, collection, getDocs, query } from "@firebase/firestore";
import { db } from '../firestore';

const usersCollection = collection(db, 'users');

const executeQuery = async (query) => {
	const querySnapshot = await getDocs(query);
	const queryResponse = querySnapshot.docs.map(user => ({ ...user.data() }));
	console.log('executeQuery :>> ', {
		usersOnDb: queryResponse.length,
		users: queryResponse
	});
	return queryResponse;
}


export const getUsersList = async () => {
	const usersQuery = query(usersCollection);
	return executeQuery(usersQuery);
};

export const saveUserToFirestore = async (user) => {
	return await addDoc(usersCollection, user)
}