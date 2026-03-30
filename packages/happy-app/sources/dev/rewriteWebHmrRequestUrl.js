const IGNORED_PATHS = new Set(['/', '/manifest', '/index.exp'])
const IGNORED_PREFIXES = ['/assets/', '/_expo/', '/node_modules/']

function hasFileExtension(pathname) {
    const lastSegment = pathname.split('/').pop() ?? ''
    return /\.[^/]+$/.test(lastSegment)
}

function shouldRewriteWebHmrRequest(parsedUrl) {
    if (parsedUrl.searchParams.get('platform') !== 'web') {
        return false
    }

    if (parsedUrl.searchParams.has('bundleEntry')) {
        return false
    }

    if (IGNORED_PATHS.has(parsedUrl.pathname)) {
        return false
    }

    if (IGNORED_PREFIXES.some((prefix) => parsedUrl.pathname.startsWith(prefix))) {
        return false
    }

    if (hasFileExtension(parsedUrl.pathname)) {
        return false
    }

    return true
}

function rewriteWebHmrRequestUrl(requestUrl, bundleRequestPath) {
    const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(requestUrl)
    const isProtocolRelativeUrl = requestUrl.startsWith('//')
    const parsedUrl = new URL(requestUrl, 'http://localhost')

    if (!shouldRewriteWebHmrRequest(parsedUrl)) {
        return requestUrl
    }

    const bundleUrl = new URL(bundleRequestPath, `${parsedUrl.protocol}//${parsedUrl.host}`)

    if (isProtocolRelativeUrl) {
        return `//${bundleUrl.host}${bundleUrl.pathname}${bundleUrl.search}`
    }

    if (!isAbsoluteUrl) {
        return `${bundleUrl.pathname}${bundleUrl.search}`
    }

    return bundleUrl.toString()
}

module.exports = {
    rewriteWebHmrRequestUrl,
}
