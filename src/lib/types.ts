export type MemberRole = "owner" | "agent";
export type ConversationStatus = "open" | "resolved";
export type SenderType = "visitor" | "agent" | "system";

export type WidgetSettings = {
  primaryColor: string;
  greeting: string;
  position: "left" | "right";
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  widgetKey: string;
  allowedOrigins: string[];
  seatLimit: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  widgetSettings: WidgetSettings;
  createdAt: string;
};

export type OrgMember = {
  id: string;
  orgId: string;
  userId: string;
  role: MemberRole;
  email?: string;
  createdAt: string;
};

export type Visitor = {
  id: string;
  orgId: string;
  sessionKey: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  orgId: string;
  visitorId: string;
  status: ConversationStatus;
  assignedTo: string | null;
  lastMessageAt: string;
  unreadForAgents: number;
  createdAt: string;
  visitor?: Visitor;
  preview?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  orgId: string;
  senderType: SenderType;
  senderUserId: string | null;
  body: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
};
