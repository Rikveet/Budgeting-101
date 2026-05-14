// app/EditTransaction.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectTransactions, selectAccounts, selectCategories } from '@/store/selectors';
import { editTransaction, editRecurringOccurrence, deleteRecurringOccurrence } from '@/store/transactionsSlice';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, Transaction, EditRecurrenceScope } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditTransaction'>;

export default function EditTransactionScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const dispatch = useAppDispatch();

    const transactions = useAppSelector(selectTransactions);
    const accounts = useAppSelector(selectAccounts);
    const categories = useAppSelector(selectCategories);

    const { transactionId, occurrenceDate } = route.params;

    const transaction = transactions.find((t) => t.id === transactionId);
    const isRecurring = transaction?.isRecurring ?? false;

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [notes, setNotes] = useState('');
    const [editScope, setEditScope] = useState<EditRecurrenceScope>(EditRecurrenceScope.CURRENT);

    useEffect(() => {
        if (transaction) {
            const occ = isRecurring
                ? (transaction as any).exceptions?.[occurrenceDate]?.overrides ?? transaction
                : transaction;

            setAmount(occ.amount?.toString() || '');
            setDescription(occ.description || '');
            setCategoryId(occ.category || '');
            setNotes(occ.notes || '');
        }
    }, [transaction]);

    const handleSave = () => {
        if (!description.trim() || !amount) {
            Alert.alert('Error', 'Description and amount are required');
            return;
        }

        const parsedAmount = parseFloat(amount);

        if (isRecurring) {
            dispatch(
                editRecurringOccurrence({
                    transactionId,
                    occurrenceDate,
                    scope: editScope,
                    changes: {
                        amount: parsedAmount,
                        description: description.trim(),
                        category: categoryId,
                        notes: notes.trim() || undefined,
                    },
                })
            );
        } else {
            dispatch(
                editTransaction({
                    transactionId,
                    changes: {
                        amount: parsedAmount,
                        description: description.trim(),
                        category: categoryId,
                        notes: notes.trim() || undefined,
                    },
                })
            );
        }

        navigation.goBack();
    };

    const handleDelete = () => {
        if (!isRecurring) {
            Alert.alert('Delete Transaction', 'Delete this transaction?', [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        dispatch({ type: 'transactions/deleteTransaction', payload: { transactionId } });
                        navigation.goBack();
                    },
                },
            ]);
        } else {
            Alert.alert('Delete Occurrence', 'What do you want to delete?', [
                { text: 'Cancel' },
                {
                    text: 'This occurrence only',
                    onPress: () =>
                        dispatch(deleteRecurringOccurrence({ transactionId, occurrenceDate, scope: EditRecurrenceScope.CURRENT })),
                },
                {
                    text: 'This and future',
                    style: 'destructive',
                    onPress: () =>
                        dispatch(deleteRecurringOccurrence({ transactionId, occurrenceDate, scope: EditRecurrenceScope.CURRENT_AND_FUTURE })),
                },
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Transaction</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll}>
                    {/* Amount */}
                    <View style={styles.amountSection}>
                        <Text style={styles.currency}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.formRow}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput style={styles.input} value={description} onChangeText={setDescription} />
                        </View>

                        <View style={styles.formRow}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.chip, categoryId === cat.id && styles.chipActive]}
                                        onPress={() => setCategoryId(cat.id)}
                                    >
                                        <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.formRow}>
                            <Text style={styles.label}>Notes</Text>
                            <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />
                        </View>
                    </View>

                    {isRecurring && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Apply changes to:</Text>
                            <View style={styles.scopeOptions}>
                                {[
                                    { label: 'This occurrence', value: EditRecurrenceScope.CURRENT },
                                    { label: 'This and future', value: EditRecurrenceScope.CURRENT_AND_FUTURE },
                                    { label: 'All occurrences', value: EditRecurrenceScope.ALL },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.scopeBtn, editScope === option.value && styles.scopeBtnActive]}
                                        onPress={() => setEditScope(option.value)}
                                    >
                                        <Text style={[styles.scopeText, editScope === option.value && styles.scopeTextActive]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color={Colors.expense} />
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.base,
        backgroundColor: Colors.surface,
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    saveText: { color: Colors.primary, fontWeight: '600' },
    scroll: { flex: 1 },
    amountSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    currency: { fontSize: 48, fontWeight: 'bold', color: Colors.textSecondary },
    amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 150, textAlign: 'center' },
    card: {
        backgroundColor: Colors.surface,
        margin: Spacing.base,
        borderRadius: Radius.lg,
        padding: Spacing.base,
        ...Shadow.sm,
    },
    formRow: { marginVertical: Spacing.sm },
    label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
    input: {
        backgroundColor: Colors.background,
        padding: Spacing.base,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: 13 },
    chipTextActive: { color: '#fff' },
    scopeOptions: { gap: 8, marginTop: 8 },
    scopeBtn: {
        padding: Spacing.base,
        borderRadius: Radius.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    scopeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    scopeText: { textAlign: 'center' },
    scopeTextActive: { color: '#fff' },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: Spacing.base,
        padding: Spacing.base,
    },
    deleteText: { color: Colors.expense, fontWeight: '600' },
});