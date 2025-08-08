import { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { sendEmailVerification } from 'firebase/auth';

// import { useAuthValue } from '../context/auth/authContext'; // TODO: Update to use Supabase auth
import { auth } from '@common/firestore';

import LayoutPage from '@components/ui/layoutPage';

const VerifyEmail = () => {
	// TODO: Update to use Supabase auth
	const currentUser = null; // const { currentUser } = useAuthValue()
	const [time, setTime] = useState(60)
	const [timeActive, setTimeActive] = useState(false); // const { timeActive, setTimeActive } = useAuthValue()
	const router = useIonRouter();

	useEffect(() => {
		const interval = setInterval(() => {
			currentUser?.reload()
				.then(() => {
					if (!currentUser?.emailVerified) return;

					clearInterval(interval)
					router.push('/');
				})
				.catch((err) => {
					alert(err.message)
				})
		}, 3000)
	}, [currentUser])

	useEffect(() => {
		let interval = null
		if (timeActive && time !== 0) {
			interval = setInterval(() => {
				setTime((time) => time - 1)
			}, 1000)
		} else if (time === 0) {
			setTimeActive(false)
			setTime(60)
			clearInterval(interval)
		}
		return () => clearInterval(interval);
	}, [timeActive, time, setTimeActive])

	const resendEmailVerification = () => {
		sendEmailVerification(auth.currentUser)
			.then(() => {
				setTimeActive(true)
			}).catch((err) => {
				alert(err.message)
			})
	}

	return (
		<LayoutPage>


			<div className="bg-white py-24">
				<div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center justify-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white sm:shrink-0">
						<svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
						</svg>
					</div>
					<div className="text-center">
						<h2 className="text-3xl font-semibold leading-8 text-indigo-600 text-center py-8">Verifica il tuo indirizzo email</h2>
						<p className="mt-2 text-lg font-semibold leading-8 text-gray-900">Una email di verifica è stata inviata all'indirizzo:</p>
						<p className="mx-auto mt-6 max-w-2xl text-xl font-bold leading-8 text-red-600 pb-8">{currentUser?.email}</p>
					</div>

					<div className="relative flex flex-col gap-6 sm:flex-row md:flex-col lg:flex-row text-center">
						<div className="sm:min-w-0 sm:flex-1">
							<p className="text-lg font-semibold leading-8 text-gray-900">Segui le istruzioni contenute nella email per confermare il tuo account</p>
							<p className="mt-12 text-base leading-7 text-gray-600">
								<button
									className="rounded-md bg-indigo-500 px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-md"
									onClick={resendEmailVerification}
									disabled={timeActive}
								>Reinvia ancora la mail {timeActive && time}</button>
							</p>
						</div>
					</div>
				</div>
			</div>
		</LayoutPage >
	)
}

export default VerifyEmail