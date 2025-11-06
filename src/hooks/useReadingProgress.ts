import { useState, useEffect, useCallback, useRef } from 'react';

interface UseReadingProgressOptions {
  // Elemento contenitore per il calcolo (default: window)
  container?: HTMLElement | null;
  // Soglia minima di lettura in percentuale prima di iniziare il tracking
  startThreshold?: number;
  // Intervallo di aggiornamento in ms
  updateInterval?: number;
  // Velocità di lettura media (parole al minuto)
  averageReadingSpeed?: number;
}

interface ReadingProgressData {
  // Percentuale di scroll (0-100)
  scrollProgress: number;
  // Percentuale stimata di lettura completata (0-100)
  readingProgress: number;
  // Tempo trascorso in secondi
  timeElapsed: number;
  // Tempo di lettura stimato in minuti
  estimatedReadingTime: number;
  // Tempo rimanente stimato in minuti
  estimatedRemainingTime: number;
  // Numero di parole nell'articolo
  wordCount: number;
  // Posizione di scroll attuale in pixel
  scrollPosition: number;
  // Altezza totale del contenuto
  contentHeight: number;
  // Se l'utente sta leggendo attivamente
  isReading: boolean;
}

interface UseReadingProgressReturn extends ReadingProgressData {
  // Funzioni di controllo
  startTracking: () => void;
  stopTracking: () => void;
  resetTracking: () => void;
  // Stato
  isTracking: boolean;
}

export const useReadingProgress = (
  contentElement: HTMLElement | null,
  options: UseReadingProgressOptions = {}
): UseReadingProgressReturn => {
  const {
    container = null,
    startThreshold = 5,
    updateInterval = 1000,
    averageReadingSpeed = 200 // WPM
  } = options;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(0);
  const [estimatedRemainingTime, setEstimatedRemainingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const startTimeRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calcola il numero di parole nel contenuto
  const calculateWordCount = useCallback((element: HTMLElement): number => {
    if (!element) return 0;
    
    const text = element.innerText || element.textContent || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }, []);

  // Calcola il tempo di lettura stimato
  const calculateEstimatedReadingTime = useCallback((words: number): number => {
    return Math.ceil(words / averageReadingSpeed);
  }, [averageReadingSpeed]);

  // Calcola la posizione di scroll e la percentuale
  const calculateScrollProgress = useCallback((): { progress: number, position: number, height: number } => {
    const scrollContainer = container || window;
    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    if (scrollContainer === window) {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      const element = scrollContainer as HTMLElement;
      scrollTop = element.scrollTop;
      scrollHeight = element.scrollHeight;
      clientHeight = element.clientHeight;
    }

    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    return {
      progress: Math.min(Math.max(progress, 0), 100),
      position: scrollTop,
      height: scrollHeight
    };
  }, [container]);

  // Gestisce il cambiamento di scroll
  const handleScroll = useCallback(() => {
    if (!isTracking) return;

    const { progress, position, height } = calculateScrollProgress();
    setScrollProgress(progress);
    setScrollPosition(position);
    setContentHeight(height);

    // Calcola il progresso di lettura basato su scroll e content
    // Assume che il progresso di lettura sia leggermente più avanzato dello scroll
    // per compensare il fatto che le persone non scrollano fino alla fine
    const adjustedProgress = Math.min(progress * 1.1, 100);
    setReadingProgress(adjustedProgress);

    // Aggiorna il tempo di ultima attività
    lastActivityRef.current = Date.now();
    setIsReading(true);

    // Resetta il timeout per rilevare quando smette di scrollare
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsReading(false);
    }, 3000); // Se non scrolla per 3 secondi, considera che ha smesso di leggere

  }, [isTracking, calculateScrollProgress]);

  // Timer per aggiornare il tempo trascorso
  const updateTimer = useCallback(() => {
    if (!isTracking || startTimeRef.current === 0) return;

    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    setTimeElapsed(elapsed);

    // Calcola tempo rimanente basato sul progresso
    if (readingProgress > 0 && readingProgress < 100) {
      const totalEstimatedTime = estimatedReadingTime * 60; // in secondi
      const progressRatio = readingProgress / 100;
      const elapsedRatio = elapsed / totalEstimatedTime;
      
      // Usa una media tra tempo trascorso effettivo e progresso di scroll
      const weightedRatio = (progressRatio + elapsedRatio) / 2;
      const remaining = totalEstimatedTime * (1 - weightedRatio);
      setEstimatedRemainingTime(Math.max(Math.ceil(remaining / 60), 0));
    }
  }, [isTracking, readingProgress, estimatedReadingTime]);

  // Inizializza il tracking
  const startTracking = useCallback(() => {
    if (!contentElement) return;

    const words = calculateWordCount(contentElement);
    const estimatedTime = calculateEstimatedReadingTime(words);
    
    setWordCount(words);
    setEstimatedReadingTime(estimatedTime);
    setEstimatedRemainingTime(estimatedTime);
    
    startTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    setIsTracking(true);

    // Calcolo iniziale
    handleScroll();
  }, [contentElement, calculateWordCount, calculateEstimatedReadingTime, handleScroll]);

  // Ferma il tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setIsReading(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  // Resetta tutto
  const resetTracking = useCallback(() => {
    stopTracking();
    setScrollProgress(0);
    setReadingProgress(0);
    setTimeElapsed(0);
    setEstimatedRemainingTime(estimatedReadingTime);
    setScrollPosition(0);
    startTimeRef.current = 0;
    lastActivityRef.current = Date.now();
  }, [stopTracking, estimatedReadingTime]);

  // Effect per gestire gli event listeners
  useEffect(() => {
    if (!isTracking) return;

    const scrollContainer = container || window;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Timer per aggiornamenti regolari
    timerRef.current = setInterval(updateTimer, updateInterval);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, container, handleScroll, updateTimer, updateInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollProgress,
    readingProgress,
    timeElapsed,
    estimatedReadingTime,
    estimatedRemainingTime,
    wordCount,
    scrollPosition,
    contentHeight,
    isReading,
    isTracking,
    startTracking,
    stopTracking,
    resetTracking
  };
};