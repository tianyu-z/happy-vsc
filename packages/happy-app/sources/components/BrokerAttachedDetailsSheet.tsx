import * as React from 'react';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Typography } from '@/constants/Typography';
import { Metadata } from '@/sync/storageTypes';
import { t } from '@/text';
import { Item } from './Item';
import { ItemGroup } from './ItemGroup';

type BrokerAttachedDetailsSheetProps = {
    sessionTitle: string;
    providerLabel: string;
    summary: string;
    readOnly: boolean;
    metadata: Pick<
        Metadata,
        | 'brokerSessionId'
        | 'brokerWindowLabel'
        | 'brokerWorkspaceLabel'
        | 'brokerWorkspacePath'
        | 'windowInstanceId'
    > | null | undefined;
};

const styles = StyleSheet.create(() => ({
    title: {
        ...Typography.default('semiBold'),
        fontSize: 17,
        textAlign: 'center',
        paddingVertical: 8,
    },
}));

export const BrokerAttachedDetailsSheet = React.memo(React.forwardRef<BottomSheetModal, BrokerAttachedDetailsSheetProps>(({
    sessionTitle,
    providerLabel,
    summary,
    readOnly,
    metadata,
}, ref) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();

    const renderBackdrop = React.useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
            />
        ),
        [],
    );

    const windowSubtitle = [metadata?.brokerWorkspaceLabel, metadata?.windowInstanceId]
        .filter(Boolean)
        .join(' • ');

    return (
        <BottomSheetModal
            ref={ref}
            enableDynamicSizing={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.colors.groupped.background }}
            handleIndicatorStyle={{ backgroundColor: theme.colors.textSecondary }}
        >
            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {t('sessionInfo.brokerAttached')}
                </Text>

                <ItemGroup
                    title={t('sessionInfo.metadata')}
                    footer={readOnly ? t('machine.brokerReadOnlyAttachDescription') : t('sessionInfo.brokerAttachedMessage')}
                >
                    <Item
                        title={sessionTitle}
                        subtitle={providerLabel}
                        showChevron={false}
                    />
                    {metadata?.brokerWindowLabel ? (
                        <Item
                            title={metadata.brokerWindowLabel}
                            subtitle={windowSubtitle || undefined}
                            showChevron={false}
                        />
                    ) : null}
                    {metadata?.brokerWorkspacePath ? (
                        <Item
                            title={metadata.brokerWorkspacePath}
                            subtitle={t('sessionInfo.path')}
                            showChevron={false}
                            copy
                        />
                    ) : null}
                    {metadata?.brokerSessionId ? (
                        <Item
                            title={metadata.brokerSessionId}
                            subtitle={t('sessionInfo.brokerSource')}
                            showChevron={false}
                            copy
                        />
                    ) : null}
                </ItemGroup>

                <ItemGroup title={t('sessionInfo.activity')}>
                    <Item
                        title={summary}
                        subtitle={providerLabel}
                        showChevron={false}
                    />
                </ItemGroup>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}));
