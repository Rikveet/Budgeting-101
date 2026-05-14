import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {Account, AccountsState, AccountType, CreditCardAccount, FriendAccount, SavingsAccount} from "@/types";
import {generateId} from "@/util";


// ─────────────────────────────────────────────
//  PAYLOAD TYPES
// ─────────────────────────────────────────────

export type CreateSavingsAccountPayload = Omit<SavingsAccount, 'id' | 'createdAt' | 'updatedAt' | 'type'>;
export type CreateCreditCardAccountPayload = Omit<CreditCardAccount, 'id' | 'createdAt' | 'updatedAt' | 'type'>;
export type CreateFriendAccountPayload = Omit<FriendAccount, 'id' | 'createdAt' | 'updatedAt' | 'type'>;

export interface UpdateBalancePayload {
    accountId: string;
    newBalance: number;
}

export interface UpdateAccountPayload {
    accountId: string;
    changes: Partial<Omit<Account, 'id' | 'type' | 'createdAt'>>;
}

// ─────────────────────────────────────────────
//  INITIAL STATE
// ─────────────────────────────────────────────

const initialState: AccountsState = {
    accounts: [],
    loading: false,
    error: null,
};

// ─────────────────────────────────────────────
//  SLICE
// ─────────────────────────────────────────────

const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        addSavingsAccount(state, action: PayloadAction<CreateSavingsAccountPayload>) {
            const now = new Date().toISOString();
            const account: SavingsAccount = {
                ...action.payload,
                id: generateId(),
                type: AccountType.SAVINGS,
                createdAt: now,
                updatedAt: now,
            };
            state.accounts.push(account);
        },

        addCreditCardAccount(state, action: PayloadAction<CreateCreditCardAccountPayload>) {
            const now = new Date().toISOString();
            const account: CreditCardAccount = {
                ...action.payload,
                id: generateId(),
                type: AccountType.CREDIT_CARD,
                createdAt: now,
                updatedAt: now,
            };
            state.accounts.push(account);
        },

        addFriendAccount(state, action: PayloadAction<CreateFriendAccountPayload>) {
            const now = new Date().toISOString();
            const account: FriendAccount = {
                ...action.payload,
                id: generateId(),
                type: AccountType.FRIEND,
                createdAt: now,
                updatedAt: now,
            };
            state.accounts.push(account);
        },

        updateAccount(state, action: PayloadAction<UpdateAccountPayload>) {
            const idx = state.accounts.findIndex((a) => a.id === action.payload.accountId);
            if (idx === -1) return;
            state.accounts[idx] = {
                ...state.accounts[idx],
                ...action.payload.changes,
                updatedAt: new Date().toISOString(),
            } as Account;
        },

        /** Update current balance only — quick action from home screen */
        updateAccountBalance(state, action: PayloadAction<UpdateBalancePayload>) {
            const idx = state.accounts.findIndex((a) => a.id === action.payload.accountId);
            if (idx === -1) return;
            const account = state.accounts[idx];
            if (account.type === AccountType.SAVINGS || account.type === AccountType.CREDIT_CARD) {
                (state.accounts[idx] as SavingsAccount | CreditCardAccount).currentBalance =
                    action.payload.newBalance;
                state.accounts[idx].updatedAt = new Date().toISOString();
            } else if (account.type === AccountType.FRIEND) {
                (state.accounts[idx] as FriendAccount).balance = action.payload.newBalance;
                state.accounts[idx].updatedAt = new Date().toISOString();
            }
        },

        deleteAccount(state, action: PayloadAction<string>) {
            state.accounts = state.accounts.filter((a) => a.id !== action.payload);
        },

        reorderAccounts(state, action: PayloadAction<string[]>) {
            // action.payload is an array of account ids in the desired order
            const idOrder = action.payload;
            state.accounts.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
        },

        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
    },
});

export const {
    addSavingsAccount,
    addCreditCardAccount,
    addFriendAccount,
    updateAccount,
    updateAccountBalance,
    deleteAccount,
    reorderAccounts,
    setError,
} = accountsSlice.actions;

export const accountsReducer = accountsSlice.reducer;