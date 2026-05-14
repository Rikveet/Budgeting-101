import { UIState } from '@/types';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {today, toMonthString} from "@/util";

const t = today();

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        selectedDate: t,
        activeAccountId: null,
        calendarMonth: toMonthString(t),
    } as UIState,
    reducers: {
        selectDate(state, action: PayloadAction<string>) {
            state.selectedDate = action.payload;
        },
        setCalendarMonth(state, action: PayloadAction<string>) {
            state.calendarMonth = action.payload;
        },
        setActiveAccount(state, action: PayloadAction<string | null>) {
            state.activeAccountId = action.payload;
        },
    },
});

export const { selectDate, setCalendarMonth, setActiveAccount } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;