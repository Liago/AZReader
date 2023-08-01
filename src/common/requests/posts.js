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
	console.log('getPostList :>> ', {
		selectFrom: field,
		ascending: order
	});
	const { supabase } = store.getState().app
	const { data: posts, error } = await supabase
		.from("posts")
		.select("*")
		.order(field, { ascending: order })

	return {
		posts,
		error
	}
}


export const savePostToDatabase = async (post) => {
	const { supabase } = store.getState().app;
	const { data, error } = await supabase
		.from('posts')
		.insert(post)
	return data
}


export const updatePostToDatabase = async (postId, payload) => {
	const { supabase } = store.getState().app;

	// DA VERIFICARE QUESTO PAYLOAD...

	const { data, error } = await supabase
		.from('posts')
		.update({ other_column: 'otherValue' })
		.eq('doc_id', postId)
		.select()

	return data;	
}

export const deletePostFromDatabase = async (postId) => {
	const { supabase } = store.getState().app;

	const { error } = await supabase
		.from('posts')
		.delete()
		.eq('doc_id', postId)


}



export const batchEditing = async () => {

	getPostList('savedOn', 'asc')
		.then((resp) => {
			resp.posts.forEach((doc) => {
				console.log('id', doc.id);

				const newSavedOnValue = Date.now() - 100000000000;
				setTimeout(() => {
					updateDocument(newSavedOnValue, doc)
				}, 500);
			});
		});
}

export const updateDocument = async (newSavedOnValue, record) => {
	const { supabase } = store.getState().app;

	const { data: updatedRecord, error: updateError } = await supabase
		.from('posts')
		.update({ savedOn: newSavedOnValue })
		.eq('firestore_id', record.firestore_id);

	updateError
		? console.error('Errore durante l\'aggiornamento del record', record.firestore_id)
		: console.log('Record aggiornato:', updatedRecord)

}