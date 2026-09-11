import { isDemoMode } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Notify open widgets that a conversation has new activity (broadcast, no RLS). */
export async function notifyConversationRefresh(conversationId: string) {
  if (isDemoMode() || !conversationId) return;
  try {
    const admin = createAdminClient();
    const channel = admin.channel(`jh-convo-${conversationId}`);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("realtime subscribe timeout")), 4000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve();
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          reject(new Error(`realtime ${status}`));
        }
      });
    });
    await channel.send({
      type: "broadcast",
      event: "refresh",
      payload: { conversationId },
    });
    await admin.removeChannel(channel);
  } catch {
    /* Widget still has poll fallback */
  }
}
