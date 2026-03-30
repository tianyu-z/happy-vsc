import * as React from 'react';
import renderer from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockSession: any;
let mockMessages: { messages: any[]; isLoaded: boolean; fetchVersion: number };

const refreshSessionsMock = vi.fn(async () => undefined);

const mockTheme = {
    dark: false,
    colors: {
        text: '#111',
        textSecondary: '#666',
        surface: '#fff',
        header: {
            tint: '#111',
        },
        shadow: {
            color: '#000',
            opacity: 0.1,
        },
        button: {
            primary: {
                background: '#111',
                tint: '#fff',
            },
        },
        status: {
            connecting: '#fa0',
            error: '#c00',
        },
    },
};

function createSession(overrides: Partial<any> = {}) {
    return {
        id: 'session-1',
        seq: 1,
        createdAt: Date.now() - 5_000,
        updatedAt: Date.now(),
        active: true,
        activeAt: Date.now(),
        metadata: {
            path: '/repo',
            host: 'host',
            machineId: 'machine-1',
            sessionSource: 'broker_attached',
            windowInstanceId: 'window-1',
            brokerWindowLabel: 'happy-vsc',
            brokerWorkspaceLabel: 'happy-vsc',
            brokerWorkspacePath: '/repo',
            brokerWindowOrdinal: 1,
            flavor: 'codex',
        },
        metadataVersion: 1,
        agentState: null,
        agentStateVersion: 1,
        thinking: false,
        thinkingAt: 0,
        presence: 'online',
        permissionMode: 'default',
        modelMode: 'default',
        fastMode: false,
        latestUsage: null,
        ...overrides,
    };
}

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
        Pressable: createHost('Pressable'),
        Platform: {
            OS: 'ios',
            select: (value: Record<string, unknown>) => value.ios ?? value.default,
        },
    };
});

vi.mock('react-native-unistyles', () => ({
    useUnistyles: () => ({ theme: mockTheme }),
}));

vi.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

vi.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

vi.mock('@gorhom/bottom-sheet', () => ({
    BottomSheetModal: 'BottomSheetModal',
}));

vi.mock('@react-navigation/native', () => ({
    useFocusEffect: vi.fn(),
    useIsFocused: () => true,
}));

vi.mock('expo-router', () => ({
    useLocalSearchParams: () => ({}),
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        canGoBack: () => false,
    }),
}));

vi.mock('@/components/AgentContentView', () => ({
    AgentContentView: ({ content, placeholder, betweenContentAndInput, input }: any) => (
        <>
            {content}
            {placeholder}
            {betweenContentAndInput}
            {input}
        </>
    ),
}));

vi.mock('@/components/AgentInput', () => ({
    AgentInput: React.forwardRef((_props: any, _ref) => null),
}));

vi.mock('@/components/Avatar', () => ({
    Avatar: () => null,
}));

vi.mock('@/components/BrokerAttachedDetailsSheet', () => ({
    BrokerAttachedDetailsSheet: () => null,
}));

vi.mock('@/components/BrokerAttachedStrip', () => ({
    BrokerAttachedStrip: () => null,
}));

vi.mock('@/components/MultiTextInput', () => ({
    MultiTextInputHandle: class {},
}));

vi.mock('@/components/autocomplete/suggestions', () => ({
    getSuggestions: () => [],
}));

vi.mock('@/components/ChatHeaderView', () => ({
    ChatHeaderView: () => null,
}));

vi.mock('@/components/ChatList', () => ({
    ChatList: () => null,
}));

vi.mock('@/components/Deferred', () => ({
    Deferred: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/DuplicateSheet', () => ({
    DuplicateSheet: () => null,
}));

vi.mock('@/components/ActionMenuModal', () => ({
    ActionMenuModal: () => null,
}));

vi.mock('@/components/EmptyMessages', () => ({
    EmptyMessages: () => React.createElement('Text', null, 'EmptyMessages'),
}));

vi.mock('@/components/PendingQueuePanel', () => ({
    PendingQueuePanel: () => null,
}));

vi.mock('@/components/VoiceAssistantStatusBar', () => ({
    VoiceAssistantStatusBar: () => null,
}));

vi.mock('@/hooks/useDraft', () => ({
    useDraft: () => ({
        clearDraft: vi.fn(),
    }),
}));

vi.mock('@/hooks/useImagePicker', () => ({
    useImagePicker: () => ({
        images: [],
        pickFromGallery: vi.fn(),
        pickFromCamera: vi.fn(),
        addImageFromUri: vi.fn(),
        removeImage: vi.fn(),
        clearImages: vi.fn(),
        initImages: vi.fn(),
        canAddMore: true,
    }),
}));

vi.mock('@/modal', () => ({
    Modal: {
        alert: vi.fn(),
        confirm: vi.fn(),
    },
}));

vi.mock('@/realtime/hooks/voiceHooks', () => ({
    voiceHooks: {
        onVoiceStarted: () => '',
        onVoiceStopped: vi.fn(),
    },
}));

vi.mock('@/realtime/RealtimeSession', () => ({
    startRealtimeSession: vi.fn(),
    stopRealtimeSession: vi.fn(),
}));

vi.mock('@/sync/ops', () => ({
    sessionAbort: vi.fn(),
    machineGetClaudeSessionUserMessages: vi.fn(),
    machineDuplicateClaudeSession: vi.fn(),
    machineSpawnNewSession: vi.fn(),
    machineGetGeminiSessionUserMessages: vi.fn(),
    machineDuplicateGeminiSession: vi.fn(),
    machineGetCodexSessionUserMessages: vi.fn(),
    machineDuplicateCodexSession: vi.fn(),
}));

vi.mock('@/sync/storage', () => {
    const storage = {
        getState: () => ({
            sessions: {
                'session-1': mockSession,
            },
            sharedSessions: {},
            socketStatus: 'connected',
            applyLocalSettings: vi.fn(),
            updateSessionPermissionMode: vi.fn(),
            updateSessionModelMode: vi.fn(),
            setSessionFastMode: vi.fn(),
        }),
    };

    return {
        storage,
        useIsDataReady: () => true,
        useLocalSetting: () => ({}),
        useOrchestratorRunningTaskCount: () => 0,
        useRealtimeStatus: () => 'disconnected',
        useSession: () => mockSession,
        useSessionMessages: () => ({
            messages: mockMessages.messages,
            isLoaded: mockMessages.isLoaded,
            hasMore: false,
            fetchVersion: mockMessages.fetchVersion,
        }),
        useSessionPendingMessages: () => [],
        useSessionUsage: () => null,
        useSetting: () => false,
    };
});

vi.mock('@/sync/sync', () => ({
    sync: {
        refreshSessions: refreshSessionsMock,
        onSessionVisible: vi.fn(),
        fetchOlderMessages: vi.fn(),
        sendNowPendingMessage: vi.fn(),
        pinPendingMessage: vi.fn(),
        deletePendingMessage: vi.fn(),
        sendOrQueueMessage: vi.fn(),
    },
}));

vi.mock('@/text', () => ({
    t: (key: string) => key,
}));

vi.mock('@/track', () => ({
    tracking: null,
    trackMessageSent: vi.fn(),
}));

vi.mock('@/utils/imagePaste', () => ({
    handleImagePasteEvent: vi.fn(),
}));

vi.mock('@/utils/platform', () => ({
    isRunningOnMac: () => false,
}));

vi.mock('@/utils/responsive', () => ({
    useDeviceType: () => 'phone',
    useHeaderHeight: () => 0,
    useIsLandscape: () => false,
    useIsTablet: () => false,
}));

vi.mock('@/utils/brokerSessionUtils', () => ({
    getBrokerSessionProviderLabel: () => 'Codex',
    getBrokerSessionStripSummary: () => 'Broker attached',
    isBrokerSessionReadOnly: () => false,
}));

vi.mock('@/utils/brokerStripState', () => ({
    BrokerStripMode: {},
    createBrokerStripStateController: () => ({
        mode: 'hidden',
        subscribe: () => () => {},
        onEnter: vi.fn(),
        onAssistantDelta: vi.fn(),
        onScroll: vi.fn(),
        onUserMessageSent: vi.fn(),
        dispose: vi.fn(),
    }),
}));

vi.mock('@/utils/sessionNavigation', () => ({
    navigateBackFromSession: vi.fn(),
}));

vi.mock('@/utils/sessionUtils', () => ({
    formatPathRelativeToHome: (path: string) => path,
    generateCopyTitle: () => 'Copy',
    getSessionAvatarId: () => 'avatar',
    getSessionName: () => 'Session',
    useSessionStatus: () => ({
        state: 'idle',
        statusText: 'Ready',
        statusColor: '#111',
        statusDotColor: '#111',
        isPulsing: false,
    }),
    copySessionMetadata: vi.fn(),
}));

vi.mock('@/utils/versionUtils', () => ({
    isVersionSupported: () => true,
    useLatestCliVersion: () => null,
}));

vi.mock('@/log', () => ({
    log: {
        log: vi.fn(),
    },
}));

afterEach(() => {
    vi.clearAllMocks();
    mockSession = undefined;
    mockMessages = {
        messages: [],
        isLoaded: true,
        fetchVersion: 1,
    };
});

describe('SessionView broker hydration', () => {
    it('shows a broker hydration placeholder for a fresh broker-attached session with zero messages', async () => {
        mockSession = createSession({ createdAt: Date.now() - 5_000 });
        mockMessages = {
            messages: [],
            isLoaded: true,
            fetchVersion: 1,
        };

        const { SessionView } = await import('./SessionView');
        let tree!: ReturnType<typeof renderer.create>;
        await renderer.act(async () => {
            tree = renderer.create(<SessionView id="session-1" />);
            await Promise.resolve();
        });

        expect(tree.root.findAllByProps({ children: 'sessionInfo.brokerHydratingTitle' }).length).toBeGreaterThan(0);
        expect(tree.root.findAllByProps({ children: 'EmptyMessages' }).length).toBe(0);
    });

    it('falls back to the normal empty state after the broker hydration window expires', async () => {
        mockSession = createSession({ createdAt: Date.now() - 20_000 });
        mockMessages = {
            messages: [],
            isLoaded: true,
            fetchVersion: 1,
        };

        const { SessionView } = await import('./SessionView');
        let tree!: ReturnType<typeof renderer.create>;
        await renderer.act(async () => {
            tree = renderer.create(<SessionView id="session-1" />);
            await Promise.resolve();
        });

        expect(tree.root.findAllByProps({ children: 'EmptyMessages' }).length).toBe(1);
    });
});
