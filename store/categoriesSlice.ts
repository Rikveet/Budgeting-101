import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {CategoriesState, Category, DEFAULT_CATEGORIES} from "@/types";
import {generateId} from "@/util";

const categoriesSlice = createSlice({
    name: 'categories',
    initialState: {
        categories: DEFAULT_CATEGORIES,
    } as CategoriesState,
    reducers: {
        addCategory(state, action: PayloadAction<Omit<Category, 'id' | 'isDefault'>>) {
            state.categories.push({
                ...action.payload,
                id: generateId(),
                isDefault: false,
            });
        },
        updateCategory(state, action: PayloadAction<{ id: string; changes: Partial<Omit<Category, 'id' | 'isDefault'>> }>) {
            const idx = state.categories.findIndex((c) => c.id === action.payload.id);
            if (idx !== -1) {
                state.categories[idx] = { ...state.categories[idx], ...action.payload.changes };
            }
        },
        deleteCategory(state, action: PayloadAction<string>) {
            state.categories = state.categories.filter((c) => c.id !== action.payload || c.isDefault);
        },
    },
});

export const { addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;
export const categoriesReducer = categoriesSlice.reducer;
