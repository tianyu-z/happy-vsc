import * as React from 'react';
import renderer from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

let authState = {
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
};

let searchParamsState: { id?: string } = {};
const replaceMock = vi.fn();

vi.mock('react-native', async () => {
    const ReactModule = await import('react');

    const createHost = (name: string) => ReactModule.forwardRef((props: any, _ref) => {
        const { children, ...rest } = props;
        return ReactModule.createElement(name, rest, children);
    });

    return {
        View: createHost('View'),
        Text: createHost('Text'),
        Image: createHost('Image'),
        Platform: {
            OS: 'web',
        },
    };
});

vi.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    }),
}));

vi.mock('expo-router', () => ({
    router: {
        push: vi.fn(),
    },
    useRouter: () => ({
        push: vi.fn(),
        replace: replaceMock,
    }),
    useLocalSearchParams: () => searchParamsState,
}));

vi.mock('@/auth/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/components/MainView', () => ({
    MainView: () => null,
}));

vi.mock('@/components/RoundButton', () => ({
    RoundButton: () => null,
}));

vi.mock('@/auth/authGetToken', () => ({
    authGetToken: vi.fn(),
}));

vi.mock('@/encryption/base64', () => ({
    encodeBase64: vi.fn(),
}));

vi.mock('expo-crypto', () => ({
    getRandomBytesAsync: vi.fn(),
}));

vi.mock('@/utils/responsive', () => ({
    useIsLandscape: () => false,
}));

vi.mock('@/constants/Typography', () => ({
    Typography: {
        default: () => ({}),
    },
}));

vi.mock('@/track', () => ({
    trackAccountCreated: vi.fn(),
    trackAccountRestored: vi.fn(),
}));

vi.mock('@/components/HomeHeader', () => ({
    HomeHeaderNotAuth: () => null,
}));

vi.mock('react-native-unistyles', () => ({
    useUnistyles: () => ({
        theme: {
            dark: false,
            colors: {
                text: '#111',
                textSecondary: '#666',
            },
        },
    }),
    StyleSheet: {
        create: (factory: any) => factory({
            dark: false,
            colors: {
                text: '#111',
                textSecondary: '#666',
            },
        }, {}),
    },
}));

vi.mock('@/text', () => ({
    t: (key: string) => key,
}));

afterEach(() => {
    authState = {
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
    };
    searchParamsState = {};
    vi.clearAllMocks();
    vi.resetModules();
});

describe('Home route compatibility redirects', () => {
    it('redirects legacy root id query params to the machine detail route', async () => {
        searchParamsState = {
            id: '0eda1541-f0d5-45ff-8c7a-5be9d148fcf9',
        };

        const { default: Home } = await import('../../app/(app)/index');

        await renderer.act(async () => {
            renderer.create(<Home />);
        });

        expect(replaceMock).toHaveBeenCalledWith(
            '/machine/0eda1541-f0d5-45ff-8c7a-5be9d148fcf9',
        );
    });
});
