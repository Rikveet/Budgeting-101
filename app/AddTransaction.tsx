import React, {useState, useCallback} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AccountType, RecurrenceFrequency, RootStackParamList, TransactionType} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectAccounts, selectCategories} from "@/store/selectors";
import {today} from "@/util";
import {addRecurringTransaction, addSingleTransaction} from "@/store/transactionsSlice";
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
import {SafeAreaView} from "react-native-safe-area-context";


type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddTransaction'>;

const FREQ_OPTIONS = [
    {label: 'Daily', value: RecurrenceFrequency.DAILY},
    {label: 'Weekly', value: RecurrenceFrequency.WEEKLY},
    {label: 'Biweekly', value: RecurrenceFrequency.BIWEEKLY},
    {label: 'Monthly', value: RecurrenceFrequency.MONTHLY},
    {label: 'Yearly', value: RecurrenceFrequency.YEARLY},
];

export default function AddTransactionScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const dispatch = useAppDispatch();

    const accounts = useAppSelector(selectAccounts).filter(
        (a) => a.type !== AccountType.FRIEND,
    );
    const categories = useAppSelector(selectCategories);

    // ── Form state ────────────────────────────────

    const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(route.params?.date ?? today());
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
    const [categoryId, setCategoryId] = useState('food');
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState(RecurrenceFrequency.MONTHLY);
    const [recurrenceInterval, setRecurrenceInterval] = useState('1');

    // ─────────────────────────────────────────────

    const handleSave = useCallback(() => {
        const parsedAmount = parseFloat(amount);

        if (!description.trim()) return Alert.alert('Missing info', 'Please enter a description.');
        if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('Invalid amount', 'Please enter a valid amount.');
        if (!accountId) return Alert.alert('Missing info', 'Please select an account.');

        if (isRecurring) {
            dispatch(
                addRecurringTransaction({
                    accountId,
                    type: txType,
                    amount: parsedAmount,
                    description: description.trim(),
                    category: categoryId,
                    date,
                    notes: notes.trim() || undefined,
                    recurrenceRule: {
                        frequency,
                        interval: parseInt(recurrenceInterval, 10) || 1,
                        startDate: date,
                    },
                }),
            );
        } else {
            dispatch(
                addSingleTransaction({
                    accountId,
                    type: txType,
                    amount: parsedAmount,
                    description: description.trim(),
                    category: categoryId,
                    date,
                    notes: notes.trim() || undefined,
                }),
            );
        }

        navigation.goBack();
    }, [amount, description, notes, date, accountId, categoryId, isRecurring, frequency, recurrenceInterval, txType, dispatch, navigation]);

    // ─────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}
                                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary}/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Transaction</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Type toggle */}
                    <View style={styles.typeToggle}>
                        {([TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER] as TransactionType[]).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeBtn,
                                    //  txType === t && styles.typeBtnActive(t)
                                ]}
                                onPress={() => setTxType(t)}
                            >
                                <Text style={[styles.typeBtnText, txType === t && styles.typeBtnTextActive]}>
                                    {t.charAt(0) + t.slice(1).toLowerCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Amount */}
                    <View style={styles.amountSection}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                    </View>

                    <View style={styles.card}>
                        {/* Description */}
                        <FormRow icon="text" label="Description">
                            <TextInput
                                style={styles.textInput}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="What was this for?"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </FormRow>

                        <Divider/>

                        {/* Date */}
                        <FormRow icon="calendar" label="Date">
                            <TextInput
                                style={styles.textInput}
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </FormRow>

                        <Divider/>

                        {/* Account */}
                        <FormRow icon="wallet" label="Account">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexShrink: 1}}>
                                <View style={styles.chipRow}>
                                    {accounts.map((a) => (
                                        <TouchableOpacity
                                            key={a.id}
                                            style={[styles.chip, accountId === a.id && {
                                                backgroundColor: a.color,
                                                borderColor: a.color
                                            }]}
                                            onPress={() => setAccountId(a.id)}
                                        >
                                            <Text style={[styles.chipText, accountId === a.id && {color: '#fff'}]}>
                                                {a.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </FormRow>

                        <Divider/>

                        {/* Category */}
                        <FormRow icon="grid" label="Category">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexShrink: 1}}>
                                <View style={styles.chipRow}>
                                    {categories.map((c) => (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={[styles.chip, categoryId === c.id && {
                                                backgroundColor: c.color,
                                                borderColor: c.color
                                            }]}
                                            onPress={() => setCategoryId(c.id)}
                                        >
                                            <Text style={[styles.chipText, categoryId === c.id && {color: '#fff'}]}>
                                                {c.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </FormRow>

                        <Divider/>

                        {/* Notes */}
                        <FormRow icon="document-text" label="Notes">
                            <TextInput
                                style={styles.textInput}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Optional notes"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </FormRow>
                    </View>

                    {/* Recurring toggle */}
                    <View style={styles.card}>
                        <View style={styles.switchRow}>
                            <View style={styles.switchLabel}>
                                <Ionicons name="repeat" size={18} color={Colors.primary}/>
                                <Text style={styles.switchLabelText}>Recurring Transaction</Text>
                            </View>
                            <Switch
                                value={isRecurring}
                                onValueChange={setIsRecurring}
                                trackColor={{true: Colors.primary}}
                                thumbColor="#fff"
                            />
                        </View>

                        {isRecurring && (
                            <>
                                <Divider/>
                                <FormRow icon="time" label="Frequency">
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                                style={{flexShrink: 1}}>
                                        <View style={styles.chipRow}>
                                            {FREQ_OPTIONS.map((f) => (
                                                <TouchableOpacity
                                                    key={f.value}
                                                    style={[styles.chip, frequency === f.value && styles.chipActive]}
                                                    onPress={() => setFrequency(f.value)}
                                                >
                                                    <Text
                                                        style={[styles.chipText, frequency === f.value && styles.chipTextActive]}>
                                                        {f.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </FormRow>
                                <Divider/>
                                <FormRow icon="repeat" label="Every">
                                    <TextInput
                                        style={[styles.textInput, {width: 60}]}
                                        value={recurrenceInterval}
                                        onChangeText={setRecurrenceInterval}
                                        keyboardType="number-pad"
                                        placeholder="1"
                                        placeholderTextColor={Colors.textTertiary}
                                    />
                                    <Text style={styles.intervalUnit}>
                                        {frequency.toLowerCase()}(s)
                                    </Text>
                                </FormRow>
                            </>
                        )}
                    </View>

                    <View style={{height: Spacing['3xl']}}/>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
//  SMALL HELPERS
// ─────────────────────────────────────────────

function FormRow({icon, label, children}: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <View style={styles.formRow}>
            <View style={styles.formRowLeft}>
                <Ionicons name={icon as any} size={16} color={Colors.textSecondary}/>
                <Text style={styles.formRowLabel}>{label}</Text>
            </View>
            <View style={styles.formRowRight}>{children}</View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider}/>;
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

function typeBtnActive(t: TransactionType) {
    return {
        backgroundColor:
            t === TransactionType.INCOME ? Colors.income :
                t === TransactionType.EXPENSE ? Colors.expense :
                    Colors.primary,
        borderColor: 'transparent',
    };
}

const styles = StyleSheet.create({
    safe: {flex: 1, backgroundColor: Colors.background},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: Typography.size.md,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
    },
    saveBtnText: {
        color: Colors.textInverse,
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semiBold,
    },
    scroll: {flex: 1},
    typeToggle: {
        flexDirection: 'row',
        margin: Spacing.base,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 4,
        ...Shadow.sm,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    //typeBtnActive: typeBtnActive,
    typeBtnText: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.medium,
        color: Colors.textSecondary,
    },
    typeBtnTextActive: {
        color: Colors.textInverse,
        fontWeight: Typography.weight.semiBold,
    },
    amountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        gap: Spacing.xs,
    },
    currencySymbol: {
        fontSize: Typography.size['2xl'],
        fontWeight: Typography.weight.bold,
        color: Colors.textSecondary,
    },
    amountInput: {
        fontSize: Typography.size['3xl'],
        fontWeight: Typography.weight.heavy,
        color: Colors.textPrimary,
        minWidth: 120,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        marginHorizontal: Spacing.base,
        marginBottom: Spacing.base,
        overflow: 'hidden',
        ...Shadow.sm,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
        minHeight: 52,
    },
    formRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        width: 100,
    },
    formRowLabel: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.weight.medium,
    },
    formRowRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
    },
    textInput: {
        fontSize: Typography.size.base,
        color: Colors.textPrimary,
        textAlign: 'right',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.borderLight,
        marginHorizontal: Spacing.base,
    },
    chipRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        paddingRight: Spacing.base,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.medium,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: Colors.textInverse,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
    },
    switchLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    switchLabelText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.medium,
        color: Colors.textPrimary,
    },
    intervalUnit: {
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
    },
});

function dispatch(arg0: any) {
    throw new Error("Function not implemented.");
}
