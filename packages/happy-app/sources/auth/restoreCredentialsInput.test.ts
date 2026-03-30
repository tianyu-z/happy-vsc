import { describe, expect, it } from 'vitest'

import { formatSecretKeyForBackup } from './secretKeyBackup'
import { normalizeRestoreInput } from './restoreCredentialsInput'

describe('normalizeRestoreInput', () => {
    it('parses exported auth credentials json from another Happy web client', () => {
        expect(
            normalizeRestoreInput(
                JSON.stringify({
                    token: 'token-123',
                    secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                })
            )
        ).toEqual({
            type: 'credentials',
            credentials: {
                token: 'token-123',
                secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
        })
    })

    it('parses exported auth credentials json when wrapped in single quotes', () => {
        expect(
            normalizeRestoreInput(
                `'${JSON.stringify({
                    token: 'token-123',
                    secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                })}'`
            )
        ).toEqual({
            type: 'credentials',
            credentials: {
                token: 'token-123',
                secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
        })
    })

    it('parses exported auth credentials json when copied as a quoted json string', () => {
        expect(
            normalizeRestoreInput(
                JSON.stringify(
                    JSON.stringify({
                        token: 'token-123',
                        secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    })
                )
            )
        ).toEqual({
            type: 'credentials',
            credentials: {
                token: 'token-123',
                secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
        })
    })

    it('keeps supporting backup secret keys', () => {
        const secret = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

        expect(normalizeRestoreInput(secret)).toEqual({
            type: 'secret',
            secret,
        })
    })

    it('normalizes formatted backup secret keys', () => {
        const secret = 'G8fdjYD7MAnf7Mfk6D2MiOB-oGDNn-QWkBXRC4o_rF8'

        expect(normalizeRestoreInput(formatSecretKeyForBackup(secret))).toEqual({
            type: 'secret',
            secret,
        })
    })
})
