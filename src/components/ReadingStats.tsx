import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/react';
import { timeOutline, bookOutline, eyeOutline, trendingUpOutline } from 'ionicons/icons';
import { supabase } from '@store/rest';
import { Session } from '@supabase/supabase-js';

interface ReadingStatsProps {
	session: Session | null;
	className?: string;
}

interface Stats {
	totalArticlesRead: number;
	totalReadingTime: number; // in seconds
	averageProgress: number; // percentage
	articlesThisWeek: number;
	articlesThisMonth: number;
}

const ReadingStats: React.FC<ReadingStatsProps> = ({ session, className = '' }) => {
	const [stats, setStats] = useState<Stats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			if (!session?.user) {
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// Fetch all reading logs for the user
				const { data: logs, error: logsError } = await supabase
					.from('reading_log')
					.select('duration_seconds, progress_percentage, read_at')
					.eq('user_id', session.user.id);

				if (logsError) throw logsError;

				if (logs && logs.length > 0) {
					// Calculate total reading time
					const totalTime = logs.reduce((sum, log) => sum + (log.duration_seconds || 0), 0);

					// Calculate average progress
					const validProgressLogs = logs.filter(log => log.progress_percentage !== null);
					const avgProgress = validProgressLogs.length > 0
						? validProgressLogs.reduce((sum, log) => sum + (log.progress_percentage || 0), 0) / validProgressLogs.length
						: 0;

					// Count articles read this week
					const oneWeekAgo = new Date();
					oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
					const articlesThisWeek = logs.filter(log =>
						log.read_at && new Date(log.read_at) >= oneWeekAgo
					).length;

					// Count articles read this month
					const oneMonthAgo = new Date();
					oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
					const articlesThisMonth = logs.filter(log =>
						log.read_at && new Date(log.read_at) >= oneMonthAgo
					).length;

					setStats({
						totalArticlesRead: logs.length,
						totalReadingTime: totalTime,
						averageProgress: Math.round(avgProgress),
						articlesThisWeek,
						articlesThisMonth
					});
				} else {
					setStats({
						totalArticlesRead: 0,
						totalReadingTime: 0,
						averageProgress: 0,
						articlesThisWeek: 0,
						articlesThisMonth: 0
					});
				}
			} catch (err: any) {
				console.error('Error fetching reading stats:', err);
				setError(err.message || 'Failed to load reading statistics');
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [session]);

	const formatTime = (seconds: number): string => {
		if (seconds < 60) return `${seconds}s`;

		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours < 24) {
			return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
		}

		const days = Math.floor(hours / 24);
		const remainingHours = hours % 24;
		return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
	};

	if (isLoading) {
		return (
			<IonCard className={`reading-stats ${className}`}>
				<IonCardContent className="flex items-center justify-center py-8">
					<IonSpinner />
				</IonCardContent>
			</IonCard>
		);
	}

	if (error) {
		return (
			<IonCard className={`reading-stats ${className}`}>
				<IonCardContent>
					<p className="text-center text-red-500">{error}</p>
				</IonCardContent>
			</IonCard>
		);
	}

	if (!stats) {
		return null;
	}

	return (
		<IonCard className={`reading-stats ${className}`}>
			<IonCardContent>
				<h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
					📊 Le tue statistiche di lettura
				</h3>

				<div className="grid grid-cols-2 gap-4">
					{/* Total Articles Read */}
					<div className="stat-item p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
						<div className="flex items-center gap-2 mb-1">
							<IonIcon icon={bookOutline} className="text-blue-500 text-xl" />
							<span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
								Articoli letti
							</span>
						</div>
						<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
							{stats.totalArticlesRead}
						</div>
					</div>

					{/* Total Reading Time */}
					<div className="stat-item p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
						<div className="flex items-center gap-2 mb-1">
							<IonIcon icon={timeOutline} className="text-green-500 text-xl" />
							<span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
								Tempo totale
							</span>
						</div>
						<div className="text-2xl font-bold text-green-600 dark:text-green-400">
							{formatTime(stats.totalReadingTime)}
						</div>
					</div>

					{/* Average Progress */}
					<div className="stat-item p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
						<div className="flex items-center gap-2 mb-1">
							<IonIcon icon={eyeOutline} className="text-purple-500 text-xl" />
							<span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
								Completamento medio
							</span>
						</div>
						<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
							{stats.averageProgress}%
						</div>
					</div>

					{/* This Week */}
					<div className="stat-item p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
						<div className="flex items-center gap-2 mb-1">
							<IonIcon icon={trendingUpOutline} className="text-orange-500 text-xl" />
							<span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
								Questa settimana
							</span>
						</div>
						<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
							{stats.articlesThisWeek}
						</div>
					</div>
				</div>

				{/* Monthly Summary */}
				<div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-600 dark:text-gray-400">Ultimo mese:</span>
						<span className="font-bold text-gray-800 dark:text-gray-200">
							{stats.articlesThisMonth} articoli
						</span>
					</div>
				</div>
			</IonCardContent>

			<style>{`
				.reading-stats {
					margin: 1rem 0;
				}

				.reading-stats ion-card-content {
					padding: 1rem;
				}

				.stat-item {
					transition: transform 0.2s ease, box-shadow 0.2s ease;
				}

				.stat-item:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				}

				@media (max-width: 480px) {
					.stat-item {
						padding: 0.75rem;
					}

					.stat-item .text-2xl {
						font-size: 1.5rem;
					}

					.stat-item .text-xs {
						font-size: 0.625rem;
					}
				}
			`}</style>
		</IonCard>
	);
};

export default ReadingStats;
