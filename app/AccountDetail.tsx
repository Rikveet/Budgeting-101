import React, { useMemo, useCallback } from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity,Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from "@/store";
import {selectAccounts, selectTransactions} from "@/store/selectors";
import {addMonths, formatCurrency, getAllOccurrences, today} from "@/util";
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
import {
    AccountType,
    CreditCardAccount,
    FriendAccount,
    RootStackParamList,
    SavingsAccount,
    TransactionOccurrence
} from "@/types";
import { deleteAccount } from "@/store/accountsSlice";
import TransactionRow from "@/components/transaction-row";
import {SafeAreaView} from "react-native-safe-area-context";


type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AccountDetail'>;

export default function AccountDetailScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const dispatch = useAppDispatch();

    const accounts = useAppSelector(selectAccounts);
    const transactions = useAppSelector(selectTransactions);

    const account = accounts.find((a) => a.id === route.params.accountId);

    // Show last 3 months + next 3 months of transactions
    const occurrences = useMemo(() => {
        if (!account) return [];
        const start = addMonths(today(), -3);
        const end = addMonths(today(), 3);
        return getAllOccurrences(
            transactions.filter((t) => t.accountId === account.id),
            start,
            end,
        ).sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
    }, [account, transactions]);

    if (!account) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <Text style={{ color: Colors.textSecondary }}>Account not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const accentColor = account.color ?? Colors.primary;
    const isFriend = account.type === AccountType.FRIEND;

    const handleDelete = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? All transactions linked to this account will be orphaned.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(deleteAccount(account.id));
                        navigation.goBack();
                    },
                },
            ],
        );
    };

    const handleTransactionPress = useCallback(
        (occ: TransactionOccurrence) => {
            navigation.navigate('EditTransaction', {
                transactionId: occ.transactionId,
                occurrenceDate: occ.occurrenceDate,
            });
        },
        [navigation],
    );

    // Stats
    const totalIn = occurrences
        .filter((o) => o.type === 'INCOME')
        .reduce((s, o) => s + o.amount, 0);
    const totalOut = occurrences
        .filter((o) => o.type === 'EXPENSE')
        .reduce((s, o) => s + o.amount, 0);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: accentColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{account.name}</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('UpdateBalance', { accountId: account.id })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={20} color={Colors.expense} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={occurrences}
                keyExtractor={(o) => `${o.transactionId}-${o.occurrenceDate}`}
                ListHeaderComponent={
                    <>
                        {/* Balance hero */}
                        <View style={[styles.hero, { backgroundColor: accentColor }]}>
                            <View style={styles.heroIconWrap}>
                                <Ionicons name={account.icon as any} size={32} color={accentColor} style={styles.heroIcon} />
                            </View>
                            <BalanceHero account={account} />
                        </View>

                        {/* Stats row */}
                        {!isFriend && (
                            <View style={styles.statsRow}>
                                <StatCard label="In (6mo)" amount={totalIn} positive />
                                <View style={styles.statDivider} />
                                <StatCard label="Out (6mo)" amount={totalOut} positive={false} />
                            </View>
                        )}

                        {/* Credit bar for CC */}
                        {account.type === AccountType.CREDIT_CARD && (
                            <CreditDetails account={account as CreditCardAccount} />
                        )}

                        {/* Friend notes */}
                        {isFriend && (account as FriendAccount).notes && (
                            <View style={styles.notesCard}>
                                <Text style={styles.notesText}>{(account as FriendAccount).notes}</Text>
                            </View>
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Transactions (±3 months)</Text>
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => navigation.navigate('AddTransaction', { date: today()})} //, accountId: account.id
                            >
                                <Ionicons name="add" size={16} color={Colors.primary} />
                                <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                }
                renderItem={({ item, index }) => (
                    <>
                        <TransactionRow occurrence={item} onPress={handleTransactionPress} />
                        {index < occurrences.length - 1 && <View style={styles.divider} />}
                    </>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No transactions in this period</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────

function BalanceHero({ account }: { account: any }) {
    if (account.type === AccountType.FRIEND) {
        const fa = account as FriendAccount;
        const owes = fa.balance >= 0;
        return (
            <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>{owes ? 'They owe you' : 'You owe them'}</Text>
                <Text style={styles.heroAmount}>{formatCurrency(Math.abs(fa.balance), fa.currency)}</Text>
                <Text style={styles.heroSub}>{fa.friendName}</Text>
            </View>
        );
    }
    const fa = account as SavingsAccount | CreditCardAccount;
    const isCC = account.type === AccountType.CREDIT_CARD;
    return (
        <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>{isCC ? 'Amount Owed' : 'Balance'}</Text>
            <Text style={styles.heroAmount}>
                {isCC ? `-${formatCurrency(fa.currentBalance, fa.currency)}` : formatCurrency(fa.currentBalance, fa.currency)}
            </Text>
            {isCC && (
                <Text style={styles.heroSub}>
                    Limit: {formatCurrency((account as CreditCardAccount).creditLimit, fa.currency)}
                </Text>
            )}
        </View>
    );
}

function StatCard({ label, amount, positive }: { label: string; amount: number; positive: boolean }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statAmount, { color: positive ? Colors.income : Colors.expense }]}>
                {positive ? '+' : '-'}{formatCurrency(amount)}
            </Text>
        </View>
    );
}

function CreditDetails({ account }: { account: CreditCardAccount }) {
    const util = Math.min(account.currentBalance / account.creditLimit, 1);
    const isOver = account.currentBalance > account.creditLimit;
    const color = isOver ? Colors.warning : util > 0.8 ? Colors.expense : Colors.primary;
    return (
        <View style={styles.creditCard}>
            <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Utilisation</Text>
                <Text style={[styles.creditValue, { color }]}>{Math.round(util * 100)}%</Text>
            </View>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(util * 100, 100)}%`, backgroundColor: color }]} />
            </View>
            <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Payment due day</Text>
                <Text style={styles.creditValue}>Day {account.dueDay}</Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 2,
    },
    headerTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    headerActions: { flexDirection: 'row', gap: Spacing.md },
    hero: {
        padding: Spacing.xl, paddingBottom: Spacing['2xl'],
        flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    },
    heroIconWrap: {
        width: 64, height: 64, borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    },
    heroIcon: { opacity: 0.9 },
    heroContent: { flex: 1 },
    heroLabel: { fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.75)', fontWeight: Typography.weight.medium },
    heroAmount: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.heavy, color: '#fff', marginTop: 2 },
    heroSub: { fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statsRow: {
        flexDirection: 'row', backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base, marginTop: -Spacing.lg,
        borderRadius: Radius.lg, ...Shadow.md, overflow: 'hidden',
    },
    statCard: { flex: 1, padding: Spacing.md, alignItems: 'center', gap: 4 },
    statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.md },
    statLabel: { fontSize: Typography.size.xs, color: Colors.textTertiary },
    statAmount: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
    creditCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        marginHorizontal: Spacing.base, marginTop: Spacing.sm,
        padding: Spacing.base, gap: Spacing.sm, ...Shadow.sm,
    },
    creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    creditLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
    creditValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    barTrack: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
    notesCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        marginHorizontal: Spacing.base, marginTop: Spacing.sm,
        padding: Spacing.base, ...Shadow.sm,
    },
    notesText: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20 },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: Spacing.sm,
    },
    sectionTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4,
        borderRadius: Radius.full,
    },
    addBtnText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semiBold, color: Colors.primary },
    listContent: { paddingBottom: Spacing['3xl'] },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },
    empty: { padding: Spacing.xl, alignItems: 'center' },
    emptyText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
});