import type { Character } from "./domain";
import { takenObjectives, isComplete } from "./domain";
import { examTargets } from "./exams";
import { loginReward, claimLoginReward } from "./login-rewards";
import { periodEnd } from "./calendar-goals";
import type { Page } from "./screens";
import { Modal, Icon } from "./ui";
export function notificationFeed(c: Character, now = new Date()) {
  const reward = loginReward(c, now);
  const feed = examTargets(c)
    .filter((t) => t.ready)
    .map((t) => ({
      id: `exam-${t.scope}-${t.owner}-${t.milestone}`,
      at: c.completions.at(-1)?.at || c.createdAt,
      title: `${t.name} examination ready`,
      detail: `Level ${t.milestone}`,
      icon: t.stat as string,
      page: "paths" as Page,
      section: "exams",
      reward: false,
    }));
  if (!reward.claimed)
    feed.push({
      id: `login-${reward.day}`,
      at: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString(),
      title: "Login reward ready",
      detail: `Day ${reward.cycleDay} · ${reward.gold} gold${reward.potion ? ` · ${reward.potion} potion` : ""}${reward.ether ? ` · ${reward.ether} ether` : ""}`,
      icon: "CON",
      page: "guild",
      section: "",
      reward: true,
    });
  for (const o of takenObjectives(c, now)) {
    if (o.cadence === "daily" || isComplete(c, o, now)) continue;
    const end = periodEnd(o.cadence, now),
      remaining = end.getTime() - now.getTime();
    if (remaining > 48 * 3600000 || remaining <= 0) continue;
    feed.push({
      id: `due-${o.id}-${end.toISOString()}`,
      at: new Date(end.getTime() - 48 * 3600000).toISOString(),
      title: `${o.title} · deadline approaching`,
      detail: `Due ${new Date(end.getTime() - 1).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      icon: o.stat,
      page: "objectives",
      section: `taken:${o.cadence}`,
      reward: false,
    });
  }
  return feed.sort(
    (a, b) =>
      Number(b.reward) - Number(a.reward) ||
      Date.parse(b.at) - Date.parse(a.at),
  );
}
export const notificationUnread = (c: Character) =>
  notificationFeed(c).filter((n) =>
    c.notificationReads
      ? !c.notificationReads.includes(n.id)
      : !c.notificationsReadAt ||
        Date.parse(n.at) > Date.parse(c.notificationsReadAt),
  );
export default function Notifications({
  c,
  onClose,
  update,
  navigate,
}: {
  c: Character;
  onClose: () => void;
  update: (c: Character) => Promise<boolean>;
  navigate: (p: Page, section?: string) => void;
}) {
  const feed = notificationFeed(c);
  return (
    <Modal title="Notifications" onClose={onClose}>
      <div className="notification-list">
        {!feed.length ? (
          <p>No notifications.</p>
        ) : (
          feed.map((n) => (
            <article key={n.id}>
              <Icon name={n.icon} size={20} />
              <div>
                <b>{n.title}</b>
                <p>{n.detail}</p>
              </div>
              <button
                className="button secondary"
                onClick={() =>
                  n.reward
                    ? update(claimLoginReward(c))
                    : navigate(n.page, n.section)
                }
              >
                {n.reward ? "Claim" : "Open"}
              </button>
            </article>
          ))
        )}
      </div>
    </Modal>
  );
}
