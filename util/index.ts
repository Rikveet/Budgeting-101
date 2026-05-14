import {
    RecurringTransaction,
    RecurrenceFrequency,
    TransactionOccurrence,
    Transaction,
    Account,
    AccountType,
    SavingsAccount,
    CreditCardAccount,
    TransactionType,
    AccountWarning,
    DaySummary,
} from '@/types';

// ─────────────────────────────────────────────
//  DATE HELPERS
// ─────────────────────────────────────────────

/** Format a JS Date to YYYY-MM-DD */
export function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** Parse YYYY-MM-DD to JS Date (local midnight) */
export function fromDateString(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Get today as YYYY-MM-DD */
export function today(): string {
    return toDateString(new Date());
}

/** Get YYYY-MM from a YYYY-MM-DD string */
export function toMonthString(dateStr: string): string {
    return dateStr.slice(0, 7);
}

/** Return all YYYY-MM-DD strings in a given month (YYYY-MM) */
export function getDaysInMonth(month: string): string[] {
    const [y, m] = month.split('-').map(Number);
    const days: string[] = [];
    const date = new Date(y, m - 1, 1);
    while (date.getMonth() === m - 1) {
        days.push(toDateString(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

/** Add N days to a date string */
export function addDays(dateStr: string, n: number): string {
    const d = fromDateString(dateStr);
    d.setDate(d.getDate() + n);
    return toDateString(d);
}

/** Add N months to a date string */
export function addMonths(dateStr: string, n: number): string {
    const d = fromDateString(dateStr);
    d.setMonth(d.getMonth() + n);
    return toDateString(d);
}

/** Add N years to a date string */
export function addYears(dateStr: string, n: number): string {
    const d = fromDateString(dateStr);
    d.setFullYear(d.getFullYear() + n);
    return toDateString(d);
}

/** Compare two date strings. Returns negative if a < b, 0 if equal, positive if a > b */
export function compareDates(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

// ─────────────────────────────────────────────
//  RECURRENCE EXPANSION
// ─────────────────────────────────────────────

/**
 * Given a RecurringTransaction, return all occurrence dates within [rangeStart, rangeEnd].
 * Exceptions (deleted / forked) are handled here.
 */
export function expandRecurrence(
    tx: RecurringTransaction,
    rangeStart: string,
    rangeEnd: string,
): TransactionOccurrence[] {
    const { recurrenceRule, exceptions } = tx;
    const occurrences: TransactionOccurrence[] = [];

    let cursor = recurrenceRule.startDate;
    let count = 0;

    while (compareDates(cursor, rangeEnd) <= 0) {
        // Stop conditions
        if (recurrenceRule.endDate && compareDates(cursor, recurrenceRule.endDate) > 0) break;
        if (recurrenceRule.occurrences && count >= recurrenceRule.occurrences) break;

        const exception = exceptions[cursor];

        if (!exception?.deleted && !exception?.forkedToId) {
            // Check if within range
            if (compareDates(cursor, rangeStart) >= 0) {
                const overrides = exception?.overrides ?? {};
                occurrences.push({
                    transactionId: tx.id,
                    isRecurring: true,
                    occurrenceDate: overrides.date ?? cursor,
                    accountId: tx.accountId,
                    type: tx.type,
                    amount: overrides.amount ?? tx.amount,
                    description: overrides.description ?? tx.description,
                    category: tx.category,
                    notes: overrides.notes ?? tx.notes,
                });
            }
        }

        cursor = nextOccurrenceDate(cursor, recurrenceRule.frequency, recurrenceRule.interval);
        count++;

        // Safety cap — prevent infinite loops on bad data
        if (count > 3650) break;
    }

    return occurrences;
}

function nextOccurrenceDate(current: string, frequency: RecurrenceFrequency, interval: number): string {
    switch (frequency) {
        case RecurrenceFrequency.DAILY:
            return addDays(current, interval);
        case RecurrenceFrequency.WEEKLY:
            return addDays(current, 7 * interval);
        case RecurrenceFrequency.BIWEEKLY:
            return addDays(current, 14 * interval);
        case RecurrenceFrequency.MONTHLY:
            return addMonths(current, interval);
        case RecurrenceFrequency.YEARLY:
            return addYears(current, interval);
    }
}

// ─────────────────────────────────────────────
//  OCCURRENCE RESOLUTION
// ─────────────────────────────────────────────

/**
 * Given all transactions, return every occurrence in [rangeStart, rangeEnd]
 * including one-time and recurring.
 */
export function getAllOccurrences(
    transactions: Transaction[],
    rangeStart: string,
    rangeEnd: string,
): TransactionOccurrence[] {
    const result: TransactionOccurrence[] = [];

    for (const tx of transactions) {
        if (tx.isRecurring) {
            result.push(...expandRecurrence(tx, rangeStart, rangeEnd));
        } else {
            if (compareDates(tx.date, rangeStart) >= 0 && compareDates(tx.date, rangeEnd) <= 0) {
                result.push({
                    transactionId: tx.id,
                    isRecurring: false,
                    occurrenceDate: tx.date,
                    accountId: tx.accountId,
                    type: tx.type,
                    amount: tx.amount,
                    description: tx.description,
                    category: tx.category,
                    notes: tx.notes,
                });
            }
        }
    }

    return result;
}

// ─────────────────────────────────────────────
//  BALANCE PROJECTION
// ─────────────────────────────────────────────

/**
 * Project the balance of an account on a given date,
 * starting from its currentBalance and applying all transactions up to (and including) that date.
 */
export function projectAccountBalance(
    account: Account,
    transactions: Transaction[],
    targetDate: string,
): number {
    if (account.type === AccountType.FRIEND) return (account as any).balance;

    const financialAccount = account as SavingsAccount | CreditCardAccount;
    let balance = financialAccount.currentBalance;

    const occurrences = getAllOccurrences(transactions, today(), targetDate).filter(
        (o) => o.accountId === account.id,
    );

    for (const o of occurrences) {
        if (account.type === AccountType.SAVINGS) {
            if (o.type === TransactionType.INCOME) balance += o.amount;
            else if (o.type === TransactionType.EXPENSE) balance -= o.amount;
        } else if (account.type === AccountType.CREDIT_CARD) {
            // For credit cards, balance = amount owed
            if (o.type === TransactionType.EXPENSE) balance += o.amount;
            else if (o.type === TransactionType.INCOME) balance -= o.amount; // payment
        }
    }

    return balance;
}

// ─────────────────────────────────────────────
//  WARNING DETECTION
// ─────────────────────────────────────────────

export function detectWarnings(
    accounts: Account[],
    transactions: Transaction[],
    dateStr: string,
): AccountWarning[] {
    const warnings: AccountWarning[] = [];

    for (const account of accounts) {
        if (account.type === AccountType.FRIEND) continue;

        const projected = projectAccountBalance(account, transactions, dateStr);

        if (account.type === AccountType.SAVINGS) {
            const sa = account as SavingsAccount;
            if (projected < sa.minimumBalance) {
                warnings.push({
                    accountId: account.id,
                    date: dateStr,
                    type: 'BELOW_MINIMUM',
                    projectedBalance: projected,
                    threshold: sa.minimumBalance,
                });
            }
        } else if (account.type === AccountType.CREDIT_CARD) {
            const cc = account as CreditCardAccount;
            if (projected > cc.creditLimit) {
                warnings.push({
                    accountId: account.id,
                    date: dateStr,
                    type: 'OVER_LIMIT',
                    projectedBalance: projected,
                    threshold: cc.creditLimit,
                });
            }
        }
    }

    return warnings;
}

// ─────────────────────────────────────────────
//  DAY SUMMARY
// ─────────────────────────────────────────────

export function buildDaySummary(
    dateStr: string,
    transactions: Transaction[],
    accounts: Account[],
): DaySummary {
    const occurrences = getAllOccurrences(transactions, dateStr, dateStr);
    const warnings = detectWarnings(accounts, transactions, dateStr);

    const totalIncome = occurrences
        .filter((o) => o.type === TransactionType.INCOME)
        .reduce((s, o) => s + o.amount, 0);

    const totalExpenses = occurrences
        .filter((o) => o.type === TransactionType.EXPENSE)
        .reduce((s, o) => s + o.amount, 0);

    return {
        date: dateStr,
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
        hasWarning: warnings.length > 0,
        warningReason: warnings.map((w) => w.type).join(', '),
        occurrences,
    };
}

// ─────────────────────────────────────────────
//  MISC HELPERS
// ─────────────────────────────────────────────

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string): string {
    return fromDateString(dateStr).toLocaleDateString('en-CA', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}