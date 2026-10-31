interface PendingImage {
  buffer: Buffer;
  contentType: string;
}

interface CaptureSession {
  createdAt: number;
  pendingImage: PendingImage | null;
}

declare global {
  var __captureSessions: Map<string, CaptureSession> | undefined;
}

const SESSION_TTL_MS = 30 * 60 * 1000;

const sessions = globalThis.__captureSessions ?? new Map<string, CaptureSession>();
globalThis.__captureSessions = sessions;

function cleanup() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function ensureSession(id: string): CaptureSession {
  cleanup();
  let session = sessions.get(id);
  if (!session) {
    session = { createdAt: Date.now(), pendingImage: null };
    sessions.set(id, session);
  }
  return session;
}

export function setPendingImage(id: string, buffer: Buffer, contentType: string) {
  const session = ensureSession(id);
  session.createdAt = Date.now();
  session.pendingImage = { buffer, contentType };
}

export function takePendingImage(id: string): PendingImage | null {
  const session = sessions.get(id);
  if (!session?.pendingImage) return null;
  const image = session.pendingImage;
  session.pendingImage = null;
  return image;
}
