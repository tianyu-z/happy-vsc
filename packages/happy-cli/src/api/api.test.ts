import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from './api';
import axios from 'axios';

// Use vi.hoisted to ensure mock functions are available when vi.mock factory runs
const { mockPost, mockIsAxiosError } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockIsAxiosError: vi.fn(() => true)
}));

const {
    mockDecodeBase64,
    mockDecrypt,
    mockEncodeBase64,
    mockEncrypt,
    mockGetRandomBytes,
    mockLibsodiumEncryptForPublicKey,
    mockReadSessionDataKey,
    mockWriteSessionDataKey,
    mockConnectionState,
    mockIsNetworkError,
} = vi.hoisted(() => ({
    mockDecodeBase64: vi.fn((data: string) => data),
    mockDecrypt: vi.fn((data: any) => data),
    mockEncodeBase64: vi.fn((data: any) => data),
    mockEncrypt: vi.fn((data: any) => data),
    mockGetRandomBytes: vi.fn(() => new Uint8Array(32).fill(7)),
    mockLibsodiumEncryptForPublicKey: vi.fn(() => new Uint8Array(32).fill(9)),
    mockReadSessionDataKey: vi.fn(async () => null),
    mockWriteSessionDataKey: vi.fn(async () => undefined),
    mockConnectionState: {
        reset: vi.fn(),
        fail: vi.fn(),
    },
    mockIsNetworkError: vi.fn((code: string | undefined) =>
        ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code ?? '')
    ),
}));

vi.mock('axios', () => ({
    default: {
        post: mockPost,
        isAxiosError: mockIsAxiosError
    },
    isAxiosError: mockIsAxiosError
}));

vi.mock('@/ui/logger', () => ({
    logger: {
        debug: vi.fn()
    }
}));

vi.mock('./apiSession', () => ({
    ApiSessionClient: class {}
}));

vi.mock('./apiMachine', () => ({
    ApiMachineClient: class {}
}));

// Mock encryption utilities
vi.mock('./encryption', () => ({
    decodeBase64: mockDecodeBase64,
    encodeBase64: mockEncodeBase64,
    decrypt: mockDecrypt,
    encrypt: mockEncrypt,
    getRandomBytes: mockGetRandomBytes,
    libsodiumEncryptForPublicKey: mockLibsodiumEncryptForPublicKey,
}));

// Mock configuration
vi.mock('@/configuration', () => ({
    configuration: {
        serverUrl: 'https://api.example.com'
    }
}));

vi.mock('./sessionDataKeyCache', () => ({
    readSessionDataKey: mockReadSessionDataKey,
    writeSessionDataKey: mockWriteSessionDataKey,
}));

vi.mock('@/utils/serverConnectionErrors', () => ({
    connectionState: mockConnectionState,
    isNetworkError: mockIsNetworkError,
}));

// Global test metadata
const testMetadata = {
    path: '/tmp',
    host: 'localhost',
    homeDir: '/home/user',
    happyHomeDir: '/home/user/.happy',
    happyLibDir: '/home/user/.happy/lib',
    happyToolsDir: '/home/user/.happy/tools'
};

const testMachineMetadata = {
    host: 'localhost',
    platform: 'darwin',
    happyCliVersion: '1.0.0',
    homeDir: '/home/user',
    happyHomeDir: '/home/user/.happy',
    happyLibDir: '/home/user/.happy/lib'
};

describe('Api server error handling', () => {
    let api: ApiClient;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockConnectionState.reset(); // Reset offline state between tests
        mockDecodeBase64.mockImplementation((data: string) => data);
        mockDecrypt.mockImplementation((data: any) => data);
        mockEncodeBase64.mockImplementation((data: any) => data);
        mockEncrypt.mockImplementation((data: any) => data);
        mockGetRandomBytes.mockImplementation(() => new Uint8Array(32).fill(7));
        mockLibsodiumEncryptForPublicKey.mockImplementation(() => new Uint8Array(32).fill(9));
        mockReadSessionDataKey.mockResolvedValue(null);
        mockWriteSessionDataKey.mockResolvedValue(undefined);

        // Create a mock credential
        const mockCredential = {
            token: 'fake-token',
            encryption: {
                type: 'legacy' as const,
                secret: new Uint8Array(32)
            }
        };

        api = await ApiClient.create(mockCredential);
    });

    describe('getOrCreateSession', () => {
        it('should return null when Happy server is unreachable (ECONNREFUSED)', async () => {
            // Mock axios to throw connection refused error
            mockPost.mockRejectedValue({ code: 'ECONNREFUSED' });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                caller: 'api.getOrCreateSession',
                errorCode: 'ECONNREFUSED',
                url: 'https://api.example.com/v1/sessions',
            });
        });

        it('should return null when Happy server cannot be found (ENOTFOUND)', async () => {
            mockConnectionState.reset();

            // Mock axios to throw DNS resolution error
            mockPost.mockRejectedValue({ code: 'ENOTFOUND' });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                caller: 'api.getOrCreateSession',
                errorCode: 'ENOTFOUND',
                url: 'https://api.example.com/v1/sessions',
            });
        });

        it('should return null when Happy server times out (ETIMEDOUT)', async () => {
            mockConnectionState.reset();

            // Mock axios to throw timeout error
            mockPost.mockRejectedValue({ code: 'ETIMEDOUT' });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                caller: 'api.getOrCreateSession',
                errorCode: 'ETIMEDOUT',
                url: 'https://api.example.com/v1/sessions',
            });
        });

        it('should return null when session endpoint returns 404', async () => {
            mockConnectionState.reset();

            // Mock axios to return 404
            mockPost.mockRejectedValue({
                response: { status: 404 },
                isAxiosError: true
            });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                errorCode: '404',
                url: 'https://api.example.com/v1/sessions',
            });
        });

        it('should return null when server returns 500 Internal Server Error', async () => {
            mockConnectionState.reset();

            // Mock axios to return 500 error
            mockPost.mockRejectedValue({
                response: { status: 500 },
                isAxiosError: true
            });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                errorCode: '500',
                url: 'https://api.example.com/v1/sessions',
                details: ['Server encountered an error, will retry automatically'],
            });
        });

        it('should return null when server returns 503 Service Unavailable', async () => {
            mockConnectionState.reset();

            // Mock axios to return 503 error
            mockPost.mockRejectedValue({
                response: { status: 503 },
                isAxiosError: true
            });

            const result = await api.getOrCreateSession({
                tag: 'test-tag',
                metadata: testMetadata,
                state: null
            });

            expect(result).toBeNull();
            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Session creation',
                errorCode: '503',
                url: 'https://api.example.com/v1/sessions',
                details: ['Server encountered an error, will retry automatically'],
            });
        });

        it('should re-throw non-connection errors', async () => {
            // Mock axios to throw a different type of error (e.g., authentication error)
            const authError = new Error('Invalid API key');
            (authError as any).code = 'UNAUTHORIZED';
            mockPost.mockRejectedValue(authError);

            await expect(
                api.getOrCreateSession({ tag: 'test-tag', metadata: testMetadata, state: null })
            ).rejects.toThrow('Failed to get or create session: Invalid API key');

            // Should not show the offline mode message
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Happy server unreachable')
            );
            consoleSpy.mockRestore();
        });

        it('refreshes existing data-key sessions when stored metadata can no longer be decrypted', async () => {
            const dataKeyApi = await ApiClient.create({
                token: 'fake-token',
                encryption: {
                    type: 'dataKey' as const,
                    publicKey: new Uint8Array(32).fill(1),
                    machineKey: new Uint8Array(32).fill(2),
                }
            });

            mockPost
                .mockResolvedValueOnce({
                    data: {
                        session: {
                            id: 'existing-session',
                            seq: 3,
                            metadata: 'encrypted-old-metadata',
                            metadataVersion: 1,
                            agentState: null,
                            agentStateVersion: 0,
                        }
                    }
                })
                .mockResolvedValueOnce({
                    data: {
                        session: {
                            id: 'existing-session',
                            seq: 3,
                            metadata: 'encrypted-refreshed-metadata',
                            metadataVersion: 2,
                            agentState: null,
                            agentStateVersion: 0,
                        }
                    }
                });

            mockDecrypt
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(testMetadata);

            const result = await dataKeyApi.getOrCreateSession({
                tag: 'broker:test-machine:test-session',
                metadata: testMetadata,
                state: null
            });

            expect(result?.metadata).toEqual(testMetadata);
            expect(mockPost).toHaveBeenCalledTimes(2);
            expect(mockPost.mock.calls[1]?.[1]).toMatchObject({
                tag: 'broker:test-machine:test-session',
                refreshOnExisting: true,
            });
            expect(mockWriteSessionDataKey).toHaveBeenCalledWith(
                'broker:test-machine:test-session',
                expect.any(Uint8Array),
            );
        });
    });

    describe('getOrCreateMachine', () => {
        it('should return minimal machine object when server is unreachable (ECONNREFUSED)', async () => {
            mockConnectionState.reset();

            // Mock axios to throw connection refused error
            mockPost.mockRejectedValue({ code: 'ECONNREFUSED' });

            const result = await api.getOrCreateMachine({
                machineId: 'test-machine',
                metadata: testMachineMetadata,
                daemonState: {
                    status: 'running',
                    pid: 1234
                }
            });

            expect(result).toEqual({
                id: 'test-machine',
                encryptionKey: expect.any(Uint8Array),
                encryptionVariant: 'legacy',
                metadata: testMachineMetadata,
                metadataVersion: 0,
                daemonState: {
                    status: 'running',
                    pid: 1234
                },
                daemonStateVersion: 0,
            });

            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Machine registration',
                caller: 'api.getOrCreateMachine',
                errorCode: 'ECONNREFUSED',
                url: 'https://api.example.com/v1/machines',
            });
        });

        it('should return minimal machine object when server endpoint returns 404', async () => {
            mockConnectionState.reset();

            // Mock axios to return 404
            mockPost.mockRejectedValue({
                response: { status: 404 },
                isAxiosError: true
            });

            const result = await api.getOrCreateMachine({
                machineId: 'test-machine',
                metadata: testMachineMetadata
            });

            expect(result).toEqual({
                id: 'test-machine',
                encryptionKey: expect.any(Uint8Array),
                encryptionVariant: 'legacy',
                metadata: testMachineMetadata,
                metadataVersion: 0,
                daemonState: null,
                daemonStateVersion: 0,
            });

            expect(mockConnectionState.fail).toHaveBeenCalledWith({
                operation: 'Machine registration',
                errorCode: '404',
                url: 'https://api.example.com/v1/machines',
            });
        });
    });
});
