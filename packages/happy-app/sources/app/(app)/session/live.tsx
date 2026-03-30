import React from 'react';
import { View, Pressable, TextInput, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { ActionMenuModal } from '@/components/ActionMenuModal';
import { Modal } from '@/modal';
import { machineAttachBrokerSession } from '@/sync/ops';
import { useAllMachines } from '@/sync/storage';
import type { BrokerRuntimeKind } from '@/sync/brokerTypes';
import { t } from '@/text';
import { useNavigateToSession } from '@/hooks/useNavigateToSession';
import {
    canAttachBrokerSession,
    flattenBrokerSessions,
    formatBrokerRowSubtitle,
    getBrokerSessionAttachabilityLabel,
    getBrokerSessionAttachActionLabel,
    getBrokerSessionDegradedMessages,
    getBrokerSessionProviderLabel,
    getBrokerSessionRuntimeDetails,
    type FlattenedBrokerSession,
} from '@/utils/brokerSessionUtils';

const providerIcons = {
    claude: require('@/assets/images/icon-claude.png'),
    codex: require('@/assets/images/icon-gpt.png'),
} as const;

const styles = StyleSheet.create((theme) => ({
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        paddingHorizontal: 8,
        height: 36,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        lineHeight: 20,
        color: theme.colors.text,
        ...Typography.default(),
    },
    clearButton: {
        padding: 4,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 4,
        gap: 8,
    },
    filterTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 36,
    },
    filterTriggerText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
}));

type ProviderFilter = 'all' | 'claude' | 'codex';
type MachineFilter = 'all' | string;
type RuntimeFilter = 'all' | BrokerRuntimeKind;

function getMachineLabel(machine: { id: string; metadata?: { displayName?: string | null; host?: string | null } | null }): string {
    return machine.metadata?.displayName || machine.metadata?.host || machine.id;
}

export default function LiveSessionsScreen() {
    const { theme } = useUnistyles();
    const navigateToSession = useNavigateToSession();
    const machines = useAllMachines();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedMachineId, setSelectedMachineId] = React.useState<MachineFilter>('all');
    const [selectedProvider, setSelectedProvider] = React.useState<ProviderFilter>('all');
    const [selectedRuntimeKind, setSelectedRuntimeKind] = React.useState<RuntimeFilter>('all');
    const [machineMenuVisible, setMachineMenuVisible] = React.useState(false);
    const [providerMenuVisible, setProviderMenuVisible] = React.useState(false);
    const [runtimeMenuVisible, setRuntimeMenuVisible] = React.useState(false);
    const [attachingSessionKey, setAttachingSessionKey] = React.useState<string | null>(null);

    const liveSessions = React.useMemo(
        () => flattenBrokerSessions(machines).filter((session) => canAttachBrokerSession(session)),
        [machines],
    );
    const runtimeKinds = React.useMemo(
        () => Array.from(new Set(liveSessions.map((session) => session.runtimeKind))),
        [liveSessions],
    );
    const filteredSessions = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return liveSessions.filter((session) => {
            if (selectedMachineId !== 'all' && session.machineId !== selectedMachineId) {
                return false;
            }
            if (selectedProvider !== 'all' && session.provider !== selectedProvider) {
                return false;
            }
            if (selectedRuntimeKind !== 'all' && session.runtimeKind !== selectedRuntimeKind) {
                return false;
            }
            if (!query) {
                return true;
            }

            return [
                session.title,
                session.windowLabel,
                session.runtimeLabel,
                session.preferredHostIp,
                session.machineLabel,
            ]
                .filter((value): value is string => Boolean(value))
                .some((value) => value.toLowerCase().includes(query));
        });
    }, [liveSessions, searchQuery, selectedMachineId, selectedProvider, selectedRuntimeKind]);

    const selectedMachineLabel = React.useMemo(() => {
        if (selectedMachineId === 'all') {
            return t('common.all');
        }
        const machine = machines.find((item) => item.id === selectedMachineId);
        return machine ? getMachineLabel(machine) : selectedMachineId;
    }, [machines, selectedMachineId]);
    const selectedProviderLabel = selectedProvider === 'all'
        ? t('common.all')
        : getBrokerSessionProviderLabel(selectedProvider, t);
    const selectedRuntimeLabel = selectedRuntimeKind === 'all'
        ? t('common.all')
        : selectedRuntimeKind;

    const handleInspect = React.useCallback((session: FlattenedBrokerSession) => {
        const degraded = session.degradedFlags.length > 0
            ? session.degradedFlags.join(', ')
            : 'none';
        Modal.alert(
            session.title,
            [
                `Machine: ${session.machineId}`,
                `Instance: ${session.instanceId}`,
                `Window: ${session.windowLabel}`,
                `Logical window: ${session.logicalWindowKey}`,
                `Broker session: ${session.brokerSessionId}`,
                `Provider session: ${session.providerSessionKey}`,
                `Runtime: ${session.runtimeKind} / ${session.runtimeLabel}`,
                `Bridge IPs: ${session.bridgeHostIps.join(', ') || 'n/a'}`,
                session.runtimeIp ? `Runtime IP: ${session.runtimeIp}` : null,
                session.preferredHostIp ? `Preferred IP: ${session.preferredHostIp}` : null,
                `Attachability: ${session.attachability}`,
                `Degraded: ${degraded}`,
                `Last seen: ${new Date(session.lastSeenAt).toLocaleString()}`,
            ].filter(Boolean).join('\n'),
        );
    }, []);

    const handleAttach = React.useCallback(async (session: FlattenedBrokerSession) => {
        setAttachingSessionKey(session.canonicalSessionKey);
        try {
            const result = await machineAttachBrokerSession(session.machineId, {
                canonicalSessionKey: session.canonicalSessionKey,
                instanceId: session.instanceId,
                brokerSessionId: session.brokerSessionId,
            });

            switch (result.type) {
                case 'success':
                    navigateToSession(result.sessionId);
                    break;
                case 'error':
                    Modal.alert(t('common.error'), result.errorMessage);
                    break;
                case 'requestToApproveDirectoryCreation':
                    Modal.alert(t('common.error'), t('status.operationFailed'));
                    break;
            }
        } finally {
            setAttachingSessionKey(null);
        }
    }, [navigateToSession]);

    return (
        <ItemList>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons
                        name="search"
                        size={16}
                        color={theme.colors.textSecondary}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search title, machine, window, runtime, or IP"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable
                            style={styles.clearButton}
                            onPress={() => setSearchQuery('')}
                        >
                            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                        </Pressable>
                    )}
                </View>
            </View>

            <View style={styles.filterRow}>
                <Pressable
                    style={styles.filterTrigger}
                    onPress={() => setMachineMenuVisible(true)}
                >
                    <Ionicons name="desktop-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.filterTriggerText} numberOfLines={1}>
                        {selectedMachineLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </Pressable>

                <Pressable
                    style={styles.filterTrigger}
                    onPress={() => setProviderMenuVisible(true)}
                >
                    <Ionicons name="sparkles-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.filterTriggerText} numberOfLines={1}>
                        {selectedProviderLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </Pressable>

                <Pressable
                    style={styles.filterTrigger}
                    onPress={() => setRuntimeMenuVisible(true)}
                >
                    <Ionicons name="layers-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.filterTriggerText} numberOfLines={1}>
                        {selectedRuntimeLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
                </Pressable>
            </View>

            <ItemGroup title={`Live Sessions (${filteredSessions.length})`}>
                {filteredSessions.length > 0 ? (
                    filteredSessions.map((session, index) => {
                        const providerLabel = getBrokerSessionProviderLabel(session.provider, t);
                        const runtimeDetails = getBrokerSessionRuntimeDetails(session);
                        const degradedMessages = getBrokerSessionDegradedMessages(
                            session.degradedFlags,
                            t,
                        );
                        const subtitle = [
                            [providerLabel, getBrokerSessionAttachabilityLabel(session, t)].join(' • '),
                            formatBrokerRowSubtitle({
                                runtimeLabel: session.runtimeLabel,
                                machineLabel: session.machineLabel,
                                windowLabel: session.windowLabel,
                                preferredHostIp: session.preferredHostIp,
                            }),
                            ...runtimeDetails,
                            ...degradedMessages,
                        ]
                            .filter((line, lineIndex, lines) => line && lines.indexOf(line) === lineIndex)
                            .join('\n');

                        return (
                            <Item
                                key={session.canonicalSessionKey}
                                title={session.title}
                                subtitle={subtitle}
                                subtitleLines={0}
                                icon={(
                                    <Image
                                        source={providerIcons[session.provider]}
                                        style={[
                                            { width: 32, height: 32 },
                                            session.provider === 'codex' && { transform: [{ scale: 0.92 }] },
                                        ]}
                                        contentFit="contain"
                                        tintColor={session.provider === 'codex' ? theme.colors.text : undefined}
                                    />
                                )}
                                onPress={() => void handleAttach(session)}
                                onLongPress={() => handleInspect(session)}
                                loading={attachingSessionKey === session.canonicalSessionKey}
                                detail={getBrokerSessionAttachActionLabel(session, t)}
                                showChevron
                                showDivider={index < filteredSessions.length - 1}
                            />
                        );
                    })
                ) : (
                    <Item
                        title="No live sessions"
                        subtitle="Start a Claude or Codex live session in VS Code, then return here to attach it."
                        subtitleLines={0}
                        showChevron={false}
                    />
                )}
            </ItemGroup>

            <ActionMenuModal
                visible={machineMenuVisible}
                title="Machine"
                items={[
                    {
                        label: t('common.all'),
                        selected: selectedMachineId === 'all',
                        onPress: () => setSelectedMachineId('all'),
                    },
                    ...machines.map((machine) => ({
                        label: getMachineLabel(machine),
                        selected: machine.id === selectedMachineId,
                        onPress: () => setSelectedMachineId(machine.id),
                    })),
                ]}
                onClose={() => setMachineMenuVisible(false)}
            />

            <ActionMenuModal
                visible={providerMenuVisible}
                title="Provider"
                items={[
                    {
                        label: t('common.all'),
                        selected: selectedProvider === 'all',
                        onPress: () => setSelectedProvider('all'),
                    },
                    {
                        label: getBrokerSessionProviderLabel('claude', t),
                        selected: selectedProvider === 'claude',
                        onPress: () => setSelectedProvider('claude'),
                    },
                    {
                        label: getBrokerSessionProviderLabel('codex', t),
                        selected: selectedProvider === 'codex',
                        onPress: () => setSelectedProvider('codex'),
                    },
                ]}
                onClose={() => setProviderMenuVisible(false)}
            />

            <ActionMenuModal
                visible={runtimeMenuVisible}
                title="Runtime"
                items={[
                    {
                        label: t('common.all'),
                        selected: selectedRuntimeKind === 'all',
                        onPress: () => setSelectedRuntimeKind('all'),
                    },
                    ...runtimeKinds.map((runtimeKind) => ({
                        label: runtimeKind,
                        selected: selectedRuntimeKind === runtimeKind,
                        onPress: () => setSelectedRuntimeKind(runtimeKind),
                    })),
                ]}
                onClose={() => setRuntimeMenuVisible(false)}
            />
        </ItemList>
    );
}
