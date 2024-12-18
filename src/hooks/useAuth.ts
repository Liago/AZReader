import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import * as actionTypes from "@store/actionTypes";

import { supabase } from "@store/rest";

interface User {
	id: string;
	email?: string;
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
			session ? dispatch({ type: actionTypes.SET_SESSION, payload: session }) : dispatch({ type: actionTypes.CLEAR_SESSION });
		});

		return () => subscription.unsubscribe();
	}, [dispatch]);

	const signIn = async (email: string) => {
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					shouldCreateUser: true, // Questo creerà un nuovo utente se non esiste
					emailRedirectTo: window.location.origin,
				},
			});
			console.log("🚀 ~ signIn ~ data:", data);

			if (error) throw error;

			// Se l'operazione è riuscita, data.user sarà null perché l'OTP non è ancora stato verificato
			console.log("OTP inviato con successo");
		} catch (error) {
			console.error("Errore durante il sign-in:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		setLoading(true);
		await supabase.auth.signOut();
		dispatch({ type: actionTypes.CLEAR_SESSION });
		setLoading(false);
	};

	const verifyOtp = async (email: string, token: string) => {
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.verifyOtp({
				email,
				token,
				type: "email",
			});

			if (error) throw error;

			// Se la verifica ha successo, data.user conterrà le informazioni dell'utente
			if (data.user) {
				console.log("OTP verificato con successo");
				// Qui puoi gestire eventuali azioni post-verifica
			}
		} catch (error) {
			console.error("Errore durante la verifica OTP:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return { session, loading, signIn, signOut, verifyOtp };
};

export default useAuth;
