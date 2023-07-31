import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where, writeBatch } from "@firebase/firestore";
import moment from "moment";
import { db } from '../firestore';
import { store } from "../../store/store";


const postsCollection = collection(db, 'posts');

const executeQuery = async (query) => {
	const querySnapshot = await getDocs(query);
	const queryResponse = querySnapshot.docs.map(post => ({ ...post.data(), id: post.id }));
	console.log('executeQuery :>> ', {
		postsOnDb: queryResponse.length,
		posts: queryResponse
	});
	return queryResponse;
}


export const getCollection = async () => {
	const postsQuery = query(
		postsCollection,
		where('savedBy', '==', "7815BcDJ1sc7WRqfnbIQfMr7Tmc2"),
		orderBy('savedOn', 'desc')
	);
	return executeQuery(postsQuery);
}

export const getPostList = async (field, order) => {
	const postsQuery = query(postsCollection, orderBy(field, order ? 'asc' : 'desc'));
	return executeQuery(postsQuery);
};


export const __getPostList = async () => {
	const { supabase } = store.getState().app
	console.log('supabase :>> ', supabase);
	const { data: posts, error } = await supabase
		.from('posts')
		.select('*')
		// .range(0, 9)
		.order('savedOn', { ascending: false })

	return {
		posts,
		error
	}
}


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