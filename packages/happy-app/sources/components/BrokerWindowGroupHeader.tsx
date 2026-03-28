import React from 'react';
import { Platform, Text, View } from 'react-native';

import { Typography } from '@/constants/Typography';
import { StyleSheet } from 'react-native-unistyles';

type BrokerWindowGroupHeaderProps = {
    title: string;
    summary: string;
    sectionTitle?: string;
};

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        gap: 2,
    },
    sectionTitle: {
        ...Typography.default('regular'),
        color: theme.colors.groupped.sectionTitle,
        fontSize: Platform.select({ ios: 13, default: 14 }),
        lineHeight: Platform.select({ ios: 18, default: 20 }),
        letterSpacing: Platform.select({ ios: -0.08, default: 0.1 }),
        textTransform: 'uppercase',
        fontWeight: Platform.select({ ios: 'normal', default: '500' }),
        marginBottom: 2,
    },
    title: {
        ...Typography.default('semiBold'),
        color: theme.colors.text,
        fontSize: Platform.select({ ios: 17, default: 16 }),
        lineHeight: Platform.select({ ios: 22, default: 24 }),
        letterSpacing: Platform.select({ ios: -0.41, default: 0.15 }),
    },
    summary: {
        ...Typography.default('regular'),
        color: theme.colors.groupped.sectionTitle,
        fontSize: Platform.select({ ios: 13, default: 14 }),
        lineHeight: Platform.select({ ios: 18, default: 20 }),
        letterSpacing: Platform.select({ ios: -0.08, default: 0.1 }),
        fontWeight: Platform.select({ ios: 'normal', default: '500' }),
    },
}));

export function BrokerWindowGroupHeader({
    title,
    summary,
    sectionTitle,
}: BrokerWindowGroupHeaderProps) {
    const styles = stylesheet;

    return (
        <View style={styles.container}>
            {sectionTitle ? (
                <Text style={styles.sectionTitle}>
                    {sectionTitle}
                </Text>
            ) : null}
            <Text style={styles.title}>
                {title}
            </Text>
            <Text style={styles.summary}>
                {summary}
            </Text>
        </View>
    );
}
