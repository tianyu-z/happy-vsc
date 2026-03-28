import * as React from 'react';
import renderer from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockTheme = {
    colors: {
        input: {
            background: '#fff',
        },
        groupped: {
            background: '#f5f5f5',
        },
        divider: '#ddd',
        button: {
            primary: {
                background: '#111',
                tint: '#fff',
            },
        },
        permissionButton: {
            inactive: {
                background: '#ccc',
            },
        },
        surfaceHigh: '#eee',
        header: {
            tint: '#111',
        },
        text: '#111',
        textSecondary: '#666',
        surfaceSelected: '#f0f0f0',
    },
};

let machineState: any;

vi.mock('react-native', async () => {
    const ReactModule = await import('react');

    const createHost = (name: string) => ReactModule.forwardRef((props: any, _ref) => {
        const { children, ...rest } = props;
        return ReactModule.createElement(name, rest, children);
    });

    return {
        View: createHost('View'),
        Text: createHost('Text'),
        ActivityIndicator: createHost('ActivityIndicator'),
        RefreshControl: createHost('RefreshControl'),
        Pressable: createHost('Pressable'),
        TextInput: createHost('TextInput'),
        Platform: {
            OS: 'web',
            select: (value: Record<string, unknown>) => value.web ?? value.default,
        },
        useWindowDimensions: () => ({
            width: 1280,
            height: 720,
            scale: 1,
            fontScale: 1,
        }),
    };
});

vi.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ id: 'machine-1' }),
    useRouter: () => ({
        back: vi.fn(),
        push: vi.fn(),
    }),
    Stack: {
        Screen: 'StackScreen',
    },
}));

vi.mock('react-native-unistyles', () => ({
    useUnistyles: () => ({ theme: mockTheme }),
    StyleSheet: {
        create: (factory: any) => factory(mockTheme, {}),
    },
}));

vi.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    AntDesign: 'AntDesign',
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

vi.mock('@/components/BrokerWindowGroupHeader', () => ({
    BrokerWindowGroupHeader: 'BrokerWindowGroupHeader',
}));

vi.mock('@/constants/Typography', () => ({
    Typography: {
        default: () => ({}),
    },
}));

vi.mock('@/sync/storage', () => {
    const storage = ((selector: (state: any) => unknown) => selector({
        registeredRepos: {
            'machine-1': [],
        },
    })) as any;

    storage.getState = () => ({
        registeredRepos: {
            'machine-1': [],
        },
        registeredReposVersions: {
            'machine-1': 0,
        },
        setRegisteredRepos: vi.fn(),
    });

    return {
        useSessions: () => [],
        useMachine: () => machineState,
        storage,
    };
});

vi.mock('@/sync/ops', () => ({
    machineAttachBrokerSession: vi.fn(),
    machineBash: vi.fn(),
    machineListBrokerSessions: vi.fn(async () => ({ sessions: [] })),
    machineStopDaemon: vi.fn(),
    machineUpdateMetadata: vi.fn(),
    machineSpawnNewSession: vi.fn(),
}));

vi.mock('@/modal', () => ({
    Modal: {
        alert: vi.fn(),
        prompt: vi.fn(),
        confirm: vi.fn(),
    },
}));

vi.mock('@/components/haptics', () => ({
    hapticsLight: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
    showToast: vi.fn(),
}));

vi.mock('@/utils/brokerSessionUtils', () => ({
    canAttachBrokerSession: () => true,
    getBrokerSessionAttachabilityLabel: () => 'Attachable',
    getBrokerSessionAttachActionLabel: () => 'Attach',
    getBrokerSessionDegradedMessages: () => [],
    getBrokerSessionDisabledReason: () => null,
    getBrokerSessionProviderLabel: () => 'Claude',
    getBrokerSessionRuntimeDetails: () => [],
    getBrokerWindowHeaderSummary: () => 'Summary',
}));

vi.mock('@/utils/brokerWindowGroups', () => ({
    groupBrokerSessionsByWindow: () => ({
        mode: 'grouped',
        groups: [],
    }),
}));

vi.mock('@/utils/sessionUtils', () => ({
    formatPathRelativeToHome: (path: string) => path,
    getSessionName: () => 'Session',
    getSessionSubtitle: () => 'Subtitle',
}));

vi.mock('@/utils/machineUtils', () => ({
    isMachineOnline: () => false,
}));

vi.mock('@/sync/sync', () => ({
    sync: {
        getCredentials: () => null,
        refreshMachines: vi.fn(),
    },
}));

vi.mock('@/text', () => ({
    t: (key: string) => key,
}));

vi.mock('@/hooks/useNavigateToSession', () => ({
    useNavigateToSession: () => vi.fn(),
}));

vi.mock('@/utils/pathUtils', () => ({
    resolveAbsolutePath: (path: string) => path,
}));

vi.mock('@/components/MultiTextInput', async () => {
    const ReactModule = await import('react');
    return {
        MultiTextInput: ReactModule.forwardRef((props: any, _ref) => ReactModule.createElement('MultiTextInput', props)),
    };
});

vi.mock('@/components/SessionTypeSelector', () => ({
    SessionTypeSelector: 'SessionTypeSelector',
}));

vi.mock('@/utils/createWorktree', () => ({
    createWorktree: vi.fn(),
}));

vi.mock('@/utils/createWorkspace', () => ({
    createWorkspace: vi.fn(),
}));

vi.mock('@/components/RepoPickerBar', () => ({
    RepoPickerBar: 'RepoPickerBar',
}));

vi.mock('@/sync/repoStore', () => ({
    saveRegisteredRepos: vi.fn(),
    loadRegisteredRepos: vi.fn(async () => ({ repos: [], version: 0 })),
}));

vi.mock('expo-crypto', () => ({
    randomUUID: () => 'uuid-1',
}));

vi.mock('@/components/ActionMenuModal', () => ({
    ActionMenuModal: 'ActionMenuModal',
}));

vi.mock('zustand/react/shallow', () => ({
    useShallow: (selector: unknown) => selector,
}));

vi.mock('@/components/FolderPickerSheet', () => ({
    FolderPickerSheet: 'FolderPickerSheet',
}));

vi.mock('@gorhom/bottom-sheet', () => ({
    BottomSheetModal: 'BottomSheetModal',
}));

afterEach(() => {
    machineState = undefined;
    vi.clearAllMocks();
    vi.resetModules();
});

describe('MachineDetailScreen', () => {
    it('does not change hook order when the machine loads after the first render', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { default: MachineDetailScreen } = await import('../../app/(app)/machine/[id]');

        let tree!: ReturnType<typeof renderer.create>;
        await renderer.act(async () => {
            tree = renderer.create(<MachineDetailScreen />);
        });

        machineState = {
            id: 'machine-1',
            metadata: {
                host: 'DESKTOP-0C3Q24O',
                homeDir: '/home/work',
            },
            metadataVersion: 1,
        };

        await expect(renderer.act(async () => {
            tree.update(<MachineDetailScreen />);
        })).resolves.toBeUndefined();

        errorSpy.mockRestore();
    });
});
