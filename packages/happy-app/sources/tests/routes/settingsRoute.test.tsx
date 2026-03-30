import * as React from 'react';
import Module from 'node:module';
import renderer from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

type TestRenderer = ReturnType<typeof renderer.create>;

const mockTheme = {
    dark: false,
    colors: {
        surface: '#ffffff',
        text: '#111111',
        textSecondary: '#666666',
        divider: '#dddddd',
        shadow: {
            color: '#000000',
            opacity: 0.1,
        },
        status: {
            connected: '#22aa55',
            disconnected: '#cc3333',
        },
        groupped: {
            background: '#f5f5f5',
            sectionTitle: '#777777',
        },
    },
};

let profileState = {
    id: '',
    timestamp: 0,
    firstName: null as string | null,
    lastName: null as string | null,
    avatar: null,
    github: null,
    connectedServices: [],
};

let machinesState: Array<any> = [];
const originalRequire = Module.prototype.require;
let requireSpy: ReturnType<typeof vi.spyOn> | null = null;

(globalThis as any).__DEV__ = false;

vi.mock('react-native', async () => {
    const ReactModule = await import('react');

    const createHost = (name: string) => ReactModule.forwardRef((props: any, _ref) => {
        const { children, ...rest } = props;
        return ReactModule.createElement(name, rest, children);
    });

    return {
        View: createHost('View'),
        ScrollView: createHost('ScrollView'),
        Pressable: createHost('Pressable'),
        Platform: {
            OS: 'web',
            select: (value: Record<string, unknown>) => value.web ?? value.default,
        },
        Linking: {
            canOpenURL: vi.fn(async () => true),
            openURL: vi.fn(async () => undefined),
        },
    };
});

vi.mock('expo-router', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('expo-constants', () => ({
    default: {
        expoConfig: {
            version: '1.2.3',
        },
    },
}));

vi.mock('expo-web-browser', () => ({
    openAuthSessionAsync: vi.fn(),
}));

vi.mock('expo-image', async () => {
    const ReactModule = await import('react');
    return {
        Image: ReactModule.forwardRef((props: any, _ref) => ReactModule.createElement('Image', props)),
    };
});

vi.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

vi.mock('react-native-unistyles', () => ({
    useUnistyles: () => ({
        theme: mockTheme,
    }),
    StyleSheet: {
        create: (factory: any) => factory(mockTheme, {}),
    },
}));

vi.mock('@/components/StyledText', async () => {
    const ReactModule = await import('react');
    return {
        Text: ReactModule.forwardRef((props: any, _ref) => ReactModule.createElement('Text', props, props.children)),
    };
});

vi.mock('@/auth/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        credentials: { token: 'token', secret: 'secret' },
        login: vi.fn(),
        logout: vi.fn(),
    }),
}));

vi.mock('@/components/Item', () => ({
    Item: 'Item',
}));

vi.mock('@/components/ItemGroup', () => ({
    ItemGroup: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ItemList', () => ({
    ItemList: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useUnifiedScanner', () => ({
    useUnifiedScanner: () => ({
        launchScanner: vi.fn(),
        connectWithUrl: vi.fn(),
        isLoading: false,
    }),
}));

vi.mock('@/sync/storage', () => ({
    useLocalSettingMutable: () => [false, vi.fn()],
    useSetting: (name: string) => {
        if (name === 'experiments') {
            return false;
        }
        return 'gradient';
    },
    useDootaskProfile: () => null,
    useAllMachines: () => machinesState,
    useProfile: () => profileState,
    storage: {
        getState: () => ({
            clearDootaskData: vi.fn(),
        }),
    },
}));

vi.mock('@/sync/serverConfig', () => ({
    isUsingCustomServer: () => true,
}));

vi.mock('@/track', () => ({
    trackWhatsNewClicked: vi.fn(),
}));

vi.mock('@/modal', () => ({
    Modal: {
        alert: vi.fn(),
        confirm: vi.fn(async () => false),
        prompt: vi.fn(async () => null),
    },
}));

vi.mock('@/hooks/useMultiClick', () => ({
    useMultiClick: (callback: () => void) => callback,
}));

vi.mock('@/hooks/useHappyAction', () => ({
    useHappyAction: () => [false, vi.fn()],
}));

vi.mock('@/sync/apiGithub', () => ({
    getGitHubOAuthParams: vi.fn(),
    disconnectGitHub: vi.fn(),
}));

vi.mock('@/utils/machineUtils', () => ({
    isMachineOnline: (machine: { active?: boolean }) => !!machine.active,
}));

vi.mock('@/components/layout', () => ({
    layout: {
        maxWidth: 920,
    },
}));

vi.mock('@/sync/profile', () => ({
    getDisplayName: (profile: typeof profileState) =>
        [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null,
    getAvatarUrl: () => null,
    getBio: () => null,
}));

vi.mock('@/components/Avatar', () => ({
    Avatar: 'Avatar',
}));

vi.mock('@/text', () => ({
    t: (key: string, params?: Record<string, unknown>) => {
        if (!params) {
            return key;
        }
        return `${key}:${JSON.stringify(params)}`;
    },
}));

requireSpy = vi.spyOn(Module.prototype, 'require').mockImplementation(function patchedRequire(this: Module, id: string) {
    if (typeof id === 'string' && id.startsWith('@/assets/images/')) {
        return id;
    }
    return originalRequire.apply(this, arguments as any);
});

afterEach(() => {
    profileState = {
        id: '',
        timestamp: 0,
        firstName: null,
        lastName: null,
        avatar: null,
        github: null,
        connectedServices: [],
    };
    machinesState = [];
    requireSpy?.mockRestore();
    requireSpy = vi.spyOn(Module.prototype, 'require').mockImplementation(function patchedRequire(this: Module, id: string) {
        if (typeof id === 'string' && id.startsWith('@/assets/images/')) {
            return id;
        }
        return originalRequire.apply(this, arguments as any);
    });
    vi.clearAllMocks();
    vi.resetModules();
});

describe('Settings route', () => {
    it('renders without crashing when profile and machines are empty', async () => {
        const { default: SettingsRoute } = await import('../../app/(app)/settings/index');

        let tree: TestRenderer | null = null;
        await renderer.act(async () => {
            tree = renderer.create(<SettingsRoute />);
        });

        expect(tree).not.toBeNull();
    });

    it('renders machine entries when machines exist', async () => {
        profileState = {
            ...profileState,
            id: 'user-1',
            firstName: 'Happy',
        };
        machinesState = [
            {
                id: 'machine-1',
                active: true,
                metadata: {
                    host: 'DESKTOP-0C3Q24O',
                    displayName: 'DESKTOP-0C3Q24O',
                    platform: 'linux',
                },
            },
        ];

        const { default: SettingsRoute } = await import('../../app/(app)/settings/index');

        let tree: TestRenderer | null = null;
        await renderer.act(async () => {
            tree = renderer.create(<SettingsRoute />);
        });

        const items = tree!.root.findAllByType('Item');
        expect(items.length).toBeGreaterThan(0);
    });
});
