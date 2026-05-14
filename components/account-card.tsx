import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {Account, AccountType, CreditCardAccount, FriendAccount, SavingsAccount} from "@/types";
import { useAppSelector } from "@/store";
import {selectProjectedBalancesForDate, selectSelectedDate} from "@/store/selectors";
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
import {formatCurrency} from "@/util";


interface AccountCardProps {
    account: Account;
    onPress: (account: Account) => void;
    onBalancePress: (account: Account) => void;
}

export default function AccountCard({ account, onPress, onBalancePress }: AccountCardProps) {
    const projectedBalances = useAppSelector(selectProjectedBalancesForDate);
    const selectedDate = useAppSelector(selectSelectedDate);
    const projected = projectedBalances[account.id];

    const isWarning = React.useMemo(() => {
        if (account.type === AccountType.SAVINGS) {
            const sa = account as SavingsAccount;
            return projected < sa.minimumBalance;
        }
        if (account.type === AccountType.CREDIT_CARD) {
            const cc = account as CreditCardAccount;
            return projected > cc.creditLimit;
        }
        return false;
    }, [account, projected]);

    const accentColor = getAccountColor(account);

    return (
        <TouchableOpacity
            style={[styles.card, isWarning && styles.cardWarning]}
            onPress={() => onPress(account)}
            activeOpacity={0.8}
        >
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            <View style={styles.content}>
                {/* Header row */}
                <View style={styles.headerRow}>
                    <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
                        <Ionicons name={account.icon as any} size={18} color={accentColor} />
                    </View>
                    <View style={styles.titleGroup}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountType}>{getAccountTypeLabel(account.type)}</Text>
                    </View>
                    {isWarning && (
                        <View style={styles.warningBadge}>
                            <Ionicons name="warning" size={12} color={Colors.warning} />
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => onBalancePress(account)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="pencil-outline" size={14} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Balance section */}
                <View style={styles.balanceRow}>
                    {account.type === AccountType.FRIEND ? (
                        <FriendBalance account={account as FriendAccount} />
                    ) : (
                        <FinancialBalance
                            account={account as SavingsAccount | CreditCardAccount}
                            projected={projected}
                            isWarning={isWarning}
                        />
                    )}
                </View>

                {/* Credit utilisation bar */}
                {account.type === AccountType.CREDIT_CARD && (
                    <CreditBar account={account as CreditCardAccount} projected={projected} />
                )}
            </View>
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────

function FinancialBalance({
                              account,
                              projected,
                              isWarning,
                          }: {
    account: SavingsAccount | CreditCardAccount;
    projected: number;
    isWarning: boolean;
}) {
    const currency = account.currency;
    const current = account.currentBalance;

    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.balanceLabel]}>Current Balance</Text>
            <Text style={[styles.balanceAmount, isWarning && { color: Colors.warning }]}>
                {account.type === AccountType.CREDIT_CARD
                    ? `-${formatCurrency(current, currency)}`
                    : formatCurrency(current, currency)}
            </Text>
            {projected !== current && (
                <Text style={styles.projectedAmount}>
                    Projected: {account.type === AccountType.CREDIT_CARD
                    ? `-${formatCurrency(projected, currency)}`
                    : formatCurrency(projected, currency)}
                </Text>
            )}
            {account.type === AccountType.CREDIT_CARD && (
                <Text style={styles.limitText}>
                    Limit: {formatCurrency((account as CreditCardAccount).creditLimit, currency)}
                </Text>
            )}
        </View>
    );
}

function FriendBalance({ account }: { account: FriendAccount }) {
    const owes = account.balance >= 0;
    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>{account.friendName}</Text>
            <Text
                style={[
                    styles.balanceAmount,
                    { color: owes ? Colors.income : Colors.expense },
                ]}
            >
                {owes ? '+' : '-'}{formatCurrency(Math.abs(account.balance), account.currency)}
            </Text>
            <Text style={styles.projectedAmount}>
                {owes ? 'They owe you' : 'You owe them'}
            </Text>
        </View>
    );
}

function CreditBar({
                       account,
                       projected,
                   }: {
    account: CreditCardAccount;
    projected: number;
}) {
    const utilisation = Math.min(projected / account.creditLimit, 1);
    const isOver = projected > account.creditLimit;
    const barColor = isOver ? Colors.warning : utilisation > 0.8 ? Colors.expense : Colors.primary;

    return (
        <View style={styles.creditBarContainer}>
            <View style={styles.creditBarTrack}>
                <View
                    style={[
                        styles.creditBarFill,
                        {
                            width: `${Math.min(utilisation * 100, 100)}%`,
                            backgroundColor: barColor,
                        },
                    ]}
                />
            </View>
            <Text style={[styles.utilisationText, { color: barColor }]}>
                {Math.round(utilisation * 100)}% used
            </Text>
        </View>
    );
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function getAccountColor(account: Account): string {
    return account.color ?? (
        account.type === AccountType.SAVINGS ? Colors.accountSavings :
            account.type === AccountType.CREDIT_CARD ? Colors.accountCredit :
                Colors.accountFriend
    );
}

function getAccountTypeLabel(type: AccountType): string {
    switch (type) {
        case AccountType.SAVINGS: return 'Savings Account';
        case AccountType.CREDIT_CARD: return 'Credit Card';
        case AccountType.FRIEND: return 'Friend Account';
    }
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        marginHorizontal: Spacing.base,
        marginVertical: Spacing.sm / 2,
        flexDirection: 'row',
        overflow: 'hidden',
        ...Shadow.sm,
    },
    cardWarning: {
        borderWidth: 1.5,
        borderColor: Colors.warningBorder,
    },
    accentBar: {
        width: 4,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleGroup: {
        flex: 1,
    },
    accountName: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textPrimary,
    },
    accountType: {
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
        marginTop: 1,
    },
    warningBadge: {
        width: 22,
        height: 22,
        borderRadius: Radius.full,
        backgroundColor: Colors.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceRow: {
        flexDirection: 'row',
    },
    balanceLabel: {
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
        marginBottom: 2,
    },
    balanceAmount: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.bold,
        color: Colors.textPrimary,
    },
    projectedAmount: {
        fontSize: Typography.size.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    limitText: {
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
        marginTop: 1,
    },
    creditBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    creditBarTrack: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.borderLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    creditBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    utilisationText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        minWidth: 55,
        textAlign: 'right',
    },
});