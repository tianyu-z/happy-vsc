import { describe, expect, it } from 'vitest'

const { rewriteWebHmrRequestUrl } = require('./rewriteWebHmrRequestUrl')

describe('rewriteWebHmrRequestUrl', () => {
    const bundleRequestPath =
        '/packages/happy-app/index.ts.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=.%2Fsources%2Fapp&unstable_transformProfile=hermes-stable'

    it('rewrites web route requests to the real bundle URL', () => {
        expect(
            rewriteWebHmrRequestUrl(
                'http://localhost:8081/inbox?platform=web',
                bundleRequestPath
            )
        ).toBe(`http://localhost:8081${bundleRequestPath}`)
    })

    it('preserves relative URLs when rewriting route requests', () => {
        expect(rewriteWebHmrRequestUrl('/inbox?platform=web', bundleRequestPath)).toBe(
            bundleRequestPath
        )
    })

    it('does not rewrite actual bundle requests', () => {
        expect(
            rewriteWebHmrRequestUrl(
                `http://localhost:8081${bundleRequestPath}`,
                bundleRequestPath
            )
        ).toBe(`http://localhost:8081${bundleRequestPath}`)
    })

    it('does not rewrite asset requests', () => {
        expect(
            rewriteWebHmrRequestUrl(
                'http://localhost:8081/assets/icon.png?platform=web',
                bundleRequestPath
            )
        ).toBe('http://localhost:8081/assets/icon.png?platform=web')
    })
})
