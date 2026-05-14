import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import {accountsReducer} from  "@/store/accountsSlice";
import {transactionsReducer} from "@/store/transactionsSlice";
import {categoriesReducer} from "@/store/categoriesSlice";
import {settingsReducer} from "@/store/settingsSlice";
import {uiReducer} from "@/store/uiSlice";
import {RootState} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────
//  PERSIST CONFIG
// ─────────────────────────────────────────────

const rootPersistConfig = {
    key: 'root',
    storage: AsyncStorage,
    /**
     * ui state is NOT persisted — it resets to today's date on each app open.
     * Everything else (accounts, transactions, categories, settings) is persisted.
     */
    blacklist: ['ui'],
    version: 1,
};

// ─────────────────────────────────────────────
//  ROOT REDUCER
// ─────────────────────────────────────────────

const rootReducer = combineReducers({
    accounts: accountsReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer,
    settings: settingsReducer,
    ui: uiReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

// ─────────────────────────────────────────────
//  STORE
// ─────────────────────────────────────────────

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // redux-persist dispatches non-serializable actions internally — ignore them
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: __DEV__,
});

export const persistor = persistStore(store);

// ─────────────────────────────────────────────
//  TYPED HOOKS
// ─────────────────────────────────────────────

export type AppDispatch = typeof store.dispatch;

/** Use instead of plain useDispatch for full TypeScript support */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Use instead of plain useSelector for full TypeScript support */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;