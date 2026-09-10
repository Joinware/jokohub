import { nanoid } from "nanoid";
import { DEFAULT_WIDGET_SETTINGS } from "./config";
import type {
  Conversation,
  Message,
  OrgMember,
  Organization,
  SessionUser,
  Visitor,
} from "./types";

type DemoDb = {
  users: SessionUser[];
  passwords: Record<string, string>;
  orgs: Organization[];
  members: OrgMember[];
  visitors: Visitor[];
  conversations: Conversation[];
  messages: Message[];
  sessions: Record<string, string>; // token -> userId
};

declare global {
  // eslint-disable-next-line no-var -- attach demo DB to globalThis for HMR
  var __jokohubDemoDb: DemoDb | undefined;
}

function seed(): DemoDb {
  const ownerId = "user_demo_owner";
  const orgId = "org_demo_joko";
  const widgetKey = "pk_demo_jokohub";
  const now = new Date().toISOString();

  return {
    users: [{ id: ownerId, email: "owner@demo.jokohub.app" }],
    passwords: { "owner@demo.jokohub.app": "demo1234" },
    orgs: [
      {
        id: orgId,
        name: "Demo Dakar Desk",
        slug: "demo-dakar",
        widgetKey,
        allowedOrigins: ["*"],
        seatLimit: 3,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: null,
        widgetSettings: { ...DEFAULT_WIDGET_SETTINGS },
        createdAt: now,
      },
    ],
    members: [
      {
        id: "mem_demo_owner",
        orgId,
        userId: ownerId,
        role: "owner",
        email: "owner@demo.jokohub.app",
        createdAt: now,
      },
    ],
    visitors: [],
    conversations: [],
    messages: [],
    sessions: {},
  };
}

export function demoDb(): DemoDb {
  if (!globalThis.__jokohubDemoDb) {
    globalThis.__jokohubDemoDb = seed();
  }
  return globalThis.__jokohubDemoDb;
}

export function demoSignup(email: string, password: string, orgName: string) {
  const db = demoDb();
  if (db.users.some((u) => u.email === email)) {
    throw new Error("Email already registered");
  }
  const userId = `user_${nanoid(10)}`;
  const orgId = `org_${nanoid(10)}`;
  const now = new Date().toISOString();
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || `org-${nanoid(6)}`;

  db.users.push({ id: userId, email });
  db.passwords[email] = password;
  db.orgs.push({
    id: orgId,
    name: orgName,
    slug: `${slug}-${nanoid(4)}`,
    widgetKey: `pk_${nanoid(16)}`,
    allowedOrigins: ["*"],
    seatLimit: 3,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: null,
    widgetSettings: { ...DEFAULT_WIDGET_SETTINGS },
    createdAt: now,
  });
  db.members.push({
    id: `mem_${nanoid(8)}`,
    orgId,
    userId,
    role: "owner",
    email,
    createdAt: now,
  });
  const token = `sess_${nanoid(24)}`;
  db.sessions[token] = userId;
  return { token, user: { id: userId, email }, orgId };
}

export function demoLogin(email: string, password: string) {
  const db = demoDb();
  const user = db.users.find((u) => u.email === email);
  if (!user || db.passwords[email] !== password) {
    throw new Error("Invalid email or password");
  }
  const token = `sess_${nanoid(24)}`;
  db.sessions[token] = user.id;
  return { token, user };
}

export function demoUserFromToken(token: string | undefined | null) {
  if (!token) return null;
  const db = demoDb();
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}

export function demoOrgForUser(userId: string) {
  const db = demoDb();
  const membership = db.members.find((m) => m.userId === userId);
  if (!membership) return null;
  const org = db.orgs.find((o) => o.id === membership.orgId);
  if (!org) return null;
  return { org, membership };
}

export function demoOrgByWidgetKey(widgetKey: string) {
  return demoDb().orgs.find((o) => o.widgetKey === widgetKey) ?? null;
}

export function demoEnsureVisitor(
  orgId: string,
  sessionKey: string,
  displayName?: string
) {
  const db = demoDb();
  let visitor = db.visitors.find(
    (v) => v.orgId === orgId && v.sessionKey === sessionKey
  );
  if (!visitor) {
    visitor = {
      id: `vis_${nanoid(10)}`,
      orgId,
      sessionKey,
      displayName: displayName || "Visitor",
      email: null,
      createdAt: new Date().toISOString(),
    };
    db.visitors.push(visitor);
  }
  return visitor;
}

export function demoOpenOrCreateConversation(orgId: string, visitorId: string) {
  const db = demoDb();
  let convo = db.conversations.find(
    (c) =>
      c.orgId === orgId && c.visitorId === visitorId && c.status === "open"
  );
  if (!convo) {
    const now = new Date().toISOString();
    convo = {
      id: `conv_${nanoid(10)}`,
      orgId,
      visitorId,
      status: "open",
      assignedTo: null,
      lastMessageAt: now,
      unreadForAgents: 0,
      createdAt: now,
    };
    db.conversations.push(convo);
  }
  return convo;
}

export function demoAddMessage(
  conversationId: string,
  orgId: string,
  senderType: Message["senderType"],
  body: string,
  senderUserId: string | null = null
) {
  const db = demoDb();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg_${nanoid(12)}`,
    conversationId,
    orgId,
    senderType,
    senderUserId,
    body,
    createdAt: now,
  };
  db.messages.push(message);
  const convo = db.conversations.find((c) => c.id === conversationId);
  if (convo) {
    convo.lastMessageAt = now;
    if (senderType === "visitor") convo.unreadForAgents += 1;
    if (senderType === "agent") convo.unreadForAgents = 0;
  }
  return message;
}

export function demoListConversations(orgId: string) {
  const db = demoDb();
  return db.conversations
    .filter((c) => c.orgId === orgId)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((c) => {
      const visitor = db.visitors.find((v) => v.id === c.visitorId);
      const last = db.messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return {
        ...c,
        visitor,
        preview: last?.body ?? "",
      };
    });
}

export function demoListMessages(conversationId: string) {
  return demoDb()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
