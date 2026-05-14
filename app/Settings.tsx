import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {RootStackParamList} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import { selectSettings } from "@/store/selectors";
import { updateSettings } from "@/store/settingsSlice";
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY'];

export default function SettingsScreen() {
    const navigation = useNavigation<Nav>();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);

    const handleCurrencyChange = (currency: string) => {
        dispatch(updateSettings({ defaultCurrency: currency }));
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        dispatch(updateSettings({ theme }));
    };

    const handleFirstDayChange = (day: 0 | 1) => {
        dispatch(updateSettings({ firstDayOfWeek: day }));
    };

    const handleGoogleSignIn = () => {
        // Placeholder — Phase 3
        Alert.alert(
            'Coming Soon',
            'Google account sync will be available in a future update. This will allow you to back up and sync your data via Google Sheets.',
            [{ text: 'OK' }],
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* General */}
                <SectionHeader title="General" />
                <View style={styles.card}>
                    <SettingRow icon="cash-outline" label="Default Currency">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chipRow}>
                                {CURRENCIES.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.chip, settings.defaultCurrency === c && styles.chipActive]}
                                        onPress={() => handleCurrencyChange(c)}
                                    >
                                        <Text style={[styles.chipText, settings.defaultCurrency === c && styles.chipTextActive]}>
                                            {c}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </SettingRow>
                    <Divider />
                    <SettingRow icon="calendar-outline" label="Week starts on">
                        <View style={styles.chipRow}>
                            {(['Sunday', 'Monday'] as const).map((d, i) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.chip, settings.firstDayOfWeek === i && styles.chipActive]}
                                    onPress={() => handleFirstDayChange(i as 0 | 1)}
                                >
                                    <Text style={[styles.chipText, settings.firstDayOfWeek === i && styles.chipTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingRow>
                </View>

                {/* Appearance */}
                <SectionHeader title="Appearance" />
                <View style={styles.card}>
                    <SettingRow icon="color-palette-outline" label="Theme">
                        <View style={styles.chipRow}>
                            {(['light', 'dark', 'system'] as const).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.chip, settings.theme === t && styles.chipActive]}
                                    onPress={() => handleThemeChange(t)}
                                >
                                    <Text style={[styles.chipText, settings.theme === t && styles.chipTextActive]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingRow>
                </View>

                {/* Google Sync — Phase 3 placeholder */}
                <SectionHeader title="Sync & Backup" />
                <View style={styles.card}>
                    {settings.googleAccount ? (
                        <>
                            <View style={styles.googleRow}>
                                <View style={styles.googleAvatar}>
                                    <Ionicons name="person" size={20} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.googleName}>{settings.googleAccount.displayName}</Text>
                                    <Text style={styles.googleEmail}>{settings.googleAccount.email}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.signOutBtn}
                                    onPress={() => Alert.alert('Sign Out', 'Coming in Phase 3')}
                                >
                                    <Text style={styles.signOutText}>Sign out</Text>
                                </TouchableOpacity>
                            </View>
                            {settings.googleAccount.spreadsheetId && (
                                <>
                                    <Divider />
                                    <SettingRow icon="document-text-outline" label="Linked Sheet">
                                        <Text style={styles.sheetId} numberOfLines={1}>
                                            {settings.googleAccount.spreadsheetId}
                                        </Text>
                                    </SettingRow>
                                </>
                            )}
                        </>
                    ) : (
                        <TouchableOpacity style={styles.googleSignInBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
                            <View style={styles.googleLogo}>
                                <Text style={styles.googleG}>G</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.googleSignInLabel}>Connect Google Account</Text>
                                <Text style={styles.googleSignInSub}>Sync transactions with Google Sheets</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* About */}
                <SectionHeader title="About" />
                <View style={styles.card}>
                    <SettingRow icon="information-circle-outline" label="Version">
                        <Text style={styles.valueText}>1.0.0</Text>
                    </SettingRow>
                    <Divider />
                    <TouchableOpacity
                        style={styles.dangerRow}
                        onPress={() =>
                            Alert.alert(
                                'Clear All Data',
                                'This will permanently delete all accounts and transactions. This cannot be undone.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Clear', style: 'destructive', onPress: () => {} },
                                ],
                            )
                        }
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.expense} />
                        <Text style={styles.dangerText}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: Spacing['3xl'] }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <Text style={styles.sectionHeader}>{title}</Text>
    );
}

function SettingRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <View style={styles.settingRight}>{children}</View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    scroll: { flex: 1 },
    sectionHeader: {
        fontSize: Typography.size.xs, fontWeight: Typography.weight.semiBold,
        color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
        paddingHorizontal: Spacing.base + 4, paddingTop: Spacing.lg, paddingBottom: Spacing.xs,
    },
    card: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        marginHorizontal: Spacing.base, overflow: 'hidden', ...Shadow.sm,
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
        gap: Spacing.sm, minHeight: 52,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 120 },
    settingLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
    settingRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },
    chipRow: { flexDirection: 'row', gap: Spacing.xs },
    chip: {
        paddingHorizontal: Spacing.md, paddingVertical: 6,
        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
    chipTextActive: { color: Colors.textInverse },
    valueText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
    googleSignInBtn: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.base,
    },
    googleLogo: {
        width: 40, height: 40, borderRadius: Radius.full,
        backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border,
        alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    googleG: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: '#4285F4' },
    googleSignInLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    googleSignInSub: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },
    googleRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base,
    },
    googleAvatar: {
        width: 40, height: 40, borderRadius: Radius.full,
        backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    googleName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: Colors.textPrimary },
    googleEmail: { fontSize: Typography.size.xs, color: Colors.textTertiary },
    signOutBtn: {
        paddingHorizontal: Spacing.sm, paddingVertical: 4,
        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    },
    signOutText: { fontSize: Typography.size.xs, color: Colors.textSecondary },
    sheetId: { fontSize: Typography.size.xs, color: Colors.textTertiary, maxWidth: 150 },
    dangerRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        padding: Spacing.base,
    },
    dangerText: { fontSize: Typography.size.base, color: Colors.expense, fontWeight: Typography.weight.medium },
});