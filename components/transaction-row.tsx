import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {TransactionOccurrence, TransactionType} from "@/types";
import {useAppSelector} from "@/store";
import {selectAccounts, selectCategories} from "@/store/selectors";
import {Colors, Radius, Spacing, Typography} from "@/constants/theme";
import {formatCurrency} from "@/util";

interface TransactionRowProps {
    occurrence: TransactionOccurrence;
    onPress: (occurrence: TransactionOccurrence) => void;
}

export default function TransactionRow({ occurrence, onPress }: TransactionRowProps) {
    const accounts = useAppSelector(selectAccounts);
    const categories = useAppSelector(selectCategories);

    const account = accounts.find((a) => a.id === occurrence.accountId);
    const category = categories.find((c) => c.id === occurrence.category);

    const isIncome = occurrence.type === TransactionType.INCOME;
    const amountColor = isIncome ? Colors.income : Colors.expense;
    const amountPrefix = isIncome ? '+' : '-';

    return (
        <TouchableOpacity style={styles.row} onPress={() => onPress(occurrence)} activeOpacity={0.7}>
            {/* Category icon */}
            <View style={[styles.iconWrap, { backgroundColor: (category?.color ?? Colors.primary) + '22' }]}>
                <Ionicons
                    name={(category?.icon ?? 'ellipsis-horizontal') as any}
                    size={18}
                    color={category?.color ?? Colors.primary}
                />
            </View>

            {/* Description + account */}
            <View style={styles.info}>
                <Text style={styles.description} numberOfLines={1}>{occurrence.description}</Text>
                <View style={styles.metaRow}>
                    {account && (
                        <View style={[styles.accountPill, { backgroundColor: account.color + '22' }]}>
                            <View style={[styles.accountDot, { backgroundColor: account.color }]} />
                            <Text style={[styles.accountName, { color: account.color }]} numberOfLines={1}>
                                {account.name}
                            </Text>
                        </View>
                    )}
                    {occurrence.isRecurring && (
                        <View style={styles.recurringBadge}>
                            <Ionicons name="repeat" size={10} color={Colors.primary} />
                        </View>
                    )}
                </View>
            </View>

            {/* Amount */}
            <Text style={[styles.amount, { color: amountColor }]}>
                {amountPrefix}{formatCurrency(occurrence.amount)}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        gap: Spacing.sm,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: 3,
    },
    description: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.textPrimary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    accountPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    accountDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    accountName: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        maxWidth: 100,
    },
    recurringBadge: {
        width: 16,
        height: 16,
        borderRadius: Radius.full,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amount: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        minWidth: 80,
        textAlign: 'right',
    },
});