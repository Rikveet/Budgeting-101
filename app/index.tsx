// app/index.tsx
import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from "@/store";
import {
    selectAccounts,
    selectMonthTotals,
    selectNetWorth,
    selectOccurrencesForDate,
    selectSelectedDate,
    selectMonthSummaries, selectYTDNet,   // ← new
} from "@/store/selectors";
import { Account, AccountType, RootStackParamList, TransactionOccurrence } from "@/types";
import { formatCurrency, formatDate, toMonthString } from "@/util";
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import TransactionRow from "@/components/transaction-row";
import AccountCard from "@/components/account-card";
import FAB from "@/components/floating-action-button";
import CalendarStrip from "@/components/calendar-strip";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const accounts = useAppSelector(selectAccounts);
    const selectedDate = useAppSelector(selectSelectedDate);
    const occurrences = useAppSelector(selectOccurrencesForDate);
    const monthTotals = useAppSelector(selectMonthTotals);
    const netWorth = useAppSelector(selectNetWorth);
    const monthSummaries = useAppSelector(selectMonthSummaries); // for calendar

    const financialAccounts = accounts.filter((a) => a.type !== AccountType.FRIEND);
    const friendAccounts = accounts.filter((a) => a.type === AccountType.FRIEND);

    // ── YTD Net ─────────────────────────────
    // const ytdNet = React.useMemo(() => {
    //     const currentMonth = toMonthString(selectedDate);
    //     const year = currentMonth.slice(0, 4);
    //     const startOfYear = `${year}-01-01`;
    //     const endOfYear = `${year}-12-31`;
    //
    //     // We'll reuse existing logic if possible, or compute here
    //     let income = 0;
    //     let expenses = 0;
    //
    //     // For simplicity, sum all occurrences this year (you can optimize later)
    //     const allYearOccurrences = /* getAllOccurrences from util if needed */ [];
    //     // For now we'll use a simple placeholder — improve if you have full year data
    //
    //     return income - expenses; // TODO: proper YTD calculation
    // }, [selectedDate]);
    const ytdNet = useAppSelector(selectYTDNet);

    // Navigation handlers...
    const handleAccountPress = useCallback((account: Account) => {
        navigation.navigate('AccountDetail', { accountId: account.id });
    }, [navigation]);

    const handleBalancePress = useCallback((account: Account) => {
        navigation.navigate('UpdateBalance', { accountId: account.id });
    }, [navigation]);

    const handleTransactionPress = useCallback((occurrence: TransactionOccurrence) => {
        navigation.navigate('EditTransaction', {
            transactionId: occurrence.transactionId,
            occurrenceDate: occurrence.occurrenceDate,
        });
    }, [navigation]);

    const handleNewTransaction = useCallback(() => {
        navigation.navigate('AddTransaction', { date: selectedDate });
    }, [navigation, selectedDate]);

    const handleNewAccount = useCallback(() => {
        navigation.navigate('AddAccount', {});
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.root}>
                {/* Top Header */}
                <View style={styles.topHeader}>
                    <View>
                        <Text style={styles.greeting}>My Budget</Text>
                        <Text style={styles.netWorthLabel}>Net Worth</Text>
                        <Text style={[styles.netWorthAmount, { color: netWorth >= 0 ? Colors.income : Colors.expense }]}>
                            {formatCurrency(netWorth)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings', {})}>
                        <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Month Metrics */}
                <View style={styles.metricsContainer}>
                    <View style={styles.metricCard}>
                        <View style={styles.totalPill}>
                            <Ionicons name="arrow-down-circle" size={14} color={Colors.income} />
                            <Text style={[styles.totalAmount, { color: Colors.income }]}>
                                {formatCurrency(monthTotals.income)}
                            </Text>
                        </View>
                        <Text style={styles.metricSubLabel}>Income</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={[styles.totalPill, { backgroundColor: Colors.expenseLight }]}>
                            <Ionicons name="arrow-up-circle" size={14} color={Colors.expense} />
                            <Text style={[styles.totalAmount, { color: Colors.expense }]}>
                                {formatCurrency(monthTotals.expenses)}
                            </Text>
                        </View>
                        <Text style={styles.metricSubLabel}>Expenses</Text>
                    </View>
                </View>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                    <CalendarStrip />

                    {/* Selected Day */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{formatDate(selectedDate)}</Text>
                            <TouchableOpacity style={styles.addDayBtn} onPress={handleNewTransaction}>
                                <Ionicons name="add" size={16} color={Colors.primary} />
                                <Text style={styles.addDayText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {occurrences.length === 0 ? (
                            <View style={styles.emptyDay}>
                                <Text style={styles.emptyDayText}>No transactions</Text>
                            </View>
                        ) : (
                            <View style={styles.transactionList}>
                                {occurrences.map((occ, i) => (
                                    <React.Fragment key={`${occ.transactionId}-${occ.occurrenceDate}`}>
                                        <TransactionRow occurrence={occ} onPress={handleTransactionPress} />
                                        {i < occurrences.length - 1 && <View style={styles.divider} />}
                                    </React.Fragment>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Accounts */}
                    {financialAccounts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Accounts</Text>
                            {financialAccounts.map((account) => (
                                <AccountCard
                                    key={account.id}
                                    account={account}
                                    onPress={handleAccountPress}
                                    onBalancePress={handleBalancePress}
                                />
                            ))}
                        </View>
                    )}

                    {friendAccounts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Friends</Text>
                            {friendAccounts.map((account) => (
                                <AccountCard
                                    key={account.id}
                                    account={account}
                                    onPress={handleAccountPress}
                                    onBalancePress={handleBalancePress}
                                />
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>

                <FAB onNewTransaction={handleNewTransaction} onNewAccount={handleNewAccount} />
            </View>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    root: { flex: 1 },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    greeting: { fontSize: Typography.size.xs, color: Colors.textTertiary, textTransform: 'uppercase' },
    netWorthLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
    netWorthAmount: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.heavy },

    metricsContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    metricCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    metricLabel: {
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
        marginBottom: 2,
    },
    metricAmount: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.semiBold,
    },
    metricSubLabel: {
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },

    totalPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.incomeLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    totalAmount: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold },

    scroll: { flex: 1 },
    section: { marginTop: Spacing.base },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textPrimary,
    },
    addDayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        backgroundColor: Colors.primaryLight,
    },
    addDayText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semiBold, color: Colors.primary },

    transactionList: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        marginHorizontal: Spacing.base,
        overflow: 'hidden',
        ...Shadow.sm,
    },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },
    emptyDay: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        marginHorizontal: Spacing.base,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyDayText: { color: Colors.textTertiary },
});