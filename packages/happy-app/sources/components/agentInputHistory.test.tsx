import * as React from 'react';
import renderer from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockTheme = {
    dark: false,
    colors: {
        input: {
            background: '#fff',
            text: '#111',
            placeholder: '#999',
        },
        button: {
            primary: {
                background: '#111',
                tint: '#fff',
            },
            secondary: {
                tint: '#444',
            },
        },
        surfacePressed: '#f5f5f5',
        surfacePressedOverlay: '#f0f0f0',
        surfaceHighest: '#fafafa',
        text: '#111',
        textSecondary: '#666',
        warning: '#fa0',
        warningCritical: '#f50',
        divider: '#ddd',
        shadow: {
            color: '#000',
            opacity: 0.1,
        },
        radio: {
            active: '#111',
            inactive: '#999',
            dot: '#111',
        },
        permission: {
            acceptEdits: '#111',
            bypass: '#111',
            plan: '#111',
            readOnly: '#111',
            safeYolo: '#111',
            yolo: '#111',
        },
        status: {
            connected: '#0a0',
            connecting: '#fa0',
            error: '#c00',
        },
    },
};

const multiTextInputMocks = vi.hoisted(() => ({
    setTextAndSelection: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
}));

vi.mock('react-native', async () => {
    const ReactModule = await import('react');

    const createHost = (name: string) => ReactModule.forwardRef((props: any, _ref) => {
        const { children, ...rest } = props;
        const resolvedChildren = typeof children === 'function'
            ? children({ pressed: false })
            : children;
        return ReactModule.createElement(name, rest, resolvedChildren);
    });

    return {
        View: createHost('View'),
        Text: createHost('Text'),
        Pressable: createHost('Pressable'),
        TouchableWithoutFeedback: createHost('TouchableWithoutFeedback'),
        ActivityIndicator: createHost('ActivityIndicator'),
        Image: createHost('Image'),
        TextInput: createHost('TextInput'),
        Keyboard: {
            dismiss: vi.fn(),
        },
        Platform: {
            OS: 'web',
            select: (value: Record<string, unknown>) => value.web ?? value.default,
        },
        useWindowDimensions: () => ({
            width: 800,
            height: 600,
            scale: 1,
            fontScale: 1,
        }),
    };
});

vi.mock('react-native-unistyles', () => ({
    useUnistyles: () => ({ theme: mockTheme }),
    StyleSheet: {
        create: (factory: any) => factory(mockTheme, {}),
    },
}));

vi.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    Octicons: 'Octicons',
    MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

vi.mock('expo-image', () => ({
    Image: 'ExpoImage',
}));

vi.mock('./layout', () => ({
    layout: {
        maxWidth: 960,
    },
}));

vi.mock('./haptics', () => ({
    hapticsLight: vi.fn(),
    hapticsError: vi.fn(),
}));

vi.mock('./Shaker', () => ({
    Shaker: React.forwardRef((_props: any, _ref) => _props.children),
}));

vi.mock('./StatusDot', () => ({
    StatusDot: 'StatusDot',
}));

vi.mock('./autocomplete/useActiveWord', () => ({
    useActiveWord: () => null,
}));

vi.mock('./autocomplete/useActiveSuggestions', () => ({
    useActiveSuggestions: () => [[], -1, vi.fn(), vi.fn()],
}));

vi.mock('./AgentInputAutocomplete', () => ({
    AgentInputAutocomplete: () => null,
}));

vi.mock('./FloatingOverlay', () => ({
    FloatingOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./GitStatusBadge', () => ({
    GitStatusBadge: () => null,
    useHasLoadedGitStatus: () => false,
}));

vi.mock('@/sync/storage', () => ({
    useSetting: (key: string) => {
        if (key === 'profiles') return [];
        if (key === 'agentInputEnterToSend') return true;
        return false;
    },
}));

vi.mock('@/constants/Typography', () => ({
    Typography: {
        default: () => ({}),
    },
}));

vi.mock('@/text', () => ({
    t: (key: string) => key,
}));

vi.mock('@/log', () => ({
    log: {
        log: vi.fn(),
    },
}));

vi.mock('@/sync/settings', () => ({
    AIBackendProfile: class {},
    getProfileEnvironmentVariables: () => [],
    validateProfileForAgent: () => null,
}));

vi.mock('@/sync/profileUtils', () => ({
    getBuiltInProfile: () => null,
}));

vi.mock('@/components/ImagePreview', () => ({
    ImagePreview: () => null,
    LocalImage: class {},
}));

vi.mock('@/components/Switch', () => ({
    Switch: () => null,
}));

vi.mock('@/modal', () => ({
    Modal: {
        alert: vi.fn(),
    },
}));

vi.mock('happy-wire', () => ({
    buildCodexModelMode: (family: string, effort: string) => `${family}:${effort}`,
    CLAUDE_MODEL_OPTIONS: [
        {
            value: 'default',
            label: 'Default',
            shortLabel: 'Default',
            description: 'Default',
        },
    ],
    CODEX_MODEL_FAMILY_OPTIONS: [
        {
            value: 'default',
            label: 'Default',
            shortLabel: 'Default',
            description: 'Default',
        },
    ],
    GEMINI_MODEL_OPTIONS: [
        {
            value: 'default',
            label: 'Default',
            shortLabel: 'Default',
            description: 'Default',
        },
    ],
    getCodexReasoningOptions: () => ['medium'],
    getMaxContextSize: () => 200_000,
    MODEL_MODE_DEFAULT: 'default',
    parseCodexModelMode: () => ({
        family: 'default',
        effort: 'medium',
    }),
    FAST_MODE_ICON_COLOR: '#ff0',
}));

vi.mock('./MultiTextInput', async () => {
    const ReactModule = await import('react');

    const MockMultiTextInput = ReactModule.forwardRef((props: any, ref) => {
        ReactModule.useImperativeHandle(ref, () => ({
            setTextAndSelection: (text: string, selection: { start: number; end: number }) => {
                multiTextInputMocks.setTextAndSelection(text, selection);
                props.onChangeText?.(text);
                props.onStateChange?.({ text, selection });
                props.onSelectionChange?.(selection);
            },
            focus: multiTextInputMocks.focus,
            blur: multiTextInputMocks.blur,
        }), [props]);

        return ReactModule.createElement('MockMultiTextInput', props);
    });

    MockMultiTextInput.displayName = 'MockMultiTextInput';

    return {
        MultiTextInput: MockMultiTextInput,
        TextInputState: {},
        MultiTextInputHandle: {},
    };
});

afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
});

describe('AgentInput history navigation', () => {
    it('recalls recently sent input with ArrowUp and ArrowDown', async () => {
        const onSend = vi.fn();
        const onChangeText = vi.fn();

        const { AgentInput } = await import('./AgentInput');

        const renderInput = (value: string) => (
            <AgentInput
                value={value}
                placeholder="Message"
                onChangeText={onChangeText}
                onSend={onSend}
                autocompletePrefixes={[]}
                autocompleteSuggestions={async () => []}
                agentType="codex"
            />
        );

        let tree!: any;
        await renderer.act(async () => {
            tree = renderer.create(renderInput('first question'));
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'Enter', shiftKey: false });
        });
        expect(onSend).toHaveBeenLastCalledWith('first question');

        await renderer.act(async () => {
            tree.update(renderInput(''));
        });

        await renderer.act(async () => {
            tree.update(renderInput('second question'));
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'Enter', shiftKey: false });
        });
        expect(onSend).toHaveBeenLastCalledWith('second question');

        await renderer.act(async () => {
            tree.update(renderInput(''));
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'ArrowUp', shiftKey: false });
        });
        expect(multiTextInputMocks.setTextAndSelection).toHaveBeenLastCalledWith('second question', {
            start: 'second question'.length,
            end: 'second question'.length,
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'ArrowUp', shiftKey: false });
        });
        expect(multiTextInputMocks.setTextAndSelection).toHaveBeenLastCalledWith('first question', {
            start: 'first question'.length,
            end: 'first question'.length,
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'ArrowDown', shiftKey: false });
        });
        expect(multiTextInputMocks.setTextAndSelection).toHaveBeenLastCalledWith('second question', {
            start: 'second question'.length,
            end: 'second question'.length,
        });

        await renderer.act(async () => {
            tree.root.findByType('MockMultiTextInput').props.onKeyPress({ key: 'ArrowDown', shiftKey: false });
        });
        expect(multiTextInputMocks.setTextAndSelection).toHaveBeenLastCalledWith('', {
            start: 0,
            end: 0,
        });
    });
});
