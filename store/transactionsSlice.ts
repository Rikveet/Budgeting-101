import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
    Transaction,
    TransactionsState,
    SingleTransaction,
    RecurringTransaction,
    TransactionType,
    RecurrenceRule,
    EditRecurrenceScope,
} from "@/types";
import {generateId, today, addDays} from '@/util';

// ─────────────────────────────────────────────
//  PAYLOAD TYPES
// ─────────────────────────────────────────────

export interface AddSingleTransactionPayload {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: string;
    date: string;
    notes?: string;
}

export interface AddRecurringTransactionPayload {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: string;
    date: string; // anchor / start date
    notes?: string;
    recurrenceRule: RecurrenceRule;
}

export interface EditTransactionPayload {
    transactionId: string;
    changes: Partial<Pick<SingleTransaction, 'amount' | 'description' | 'category' | 'date' | 'notes' | 'accountId' | 'type'>>;
}

export interface EditRecurringOccurrencePayload {
    transactionId: string;
    occurrenceDate: string; // the date of the specific occurrence being edited
    scope: EditRecurrenceScope;
    changes: Partial<Pick<RecurringTransaction, 'amount' | 'description' | 'category' | 'notes' | 'recurrenceRule' | 'accountId' | 'type'>>;
}

export interface DeleteTransactionPayload {
    transactionId: string;
}

export interface DeleteRecurringOccurrencePayload {
    transactionId: string;
    occurrenceDate: string;
    scope: EditRecurrenceScope;
}

// ─────────────────────────────────────────────
//  INITIAL STATE
// ─────────────────────────────────────────────

const initialState: TransactionsState = {
    transactions: [],
    loading: false,
    error: null,
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function nowISO() {
    return new Date().toISOString();
}

// ─────────────────────────────────────────────
//  SLICE
// ─────────────────────────────────────────────

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        // ── ADD ──────────────────────────────────

        addSingleTransaction(state, action: PayloadAction<AddSingleTransactionPayload>) {
            const tx: SingleTransaction = {
                ...action.payload,
                id: generateId(),
                isRecurring: false,
                createdAt: nowISO(),
                updatedAt: nowISO(),
            };
            state.transactions.push(tx);
        },

        addRecurringTransaction(state, action: PayloadAction<AddRecurringTransactionPayload>) {
            const tx: RecurringTransaction = {
                ...action.payload,
                id: generateId(),
                isRecurring: true,
                exceptions: {},
                createdAt: nowISO(),
                updatedAt: nowISO(),
            };
            state.transactions.push(tx);
        },

        // ── EDIT ─────────────────────────────────

        /** Edit a one-time transaction */
        editTransaction(state, action: PayloadAction<EditTransactionPayload>) {
            const idx = state.transactions.findIndex((t) => t.id === action.payload.transactionId);
            if (idx === -1) return;
            const tx = state.transactions[idx];
            if (tx.isRecurring) return; // use editRecurringOccurrence instead
            state.transactions[idx] = {
                ...tx,
                ...action.payload.changes,
                updatedAt: nowISO(),
            } as SingleTransaction;
        },

        /**
         * Edit a recurring occurrence with scope:
         * - CURRENT: add an exception override for that date only
         * - CURRENT_AND_FUTURE: end the original series at occurrenceDate-1, create new series from occurrenceDate
         * - ALL: update the root recurring transaction
         */
        editRecurringOccurrence(state, action: PayloadAction<EditRecurringOccurrencePayload>) {
            const {transactionId, occurrenceDate, scope, changes} = action.payload;
            const idx = state.transactions.findIndex((t) => t.id === transactionId);
            if (idx === -1) return;
            const tx = state.transactions[idx];
            if (!tx.isRecurring) return;
            const recurringTx = tx as RecurringTransaction;

            switch (scope) {
                case EditRecurrenceScope.CURRENT: {
                    // Store only the changed fields as an exception override
                    const existingException = recurringTx.exceptions[occurrenceDate] ?? {};
                    state.transactions[idx] = {
                        ...recurringTx,
                        exceptions: {
                            ...recurringTx.exceptions,
                            [occurrenceDate]: {
                                ...existingException,
                                overrides: {
                                    ...(existingException.overrides ?? {}),
                                    ...changes,
                                },
                            },
                        },
                        updatedAt: nowISO(),
                    };
                    break;
                }

                case EditRecurrenceScope.CURRENT_AND_FUTURE: {
                    // 1. End the original series the day before this occurrence
                    const dayBefore = addDays(occurrenceDate, -1);
                    const updatedOriginal: RecurringTransaction = {
                        ...recurringTx,
                        recurrenceRule: {
                            ...recurringTx.recurrenceRule,
                            endDate: dayBefore,
                        },
                        updatedAt: nowISO(),
                    };
                    state.transactions[idx] = updatedOriginal;

                    // 2. Create a new recurring transaction starting from this occurrence
                    const newId = generateId();
                    const newTx: RecurringTransaction = {
                        ...recurringTx,
                        ...changes,
                        id: newId,
                        recurrenceRule: {
                            ...(changes.recurrenceRule ?? recurringTx.recurrenceRule),
                            startDate: occurrenceDate,
                            endDate: (changes.recurrenceRule ?? recurringTx.recurrenceRule).endDate,
                        },
                        exceptions: {},
                        createdAt: nowISO(),
                        updatedAt: nowISO(),
                    };
                    state.transactions.push(newTx);

                    // Mark the exception with a fork pointer
                    state.transactions[idx] = {
                        ...state.transactions[idx] as RecurringTransaction,
                        exceptions: {
                            ...(state.transactions[idx] as RecurringTransaction).exceptions,
                            [occurrenceDate]: {forkedToId: newId},
                        },
                    };
                    break;
                }

                case EditRecurrenceScope.ALL: {
                    state.transactions[idx] = {
                        ...recurringTx,
                        ...changes,
                        updatedAt: nowISO(),
                    } as RecurringTransaction;
                    break;
                }
            }
        },

        // ── DELETE ───────────────────────────────

        deleteTransaction(state, action: PayloadAction<DeleteTransactionPayload>) {
            state.transactions = state.transactions.filter(
                (t) => t.id !== action.payload.transactionId,
            );
        },

        deleteRecurringOccurrence(state, action: PayloadAction<DeleteRecurringOccurrencePayload>) {
            const {transactionId, occurrenceDate, scope} = action.payload;
            const idx = state.transactions.findIndex((t) => t.id === transactionId);
            if (idx === -1) return;
            const tx = state.transactions[idx];
            if (!tx.isRecurring) return;
            const recurringTx = tx as RecurringTransaction;

            switch (scope) {
                case EditRecurrenceScope.CURRENT: {
                    state.transactions[idx] = {
                        ...recurringTx,
                        exceptions: {
                            ...recurringTx.exceptions,
                            [occurrenceDate]: {deleted: true},
                        },
                        updatedAt: nowISO(),
                    };
                    break;
                }

                case EditRecurrenceScope.CURRENT_AND_FUTURE: {
                    const dayBefore = addDays(occurrenceDate, -1);
                    state.transactions[idx] = {
                        ...recurringTx,
                        recurrenceRule: {
                            ...recurringTx.recurrenceRule,
                            endDate: dayBefore,
                        },
                        updatedAt: nowISO(),
                    };
                    break;
                }

                case EditRecurrenceScope.ALL: {
                    state.transactions = state.transactions.filter((t) => t.id !== transactionId);
                    break;
                }
            }
        },

        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
    },
});

export const {
    addSingleTransaction,
    addRecurringTransaction,
    editTransaction,
    editRecurringOccurrence,
    deleteTransaction,
    deleteRecurringOccurrence,
    setError,
} = transactionsSlice.actions;

export const transactionsReducer = transactionsSlice.reducer;