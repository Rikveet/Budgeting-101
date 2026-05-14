
import { SettingsState, AppSettings } from '@/types';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const defaultSettings: AppSettings = {
    defaultCurrency: 'CAD',
    theme: 'system',
    firstDayOfWeek: 0,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState: { settings: defaultSettings } as SettingsState,
    reducers: {
        updateSettings(state, action: PayloadAction<Partial<AppSettings>>) {
            state.settings = { ...state.settings, ...action.payload };
        },

        // Google account auth — placeholder until Phase 3
        setGoogleAccount(
            state,
            action: PayloadAction<AppSettings['googleAccount']>,
        ) {
            state.settings.googleAccount = action.payload;
        },

        clearGoogleAccount(state) {
            delete state.settings.googleAccount;
        },
    },
});

export const { updateSettings, setGoogleAccount, clearGoogleAccount } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
