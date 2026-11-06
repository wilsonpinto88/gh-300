// Cache-first offline support. Bump VERSION on each deploy to refresh the cache.
const VERSION = "gh300-v2";
const INFOGRAPHICS = [
  "01-responsible-ai-ethics-and-safe-usage",
  "02-github-copilot-fundamentals-plans-and-core-features",
  "03-copilot-in-the-ide-suggestions-chat-inline-chat-and-edits",
  "04-prompt-crafting-engineering-and-context-control",
  "05-how-copilot-works-context-data-flow-and-limitations",
  "06-privacy-public-code-matching-content-exclusions-and-safeguards",
  "07-administration-policy-management-and-enterprise-governance",
  "08-developer-productivity-sdlc-and-practical-use-cases",
  "09-testing-with-github-copilot",
  "10-github-com-workflows-pull-requests-code-review-and-issues",
  "11-spaces-knowledge-bases-and-mcp-server",
  "12-agents-cli-metrics-and-advanced-operational-capabilities",
].map((n) => `infographics/${n}.infographic.html`);
const CORE = [
  "./", "index.html", "style.css", "app.js", "questions.js", "manifest.webmanifest", "icon.svg",
  "infographics/assets/scroll-fx.css", "infographics/assets/scroll-fx.js", "infographics/assets/visuals.css",
  ...INFOGRAPHICS,
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
