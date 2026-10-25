// Bounded documents keep a lifetime character below Firestore's per-document limit.
export const CLOUD_CHUNK_SIZE = 20_000;
export interface CloudSnapshot {
  format: 2;
  generation: string;
  chunks: number;
  sha256: string;
  characterId: string;
  savedAt: string;
}
const checksum = async (text: string) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
export function validCloudSnapshot(input: unknown): input is CloudSnapshot {
  const v = input as CloudSnapshot | null;
  return (
    !!v &&
    v.format === 2 &&
    typeof v.generation === "string" &&
    /^[a-zA-Z0-9-]{1,80}$/.test(v.generation) &&
    Number.isInteger(v.chunks) &&
    v.chunks > 0 &&
    v.chunks <= 2048 &&
    /^[a-f0-9]{64}$/.test(v.sha256) &&
    typeof v.characterId === "string" &&
    Number.isFinite(Date.parse(v.savedAt))
  );
}
export async function packCloudSnapshot(character: { id: string }) {
  const text = JSON.stringify(character),
    chunks: string[] = [];
  for (let i = 0; i < text.length; i += CLOUD_CHUNK_SIZE) {
    // Avoid splitting a UTF-16 surrogate pair between documents.
    let end = Math.min(text.length, i + CLOUD_CHUNK_SIZE);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    chunks.push(text.slice(i, end));
    i = end - CLOUD_CHUNK_SIZE;
  }
  if (chunks.length > 2048)
    throw new Error(
      "This cloud backup is too large. Export your character to a file.",
    );
  const manifest: CloudSnapshot = {
    format: 2,
    generation: crypto.randomUUID(),
    chunks: chunks.length,
    sha256: await checksum(text),
    characterId: character.id,
    savedAt: new Date().toISOString(),
  };
  return { manifest, chunks };
}
export async function unpackCloudSnapshot(
  manifest: CloudSnapshot,
  chunks: unknown[],
): Promise<unknown> {
  if (
    !validCloudSnapshot(manifest) ||
    chunks.length !== manifest.chunks ||
    chunks.some((p) => typeof p !== "string" || p.length > CLOUD_CHUNK_SIZE)
  )
    throw new Error(
      "The cloud backup is incomplete. Your local character is unchanged.",
    );
  const text = chunks.join("");
  if ((await checksum(text)) !== manifest.sha256)
    throw new Error(
      "The cloud backup did not pass its integrity check. Your local character is unchanged.",
    );
  const value = JSON.parse(text);
  if (value?.id !== manifest.characterId)
    throw new Error("The cloud character identity does not match its backup.");
  return value;
}
