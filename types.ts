

// ─────────────────────────────────────────────
//  Nav
// ─────────────────────────────────────────────


export type RootStackParamList ={
    AccountDetail: {
        accountId: Account["id"]
    },
    UpdateBalance: {
        accountId: Account["id"]
    },
    EditTransaction:   {
        transactionId: TransactionOccurrence["transactionId"],
        occurrenceDate: TransactionOccurrence["occurrenceDate"],
    },
    AddTransaction: {
        date: string
    },
    AddAccount: {},
    Settings: {}
}

// ─────────────────────────────────────────────
//  ENUMS
// ─────────────────────────────────────────────

export enum AccountType {
    SAVINGS = 'SAVINGS',
    CREDIT_CARD = 'CREDIT_CARD',
    FRIEND = 'FRIEND',
}

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    TRANSFER = 'TRANSFER',
}

export enum RecurrenceFrequency {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    BIWEEKLY = 'BIWEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}

export enum EditRecurrenceScope {
    CURRENT = 'CURRENT',
    CURRENT_AND_FUTURE = 'CURRENT_AND_FUTURE',
    ALL = 'ALL',
}

// ─────────────────────────────────────────────
//  ACCOUNTS
// ─────────────────────────────────────────────

export interface BaseAccount {
    id: string;
    name: string;
    type: AccountType;
    color: string;       // hex color for UI
    icon: string;        // icon name (e.g. from @expo/vector-icons)
    createdAt: string;   // ISO date string
    updatedAt: string;
}

export interface SavingsAccount extends BaseAccount {
    type: AccountType.SAVINGS;
    currentBalance: number;
    minimumBalance: number; // warn if below this
    currency: string;
}

export interface CreditCardAccount extends BaseAccount {
    type: AccountType.CREDIT_CARD;
    currentBalance: number;  // amount owed (positive = debt)
    creditLimit: number;     // warn if currentBalance > creditLimit
    currency: string;
    dueDay: number;          // day of month payment is due
}

export interface FriendAccount extends BaseAccount {
    type: AccountType.FRIEND;
    /**
     * Positive = they owe me
     * Negative = I owe them
     */
    balance: number;
    currency: string;
    friendName: string;
    notes?: string;
}

export type Account = SavingsAccount | CreditCardAccount | FriendAccount;

// ─────────────────────────────────────────────
//  RECURRENCE
// ─────────────────────────────────────────────

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    interval: number;          // e.g. every 2 weeks → interval: 2, frequency: WEEKLY
    startDate: string;         // ISO date (YYYY-MM-DD)
    endDate?: string;          // ISO date — undefined = infinite
    occurrences?: number;      // max number of occurrences — undefined = infinite
}

// ─────────────────────────────────────────────
//  TRANSACTIONS
// ─────────────────────────────────────────────

export interface BaseTransaction {
    id: string;
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: string;
    date: string;              // ISO date (YYYY-MM-DD) — the "anchor" date
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

/** One-time transaction */
export interface SingleTransaction extends BaseTransaction {
    isRecurring: false;
}

/** The "master" definition of a recurring series */
export interface RecurringTransaction extends BaseTransaction {
    isRecurring: true;
    recurrenceRule: RecurrenceRule;
    /**
     * Map of date (YYYY-MM-DD) → overridden fields for that specific occurrence.
     * This allows editing just one occurrence or all future ones without
     * duplicating the whole transaction.
     */
    exceptions: Record<string, RecurrenceException>;
}

export interface RecurrenceException {
    /** If true this occurrence is deleted (skipped) */
    deleted?: boolean;
    /** Overridden fields for this occurrence */
    overrides?: Partial<Pick<BaseTransaction, 'amount' | 'description' | 'notes' | 'date'>>;
    /**
     * If this occurrence spawned a new "fork" (edit all future from here),
     * store the new recurring transaction id.
     */
    forkedToId?: string;
}

export type Transaction = SingleTransaction | RecurringTransaction;

// ─────────────────────────────────────────────
//  COMPUTED / VIEW HELPERS
// ─────────────────────────────────────────────

/** A fully resolved single occurrence of any transaction (used in the calendar day view) */
export interface TransactionOccurrence {
    transactionId: string;
    isRecurring: boolean;
    /** The specific date of this occurrence */
    occurrenceDate: string;
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: string;
    notes?: string;
}

/** Summary of a single day */
export interface DaySummary {
    date: string; // YYYY-MM-DD
    totalIncome: number;
    totalExpenses: number;
    net: number;
    hasWarning: boolean;
    warningReason?: string;
    occurrences: TransactionOccurrence[];
}

/** Warning state for an account on a given date */
export interface AccountWarning {
    accountId: string;
    date: string;
    type: 'OVER_LIMIT' | 'BELOW_MINIMUM';
    projectedBalance: number;
    threshold: number;
}

// ─────────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────────

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isDefault: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', isDefault: true },
    { id: 'transport', name: 'Transport', icon: 'car', color: '#4ECDC4', isDefault: true },
    { id: 'housing', name: 'Housing', icon: 'home', color: '#45B7D1', isDefault: true },
    { id: 'utilities', name: 'Utilities', icon: 'flash', color: '#FFA07A', isDefault: true },
    { id: 'health', name: 'Health', icon: 'medical', color: '#98D8C8', isDefault: true },
    { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#C7B8EA', isDefault: true },
    { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#F7DC6F', isDefault: true },
    { id: 'income', name: 'Income', icon: 'trending-up', color: '#82E0AA', isDefault: true },
    { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', color: '#AED6F1', isDefault: true },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#D5D8DC', isDefault: true },
];

// ─────────────────────────────────────────────
//  APP SETTINGS
// ─────────────────────────────────────────────

export interface AppSettings {
    defaultCurrency: string;
    theme: 'light' | 'dark' | 'system';
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
    /** Google account info — populated after OAuth login */
    googleAccount?: {
        email: string;
        displayName: string;
        photoUrl?: string;
        accessToken?: string;
        refreshToken?: string;
        spreadsheetId?: string; // linked Google Sheet
    };
}

// ─────────────────────────────────────────────
//  REDUX STATE SLICES
// ─────────────────────────────────────────────

export interface AccountsState {
    accounts: Account[];
    loading: boolean;
    error: string | null;
}

export interface TransactionsState {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
}

export interface CategoriesState {
    categories: Category[];
}

export interface SettingsState {
    settings: AppSettings;
}

export interface UIState {
    selectedDate: string;         // YYYY-MM-DD — the date highlighted on the calendar
    activeAccountId: string | null;
    calendarMonth: string;        // YYYY-MM — the month shown in the calendar
}

export interface RootState {
    accounts: AccountsState;
    transactions: TransactionsState;
    categories: CategoriesState;
    settings: SettingsState;
    ui: UIState;
}