import * as React from 'react';
import renderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

(globalThis as any).__DEV__ = false;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type TestRenderer = ReturnType<typeof renderer.create>;

vi.mock('react-native', async () => {
    const ReactModule = await import('react');

    const createHost = (name: string) => ReactModule.forwardRef((props: any, _ref) => {
        const { children, ...rest } = props;
        return ReactModule.createElement(name, rest, children);
    });

    return {
        View: createHost('View'),
        Text: createHost('Text'),
        ScrollView: createHost('ScrollView'),
        Pressable: createHost('Pressable'),
        Platform: {
            OS: 'web',
            select: (value: Record<string, unknown>) => value.web ?? value.default,
        },
    };
});

vi.mock('expo-secure-store', () => ({
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
}));

vi.mock('react-native-mmkv', () => ({
    MMKV: class MockMMKV {
        getString() {
            return null;
        }

        set() {
            return undefined;
        }

        delete() {
            return undefined;
        }

        clearAll() {
            return undefined;
        }
    },
}));

vi.mock('expo', () => ({
    reloadAppAsync: vi.fn(async () => undefined),
}));

describe('RootErrorBoundary', () => {
    it('exposes retry, reset cache, and sign-out recovery actions', async () => {
        const retry = vi.fn(async () => undefined);
        const deps = {
            clearPersistence: vi.fn(),
            removeCredentials: vi.fn(async () => true),
            reloadCurrentRoute: vi.fn(async () => undefined),
            navigateHome: vi.fn(async () => undefined),
        };

        const { RootErrorBoundary } = await import('../../bootstrap/rootErrorBoundary');

        let tree: TestRenderer;
        await renderer.act(async () => {
            tree = renderer.create(
                <RootErrorBoundary
                    error={new Error('Minified React error #130')}
                    retry={retry}
                    deps={deps}
                />,
            );
        });

        expect(tree!.root.findByProps({ testID: 'root-error-retry' })).toBeTruthy();
        expect(tree!.root.findByProps({ testID: 'root-error-reset-cache' })).toBeTruthy();
        expect(tree!.root.findByProps({ testID: 'root-error-signout-reset' })).toBeTruthy();

        await renderer.act(async () => {
            await tree!.root.findByProps({ testID: 'root-error-retry' }).props.onPress();
        });
        expect(retry).toHaveBeenCalledTimes(1);

        await renderer.act(async () => {
            await tree!.root.findByProps({ testID: 'root-error-reset-cache' }).props.onPress();
        });
        expect(deps.clearPersistence).toHaveBeenCalledTimes(1);
        expect(deps.reloadCurrentRoute).toHaveBeenCalledTimes(1);
        expect(deps.removeCredentials).not.toHaveBeenCalled();

        await renderer.act(async () => {
            await tree!.root.findByProps({ testID: 'root-error-signout-reset' }).props.onPress();
        });
        expect(deps.clearPersistence).toHaveBeenCalledTimes(2);
        expect(deps.removeCredentials).toHaveBeenCalledTimes(1);
        expect(deps.navigateHome).toHaveBeenCalledTimes(1);
    });
});
