import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {Colors, Radius, Shadow, Spacing, Typography} from "@/constants/theme";
interface FABProps {
    onNewTransaction: () => void;
    onNewAccount: () => void;
}

export default function FAB({ onNewTransaction, onNewAccount }: FABProps) {
    const [open, setOpen] = useState(false);
    const rotation = useRef(new Animated.Value(0)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;
    const menuTranslate = useRef(new Animated.Value(20)).current;

    const toggle = () => {
        const toOpen = !open;
        setOpen(toOpen);

        Animated.parallel([
            Animated.spring(rotation, {
                toValue: toOpen ? 1 : 0,
                useNativeDriver: true,
                tension: 80,
                friction: 8,
            }),
            Animated.timing(menuOpacity, {
                toValue: toOpen ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(menuTranslate, {
                toValue: toOpen ? 0 : 20,
                useNativeDriver: true,
                tension: 80,
                friction: 8,
            }),
        ]).start();
    };

    const close = () => {
        if (open) toggle();
    };

    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const handleTransaction = () => {
        close();
        onNewTransaction();
    };

    const handleAccount = () => {
        close();
        onNewAccount();
    };

    return (
        <>
            {/* Backdrop overlay */}
            {open && (
                <Pressable style={styles.backdrop} onPress={close} />
            )}

            <View style={styles.container}>
                {/* Menu options */}
                <Animated.View
                    style={[
                        styles.menu,
                        {
                            opacity: menuOpacity,
                            transform: [{ translateY: menuTranslate }],
                        },
                    ]}
                    pointerEvents={open ? 'auto' : 'none'}
                >
                    <FABMenuItem
                        icon="swap-horizontal"
                        label="New Transaction"
                        color={Colors.primary}
                        onPress={handleTransaction}
                    />
                    <FABMenuItem
                        icon="wallet"
                        label="New Account"
                        color={Colors.income}
                        onPress={handleAccount}
                    />
                </Animated.View>

                {/* Main FAB button */}
                <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.9}>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                        <Ionicons name="add" size={28} color={Colors.textInverse} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </>
    );
}

function FABMenuItem({
                         icon,
                         label,
                         color,
                         onPress,
                     }: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.menuLabel}>{label}</Text>
            <View style={[styles.menuIcon, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={20} color={Colors.textInverse} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.overlay,
    },
    container: {
        position: 'absolute',
        bottom: Spacing['2xl'],
        right: Spacing.base,
        alignItems: 'flex-end',
        gap: Spacing.sm,
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: Radius.full,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.lg,
    },
    menu: {
        gap: Spacing.sm,
        alignItems: 'flex-end',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    menuLabel: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semiBold,
        color: Colors.textInverse,
        backgroundColor: Colors.textPrimary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    menuIcon: {
        width: 46,
        height: 46,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.md,
    },
});