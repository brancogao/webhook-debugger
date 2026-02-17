(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();const w=window.location.origin;async function d(e,t={}){const o={...t,credentials:"include",headers:{"Content-Type":"application/json",...t.headers}},a=await fetch(`${w}${e}`,o);if(a.status===401)throw window.location.href="/",new Error("Unauthorized");if(!a.ok){const n=await a.json().catch(()=>({}));throw new Error(n.error||`HTTP ${a.status}`)}return a.json()}const y={getCurrentUser:()=>d("/api/auth/me"),logout:()=>d("/api/auth/logout",{method:"POST"})},u={list:()=>d("/api/endpoints"),create:e=>d("/api/endpoints",{method:"POST",body:JSON.stringify({name:e})}),get:e=>d(`/api/endpoints/${e}`),update:(e,t)=>d(`/api/endpoints/${e}`,{method:"PUT",body:JSON.stringify(t)}),delete:e=>d(`/api/endpoints/${e}`,{method:"DELETE"})},l={list:(e,t={})=>{const o=new URLSearchParams({limit:t.limit||"50",offset:t.offset||"0"});return t.source&&o.set("source",t.source),d(`/api/endpoints/${e}/webhooks?${o}`)},get:e=>d(`/api/webhooks/${e}`),search:(e,t,o={})=>{const a=new URLSearchParams({q:t,limit:o.limit||"50",offset:o.offset||"0"});return d(`/api/endpoints/${e}/webhooks/search?${a}`)},replay:(e,t)=>d(`/api/webhooks/${e}/replay`,{method:"POST",body:JSON.stringify({url:t})})};function g(e){const t=new Date(e),a=Math.floor((new Date-t)/1e3),n=[{label:"year",seconds:31536e3},{label:"month",seconds:2592e3},{label:"week",seconds:604800},{label:"day",seconds:86400},{label:"hour",seconds:3600},{label:"minute",seconds:60},{label:"second",seconds:1}];for(const s of n){const r=Math.floor(a/s.seconds);if(r>=1)return`${r} ${s.label}${r>1?"s":""} ago`}return"just now"}function i(e,t="info"){const o=document.querySelector(".toast");o&&o.remove();const a=document.createElement("div");a.className=`toast ${t}`,a.textContent=e,document.body.appendChild(a),setTimeout(()=>{a.remove()},3e3)}function k(e,t){let o;return function(...n){const s=()=>{clearTimeout(o),e(...n)};clearTimeout(o),o=setTimeout(s,t)}}const p=document.getElementById("app");function b(){const e=window.location.pathname;new URLSearchParams(window.location.search),$().then(t=>{if(!t&&e!=="/"){window.location.href="/";return}if(e==="/")L();else if(e==="/dashboard")C(t);else if(e.startsWith("/endpoints/")){const o=e.split("/")[2];E(t,o)}else e==="/settings"?O(t):D()}).catch(t=>{console.error("Auth check failed:",t),window.location.href="/"})}async function $(){try{return(await y.getCurrentUser()).user}catch{return null}}function L(){p.innerHTML=`
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div class="text-center max-w-lg px-4">
        <h1 class="text-5xl font-bold text-indigo-600 mb-4">Webhook Debugger</h1>
        <p class="text-xl text-gray-600 mb-8">
          Capture, inspect, and replay webhooks with 90-day history
        </p>

        <div class="bg-white rounded-lg shadow-lg p-6 mb-8 text-left">
          <h3 class="font-semibold text-gray-800 mb-4">Features</h3>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Unique webhook URLs generated instantly
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Auto-detect GitHub, Stripe, Slack, Shopify & more
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              One-click replay to any URL
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Full-text search across all payloads
            </li>
          </ul>
        </div>

        <a href="/api/auth/github"
           class="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Login with GitHub
        </a>

        <p class="mt-4 text-sm text-gray-500">
          Free plan: 1 endpoint, 7-day history
        </p>
      </div>
    </div>
  `}function m(e,t){var o;return`
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 p-4">
        <h1 class="text-xl font-bold text-indigo-600 mb-6">Webhook Debugger</h1>

        <nav class="space-y-1">
          <a href="/dashboard" class="block px-3 py-2 rounded-lg ${window.location.pathname==="/dashboard"?"bg-indigo-50 text-indigo-700":"text-gray-600 hover:bg-gray-100"}">
            Endpoints
          </a>
          <a href="/settings" class="block px-3 py-2 rounded-lg ${window.location.pathname==="/settings"?"bg-indigo-50 text-indigo-700":"text-gray-600 hover:bg-gray-100"}">
            Settings
          </a>
        </nav>

        <div class="mt-auto pt-6 border-t border-gray-200">
          <div class="flex items-center gap-3 mb-4">
            ${e.avatar_url?`<img src="${e.avatar_url}" class="w-8 h-8 rounded-full" alt="${e.github_login}"/>`:`<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">${((o=e.github_login)==null?void 0:o[0])||"U"}</div>`}
            <span class="text-sm font-medium text-gray-700">${e.github_login}</span>
          </div>
          <button onclick="logout()" class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-gray-50 overflow-y-auto">
        ${t}
      </main>
    </div>
  `}async function C(e){p.innerHTML=m(e,`
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Endpoints</h2>
        <button onclick="createEndpoint()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          + New Endpoint
        </button>
      </div>

      <div id="endpoints-list" class="space-y-4">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `);try{const t=await u.list(),o=document.getElementById("endpoints-list");if(t.endpoints.length===0){o.innerHTML=`
        <div class="text-center py-16">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">No endpoints yet</h3>
          <p class="text-gray-500 mb-4">Create your first endpoint to start receiving webhooks</p>
          <button onclick="createEndpoint()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Create Endpoint
          </button>
        </div>
      `;return}o.innerHTML=t.endpoints.map(a=>T(a)).join("")}catch(t){console.error("Failed to load endpoints:",t),i("Failed to load endpoints","error")}}function T(e){const t=`${window.location.origin}/hook/${e.path.replace("/hook/","")}`;return`
    <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-lg text-gray-800">${e.name}</h3>
          <p class="text-sm text-gray-500 mt-1">Created ${g(e.created_at)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="deleteEndpoint('${e.id}')" class="text-gray-400 hover:text-red-600 p-1" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-3 mb-3">
        <div class="flex items-center justify-between">
          <code class="text-sm text-gray-700 font-mono">${t}</code>
          <button onclick="copyToClipboard('${t}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Copy
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">
          <span class="font-medium text-gray-700">${e.webhook_count||0}</span> webhooks received
        </span>
        <a href="/endpoints/${e.id}" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          View Details →
        </a>
      </div>
    </div>
  `}async function E(e,t,o){p.innerHTML=m(e,`
    <div class="p-8">
      <div id="endpoint-detail">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `);try{const[a,n]=await Promise.all([u.get(t),l.list(t,{limit:50})]),s=a.endpoint,{webhooks:r}=n;S(s,r)}catch(a){console.error("Failed to load endpoint:",a),i("Failed to load endpoint","error")}}function S(e,t){const o=`${window.location.origin}/hook/${e.path.replace("/hook/","")}`,a=document.getElementById("endpoint-detail");a.innerHTML=`
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-1">${e.name}</h2>
          <p class="text-gray-500">Created ${g(e.created_at)}</p>
        </div>
        <button onclick="deleteEndpoint('${e.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">
          Delete Endpoint
        </button>
      </div>

      <div class="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-100">
        <label class="block text-sm font-medium text-indigo-700 mb-2">Webhook URL</label>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-white px-4 py-2 rounded-lg text-gray-800 font-mono text-sm">${o}</code>
          <button onclick="copyToClipboard('${o}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Copy
          </button>
        </div>
      </div>

      <div class="flex gap-6 mt-4">
        <div>
          <span class="text-2xl font-bold text-gray-800">${t.length}</span>
          <p class="text-sm text-gray-500">Total</p>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <input
          type="text"
          id="webhook-search"
          placeholder="Search webhooks..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <!-- Webhooks List -->
    <div id="webhooks-list" class="space-y-3">
      ${t.length===0?`<div class="text-center py-16">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">No webhooks yet</h3>
            <p class="text-gray-500">Send a webhook to the URL above to get started</p>
          </div>`:t.map(r=>f(r)).join("")}
    </div>
  `;const n=document.getElementById("webhook-search"),s=k(async r=>{if(!r.trim()){const c=await l.list(e.id,{limit:50});h(c.webhooks);return}try{const c=await l.search(e.id,r,{limit:50});h(c.webhooks)}catch(c){console.error("Search failed:",c),i("Search failed","error")}},300);n.addEventListener("input",r=>{s(r.target.value)})}function h(e){const t=document.getElementById("webhooks-list");t.innerHTML=e.length===0?'<div class="text-center py-8 text-gray-500">No webhooks found</div>':e.map(o=>f(o)).join("")}function f(e){const t=getSourceIcon(e.source),o={GET:"bg-blue-100 text-blue-800",POST:"bg-green-100 text-green-800",PUT:"bg-yellow-100 text-yellow-800",PATCH:"bg-orange-100 text-orange-800",DELETE:"bg-red-100 text-red-800"};return`
    <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
         onclick="showWebhookDetail('${e.id}')">
      <div class="flex items-center gap-3">
        <div class="source-icon">${t}</div>
        <span class="px-2 py-1 rounded text-xs font-medium ${o[e.method]||"bg-gray-100 text-gray-800"}">
          ${e.method}
        </span>
        <span class="text-sm text-gray-500 flex-1">
          ${e.source||"Unknown"}
        </span>
        <span class="text-sm text-gray-500">
          ${g(e.received_at)}
        </span>
        ${e.replay_count>0?`<span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Replayed ${e.replay_count}x
            </span>`:""}
      </div>
    </div>
  `}async function x(e){const t=document.createElement("div");t.className="modal-backdrop",document.body.appendChild(t);const o=document.createElement("div");o.className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4",o.innerHTML=`
    <div class="p-6">
      <div class="flex justify-between items-start mb-6">
        <h2 class="text-xl font-bold text-gray-800">Webhook Details</h2>
        <button onclick="closeWebhookModal()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div id="webhook-detail-content">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `,t.appendChild(o),t.addEventListener("click",a=>{a.target===t&&v()});try{const a=await l.get(e);M(a.webhook)}catch(a){console.error("Failed to load webhook:",a),document.getElementById("webhook-detail-content").innerHTML=`
      <p class="text-red-600">Failed to load webhook details</p>
    `}}function M(e){const t=document.getElementById("webhook-detail-content"),o=JSON.parse(e.headers||"{}"),a=e.query_params?JSON.parse(e.query_params):{},n=e.body?JSON.parse(e.body):null;t.innerHTML=`
    <!-- Metadata -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Method</label>
        <span class="text-lg font-semibold text-gray-800">${e.method}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Received</label>
        <span class="text-lg font-semibold text-gray-800">${formatDate(e.received_at)}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Source</label>
        <span class="text-lg font-semibold text-gray-800">${e.source||"Unknown"}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Content Type</label>
        <span class="text-lg font-semibold text-gray-800">${e.content_type||"Not specified"}</span>
      </div>
    </div>

    <!-- Replay Section -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Replay to URL</label>
      <div class="flex gap-2">
        <input
          type="text"
          id="replay-url"
          placeholder="https://your-server.com/webhook"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button onclick="replayWebhook('${e.id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Replay
        </button>
      </div>
      ${e.last_replay_status?`
        <div class="mt-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Last replay:</span>
            <span class="px-2 py-1 rounded text-xs font-medium ${e.last_replay_status<300?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}">
              ${e.last_replay_status}
            </span>
          </div>
        </div>
      `:""}
    </div>

    <!-- Copy cURL -->
    <div class="mb-6">
      <button onclick="copyCurlCommand('${e.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
        Copy as cURL
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="flex gap-4">
        <button onclick="showTab('headers')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600" data-tab="headers">
          Headers
        </button>
        ${n?`
          <button onclick="showTab('body')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800" data-tab="body">
            Body
          </button>
        `:""}
        ${Object.keys(a).length>0?`
          <button onclick="showTab('query')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800" data-tab="query">
            Query Params
          </button>
        `:""}
      </nav>
    </div>

    <!-- Tab Content -->
    <div id="tab-headers" class="tab-content">
      <pre><code>${formatJSON(JSON.stringify(o,null,2))}</code></pre>
    </div>
    ${n?`
      <div id="tab-body" class="tab-content hidden">
        <pre><code>${formatJSON(JSON.stringify(n,null,2))}</code></pre>
      </div>
    `:""}
    ${Object.keys(a).length>0?`
      <div id="tab-query" class="tab-content hidden">
        <pre><code>${formatJSON(JSON.stringify(a,null,2))}</code></pre>
      </div>
    `:""}
  `}function U(e){document.querySelectorAll(".tab-btn").forEach(t=>{t.dataset.tab===e?(t.classList.add("border-indigo-600","text-indigo-600"),t.classList.remove("border-transparent","text-gray-600")):(t.classList.remove("border-indigo-600","text-indigo-600"),t.classList.add("border-transparent","text-gray-600"))}),document.querySelectorAll(".tab-content").forEach(t=>{t.classList.add("hidden")}),document.getElementById(`tab-${e}`).classList.remove("hidden")}function v(){const e=document.querySelector(".modal-backdrop");e&&e.remove()}async function _(e){const o=document.getElementById("replay-url").value.trim();if(!o){i("Please enter a target URL","error");return}try{const a=await l.replay(e,o);a.success?(i(`Replay successful: ${a.status}`,"success"),x(e)):i(`Replay failed: ${a.error}`,"error")}catch(a){console.error("Replay failed:",a),i("Replay failed","error")}}async function j(e){var t;try{const a=(await l.get(e)).webhook,n=`${window.location.origin}/hook/${(t=a.path)==null?void 0:t.replace("/hook/","")}`,s=generateCurlCommand(a,n);await copyToClipboard(s)}catch(o){console.error("Failed to copy cURL:",o),i("Failed to copy cURL","error")}}function O(e){var t;p.innerHTML=m(e,`
    <div class="p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div class="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        <div class="flex items-center gap-4 mb-6">
          ${e.avatar_url?`<img src="${e.avatar_url}" class="w-16 h-16 rounded-full" alt="${e.github_login}"/>`:`<div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">${((t=e.github_login)==null?void 0:t[0])||"U"}</div>`}
          <div>
            <h3 class="font-semibold text-lg text-gray-800">${e.github_login}</h3>
            <p class="text-gray-500">Joined ${g(e.created_at)}</p>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-sm font-medium ${e.plan==="free"?"bg-gray-100 text-gray-800":e.plan==="pro"?"bg-blue-100 text-blue-800":"bg-purple-100 text-purple-800"}">
                ${e.plan.charAt(0).toUpperCase()+e.plan.slice(1)}
              </span>
              ${e.plan==="free"?`
                <button class="text-sm text-indigo-600 hover:text-indigo-800">Upgrade to Pro</button>
              `:""}
            </div>
          </div>

          <div class="pt-4">
            <button onclick="logout()" class="text-red-600 hover:text-red-800 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `)}function D(){p.innerHTML=`
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p class="text-gray-600 mb-4">Page not found</p>
        <a href="/dashboard" class="text-indigo-600 hover:text-indigo-800">Go to Dashboard</a>
      </div>
    </div>
  `}window.createEndpoint=async function(){const e=prompt("Enter endpoint name:");if(e)try{await u.create(e),i("Endpoint created successfully","success"),window.location.reload()}catch(t){console.error("Failed to create endpoint:",t),i("Failed to create endpoint","error")}};window.deleteEndpoint=async function(e){if(confirm("Are you sure you want to delete this endpoint? This will also delete all associated webhooks."))try{await u.delete(e),i("Endpoint deleted successfully","success"),window.location.href="/dashboard"}catch(t){console.error("Failed to delete endpoint:",t),i("Failed to delete endpoint","error")}};window.logout=async function(){try{await y.logout(),window.location.href="/"}catch(e){console.error("Logout failed:",e),window.location.href="/"}};window.showWebhookDetail=x;window.closeWebhookModal=v;window.replayWebhook=_;window.copyCurlCommand=j;window.showTab=U;window.copyToClipboard=copyToClipboard;window.getSourceIcon=getSourceIcon;window.formatDate=formatDate;b();window.addEventListener("popstate",b);document.addEventListener("click",e=>{const t=e.target.closest("a");if(t&&t.href.startsWith(window.location.origin)&&!t.getAttribute("href").startsWith("/api/")&&!t.getAttribute("href").startsWith("/hook/")){e.preventDefault();const o=new URL(t.href).pathname;window.history.pushState({},"",o),b()}});
