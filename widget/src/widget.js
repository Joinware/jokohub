(() => {
  const settings = window.JokoHubSettings || {};
  const key = settings.key;
  if (!key) {
    console.warn("[JokoHub] Missing window.JokoHubSettings.key");
    return;
  }

  // Prefer explicit apiBase; otherwise use the origin that served widget.js
  // so cross-origin embeds (e.g. Netlify shop → Vercel widget) work without
  // requiring apiBase in the host-page snippet.
  function resolveApiBase() {
    if (settings.apiBase) return String(settings.apiBase).replace(/\/$/, "");
    const script =
      document.currentScript instanceof HTMLScriptElement
        ? document.currentScript
        : document.querySelector(
            'script[src*="/widget.js"], script[src$="widget.js"], script[data-jokohub-widget]'
          );
    const src = script && "src" in script ? script.src : "";
    if (src) {
      try {
        return new URL(src).origin;
      } catch {
        /* ignore */
      }
    }
    return "";
  }

  const apiBase = resolveApiBase();
  const storageKey = `jokohub_session_${key}`;
  let sessionKey = localStorage.getItem(storageKey);
  if (!sessionKey) {
    sessionKey = `vs_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(storageKey, sessionKey);
  }

  let open = false;
  let conversationId = null;
  let primary = "#0A3D3A";
  let greeting = "Hi — how can we help?";
  let position = "right";
  let realtimeCfg = null;
  let supabaseClient = null;
  let realtimeChannel = null;
  let pollTimer = null;

  const root = document.createElement("div");
  root.id = "jokohub-root";
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = `
    #jokohub-root { all: initial; font-family: "Segoe UI", system-ui, sans-serif; }
    #jokohub-root * { box-sizing: border-box; }
    .jh-launcher {
      position: fixed; bottom: 20px; z-index: 2147483000;
      width: 56px; height: 56px; border-radius: 999px; border: 0; cursor: pointer;
      color: #fff; font-size: 22px; box-shadow: 0 12px 30px rgba(0,0,0,.22);
    }
    .jh-panel {
      position: fixed; bottom: 88px; z-index: 2147483000; width: min(360px, calc(100vw - 24px));
      height: 480px; background: #fff; border-radius: 18px; overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,.22); display: flex; flex-direction: column;
      border: 1px solid #d5e0dd;
    }
    .jh-header { padding: 14px 16px; color: #fff; font-weight: 600; }
    .jh-messages { flex: 1; overflow: auto; padding: 12px; background: #f4f7f6; }
    .jh-bubble { max-width: 85%; margin: 8px 0; padding: 8px 10px; border-radius: 14px; font-size: 14px; line-height: 1.35; }
    .jh-visitor { margin-left: auto; background: var(--jh-color, #0A3D3A); color: #fff; }
    .jh-agent { background: #fff; border: 1px solid #d5e0dd; color: #102a28; }
    .jh-system { background: transparent; color: #667; font-size: 12px; }
    .jh-form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #d5e0dd; }
    .jh-form input { flex: 1; border: 1px solid #d5e0dd; border-radius: 12px; padding: 10px; font: inherit; }
    .jh-form button { border: 0; border-radius: 12px; padding: 0 14px; background: var(--jh-color, #0A3D3A); color: #fff; font-weight: 600; cursor: pointer; }
  `;
  document.head.appendChild(style);

  function loadSupabaseJs() {
    if (window.supabase && window.supabase.createClient) {
      return Promise.resolve(window.supabase);
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-jokohub-supabase]");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.supabase));
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.async = true;
      s.dataset.jokohubSupabase = "1";
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureRealtime(convoId) {
    if (!realtimeCfg || !convoId) return;
    try {
      const sb = await loadSupabaseJs();
      if (!supabaseClient) {
        supabaseClient = sb.createClient(realtimeCfg.url, realtimeCfg.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      }
      const topic = `jh-convo-${convoId}`;
      if (realtimeChannel && realtimeChannel.topic === `realtime:${topic}`) return;
      if (realtimeChannel) {
        await supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
      realtimeChannel = supabaseClient
        .channel(topic)
        .on("broadcast", { event: "refresh" }, () => {
          if (open) refreshMessages();
        })
        .subscribe();
    } catch (err) {
      console.warn("[JokoHub] realtime unavailable", err);
    }
  }

  function startPoll(ms) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (open) refreshMessages();
    }, ms);
  }

  function render() {
    root.innerHTML = "";
    const launcher = document.createElement("button");
    launcher.className = "jh-launcher";
    launcher.style.background = primary;
    launcher.style[position === "left" ? "left" : "right"] = "20px";
    launcher.innerHTML = open
      ? '<span style="font-size:28px;line-height:1">×</span>'
      : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5Z" fill="currentColor"/></svg>';
    launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    launcher.style.display = "grid";
    launcher.style.placeItems = "center";
    launcher.onclick = () => {
      open = !open;
      render();
      if (open) refreshMessages();
    };
    root.appendChild(launcher);

    if (!open) return;

    const panel = document.createElement("div");
    panel.className = "jh-panel";
    panel.style[position === "left" ? "left" : "right"] = "20px";
    panel.style.setProperty("--jh-color", primary);

    const header = document.createElement("div");
    header.className = "jh-header";
    header.style.background = primary;
    header.textContent = "Chat with us";
    panel.appendChild(header);

    const messagesEl = document.createElement("div");
    messagesEl.className = "jh-messages";
    messagesEl.id = "jh-messages";
    panel.appendChild(messagesEl);

    const form = document.createElement("form");
    form.className = "jh-form";
    const input = document.createElement("input");
    input.placeholder = "Write a message…";
    input.required = true;
    const send = document.createElement("button");
    send.type = "submit";
    send.textContent = "Send";
    form.appendChild(input);
    form.appendChild(send);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = input.value.trim();
      if (!body) return;
      input.value = "";
      await fetch(`${apiBase}/api/widget/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, sessionKey, body }),
      });
      await refreshMessages();
    };
    panel.appendChild(form);
    root.appendChild(panel);
  }

  function paintMessages(messages) {
    const el = document.getElementById("jh-messages");
    if (!el) return;
    el.innerHTML = "";
    if (!messages.length) {
      const g = document.createElement("div");
      g.className = "jh-bubble jh-system";
      g.textContent = greeting;
      el.appendChild(g);
    }
    messages.forEach((m) => {
      const b = document.createElement("div");
      b.className = `jh-bubble ${
        m.senderType === "visitor"
          ? "jh-visitor"
          : m.senderType === "system"
            ? "jh-system"
            : "jh-agent"
      }`;
      b.textContent = m.body;
      el.appendChild(b);
    });
    el.scrollTop = el.scrollHeight;
  }

  async function refreshMessages() {
    try {
      const url = new URL(`${apiBase}/api/widget/messages`, window.location.origin);
      url.searchParams.set("key", key);
      url.searchParams.set("sessionKey", sessionKey);
      if (conversationId) url.searchParams.set("conversationId", conversationId);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      conversationId = data.conversationId;
      paintMessages(data.messages || []);
      if (conversationId) void ensureRealtime(conversationId);
    } catch (err) {
      console.warn("[JokoHub] messages unavailable", err);
    }
  }

  async function bootstrap() {
    try {
      const url = new URL(`${apiBase}/api/widget/bootstrap`, window.location.origin);
      url.searchParams.set("key", key);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        primary = (data.settings && data.settings.primaryColor) || primary;
        greeting = (data.settings && data.settings.greeting) || greeting;
        position = (data.settings && data.settings.position) || position;
        realtimeCfg = data.realtime || null;
      }
    } catch (err) {
      console.warn("[JokoHub] bootstrap unavailable", err);
    }
    render();
    // Slow poll as safety net; realtime broadcast drives fast updates when available.
    startPoll(realtimeCfg ? 15000 : 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
