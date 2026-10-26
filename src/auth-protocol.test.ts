import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { demoCharacter } from "./domain";
const fake = vi.hoisted(() => ({
  auth: { currentUser: { uid: "owner-a" } as { uid: string } | null },
  native: false,
  records: new Map<string, unknown>(),
  events: [] as string[],
  failCommit: false,
  switchOnCommit: false,
  switchOnRead: false,
  nativeLogoutFails: false,
  firebaseSignOut: vi.fn(),
  nativeLogout: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => fake.native },
}));
vi.mock("firebase/app", () => ({
  initializeApp: () => ({}),
  getApps: () => [],
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => fake.auth,
  signOut: () => {
    fake.firebaseSignOut();
    fake.auth.currentUser = null;
    return Promise.resolve();
  },
}));
vi.mock("@capgo/capacitor-social-login", () => ({
  SocialLogin: {
    logout: async () => {
      fake.nativeLogout();
      if (fake.nativeLogoutFails) throw Error("native bridge unavailable");
    },
  },
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, ...parts: string[]) => parts.join("/"),
  serverTimestamp: () => "server-time",
  writeBatch: () => {
    const writes: [string, unknown][] = [];
    return {
      set: (path: string, value: unknown) => writes.push([path, value]),
      commit: async () => {
        fake.events.push("commit");
        if (fake.failCommit) throw Error("offline");
        for (const [path, value] of writes) fake.records.set(path, value);
        if (fake.switchOnCommit) fake.auth.currentUser = { uid: "owner-b" };
      },
    };
  },
  setDoc: async (path: string, value: unknown) => {
    fake.events.push(`publish:${path}`);
    fake.records.set(path, value);
  },
  getDoc: async (path: string) => {
    const value = fake.records.get(path);
    if (fake.switchOnRead) fake.auth.currentUser = { uid: "owner-b" };
    return { exists: () => value !== undefined, data: () => value };
  },
}));
beforeEach(() => {
  vi.resetModules();
  for (const key of ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"])
    vi.stubEnv(`VITE_FIREBASE_${key}`, "test-project");
  vi.stubEnv("VITE_GOOGLE_WEB_CLIENT_ID", "test-client");
  fake.auth.currentUser = { uid: "owner-a" };
  fake.records.clear();
  fake.events = [];
  fake.failCommit = false;
  fake.switchOnCommit = false;
  fake.switchOnRead = false;
  fake.nativeLogoutFails = false;
  fake.native = false;
  fake.firebaseSignOut.mockClear();
  fake.nativeLogout.mockClear();
});
afterEach(() => vi.unstubAllEnvs());
const character = () => ({ ...demoCharacter(), demo: false });
describe("Google/cloud operation protocol with SDK doubles", () => {
  it("publishes only after chunks commit, round-trips the owner path and accepts older whole-document copies", async () => {
    const service = await import("./auth"),
      c = character();
    await service.uploadCharacter(c);
    expect(fake.events[0]).toBe("commit");
    expect(fake.events.at(-1)).toBe("publish:characters/owner-a");
    expect(
      [...fake.records.keys()].every((key) =>
        key.startsWith("characters/owner-a"),
      ),
    ).toBe(true);
    expect(await service.downloadCharacter()).toEqual(c);
    fake.records.set("characters/owner-a", { character: c });
    expect(await service.downloadCharacter()).toEqual(c);
  });
  it("leaves the published copy intact when a chunk commit fails", async () => {
    const service = await import("./auth"),
      c = character();
    await service.uploadCharacter(c);
    const previous = fake.records.get("characters/owner-a");
    fake.failCommit = true;
    await expect(service.uploadCharacter(c)).rejects.toThrow("offline");
    expect(fake.records.get("characters/owner-a")).toBe(previous);
    expect(fake.events.filter((e) => e.startsWith("publish"))).toHaveLength(1);
  });
  it("does not publish a pending upload or return a restore after the account changes", async () => {
    const service = await import("./auth");
    fake.switchOnCommit = true;
    await expect(service.uploadCharacter(character())).rejects.toThrow(
      "account changed",
    );
    expect(fake.events.some((e) => e.startsWith("publish"))).toBe(false);
    fake.auth.currentUser = { uid: "owner-a" };
    fake.switchOnCommit = false;
    await service.uploadCharacter(character());
    fake.switchOnRead = true;
    await expect(service.downloadCharacter()).rejects.toThrow(
      "account changed",
    );
    expect(
      [...fake.records.keys()].some((path) =>
        path.startsWith("characters/owner-b"),
      ),
    ).toBe(false);
  });
  it("rejects a corrupt cloud chunk and refuses sample uploads", async () => {
    const service = await import("./auth");
    await expect(service.uploadCharacter(demoCharacter())).rejects.toThrow(
      "personal character",
    );
    await service.uploadCharacter(character());
    const chunk = [...fake.records.keys()].find((key) =>
      key.includes("/chunks/"),
    )!;
    fake.records.set(chunk, { data: "corrupted" });
    await expect(service.downloadCharacter()).rejects.toThrow("integrity");
  });
  it("attempts Firebase sign-out even when the native Google bridge fails", async () => {
    fake.native = true;
    fake.nativeLogoutFails = true;
    const service = await import("./auth");
    await expect(service.logoutGoogle()).rejects.toThrow(
      "did not fully finish",
    );
    expect(fake.nativeLogout).toHaveBeenCalledOnce();
    expect(fake.firebaseSignOut).toHaveBeenCalledOnce();
    expect(fake.auth.currentUser).toBeNull();
  });
});
