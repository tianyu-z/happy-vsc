import type {
  CaptureVscodeHost,
  Disposable,
  MutableProviderRuntimeCaptureRegistry,
} from './ProviderRuntimeCapture';
import type { ProviderRuntimeCapturePath } from './types';

type SharedRegistrarMethod = (...args: unknown[]) => unknown;
type SharedRegistrarMethodKey =
  | 'registerWebviewViewProvider'
  | 'registerCustomEditorProvider'
  | 'registerChatSessionItemProvider';

type SharedRegistrarTarget = {
  registerWebviewViewProvider?: SharedRegistrarMethod;
  registerCustomEditorProvider?: SharedRegistrarMethod;
  registerChatSessionItemProvider?: SharedRegistrarMethod;
  [sharedPatchStateKey]?: SharedPatchState;
};

type SharedRegistrarCandidate =
  | unknown
  | {
      label?: string;
      value: unknown;
    };

type SharedRegistrarTargetKind = 'instance' | 'prototype';

type SharedPatchState = {
  refCount: number;
  registries: Set<MutableProviderRuntimeCaptureRegistry>;
  originalRegisterWebviewViewProvider?: SharedRegistrarMethod;
  originalRegisterCustomEditorProvider?: SharedRegistrarMethod;
  originalRegisterChatSessionItemProvider?: SharedRegistrarMethod;
};

export type SharedWebviewRegistrarLocation = {
  target: SharedRegistrarTarget;
  targetKind: SharedRegistrarTargetKind;
  registerWebviewViewProvider?: SharedRegistrarMethod;
  registerCustomEditorProvider?: SharedRegistrarMethod;
  registerChatSessionItemProvider?: SharedRegistrarMethod;
  label?: string;
};

export type ExtHostSharedRegistrationDiagnostic = {
  installed: boolean;
  targetKind: SharedRegistrarTargetKind | null;
  failureReason: string | null;
};

type LocateSharedWebviewRegistrarOptions = {
  vscodeHost?: CaptureVscodeHost;
  functionSource?: string;
  candidates?: SharedRegistrarCandidate[];
};

type InstallExtHostSharedRegistrationCaptureOptions =
  LocateSharedWebviewRegistrarOptions & {
    registry: MutableProviderRuntimeCaptureRegistry;
    failureReason?: string | null;
  };

type InspectorRemoteValue = {
  objectId?: string;
  type?: string;
};

type InspectorPropertyDescriptor = {
  name: string;
  value?: InspectorRemoteValue;
};

type InspectorPostResult = {
  result?: InspectorRemoteValue | InspectorPropertyDescriptor[];
  internalProperties?: InspectorPropertyDescriptor[];
};

type InspectorSessionLike = {
  connect(): void;
  disconnect(): void;
  post(
    method: string,
    params: Record<string, unknown>,
    callback: (error: Error | null, result?: InspectorPostResult) => void,
  ): void;
};

export type SharedRegistrarDiscoveryResult = {
  candidates: Array<{ label?: string; value: unknown }>;
  failureReason: string | null;
};

const sharedPatchStateKey = Symbol('happy.extHostSharedRegistrationCapture');
let inspectorGlobalRefCounter = 0;

function nextInspectorGlobalRef(prefix: string): string {
  inspectorGlobalRefCounter += 1;
  return `__happy_${prefix}_${process.pid}_${inspectorGlobalRefCounter}__`;
}

function toObjectLike(value: unknown): object | null {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    return null;
  }

  return value;
}

function toCandidateRecords(
  candidates: SharedRegistrarCandidate[] | undefined,
): Array<{ label?: string; value: unknown }> {
  return (candidates ?? []).map((candidate) => {
    if (
      candidate &&
      typeof candidate === 'object' &&
      'value' in candidate
    ) {
      return candidate as {
        label?: string;
        value: unknown;
      };
    }

    return { value: candidate };
  });
}

function extractCandidateSymbol(label: string | undefined): string | null {
  if (!label) {
    return null;
  }

  const parts = label.split('.');
  const last = parts[parts.length - 1]?.trim();
  return last ? last : null;
}

function candidateMatchesFunctionSource(
  label: string | undefined,
  functionSource: string | undefined,
): boolean {
  const symbol = extractCandidateSymbol(label);
  if (!symbol || !functionSource) {
    return false;
  }

  return (
    functionSource.includes(`${symbol}.registerWebviewViewProvider`) ||
    functionSource.includes(`${symbol}.registerCustomEditorProvider`) ||
    functionSource.includes(`${symbol}.registerChatSessionItemProvider`)
  );
}

function hasReachableRegistrarMethods(
  value: unknown,
): value is SharedRegistrarTarget {
  const objectValue = toObjectLike(value) as SharedRegistrarTarget | null;
  if (!objectValue) {
    return false;
  }

  return (
    typeof objectValue.registerWebviewViewProvider === 'function' ||
    typeof objectValue.registerCustomEditorProvider === 'function' ||
    typeof objectValue.registerChatSessionItemProvider === 'function'
  );
}

function hasOwnRegistrarMethods(
  value: unknown,
): value is SharedRegistrarTarget {
  const objectValue = toObjectLike(value) as SharedRegistrarTarget | null;
  if (!objectValue) {
    return false;
  }

  return (
    typeof Object.getOwnPropertyDescriptor(
      objectValue,
      'registerWebviewViewProvider',
    )?.value === 'function' ||
    typeof Object.getOwnPropertyDescriptor(
      objectValue,
      'registerCustomEditorProvider',
    )?.value === 'function' ||
    typeof Object.getOwnPropertyDescriptor(
      objectValue,
      'registerChatSessionItemProvider',
    )?.value === 'function'
  );
}

function hasReachableRegistrarMethod(
  candidate: SharedRegistrarTarget,
  methodKey: SharedRegistrarMethodKey,
): boolean {
  return typeof candidate[methodKey] === 'function';
}

function hasOwnRegistrarMethod(
  candidate: SharedRegistrarTarget,
  methodKey: SharedRegistrarMethodKey,
): boolean {
  return (
    typeof Object.getOwnPropertyDescriptor(
      candidate,
      methodKey,
    )?.value === 'function'
  );
}

function parseRegistrationArgs(
  args: unknown[],
): {
  registrationType: string;
  provider: unknown;
} | null {
  if (typeof args[0] === 'string') {
    return {
      registrationType: args[0],
      provider: args[1],
    };
  }

  if (typeof args[1] === 'string') {
    return {
      registrationType: args[1],
      provider: args[2],
    };
  }

  return null;
}

function postInspector(
  session: InspectorSessionLike,
  method: string,
  params: Record<string, unknown>,
): Promise<InspectorPostResult> {
  return new Promise((resolve, reject) => {
    session.post(method, params, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result ?? {});
    });
  });
}

async function captureRemoteObjectIntoGlobal(
  session: InspectorSessionLike,
  objectId: string,
  globalRef: string,
): Promise<void> {
  await postInspector(session, 'Runtime.callFunctionOn', {
    objectId,
    functionDeclaration:
      'function(key) { globalThis[key] = this; return true; }',
    arguments: [{ value: globalRef }],
  });
}

async function discoverSharedRegistrarCandidatesFromRegistrationFunction(
  registrationFunction: SharedRegistrarMethod,
): Promise<SharedRegistrarDiscoveryResult> {
  let inspectorModule: { Session: new () => InspectorSessionLike };
  try {
    inspectorModule = await import('node:inspector');
  } catch {
    return {
      candidates: [],
      failureReason: 'inspector_unavailable',
    };
  }

  const session = new inspectorModule.Session();
  const globalHost = globalThis as Record<string, unknown>;
  const functionRef = nextInspectorGlobalRef('scope_function');
  const capturedRefs: string[] = [];
  globalHost[functionRef] = registrationFunction;

  try {
    session.connect();

    const evaluated = await postInspector(session, 'Runtime.evaluate', {
      expression: `globalThis[${JSON.stringify(functionRef)}]`,
      objectGroup: 'happy-shared-registrar-discovery',
    });
    const evaluatedResult = Array.isArray(evaluated.result)
      ? null
      : evaluated.result;
    const functionObjectId = evaluatedResult?.objectId;
    if (!functionObjectId) {
      return {
        candidates: [],
        failureReason: 'function_object_missing',
      };
    }

    const functionProps = await postInspector(session, 'Runtime.getProperties', {
      objectId: functionObjectId,
      ownProperties: false,
      accessorPropertiesOnly: false,
      generatePreview: false,
    });
    const scopesObjectId = functionProps.internalProperties
      ?.find((property) => property.name === '[[Scopes]]')
      ?.value?.objectId;
    if (!scopesObjectId) {
      return {
        candidates: [],
        failureReason: 'scopes_unavailable',
      };
    }

    const scopes = await postInspector(session, 'Runtime.getProperties', {
      objectId: scopesObjectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: false,
    });

    const dedupedCandidates = new Set<unknown>();
    const candidates: Array<{ label?: string; value: unknown }> = [];
    const scopeList = Array.isArray(scopes.result) ? scopes.result : [];
    for (const scope of scopeList) {
      if (!/^\d+$/.test(scope.name) || !scope.value?.objectId) {
        continue;
      }

      const scopeEntries = await postInspector(session, 'Runtime.getProperties', {
        objectId: scope.value.objectId,
        ownProperties: true,
        accessorPropertiesOnly: false,
        generatePreview: false,
      });

      const scopeEntryList = Array.isArray(scopeEntries.result)
        ? scopeEntries.result
        : [];
      for (const entry of scopeEntryList) {
        const entryValue = entry.value;
        if (
          !entryValue?.objectId ||
          (entryValue.type !== 'object' && entryValue.type !== 'function')
        ) {
          continue;
        }

        const globalRef = nextInspectorGlobalRef('scope_candidate');
        await captureRemoteObjectIntoGlobal(
          session,
          entryValue.objectId,
          globalRef,
        );
        capturedRefs.push(globalRef);

        const candidateValue = globalHost[globalRef];
        if (
          candidateValue === undefined ||
          dedupedCandidates.has(candidateValue)
        ) {
          continue;
        }

        dedupedCandidates.add(candidateValue);
        candidates.push({
          label: `scope:${scope.name}.${entry.name}`,
          value: candidateValue,
        });
      }
    }

    return {
      candidates,
      failureReason: candidates.length > 0 ? null : 'no_scope_objects_found',
    };
  } catch {
    return {
      candidates: [],
      failureReason: 'inspector_query_failed',
    };
  } finally {
    for (const globalRef of [functionRef, ...capturedRefs]) {
      delete globalHost[globalRef];
    }

    try {
      session.disconnect();
    } catch {
      // Ignore disconnect failures from partially initialized sessions.
    }
  }
}

export async function discoverSharedRegistrarCandidatesFromVscodeApi(
  vscodeHost: CaptureVscodeHost,
): Promise<SharedRegistrarDiscoveryResult> {
  const registrationFunctions = [
    vscodeHost.window?.registerWebviewViewProvider,
    vscodeHost.window?.registerCustomEditorProvider,
    vscodeHost.chat?.registerChatSessionItemProvider,
  ].flatMap((candidate) =>
    typeof candidate === 'function'
      ? [candidate as SharedRegistrarMethod]
      : [],
  );

  if (registrationFunctions.length === 0) {
    return {
      candidates: [],
      failureReason: 'registration_unavailable',
    };
  }

  const dedupedCandidates = new Set<unknown>();
  const candidates: Array<{ label?: string; value: unknown }> = [];
  let failureReason: string | null = null;

  for (const registrationFunction of registrationFunctions) {
    const discovered =
      await discoverSharedRegistrarCandidatesFromRegistrationFunction(
        registrationFunction,
      );
    if (!failureReason && discovered.failureReason) {
      failureReason = discovered.failureReason;
    }

    for (const candidate of discovered.candidates) {
      if (dedupedCandidates.has(candidate.value)) {
        continue;
      }
      dedupedCandidates.add(candidate.value);
      candidates.push(candidate);
    }
  }

  return {
    candidates,
    failureReason: candidates.length > 0 ? null : failureReason,
  };
}

function locateSharedRegistrarForMethod(options: {
  candidates?: SharedRegistrarCandidate[];
  functionSource?: string;
  methodKey: SharedRegistrarMethodKey;
}): SharedWebviewRegistrarLocation | null {
  const candidateRecords = toCandidateRecords(options.candidates);
  const prioritizedCandidates = [
    ...candidateRecords.filter((candidateRecord) =>
      candidateMatchesFunctionSource(
        candidateRecord.label,
        options.functionSource,
      ),
    ),
    ...candidateRecords.filter(
      (candidateRecord) =>
        !candidateMatchesFunctionSource(
          candidateRecord.label,
          options.functionSource,
        ),
    ),
  ];

  for (const candidateRecord of prioritizedCandidates) {
    if (
      hasOwnRegistrarMethods(candidateRecord.value) &&
      hasOwnRegistrarMethod(candidateRecord.value, options.methodKey)
    ) {
      return {
        target: candidateRecord.value,
        targetKind: 'instance',
        registerWebviewViewProvider:
          candidateRecord.value.registerWebviewViewProvider,
        registerCustomEditorProvider:
          candidateRecord.value.registerCustomEditorProvider,
        registerChatSessionItemProvider:
          candidateRecord.value.registerChatSessionItemProvider,
        label: candidateRecord.label,
      };
    }

    const objectValue = toObjectLike(candidateRecord.value);
    if (!objectValue) {
      continue;
    }

    const prototype = Object.getPrototypeOf(objectValue);
    if (
      !prototype ||
      prototype === Object.prototype ||
      prototype === Function.prototype ||
      !hasReachableRegistrarMethods(prototype) ||
      !hasReachableRegistrarMethod(prototype, options.methodKey)
    ) {
      continue;
    }

    return {
      target: prototype,
      targetKind: 'prototype',
      registerWebviewViewProvider: prototype.registerWebviewViewProvider,
      registerCustomEditorProvider: prototype.registerCustomEditorProvider,
      registerChatSessionItemProvider:
        prototype.registerChatSessionItemProvider,
      label: candidateRecord.label,
    };
  }

  return null;
}

export function locateSharedWebviewRegistrar(
  options: LocateSharedWebviewRegistrarOptions,
): SharedWebviewRegistrarLocation | null {
  return locateSharedRegistrarForMethod({
    candidates: options.candidates,
    functionSource:
      options.functionSource ??
      options.vscodeHost?.window?.registerWebviewViewProvider?.toString(),
    methodKey: 'registerWebviewViewProvider',
  });
}

function locateSharedRegistrarLocations(
  options: LocateSharedWebviewRegistrarOptions,
): SharedWebviewRegistrarLocation[] {
  const allMethodTargets: Array<{
    methodKey: SharedRegistrarMethodKey;
    functionSource: string | undefined;
  }> = [
    {
      methodKey: 'registerWebviewViewProvider',
      functionSource: options.vscodeHost?.window?.registerWebviewViewProvider?.toString(),
    },
    {
      methodKey: 'registerCustomEditorProvider',
      functionSource: options.vscodeHost?.window?.registerCustomEditorProvider?.toString(),
    },
    {
      methodKey: 'registerChatSessionItemProvider',
      functionSource: options.vscodeHost?.chat?.registerChatSessionItemProvider?.toString(),
    },
  ];
  const methodTargets = allMethodTargets.filter(
    ({ functionSource }) => typeof functionSource === 'string',
  );

  const dedupedTargets = new Set<SharedRegistrarTarget>();
  const locations: SharedWebviewRegistrarLocation[] = [];
  for (const methodTarget of methodTargets) {
    const location = locateSharedRegistrarForMethod({
      candidates: options.candidates,
      functionSource: methodTarget.functionSource,
      methodKey: methodTarget.methodKey,
    });
    if (!location || dedupedTargets.has(location.target)) {
      continue;
    }

    dedupedTargets.add(location.target);
    locations.push(location);
  }

  return locations;
}

function installPatchedMethod(
  target: SharedRegistrarTarget,
  key: SharedRegistrarMethodKey,
  originalMethod: SharedRegistrarMethod | undefined,
  patchState: SharedPatchState,
  capturePath: ProviderRuntimeCapturePath,
) {
  if (!originalMethod) {
    return;
  }

  target[key] = function patchedSharedRegistrationMethod(
    ...args: unknown[]
  ) {
    const registration = parseRegistrationArgs(args);
    if (registration) {
      for (const registry of patchState.registries) {
        if (key === 'registerChatSessionItemProvider') {
          registry.captureChatSessionRegistration(
            registration.registrationType,
            registration.provider,
            {
              capturePath,
            },
          );
        } else {
          registry.captureRegistration(
            registration.registrationType,
            registration.provider,
            {
              capturePath,
            },
          );
        }
      }
    }

    return originalMethod.apply(this, args);
  };
}

function toMapEntries(
  value: unknown,
): Array<[unknown, unknown]> {
  if (value instanceof Map) {
    return Array.from(value.entries());
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { entries?: unknown }).entries === 'function'
  ) {
    try {
      return Array.from(
        (value as { entries(): Iterable<[unknown, unknown]> }).entries(),
      );
    } catch {
      return [];
    }
  }

  return [];
}

function backfillCapturedProvidersFromCandidate(params: {
  candidateValue: unknown;
  registry: MutableProviderRuntimeCaptureRegistry;
  capturePath: ProviderRuntimeCapturePath;
}) {
  const candidate =
    toObjectLike(params.candidateValue) as Record<string, unknown> | null;
  if (!candidate) {
    return;
  }

  for (const [viewType, entry] of toMapEntries(candidate._viewProviders)) {
    if (typeof viewType !== 'string') {
      continue;
    }

    const provider = (
      entry as { provider?: unknown } | null | undefined
    )?.provider;
    if (provider) {
      params.registry.captureRegistration(viewType, provider, {
        capturePath: params.capturePath,
      });
    }
  }

  const editorProviders = (
    candidate._editorProviders as { _providers?: unknown } | null | undefined
  )?._providers;
  for (const [viewType, entry] of toMapEntries(editorProviders)) {
    if (typeof viewType !== 'string') {
      continue;
    }

    const provider = (
      entry as { provider?: unknown } | null | undefined
    )?.provider;
    if (provider) {
      params.registry.captureRegistration(viewType, provider, {
        capturePath: params.capturePath,
      });
    }
  }

  for (const [, entry] of toMapEntries(candidate._chatSessionItemControllers)) {
    const chatSessionType = (
      entry as { chatSessionType?: unknown } | null | undefined
    )?.chatSessionType;
    const controller = (
      entry as { controller?: unknown } | null | undefined
    )?.controller;
    if (typeof chatSessionType !== 'string' || !controller) {
      continue;
    }

    params.registry.captureChatSessionRegistration(chatSessionType, controller, {
      capturePath: params.capturePath,
    });
  }
}

export function installExtHostSharedRegistrationCapture(
  options: InstallExtHostSharedRegistrationCaptureOptions,
): Disposable & {
  diagnostics: ExtHostSharedRegistrationDiagnostic;
} {
  const locations = locateSharedRegistrarLocations(options);
  const failureReason = options.failureReason ?? 'no_candidate_found';

  if (locations.length === 0) {
    options.registry.setSharedHookDiagnostic({
      installed: false,
      targetKind: null,
      failureReason,
    });
    return {
      diagnostics: {
        installed: false,
        targetKind: null,
        failureReason,
      },
      dispose() {},
    };
  }
  const firstLocation = locations[0]!;
  const capturePath =
    firstLocation.targetKind === 'instance'
      ? 'shared_ext_host_instance'
      : 'shared_ext_host_prototype';
  const patchedTargets = new Set<SharedRegistrarTarget>();
  for (const location of locations) {
    const target = location.target;
    let patchState = target[sharedPatchStateKey];

    if (!patchState) {
      patchState = {
        refCount: 0,
        registries: new Set(),
        originalRegisterWebviewViewProvider:
          target.registerWebviewViewProvider,
        originalRegisterCustomEditorProvider:
          target.registerCustomEditorProvider,
        originalRegisterChatSessionItemProvider:
          target.registerChatSessionItemProvider,
      };
      target[sharedPatchStateKey] = patchState;

      installPatchedMethod(
        target,
        'registerWebviewViewProvider',
        patchState.originalRegisterWebviewViewProvider,
        patchState,
        capturePath,
      );
      installPatchedMethod(
        target,
        'registerCustomEditorProvider',
        patchState.originalRegisterCustomEditorProvider,
        patchState,
        capturePath,
      );
      installPatchedMethod(
        target,
        'registerChatSessionItemProvider',
        patchState.originalRegisterChatSessionItemProvider,
        patchState,
        capturePath,
      );
    }

    patchState.registries.add(options.registry);
    patchState.refCount += 1;
    patchedTargets.add(target);
  }

  for (const candidate of toCandidateRecords(options.candidates)) {
    backfillCapturedProvidersFromCandidate({
      candidateValue: candidate.value,
      registry: options.registry,
      capturePath,
    });
  }

  options.registry.setSharedHookDiagnostic({
    installed: true,
    targetKind: firstLocation.targetKind,
    failureReason: null,
  });

  return {
    diagnostics: {
      installed: true,
      targetKind: firstLocation.targetKind,
      failureReason: null,
    },
    dispose() {
      for (const target of patchedTargets) {
        const currentPatchState = target[sharedPatchStateKey];
        if (!currentPatchState) {
          continue;
        }

        currentPatchState.refCount -= 1;
        currentPatchState.registries.delete(options.registry);
        if (currentPatchState.refCount > 0) {
          continue;
        }

        if (currentPatchState.originalRegisterWebviewViewProvider) {
          target.registerWebviewViewProvider =
            currentPatchState.originalRegisterWebviewViewProvider;
        }
        if (currentPatchState.originalRegisterCustomEditorProvider) {
          target.registerCustomEditorProvider =
            currentPatchState.originalRegisterCustomEditorProvider;
        }
        if (currentPatchState.originalRegisterChatSessionItemProvider) {
          target.registerChatSessionItemProvider =
            currentPatchState.originalRegisterChatSessionItemProvider;
        }

        delete target[sharedPatchStateKey];
      }
    },
  };
}
