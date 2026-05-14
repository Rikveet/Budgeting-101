// components/calendar-strip.tsx
import React, { useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import {
    selectCalendarMonth,
    selectSelectedDate,
    selectMonthSummaries,
    selectProjectedBalancesForMonth,
    selectAccounts,
} from '@/store/selectors';
import { useAppDispatch, useAppSelector } from "@/store";
import { addMonths, fromDateString, getDaysInMonth, today } from "@/util";
import { selectDate, setCalendarMonth } from "@/store/uiSlice";
import { AccountType } from "@/types";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_ICONS: Record<AccountType, string> = {
    [AccountType.SAVINGS]: 'wallet',
    [AccountType.CREDIT_CARD]: 'card',
    [AccountType.FRIEND]: 'people',
};

// Dynamic color based on account type and status
function getTypeColor(type: AccountType, balance: number, account: any): string {
    if (type === AccountType.CREDIT_CARD) {
        const utilization = account.creditLimit > 0 ? (balance / account.creditLimit) * 100 : 0;

        if (utilization > 100) return '#ef4444';      // Bright Red - Over limit
        if (utilization > 90) return '#b91c1c';       // Dark Red
        if (utilization > 30) return '#f59e0b';       // Amber
        return '#10b981';                             // Green
    }

    if (type === AccountType.SAVINGS) {
        if (balance < 0) return '#ef4444';            // Red - Negative
        if (balance < (account as any).minimumBalance) return '#f59e0b'; // Amber
        return '#10b981';                             // Green
    }

    return Colors.textSecondary; // Friend / others
}

export default function CalendarStrip() {
    const dispatch = useAppDispatch();
    const calendarMonth = useAppSelector(selectCalendarMonth);
    const selectedDate = useAppSelector(selectSelectedDate);
    const monthSummaries = useAppSelector(selectMonthSummaries);
    const projectedBalancesByDay = useAppSelector(selectProjectedBalancesForMonth);
    const accounts = useAppSelector(selectAccounts);
    const todayStr = today();

    const days = useMemo(() => getDaysInMonth(calendarMonth), [calendarMonth]);

    const firstDayOfWeek = useMemo(() => {
        const d = fromDateString(days[0]);
        return d.getDay();
    }, [days]);

    const [year, month] = calendarMonth.split('-').map(Number);
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-CA', {
        month: 'long',
        year: 'numeric',
    });

    const goToPrevMonth = useCallback(() => {
        dispatch(setCalendarMonth(addMonths(`${calendarMonth}-01`, -1).slice(0, 7)));
    }, [calendarMonth, dispatch]);

    const goToNextMonth = useCallback(() => {
        dispatch(setCalendarMonth(addMonths(`${calendarMonth}-01`, 1).slice(0, 7)));
    }, [calendarMonth, dispatch]);

    const handleDayPress = useCallback((dateStr: string) => {
        dispatch(selectDate(dateStr));
    }, [dispatch]);

    const grid: (string | null)[][] = useMemo(() => {
        const cells: (string | null)[] = [...Array(firstDayOfWeek).fill(null), ...days];
        while (cells.length % 7 !== 0) cells.push(null);
        const rows: (string | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
        return rows;
    }, [days, firstDayOfWeek]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                    <Text style={styles.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                    <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dayNamesRow}>
                {DAY_NAMES.map((d) => (
                    <Text key={d} style={styles.dayName}>{d}</Text>
                ))}
            </View>

            {grid.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.row}>
                    {row.map((dateStr, colIdx) => {
                        if (!dateStr) return <View key={colIdx} style={styles.cell} />;

                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === todayStr;
                        const summary = monthSummaries[dateStr];
                        const hasTransactions = summary?.occurrences?.length > 0;

                        const dayProjected = projectedBalancesByDay[dateStr] || {};

                        const activeAccounts = accounts.filter(acc =>
                            summary?.occurrences?.some((o: any) => o.accountId === acc.id)
                        );

                        return (
                            <TouchableOpacity
                                key={colIdx}
                                style={[
                                    styles.cell,
                                    isSelected && styles.cellSelected,
                                    isToday && !isSelected && styles.cellToday,
                                ]}
                                onPress={() => handleDayPress(dateStr)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.dayNum,
                                    isSelected && styles.dayNumSelected,
                                    isToday && !isSelected && styles.dayNumToday,
                                ]}>
                                    {dateStr.split('-')[2].replace(/^0+/, '')}
                                </Text>

                                {hasTransactions && activeAccounts.length > 0 && (
                                    <View style={styles.typesContainer}>
                                        {activeAccounts.map((acc) => {
                                            const balance = dayProjected[acc.id] ?? 0;
                                            const color = getTypeColor(acc.type, balance, acc);

                                            return (
                                                <View key={acc.id} style={styles.typeRow}>
                                                    <Ionicons
                                                        name={TYPE_ICONS[acc.type] as any}
                                                        size={13}
                                                        color={color}
                                                    />
                                                    <Text style={[styles.balanceText, { color }]}>
                                                        {Math.round(balance)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const CELL_SIZE = 64;

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    navBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.full,
        backgroundColor: Colors.primaryLight,
    },
    navArrow: { fontSize: 24, color: Colors.primary },
    monthLabel: {
        fontSize: Typography.size.md,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textPrimary,
    },
    dayNamesRow: { flexDirection: 'row', marginBottom: 6 },
    dayName: {
        flex: 1,
        textAlign: 'center',
        fontSize: Typography.size.xs,
        color: Colors.textTertiary,
    },
    row: { flexDirection: 'row' },
    cell: {
        flex: 1,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.md,
        margin: 1,
    },
    cellSelected: { backgroundColor: Colors.primary },
    cellToday: { borderWidth: 2, borderColor: Colors.primary },

    dayNum: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.textPrimary,
    },
    dayNumSelected: { color: Colors.textInverse, fontWeight: Typography.weight.bold },
    dayNumToday: { color: Colors.primary, fontWeight: Typography.weight.bold },

    typesContainer: {
        marginTop: 4,
        alignItems: 'center',
        gap: 1,
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    balanceText: {
        fontSize: 9.5,
        fontWeight: Typography.weight.semiBold,
    },
});