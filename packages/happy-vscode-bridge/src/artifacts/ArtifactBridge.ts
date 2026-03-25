export type FileArtifactInput = {
  kind: 'file' | 'image' | 'temp_file';
  displayName: string;
  filePath: string;
  mimeType?: string;
};

export type DiffArtifactInput = {
  kind: 'diff';
  displayName: string;
  text: string;
};

export type ArtifactInput = FileArtifactInput | DiffArtifactInput;

type ArtifactBase = {
  id: string;
  displayName: string;
  createdAt: number;
  mimeType?: string;
  text?: string;
};

export type FileArtifact = ArtifactBase & FileArtifactInput;
export type DiffArtifact = ArtifactBase & DiffArtifactInput;
export type StagedArtifact = FileArtifact | DiffArtifact;

export type ArtifactSnapshot = {
  artifacts: StagedArtifact[];
};

function cloneArtifact(artifact: StagedArtifact): StagedArtifact {
  return { ...artifact };
}

export class ArtifactBridge {
  private nextId = 1;
  private readonly artifacts: StagedArtifact[] = [];

  stage(input: ArtifactInput): StagedArtifact {
    const artifact: StagedArtifact = {
      id: `artifact-${this.nextId++}`,
      createdAt: Date.now(),
      ...input,
    };

    this.artifacts.push(artifact);
    return cloneArtifact(artifact);
  }

  get(id: string): StagedArtifact | undefined {
    const artifact = this.artifacts.find((candidate) => candidate.id === id);
    if (!artifact) {
      return undefined;
    }

    return cloneArtifact(artifact);
  }

  snapshot(): ArtifactSnapshot {
    return {
      artifacts: this.artifacts.map((artifact) => cloneArtifact(artifact)),
    };
  }
}
