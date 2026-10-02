export const REQUIRED_ARTIFACTS_COUNT = 8;
export const TOTAL_SECRETS_COUNT = 4;

export const ARTIFACT_MESSAGES: Record<string, string> = {
  ARTIFACT_1: "DISCOVERED: AMITDIED GENESIS ARCHIVE DISK // 2024",
  ARTIFACT_2: "DISCOVERED: ENCRYPTED BASS SCHEMATIC // NODE 01",
  ARTIFACT_3: "DISCOVERED: DEEP SUB-FREQUENCY CALIBRATION LOG",
  ARTIFACT_4: "DISCOVERED: SYNTHESIZER PATCH VAULT #4",
  ARTIFACT_5: "DISCOVERED: ACID HOUSE MASTER TAPE // ARCHIVES",
  ARTIFACT_6: "DISCOVERED: MODULAR SYNTH PATCH MATRIX RECORD",
  ARTIFACT_7: "DISCOVERED: MASTERING COMPRESSOR PRESET DECK",
  ARTIFACT_8: "DISCOVERED: ULTIMATE AMITDIED CORE ARTIFACT",
};

export const SECRET_MESSAGES: Record<string, string> = {
  SECRET_1: "CLASSIFIED: SECRET TRANSMISSION INTERCEPTED",
  SECRET_2: "CLASSIFIED: FOUND HIDDEN TERMINAL LOG",
  SECRET_3: "CLASSIFIED: ANOMALOUS AUDIO RESONANCE DETECTED",
  SECRET_4: "CLASSIFIED: NODE 04 PROTOCOL BYPASS FOUND",
};

export function checkNode04Unlocked(discoveredArtifactIds: string[], discoveredSecretIds: string[]): boolean {
  return discoveredArtifactIds.length >= REQUIRED_ARTIFACTS_COUNT || discoveredSecretIds.length >= 2;
}

export function getProgressionMilestoneMessage(
  artifactsCount: number,
  nextArtifactsCount: number,
  secretsCount: number,
  nextSecretsCount: number
): string | null {
  if (nextArtifactsCount === REQUIRED_ARTIFACTS_COUNT) {
    return "ARCHIVE FULLY COLLECTED. NODE 04 CHAMBER UNLOCKED.";
  }
  if (nextSecretsCount === 2 && secretsCount < 2) {
    return "SECRET ANOMALIES CALIBRATED. NODE 04 ACCESS GRANTED.";
  }
  return null;
}
