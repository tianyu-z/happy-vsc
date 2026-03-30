import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { BrokerStripMode } from '@/utils/brokerStripState';
import { layout } from './layout';
import { StyleSheet } from 'react-native-unistyles';

export interface BrokerAttachedStripProps {
    mode: BrokerStripMode;
    summary: string;
    locationSummary: string;
    readOnly?: boolean;
    onPress?: () => void;
}

const stylesheet = StyleSheet.create((theme) => ({
    wrapper: {
        alignItems: 'center',
        paddingHorizontal: Platform.select({ ios: 0, default: 4 }),
        paddingTop: 8,
        paddingBottom: 4,
    },
    container: {
        width: '100%',
        maxWidth: layout.maxWidth,
        marginHorizontal: Platform.select({ ios: 16, default: 12 }),
        borderRadius: Platform.select({ ios: 16, default: 20 }),
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.colors.shadow.opacity,
        shadowRadius: 4,
        elevation: 2,
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    pressableCollapsed: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceHighest,
    },
    iconBadgeReadOnly: {
        backgroundColor: theme.colors.surfacePressed,
    },
    content: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    title: {
        ...Typography.default('semiBold'),
        color: theme.colors.text,
        fontSize: 14,
        lineHeight: 18,
    },
    message: {
        ...Typography.default('regular'),
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    location: {
        ...Typography.default('semiBold'),
        color: theme.colors.text,
        fontSize: 13,
        lineHeight: 18,
        marginTop: 2,
    },
    summary: {
        ...Typography.default('regular'),
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 16,
        marginTop: 2,
    },
    collapsedSummary: {
        ...Typography.default('regular'),
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
}));

export function BrokerAttachedStrip({
    mode,
    summary,
    locationSummary,
    readOnly = false,
    onPress,
}: BrokerAttachedStripProps) {
    const styles = stylesheet;
    const isCollapsed = mode === 'collapsed';

    if (mode === 'hidden') {
        return null;
    }

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                        styles.pressable,
                        isCollapsed ? styles.pressableCollapsed : null,
                        { opacity: pressed ? 0.82 : 1 },
                    ]}
                >
                    <View style={[
                        styles.iconBadge,
                        readOnly ? styles.iconBadgeReadOnly : null,
                    ]}>
                        <Ionicons
                            name={readOnly ? 'eye-outline' : 'link-outline'}
                            size={18}
                            color={readOnly ? '#C0392B' : '#2563EB'}
                        />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>
                            {t('sessionInfo.brokerAttached')}
                        </Text>

                        {isCollapsed ? (
                            <Text numberOfLines={1} style={styles.collapsedSummary}>
                                {summary}
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.message}>
                                    {t('sessionInfo.brokerAttachedMessage')}
                                </Text>
                                <Text numberOfLines={1} style={styles.location}>
                                    {locationSummary}
                                </Text>
                                <Text numberOfLines={2} style={styles.summary}>
                                    {summary}
                                </Text>
                            </>
                        )}
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#8E8E93"
                    />
                </Pressable>
            </View>
        </View>
    );
}
