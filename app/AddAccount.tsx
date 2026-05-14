// app/AddAccount.tsx
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '@/store';
import {
    addSavingsAccount,
    addCreditCardAccount,
    addFriendAccount,
} from '@/store/accountsSlice';
import { AccountType, RootStackParamList } from '@/types';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateId } from '@/util';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACCOUNT_TYPES = [
    { type: AccountType.SAVINGS, label: 'Savings', icon: 'wallet' },
    { type: AccountType.CREDIT_CARD, label: 'Credit Card', icon: 'card' },
    { type: AccountType.FRIEND, label: 'Friend / Person', icon: 'person' },
];

export default function AddAccountScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();

    const [accountType, setAccountType] = useState<AccountType>(AccountType.SAVINGS);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [icon, setIcon] = useState('wallet');
    const [initialBalance, setInitialBalance] = useState('0');

    // Savings specific
    const [minimumBalance, setMinimumBalance] = useState('0');

    // Credit Card specific
    const [creditLimit, setCreditLimit] = useState('5000');
    const [dueDay, setDueDay] = useState('15');

    // Friend specific
    const [friendName, setFriendName] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            return Alert.alert('Error', 'Account name is required');
        }

        const balance = parseFloat(initialBalance) || 0;

        switch (accountType) {
            case AccountType.SAVINGS:
                dispatch(
                    addSavingsAccount({
                        name: name.trim(),
                        color,
                        icon,
                        currentBalance: balance,
                        minimumBalance: parseFloat(minimumBalance) || 0,
                        currency: 'CAD',
                    })
                );
                break;

            case AccountType.CREDIT_CARD:
                dispatch(
                    addCreditCardAccount({
                        name: name.trim(),
                        color,
                        icon,
                        currentBalance: balance,
                        creditLimit: parseFloat(creditLimit) || 5000,
                        dueDay: parseInt(dueDay) || 15,
                        currency: 'CAD',
                    })
                );
                break;

            case AccountType.FRIEND:
                if (!friendName.trim()) {
                    return Alert.alert('Error', 'Friend name is required');
                }
                dispatch(
                    addFriendAccount({
                        name: name.trim(),
                        color,
                        icon,
                        balance,
                        friendName: friendName.trim(),
                        notes: notes.trim() || undefined,
                        currency: 'CAD',
                    })
                );
                break;
        }

        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Account</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Account Type */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Account Type</Text>
                        <View style={styles.typeRow}>
                            {ACCOUNT_TYPES.map((item) => (
                                <TouchableOpacity
                                    key={item.type}
                                    style={[
                                        styles.typeBtn,
                                        accountType === item.type && styles.typeBtnActive,
                                    ]}
                                    onPress={() => setAccountType(item.type)}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={24}
                                        color={accountType === item.type ? '#fff' : Colors.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.typeBtnText,
                                            accountType === item.type && styles.typeBtnTextActive,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Basic Info */}
                    <View style={styles.card}>
                        <View style={styles.formRow}>
                            <Text style={styles.label}>Account Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Chequing"
                            />
                        </View>

                        <View style={styles.formRow}>
                            <Text style={styles.label}>Icon Color</Text>
                            <View style={styles.colorPicker}>
                                {['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'].map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.colorDot, { backgroundColor: c }]}
                                        onPress={() => setColor(c)}
                                    >
                                        {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Type-specific fields */}
                    {(accountType === AccountType.SAVINGS || accountType === AccountType.CREDIT_CARD) && (
                        <View style={styles.card}>
                            <View style={styles.formRow}>
                                <Text style={styles.label}>Current Balance</Text>
                                <TextInput
                                    style={styles.input}
                                    value={initialBalance}
                                    onChangeText={setInitialBalance}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            {accountType === AccountType.SAVINGS && (
                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Minimum Balance Alert</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={minimumBalance}
                                        onChangeText={setMinimumBalance}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            )}

                            {accountType === AccountType.CREDIT_CARD && (
                                <>
                                    <View style={styles.formRow}>
                                        <Text style={styles.label}>Credit Limit</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={creditLimit}
                                            onChangeText={setCreditLimit}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <View style={styles.formRow}>
                                        <Text style={styles.label}>Payment Due Day</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={dueDay}
                                            onChangeText={setDueDay}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {accountType === AccountType.FRIEND && (
                        <View style={styles.card}>
                            <View style={styles.formRow}>
                                <Text style={styles.label}>Friend's Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={friendName}
                                    onChangeText={setFriendName}
                                    placeholder="e.g. Sarah Chen"
                                />
                            </View>
                            <View style={styles.formRow}>
                                <Text style={styles.label}>Notes</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                />
                            </View>
                        </View>
                    )}
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
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: Typography.size.lg, fontWeight: '600', color: Colors.textPrimary },
    saveText: { color: Colors.primary, fontWeight: '600', fontSize: 17 },
    scroll: { flex: 1 },
    card: {
        backgroundColor: Colors.surface,
        margin: Spacing.base,
        borderRadius: Radius.lg,
        padding: Spacing.base,
        ...Shadow.sm,
    },
    sectionTitle: {
        fontSize: Typography.size.base,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    typeRow: { flexDirection: 'row', gap: Spacing.sm },
    typeBtn: {
        flex: 1,
        padding: Spacing.md,
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    typeBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeBtnText: { marginTop: 6, fontWeight: '500' },
    typeBtnTextActive: { color: '#fff' },
    formRow: { marginVertical: Spacing.sm },
    label: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: 4 },
    input: {
        backgroundColor: Colors.background,
        padding: Spacing.base,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: Typography.size.base,
    },
    colorPicker: { flexDirection: 'row', gap: 12, marginTop: 8 },
    colorDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});