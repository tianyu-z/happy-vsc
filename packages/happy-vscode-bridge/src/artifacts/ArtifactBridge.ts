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
    return artifact;
  }

  get(id: string): StagedArtifact | undefined {
    return this.artifacts.find((artifact) => artifact.id === id);
  }

  snapshot(): ArtifactSnapshot {
    return {
      artifacts: [...this.artifacts],
    };
  }
}
