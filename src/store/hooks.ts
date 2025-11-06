import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store-rtk';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Alternative exports for compatibility
export const useRTKDispatch = () => useDispatch<AppDispatch>();
export const useRTKSelector = <TSelected = unknown>(
  selector: (state: RootState) => TSelected
): TSelected => useSelector(selector);

// Legacy compatibility hooks (for gradual migration)
export const useLegacySelector = useSelector;
export const useLegacyDispatch = useDispatch;