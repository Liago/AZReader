import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@store/rest';
import { Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

interface UseReadingLoggerOptions {
	articleId: string;
	session: Session | null;
	// Minimum time in seconds before logging (prevents accidental opens)
	minimumReadTime?: number;
	// How often to update the log in seconds
	updateInterval?: number;
	// Auto-start tracking
	autoStart?: boolean;
}

interface ReadingLogEntry {
	user_id: string;
	article_id: string;
	read_at: string;
	duration_seconds: number;
	progress_percentage: number;
	device_info: {
		platform: string;
		model?: string;
		osVersion?: string;
		appVersion?: string;
		manufacturer?: string;
	};
}

export const useReadingLogger = ({
	articleId,
	session,
	minimumReadTime = 5, // Don't log if read for less than 5 seconds
	updateInterval = 30, // Update every 30 seconds
	autoStart = true
}: UseReadingLoggerOptions) => {
	const startTimeRef = useRef<number>(0);
	const lastUpdateRef = useRef<number>(0);
	const progressRef = useRef<number>(0);
	const isTrackingRef = useRef<boolean>(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const logIdRef = useRef<string | null>(null);
	const deviceInfoRef = useRef<ReadingLogEntry['device_info'] | null>(null);

	// Get device information once
	useEffect(() => {
		const getDeviceInfo = async () => {
			try {
				const platform = Capacitor.getPlatform();

				// For web platform - get browser info
				if (platform === 'web') {
					deviceInfoRef.current = {
						platform: 'web',
						model: navigator.userAgent,
						appVersion: process.env.REACT_APP_VERSION || '1.0.0'
					};
				} else {
					// For native platforms, use basic info (Device plugin can be added later)
					deviceInfoRef.current = {
						platform,
						appVersion: process.env.REACT_APP_VERSION || '1.0.0'
					};
				}
			} catch (error) {
				console.error('Error getting device info:', error);
				deviceInfoRef.current = {
					platform: Capacitor.getPlatform(),
					appVersion: process.env.REACT_APP_VERSION || '1.0.0'
				};
			}
		};

		getDeviceInfo();
	}, []);

	// Calculate current reading duration
	const getCurrentDuration = useCallback((): number => {
		if (startTimeRef.current === 0) return 0;
		return Math.floor((Date.now() - startTimeRef.current) / 1000);
	}, []);

	// Update progress percentage
	const updateProgress = useCallback((progress: number) => {
		progressRef.current = Math.min(Math.max(progress, 0), 100);
	}, []);

	// Create or update reading log entry
	const saveReadingLog = useCallback(async (isFinal: boolean = false) => {
		if (!session?.user || !articleId) return;

		const duration = getCurrentDuration();

		// Don't log if below minimum read time (unless it's the final save and we're at 90%+)
		if (duration < minimumReadTime && !(isFinal && progressRef.current >= 90)) {
			return;
		}

		try {
			const logEntry: Omit<ReadingLogEntry, 'id'> = {
				user_id: session.user.id,
				article_id: articleId,
				read_at: new Date().toISOString(),
				duration_seconds: duration,
				progress_percentage: Math.round(progressRef.current),
				device_info: deviceInfoRef.current || { platform: 'unknown' }
			};

			if (logIdRef.current && !isFinal) {
				// Update existing log entry
				const { error } = await supabase
					.from('reading_log')
					.update({
						duration_seconds: logEntry.duration_seconds,
						progress_percentage: logEntry.progress_percentage,
						read_at: logEntry.read_at
					})
					.eq('id', logIdRef.current);

				if (error) {
					console.error('Error updating reading log:', error);
					// If update fails, try creating a new entry
					logIdRef.current = null;
					await saveReadingLog(isFinal);
				}
			} else {
				// Create new log entry
				const { data, error } = await supabase
					.from('reading_log')
					.insert([logEntry])
					.select('id')
					.single();

				if (error) {
					console.error('Error creating reading log:', error);
				} else if (data) {
					logIdRef.current = data.id;
				}
			}

			lastUpdateRef.current = Date.now();
		} catch (error) {
			console.error('Error in saveReadingLog:', error);
		}
	}, [session, articleId, minimumReadTime, getCurrentDuration]);

	// Start tracking
	const startTracking = useCallback(() => {
		if (isTrackingRef.current || !session?.user) return;

		startTimeRef.current = Date.now();
		lastUpdateRef.current = Date.now();
		isTrackingRef.current = true;

		// Set up periodic updates
		intervalRef.current = setInterval(() => {
			const timeSinceLastUpdate = (Date.now() - lastUpdateRef.current) / 1000;

			if (timeSinceLastUpdate >= updateInterval) {
				saveReadingLog(false);
			}
		}, updateInterval * 1000);

		// Initial save after minimum read time
		setTimeout(() => {
			if (isTrackingRef.current) {
				saveReadingLog(false);
			}
		}, minimumReadTime * 1000);
	}, [session, updateInterval, minimumReadTime, saveReadingLog]);

	// Stop tracking
	const stopTracking = useCallback(async () => {
		if (!isTrackingRef.current) return;

		isTrackingRef.current = false;

		// Clear interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		// Final save
		await saveReadingLog(true);

		// Reset refs (except deviceInfo which is static)
		startTimeRef.current = 0;
		lastUpdateRef.current = 0;
		progressRef.current = 0;
		logIdRef.current = null;
	}, [saveReadingLog]);

	// Pause tracking (useful when app goes to background)
	const pauseTracking = useCallback(async () => {
		if (!isTrackingRef.current) return;

		// Save current state
		await saveReadingLog(false);

		// Clear interval but don't reset tracking state
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [saveReadingLog]);

	// Resume tracking (after pause)
	const resumeTracking = useCallback(() => {
		if (!isTrackingRef.current || intervalRef.current) return;

		// Resume interval
		intervalRef.current = setInterval(() => {
			const timeSinceLastUpdate = (Date.now() - lastUpdateRef.current) / 1000;

			if (timeSinceLastUpdate >= updateInterval) {
				saveReadingLog(false);
			}
		}, updateInterval * 1000);
	}, [updateInterval, saveReadingLog]);

	// Auto-start if enabled
	useEffect(() => {
		if (autoStart && session?.user && articleId) {
			startTracking();
		}

		return () => {
			if (isTrackingRef.current) {
				stopTracking();
			}
		};
	}, [autoStart, session, articleId, startTracking, stopTracking]);

	// Handle app visibility changes (pause/resume)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				pauseTracking();
			} else {
				resumeTracking();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [pauseTracking, resumeTracking]);

	return {
		startTracking,
		stopTracking,
		pauseTracking,
		resumeTracking,
		updateProgress,
		isTracking: isTrackingRef.current,
		currentDuration: getCurrentDuration()
	};
};
