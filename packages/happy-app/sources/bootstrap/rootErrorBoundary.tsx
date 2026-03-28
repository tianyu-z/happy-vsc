import * as React from 'react';
import type { ErrorBoundaryProps } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { TokenStorage } from '@/auth/tokenStorage';
import { resetLocalPersistence } from '@/sync/persistence';

export type RootErrorBoundaryDeps = {
    clearPersistence: () => void;
    removeCredentials: () => Promise<boolean>;
    reloadCurrentRoute: () => Promise<void>;
    navigateHome: () => Promise<void>;
};

type RootErrorBoundaryComponentProps = ErrorBoundaryProps & {
    deps?: RootErrorBoundaryDeps;
};

async function reloadCurrentRoute(): Promise<void> {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
        return;
    }

    const { reloadAppAsync } = await import('expo');
    await reloadAppAsync('Root error recovery');
}

async function navigateHome(): Promise<void> {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            window.location.assign('/');
        }
        return;
    }

    const { reloadAppAsync } = await import('expo');
    await reloadAppAsync('Root error recovery');
}

const defaultDeps: RootErrorBoundaryDeps = {
    clearPersistence: () => resetLocalPersistence(),
    removeCredentials: () => TokenStorage.removeCredentials(),
    reloadCurrentRoute,
    navigateHome,
};

function ActionButton(props: {
    testID: string;
    label: string;
    onPress: () => Promise<void>;
    disabled: boolean;
    primary?: boolean;
}) {
    return (
        <Pressable
            testID={props.testID}
            accessibilityRole="button"
            disabled={props.disabled}
            onPress={props.onPress}
            style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: props.primary ? '#2563eb' : '#d0d7de',
                backgroundColor: props.primary ? '#2563eb' : '#ffffff',
                paddingVertical: 14,
                paddingHorizontal: 16,
                opacity: props.disabled ? 0.6 : 1,
            }}
        >
            <Text
                style={{
                    color: props.primary ? '#ffffff' : '#111827',
                    fontSize: 15,
                    fontWeight: '600',
                    textAlign: 'center',
                }}
            >
                {props.label}
            </Text>
        </Pressable>
    );
}

export function RootErrorBoundary({
    error,
    retry,
    deps = defaultDeps,
}: RootErrorBoundaryComponentProps) {
    const [pendingAction, setPendingAction] = React.useState<null | 'retry' | 'reset' | 'signout'>(null);

    const runAction = React.useCallback(async (
        action: 'retry' | 'reset' | 'signout',
        task: () => Promise<void>,
    ) => {
        setPendingAction(action);
        try {
            await task();
        } finally {
            setPendingAction(null);
        }
    }, []);

    const errorMessage = error?.message || String(error);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f6f8fb',
                paddingHorizontal: 20,
                paddingVertical: 32,
            }}
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 640,
                        backgroundColor: '#ffffff',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        padding: 24,
                        gap: 16,
                    }}
                >
                    <Text
                        testID="root-error-title"
                        style={{
                            color: '#111827',
                            fontSize: 28,
                            fontWeight: '700',
                        }}
                    >
                        Something went wrong
                    </Text>
                    <Text
                        style={{
                            color: '#4b5563',
                            fontSize: 15,
                            lineHeight: 22,
                        }}
                    >
                        This build can usually recover by retrying once, clearing local app data, or signing out and resetting the cached state.
                    </Text>
                    <View
                        style={{
                            borderRadius: 14,
                            backgroundColor: '#f3f4f6',
                            padding: 14,
                            gap: 8,
                        }}
                    >
                        <Text
                            style={{
                                color: '#6b7280',
                                fontSize: 12,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                            }}
                        >
                            Error
                        </Text>
                        <Text
                            testID="root-error-message"
                            selectable
                            style={{
                                color: '#111827',
                                fontSize: 14,
                                lineHeight: 21,
                            }}
                        >
                            {errorMessage}
                        </Text>
                    </View>
                    <View style={{ gap: 12 }}>
                        <ActionButton
                            testID="root-error-retry"
                            label={pendingAction === 'retry' ? 'Retrying...' : 'Retry'}
                            onPress={() => runAction('retry', retry)}
                            disabled={pendingAction !== null}
                            primary
                        />
                        <ActionButton
                            testID="root-error-reset-cache"
                            label={pendingAction === 'reset' ? 'Resetting local cache...' : 'Reset Local Cache'}
                            onPress={() => runAction('reset', async () => {
                                deps.clearPersistence();
                                await deps.reloadCurrentRoute();
                            })}
                            disabled={pendingAction !== null}
                        />
                        <ActionButton
                            testID="root-error-signout-reset"
                            label={pendingAction === 'signout' ? 'Signing out and resetting...' : 'Sign Out And Reset'}
                            onPress={() => runAction('signout', async () => {
                                deps.clearPersistence();
                                await deps.removeCredentials();
                                await deps.navigateHome();
                            })}
                            disabled={pendingAction !== null}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
