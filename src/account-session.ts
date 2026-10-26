export function accountGuard(
  auth: { currentUser: { uid: string } | null },
  generation: () => number = () => 0,
) {
  const uid = auth.currentUser?.uid,
    started = generation();
  if (!uid) throw Error("Link your Google account first.");
  return {
    uid,
    check() {
      if (auth.currentUser?.uid !== uid || generation() !== started)
        throw Error(
          "Your Google account changed. Reopen Account & backups and retry.",
        );
    },
  };
}
