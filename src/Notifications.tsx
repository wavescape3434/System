import type { Character } from "./domain";
import { examTargets } from "./exams";
import { Modal, Icon, Tag } from "./ui";
export function notificationFeed(c: Character) {
  const events = (c.journeyEvents || []).map((e) => ({
    id: e.id,
    at: e.at,
    title: e.title,
    detail: e.detail || "",
    icon: e.kind === "skill" ? "INT" : "CON",
  }));
  const completed = c.completions.map((o) => ({
    id: `request-${o.id}-${o.period}`,
    at: o.at,
    title: o.title,
    detail: `+${o.xp} XP${o.gold !== undefined ? ` · +${o.gold} gold` : ""}`,
    icon: o.stat,
  }));
  const due = examTargets(c)
    .filter((t) => t.ready)
    .map((t) => ({
      id: `exam-${t.scope}-${t.owner}-${t.milestone}`,
      at: c.completions.at(-1)?.at || c.createdAt,
      title: `${t.name} examination ready`,
      detail: `Level ${t.milestone} · Class Paths → Examinations`,
      icon: t.stat,
    }));
  return [...due, ...events, ...completed]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 60);
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
}: {
  c: Character;
  onClose: () => void;
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
                <small>{new Date(n.at).toLocaleString()}</small>
              </div>
              <Tag>Guild</Tag>
            </article>
          ))
        )}
      </div>
    </Modal>
  );
}
