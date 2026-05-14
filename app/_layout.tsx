import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {store} from "@/store";
import {Provider} from "react-redux";
import {Account, TransactionOccurrence} from "@/types";
import {SafeAreaProvider} from "react-native-safe-area-context";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <Provider store={store}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                        <Stack.Screen name="index" options={{headerShown: false}}/>
                        <Stack.Screen name="AddTransaction" options={{headerShown: false}}/>
                        <Stack.Screen name="AccountDetail" options={{headerShown: false}}/>
                        <Stack.Screen name="UpdateBalance" options={{headerShown: false}}/>
                        <Stack.Screen name="EditTransaction" options={{headerShown: false}}/>
                        <Stack.Screen name="AddAccount" options={{headerShown: false}}/>
                        <Stack.Screen name="Settings" options={{headerShown: false}}/>
                    </Stack>
                    <StatusBar style="auto"/>
                </ThemeProvider>
            </Provider>
        </SafeAreaProvider>
    );
}
