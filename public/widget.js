/* JokoHub widget — Joinware */
"use strict";(()=>{(()=>{let b=window.JokoHubSettings||{},i=b.key;if(!i){console.warn("[JokoHub] Missing window.JokoHubSettings.key");return}let h=b.apiBase||"",x=`jokohub_session_${i}`,a=localStorage.getItem(x);a||(a=`vs_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,localStorage.setItem(x,a));let n=!1,g=null,r="#0A3D3A",f="Hi \u2014 how can we help?",p="right",d=document.createElement("div");d.id="jokohub-root",document.body.appendChild(d);let y=document.createElement("style");y.textContent=`
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
  `,document.head.appendChild(y);function w(){d.innerHTML="";let t=document.createElement("button");if(t.className="jh-launcher",t.style.background=r,t.style[p==="left"?"left":"right"]="20px",t.innerHTML=n?'<span style="font-size:28px;line-height:1">\xD7</span>':'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5Z" fill="currentColor"/></svg>',t.setAttribute("aria-label",n?"Close chat":"Open chat"),t.style.display="grid",t.style.placeItems="center",t.onclick=()=>{n=!n,w(),n&&u()},d.appendChild(t),!n)return;let o=document.createElement("div");o.className="jh-panel",o.style[p==="left"?"left":"right"]="20px",o.style.setProperty("--jh-color",r);let e=document.createElement("div");e.className="jh-header",e.style.background=r,e.textContent="Chat with us",o.appendChild(e);let s=document.createElement("div");s.className="jh-messages",s.id="jh-messages",o.appendChild(s);let l=document.createElement("form");l.className="jh-form";let c=document.createElement("input");c.placeholder="Write a message\u2026",c.required=!0;let m=document.createElement("button");m.type="submit",m.textContent="Send",l.appendChild(c),l.appendChild(m),l.onsubmit=async C=>{C.preventDefault();let v=c.value.trim();v&&(c.value="",await fetch(`${h}/api/widget/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:i,sessionKey:a,body:v})}),await u())},o.appendChild(l),d.appendChild(o)}function k(t){let o=document.getElementById("jh-messages");if(o){if(o.innerHTML="",!t.length){let e=document.createElement("div");e.className="jh-bubble jh-system",e.textContent=f,o.appendChild(e)}t.forEach(e=>{let s=document.createElement("div");s.className=`jh-bubble ${e.senderType==="visitor"?"jh-visitor":e.senderType==="system"?"jh-system":"jh-agent"}`,s.textContent=e.body,o.appendChild(s)}),o.scrollTop=o.scrollHeight}}async function u(){let t=new URL(`${h}/api/widget/messages`,window.location.origin);t.searchParams.set("key",i),t.searchParams.set("sessionKey",a),g&&t.searchParams.set("conversationId",g);let o=await fetch(t.toString());if(!o.ok)return;let e=await o.json();g=e.conversationId,k(e.messages||[])}async function j(){let t=new URL(`${h}/api/widget/bootstrap`,window.location.origin);t.searchParams.set("key",i);let o=await fetch(t.toString());if(o.ok){let e=await o.json();r=e.settings&&e.settings.primaryColor||r,f=e.settings&&e.settings.greeting||f,p=e.settings&&e.settings.position||p}w(),setInterval(()=>{n&&u()},3e3)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",j):j()})();})();

