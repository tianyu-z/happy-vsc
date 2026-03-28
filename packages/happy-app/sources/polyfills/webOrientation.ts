const INSTALL_FLAG = '__happyWebOrientationPolyfillInstalled__';

type MutableScreenOrientation = {
    type?: string;
    angle?: number;
    onchange?: ((this: ScreenOrientation, ev: Event) => any) | null;
    addEventListener?: (...args: any[]) => void;
    removeEventListener?: (...args: any[]) => void;
    dispatchEvent?: (...args: any[]) => boolean;
};

function getFallbackOrientationType() {
    return window.innerWidth > window.innerHeight
        ? 'landscape-primary'
        : 'portrait-primary';
}

export function ensureWebScreenOrientationSupport() {
    if (typeof window === 'undefined' || typeof screen === 'undefined') {
        return;
    }

    const screenWithOrientation = screen as Screen & {
        orientation?: MutableScreenOrientation;
    };
    if (typeof screenWithOrientation.orientation?.type === 'string') {
        return;
    }

    const orientation = (
        typeof screenWithOrientation.orientation === 'object'
        && screenWithOrientation.orientation !== null
            ? screenWithOrientation.orientation
            : {}
    ) as MutableScreenOrientation;

    const updateType = () => {
        orientation.type = getFallbackOrientationType();
    };

    updateType();

    if (typeof orientation.angle !== 'number') {
        orientation.angle = 0;
    }
    if (typeof orientation.onchange === 'undefined') {
        orientation.onchange = null;
    }
    if (typeof orientation.addEventListener !== 'function') {
        orientation.addEventListener = () => {};
    }
    if (typeof orientation.removeEventListener !== 'function') {
        orientation.removeEventListener = () => {};
    }
    if (typeof orientation.dispatchEvent !== 'function') {
        orientation.dispatchEvent = () => false;
    }

    try {
        Object.defineProperty(screenWithOrientation, 'orientation', {
            configurable: true,
            enumerable: true,
            value: orientation,
        });
    } catch {
        (screenWithOrientation as { orientation?: MutableScreenOrientation }).orientation = orientation;
    }

    if (!(globalThis as Record<string, unknown>)[INSTALL_FLAG] && typeof window.addEventListener === 'function') {
        window.addEventListener('resize', updateType);
        (globalThis as Record<string, unknown>)[INSTALL_FLAG] = true;
    }
}

ensureWebScreenOrientationSupport();
