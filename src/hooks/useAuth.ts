import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as actionTypes from "../store/actionTypes";
import { supabase } from "../store/rest";

interface User {
	id: string;
	email?: string;
	// Altre proprietà dell'utente...
}

interface Session {
	user: User;
}

export const useAuth = () => {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const dispatch = useDispatch();

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setLoading(false);
			if (session) {
				dispatch({ type: actionTypes.SET_SESSION, payload: session });
			}
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setLoading(false);
			if (session) {
				dispatch({ type: actionTypes.SET_SESSION, payload: session });
			} else {
				dispatch({ type: actionTypes.CLEAR_SESSION });
			}
		});

		return () => subscription.unsubscribe();
	}, [dispatch]);

	const signIn = async (email: string) => {
		setLoading(true);
		const { error } = await supabase.auth.signInWithOtp({ email });
		setLoading(false);
		if (error) throw error;
	};

	const signOut = async () => {
		setLoading(true);
		await supabase.auth.signOut();
		dispatch({ type: actionTypes.CLEAR_SESSION });
		setLoading(false);
	};

	const verifyOtp = async (email: string, token: string) => {
		setLoading(true);
		const { error } = await supabase.auth.verifyOtp({
			email,
			token,
			type: "email",
		});
		setLoading(false);
		if (error) throw error;
	};

	return { session, loading, signIn, signOut, verifyOtp };
};

export default useAuth;
