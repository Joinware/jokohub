/* JokoHub widget — Joinware */
"use strict";(()=>{(()=>{let b=window.JokoHubSettings||{},a=b.key;if(!a){console.warn("[JokoHub] Missing window.JokoHubSettings.key");return}let h=b.apiBase||"",x=`jokohub_session_${a}`,i=localStorage.getItem(x);i||(i=`vs_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,localStorage.setItem(x,i));let s=!1,u=null,r="#0A3D3A",f="Hi \u2014 how can we help?",p="right",d=document.createElement("div");d.id="jokohub-root",document.body.appendChild(d);let y=document.createElement("style");y.textContent=`
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
  `,document.head.appendChild(y);function j(){d.innerHTML="";let o=document.createElement("button");if(o.className="jh-launcher",o.style.background=r,o.style[p==="left"?"left":"right"]="20px",o.textContent=s?"\xD7":"\u{1F4AC}",o.setAttribute("aria-label","Open chat"),o.onclick=()=>{s=!s,j(),s&&g()},d.appendChild(o),!s)return;let t=document.createElement("div");t.className="jh-panel",t.style[p==="left"?"left":"right"]="20px",t.style.setProperty("--jh-color",r);let e=document.createElement("div");e.className="jh-header",e.style.background=r,e.textContent="Chat with us",t.appendChild(e);let n=document.createElement("div");n.className="jh-messages",n.id="jh-messages",t.appendChild(n);let l=document.createElement("form");l.className="jh-form";let c=document.createElement("input");c.placeholder="Write a message\u2026",c.required=!0;let m=document.createElement("button");m.type="submit",m.textContent="Send",l.appendChild(c),l.appendChild(m),l.onsubmit=async C=>{C.preventDefault();let k=c.value.trim();k&&(c.value="",await fetch(`${h}/api/widget/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:a,sessionKey:i,body:k})}),await g())},t.appendChild(l),d.appendChild(t)}function v(o){let t=document.getElementById("jh-messages");if(t){if(t.innerHTML="",!o.length){let e=document.createElement("div");e.className="jh-bubble jh-system",e.textContent=f,t.appendChild(e)}o.forEach(e=>{let n=document.createElement("div");n.className=`jh-bubble ${e.senderType==="visitor"?"jh-visitor":e.senderType==="system"?"jh-system":"jh-agent"}`,n.textContent=e.body,t.appendChild(n)}),t.scrollTop=t.scrollHeight}}async function g(){let o=new URL(`${h}/api/widget/messages`,window.location.origin);o.searchParams.set("key",a),o.searchParams.set("sessionKey",i),u&&o.searchParams.set("conversationId",u);let t=await fetch(o.toString());if(!t.ok)return;let e=await t.json();u=e.conversationId,v(e.messages||[])}async function w(){let o=new URL(`${h}/api/widget/bootstrap`,window.location.origin);o.searchParams.set("key",a);let t=await fetch(o.toString());if(t.ok){let e=await t.json();r=e.settings&&e.settings.primaryColor||r,f=e.settings&&e.settings.greeting||f,p=e.settings&&e.settings.position||p}j(),setInterval(()=>{s&&g()},3e3)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w()})();})();

