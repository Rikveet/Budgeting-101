import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {AccountType, CreditCardAccount, FriendAccount, RootStackParamList, SavingsAccount} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectAccounts} from "@/store/selectors";
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
import {updateAccountBalance} from "@/store/accountsSlice";
import {SafeAreaView} from "react-native-safe-area-context";


type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'UpdateBalance'>;

export default function UpdateBalanceScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const dispatch = useAppDispatch();
    const accounts = useAppSelector(selectAccounts);
    const account = accounts.find((a) => a.id === route.params.accountId);

    const currentVal =
        account?.type === AccountType.FRIEND
            ? String(Math.abs((account as FriendAccount).balance))
            : String((account as SavingsAccount | CreditCardAccount)?.currentBalance ?? '0');

    const [value, setValue] = useState(currentVal);

    if (!account) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <Text style={{ color: Colors.textSecondary }}>Account not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isFriend = account.type === AccountType.FRIEND;
    const friendAccount = account as FriendAccount;

    const handleSave = () => {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 0) {
            return Alert.alert('Invalid', 'Please enter a valid amount.');
        }
        let finalBalance = parsed;
        if (isFriend && friendAccount.balance < 0) {
            finalBalance = -parsed; // preserve direction
        }
        dispatch(updateAccountBalance({ accountId: account.id, newBalance: finalBalance }));
        navigation.goBack();
    };

    const label = isFriend
        ? friendAccount.balance >= 0 ? 'Amount they owe you' : 'Amount you owe them'
        : account.type === AccountType.CREDIT_CARD ? 'Current amount owed' : 'Current balance';

    const accentColor = account.color ?? Colors.primary;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Update Balance</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.body}>
                    {/* Account info */}
                    <View style={[styles.accountBadge, { borderColor: accentColor }]}>
                        <View style={[styles.accountIcon, { backgroundColor: accentColor + '22' }]}>
                            <Ionicons name={account.icon as any} size={22} color={accentColor} />
                        </View>
                        <View>
                            <Text style={styles.accountName}>{account.name}</Text>
                            <Text style={styles.accountType}>{label}</Text>
                        </View>
                    </View>

                    {/* Big input */}
                    <View style={styles.inputRow}>
                        <Text style={styles.currSymbol}>$</Text>
                        <TextInput
                            style={styles.bigInput}
                            value={value}
                            onChangeText={setValue}
                            keyboardType="decimal-pad"
                            autoFocus
                            selectTextOnFocus
                            placeholder="0.00"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    <Text style={styles.hint}>
                        This sets the current balance directly. Future projected balances will be
                        calculated from this point.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    saveBtnText: { color: Colors.textInverse, fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold },
    body: { flex: 1, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xl },
    accountBadge: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md,
        backgroundColor: Colors.surface, alignSelf: 'stretch', ...Shadow.sm,
    },
    accountIcon: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
    accountName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    accountType: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    currSymbol: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.textSecondary },
    bigInput: {
        fontSize: 52, fontWeight: Typography.weight.heavy, color: Colors.textPrimary,
        minWidth: 160, textAlign: 'center',
    },
    hint: {
        fontSize: Typography.size.sm, color: Colors.textTertiary,
        textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.lg,
    },
});