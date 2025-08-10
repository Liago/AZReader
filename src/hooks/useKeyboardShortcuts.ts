import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  // Se disabilitare tutte le shortcuts
  disabled?: boolean;
  // Elementi dove ignorare le shortcuts (es. input, textarea)
  ignoreElements?: string[];
  // Se prevenire il comportamento default per tutte le shortcuts
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsReturn {
  // Registra una nuova shortcut
  addShortcut: (shortcut: KeyboardShortcut) => void;
  // Rimuove una shortcut
  removeShortcut: (key: string, modifiers?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; metaKey?: boolean }) => void;
  // Lista delle shortcuts attive
  shortcuts: KeyboardShortcut[];
  // Pulisce tutte le shortcuts
  clearShortcuts: () => void;
}

export const useKeyboardShortcuts = (
  initialShortcuts: KeyboardShortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn => {
  const {
    disabled = false,
    ignoreElements = ['input', 'textarea', 'select', '[contenteditable="true"]'],
    preventDefault = false
  } = options;

  const shortcutsRef = useRef<KeyboardShortcut[]>(initialShortcuts);

  // Normalizza la chiave per la comparazione
  const normalizeKey = (key: string): string => {
    return key.toLowerCase();
  };

  // Verifica se l'elemento corrente deve essere ignorato
  const shouldIgnoreEvent = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.contentEditable === 'true';

    return ignoreElements.some(selector => {
      if (selector.startsWith('[') && selector.endsWith(']')) {
        // Attribute selector
        const attr = selector.slice(1, -1);
        const [attrName, attrValue] = attr.split('=');
        if (attrValue && attrName) {
          return target.getAttribute(attrName) === attrValue.replace(/"/g, '');
        }
        return attrName ? target.hasAttribute(attrName) : false;
      }
      return tagName === selector;
    }) || isContentEditable;
  }, [ignoreElements]);

  // Trova la shortcut che corrisponde all'evento
  const findMatchingShortcut = useCallback((event: KeyboardEvent): KeyboardShortcut | undefined => {
    const normalizedKey = normalizeKey(event.key);
    
    return shortcutsRef.current.find(shortcut => {
      const keyMatches = normalizeKey(shortcut.key) === normalizedKey;
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });
  }, []);

  // Handler principale per gli eventi keyboard
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // Ignora se l'elemento corrente è in una lista di elementi da ignorare
    if (shouldIgnoreEvent(event.target)) return;

    const matchingShortcut = findMatchingShortcut(event);
    
    if (matchingShortcut) {
      // Previeni il comportamento default se richiesto
      if (matchingShortcut.preventDefault !== false && (preventDefault || matchingShortcut.preventDefault)) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }, [disabled, shouldIgnoreEvent, findMatchingShortcut, preventDefault]);

  // Registra una nuova shortcut
  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    // Rimuovi eventuali shortcuts duplicate
    shortcutsRef.current = shortcutsRef.current.filter(existing => {
      const keyMatches = normalizeKey(existing.key) === normalizeKey(shortcut.key);
      const modifiersMatch = 
        !!existing.ctrlKey === !!shortcut.ctrlKey &&
        !!existing.altKey === !!shortcut.altKey &&
        !!existing.shiftKey === !!shortcut.shiftKey &&
        !!existing.metaKey === !!shortcut.metaKey;
      return !(keyMatches && modifiersMatch);
    });

    shortcutsRef.current.push(shortcut);
  }, []);

  // Rimuove una shortcut
  const removeShortcut = useCallback((key: string, modifiers: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; metaKey?: boolean } = {}) => {
    shortcutsRef.current = shortcutsRef.current.filter(shortcut => {
      const keyMatches = normalizeKey(shortcut.key) === normalizeKey(key);
      const modifiersMatch = 
        !!shortcut.ctrlKey === !!modifiers.ctrlKey &&
        !!shortcut.altKey === !!modifiers.altKey &&
        !!shortcut.shiftKey === !!modifiers.shiftKey &&
        !!shortcut.metaKey === !!modifiers.metaKey;
      return !(keyMatches && modifiersMatch);
    });
  }, []);

  // Pulisce tutte le shortcuts
  const clearShortcuts = useCallback(() => {
    shortcutsRef.current = [];
  }, []);

  // Effect per gestire gli event listeners
  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, handleKeyDown]);

  // Inizializza le shortcuts iniziali
  useEffect(() => {
    shortcutsRef.current = [...initialShortcuts];
  }, []);

  return {
    addShortcut,
    removeShortcut,
    shortcuts: shortcutsRef.current,
    clearShortcuts
  };
};

// Hook specializzato per la navigazione di lettura
export const useReadingKeyboardShortcuts = (
  callbacks: {
    onPrevious?: () => void;
    onNext?: () => void;
    onToggleSettings?: () => void;
    onGoToList?: () => void;
    onToggleBookmark?: () => void;
    onToggleLike?: () => void;
    onFocusSearch?: () => void;
  },
  options: UseKeyboardShortcutsOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [
    // Navigazione base
    {
      key: 'ArrowLeft',
      action: callbacks.onPrevious || (() => {}),
      description: 'Articolo precedente',
      preventDefault: true
    },
    {
      key: 'ArrowRight', 
      action: callbacks.onNext || (() => {}),
      description: 'Articolo successivo',
      preventDefault: true
    },
    
    // Navigazione alternativa con J/K (stile Vim)
    {
      key: 'j',
      action: callbacks.onNext || (() => {}),
      description: 'Articolo successivo (j)',
      preventDefault: true
    },
    {
      key: 'k',
      action: callbacks.onPrevious || (() => {}),
      description: 'Articolo precedente (k)',
      preventDefault: true
    },
    
    // Azioni articolo
    {
      key: 'b',
      action: callbacks.onToggleBookmark || (() => {}),
      description: 'Toggle bookmark (b)',
      preventDefault: true
    },
    {
      key: 'l',
      action: callbacks.onToggleLike || (() => {}),
      description: 'Toggle like (l)',
      preventDefault: true
    },
    
    // UI
    {
      key: 's',
      action: callbacks.onToggleSettings || (() => {}),
      description: 'Toggle settings (s)',
      preventDefault: true
    },
    {
      key: 'Escape',
      action: callbacks.onGoToList || (() => {}),
      description: 'Torna alla lista (ESC)',
      preventDefault: true
    },
    
    // Search
    {
      key: '/',
      action: callbacks.onFocusSearch || (() => {}),
      description: 'Focus search (/)',
      preventDefault: true
    },
    
    // Con modificatori
    {
      key: 'h',
      ctrlKey: true,
      action: callbacks.onGoToList || (() => {}),
      description: 'Home (Ctrl+H)',
      preventDefault: true
    }
  ];

  return useKeyboardShortcuts(shortcuts, options);
};