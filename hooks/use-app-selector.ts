import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

// Use these throughout your app instead of plain useDispatch/useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;