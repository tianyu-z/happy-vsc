import { decodeBase64 } from '@/encryption/base64'

import { normalizeSecretKey } from './secretKeyBackup'
import type { AuthCredentials } from './tokenStorage'

export type NormalizedRestoreInput =
    | { type: 'credentials'; credentials: AuthCredentials }
    | { type: 'secret'; secret: string }

export function normalizeRestoreInput(input: string): NormalizedRestoreInput {
    for (const candidate of expandRestoreInputCandidates(input)) {
        const importedCredentials = tryParseCredentials(candidate)

        if (importedCredentials) {
            return {
                type: 'credentials',
                credentials: importedCredentials,
            }
        }
    }

    return {
        type: 'secret',
        secret: normalizeSecretKey(input.trim()),
    }
}

function tryParseCredentials(input: string): AuthCredentials | null {
    if (!input.startsWith('{')) {
        return null
    }

    try {
        const parsed = JSON.parse(input) as Partial<AuthCredentials>
        if (typeof parsed.token !== 'string' || typeof parsed.secret !== 'string') {
            return null
        }

        const secretBytes = decodeBase64(parsed.secret, 'base64url')
        if (secretBytes.length !== 32) {
            return null
        }

        return {
            token: parsed.token,
            secret: parsed.secret,
        }
    } catch {
        return null
    }
}

function expandRestoreInputCandidates(input: string): string[] {
    const seen = new Set<string>()
    const queue = [input.trim()]

    while (queue.length > 0) {
        const current = queue.shift()
        if (!current || seen.has(current)) {
            continue
        }

        seen.add(current)

        const unwrapped = unwrapMatchingQuotes(current)
        if (unwrapped && !seen.has(unwrapped)) {
            queue.push(unwrapped)
        }

        try {
            const parsed = JSON.parse(current)
            if (typeof parsed === 'string') {
                const trimmedParsed = parsed.trim()
                if (trimmedParsed && !seen.has(trimmedParsed)) {
                    queue.push(trimmedParsed)
                }
            }
        } catch {
            // Ignore non-JSON input here and fall back to secret-key parsing.
        }
    }

    return Array.from(seen)
}

function unwrapMatchingQuotes(input: string): string | null {
    if (input.length < 2) {
        return null
    }

    const first = input[0]
    const last = input[input.length - 1]
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
        return input.slice(1, -1).trim()
    }

    return null
}
