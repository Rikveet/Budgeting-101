import { createSelector } from '@reduxjs/toolkit';
import { RootState, AccountType, TransactionType } from '@/types';
import {
    getAllOccurrences,
    buildDaySummary,
    detectWarnings,
    getDaysInMonth,
    projectAccountBalance,
} from '@/util';

// ─────────────────────────────────────────────
//  BASE SELECTORS
// ─────────────────────────────────────────────

export const selectAccounts = (state: RootState) => state.accounts.accounts;
export const selectTransactions = (state: RootState) => state.transactions.transactions;
export const selectCategories = (state: RootState) => state.categories.categories;
export const selectSettings = (state: RootState) => state.settings.settings;
export const selectSelectedDate = (state: RootState) => state.ui.selectedDate;
export const selectCalendarMonth = (state: RootState) => state.ui.calendarMonth;
export const selectActiveAccountId = (state: RootState) => state.ui.activeAccountId;

// ─────────────────────────────────────────────
//  ACCOUNT SELECTORS
// ─────────────────────────────────────────────

/** All financial accounts (savings + credit cards) */
export const selectFinancialAccounts = createSelector(selectAccounts, (accounts) =>
    accounts.filter((a) => a.type !== AccountType.FRIEND),
);

/** All friend accounts */
export const selectFriendAccounts = createSelector(selectAccounts, (accounts) =>
    accounts.filter((a) => a.type === AccountType.FRIEND),
);

/** Account by id */
export const selectAccountById = (id: string) =>
    createSelector(selectAccounts, (accounts) => accounts.find((a) => a.id === id));

// ─────────────────────────────────────────────
//  TRANSACTION SELECTORS
// ─────────────────────────────────────────────

/** Transactions for a specific account */
export const selectTransactionsByAccount = (accountId: string) =>
    createSelector(selectTransactions, (transactions) =>
        transactions.filter((t) => t.accountId === accountId),
    );

// ─────────────────────────────────────────────
//  CALENDAR MONTH SELECTORS
// ─────────────────────────────────────────────

/**
 * Returns a map of date → DaySummary for the currently visible calendar month.
 * Memoized — only recomputes when transactions, accounts, or calendarMonth changes.
 */
export const selectMonthSummaries = createSelector(
    selectTransactions,
    selectAccounts,
    selectCalendarMonth,
    (transactions, accounts, month) => {
        const days = getDaysInMonth(month);
        const summaries: Record<string, any> = {};

        for (const day of days) {
            const daySummary = buildDaySummary(day, transactions, accounts);

            // Calculate YTD Net up to this day
            const year = day.slice(0, 4);
            const startOfYear = `${year}-01-01`;
            const ytdOccurrences = getAllOccurrences(transactions, startOfYear, day);

            const ytdIncome = ytdOccurrences
                .filter(o => o.type === TransactionType.INCOME)
                .reduce((sum, o) => sum + o.amount, 0);

            const ytdExpenses = ytdOccurrences
                .filter(o => o.type === TransactionType.EXPENSE)
                .reduce((sum, o) => sum + o.amount, 0);

            summaries[day] = {
                ...daySummary,
                ytdNet: ytdIncome - ytdExpenses,
            };
        }
        return summaries;
    }
);

/**
 * Returns warnings for the selected date
 */
export const selectWarningsForDate = createSelector(
    selectTransactions,
    selectAccounts,
    selectSelectedDate,
    (transactions, accounts, date) => detectWarnings(accounts, transactions, date),
);

/**
 * Returns all occurrences on the selected date
 */
export const selectOccurrencesForDate = createSelector(
    selectTransactions,
    selectSelectedDate,
    (transactions, date) => getAllOccurrences(transactions, date, date),
);

// ─────────────────────────────────────────────
//  ACCOUNT BALANCE PROJECTIONS
// ─────────────────────────────────────────────

/**
 * Projected balance of each account on the selected date.
 * Returns Record<accountId, projectedBalance>
 */
export const selectProjectedBalancesForDate = createSelector(
    selectAccounts,
    selectTransactions,
    selectSelectedDate,
    (accounts, transactions, date) => {
        const result: Record<string, number> = {};
        for (const account of accounts) {
            result[account.id] = projectAccountBalance(account, transactions, date);
        }
        return result;
    },
);

export const selectProjectedBalancesForMonth = createSelector(
    selectAccounts,
    selectTransactions,
    selectCalendarMonth,
    (accounts, transactions, calendarMonth) => {
        const days = getDaysInMonth(calendarMonth);
        const result: Record<string, Record<string, number>> = {};

        for (const date of days) {
            result[date] = {};
            for (const account of accounts) {
                result[date][account.id] = projectAccountBalance(account, transactions, date);
            }
        }

        return result;
    }
);

// ─────────────────────────────────────────────
//  TOTALS
// ─────────────────────────────────────────────

/** Net worth: sum of all savings balances minus all credit card balances */
export const selectNetWorth = createSelector(selectAccounts, (accounts) => {
    let total = 0;
    for (const account of accounts) {
        if (account.type === AccountType.SAVINGS) {
            total += (account as any).currentBalance;
        } else if (account.type === AccountType.CREDIT_CARD) {
            total -= (account as any).currentBalance; // owed amount reduces net worth
        }
    }
    return total;
});

/** Monthly income and expense totals for the calendar month */
export const selectMonthTotals = createSelector(
    selectTransactions,
    selectCalendarMonth,
    (transactions, month) => {
        const start = `${month}-01`;
        const end = `${month}-31`; // getAllOccurrences handles days that don't exist
        const occurrences = getAllOccurrences(transactions, start, end);

        const income = occurrences
            .filter((o) => o.type === TransactionType.INCOME)
            .reduce((s, o) => s + o.amount, 0);

        const expenses = occurrences
            .filter((o) => o.type === TransactionType.EXPENSE)
            .reduce((s, o) => s + o.amount, 0);

        return { income, expenses, net: income - expenses };
    },
);

/**
 * Year-to-Date Net (Income - Expenses)
 * From Jan 1st of the year of the selected date → selected date
 */
/**
 * Correct YTD Net = Change in Net Worth from Jan 1 to selected date
 */
/**
 * Correct YTD Net = (Projected Net Worth on selected date) - (Net Worth on Jan 1)
 */
export const selectYTDNet = createSelector(
    selectAccounts,
    selectTransactions,
    selectSelectedDate,
    (accounts, transactions, selectedDate) => {
        const year = selectedDate.slice(0, 4);
        const startOfYear = `${year}-01-01`;

        // 1. Starting Net Worth on Jan 1
        let startingNetWorth = 0;
        accounts.forEach((acc) => {
            if (acc.type === AccountType.SAVINGS) {
                startingNetWorth += (acc as any).currentBalance;
            } else if (acc.type === AccountType.CREDIT_CARD) {
                startingNetWorth -= (acc as any).currentBalance;
            } else if (acc.type === AccountType.FRIEND) {
                startingNetWorth += (acc as any).balance;
            }
        });

        // 2. Projected Net Worth on selected date
        let currentNetWorth = 0;
        accounts.forEach((acc) => {
            const projected = projectAccountBalance(acc, transactions, selectedDate);
            if (acc.type === AccountType.SAVINGS) {
                currentNetWorth += projected;
            } else if (acc.type === AccountType.CREDIT_CARD) {
                currentNetWorth -= projected;
            } else if (acc.type === AccountType.FRIEND) {
                currentNetWorth += projected;
            }
        });

        return currentNetWorth - startingNetWorth;
    }
);