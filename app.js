(() => {
  "use strict";
  const TESTS = window.GH300_TESTS;
  const INFOGRAPHICS = [
    ["01-responsible-ai-ethics-and-safe-usage", "Responsible AI & Safe Usage"],
    ["02-github-copilot-fundamentals-plans-and-core-features", "Fundamentals, Plans & Core Features"],
    ["03-copilot-in-the-ide-suggestions-chat-inline-chat-and-edits", "Copilot in the IDE"],
    ["04-prompt-crafting-engineering-and-context-control", "Prompt Crafting & Context Control"],
    ["05-how-copilot-works-context-data-flow-and-limitations", "How Copilot Works"],
    ["06-privacy-public-code-matching-content-exclusions-and-safeguards", "Privacy, Public Code & Safeguards"],
    ["07-administration-policy-management-and-enterprise-governance", "Administration & Governance"],
    ["08-developer-productivity-sdlc-and-practical-use-cases", "Productivity, SDLC & Use Cases"],
    ["09-testing-with-github-copilot", "Testing with Copilot"],
    ["10-github-com-workflows-pull-requests-code-review-and-issues", "GitHub.com Workflows, PRs & Issues"],
    ["11-spaces-knowledge-bases-and-mcp-server", "Spaces, Knowledge Bases & MCP"],
    ["12-agents-cli-metrics-and-advanced-operational-capabilities", "Agents, CLI & Metrics"],
  ];
  const KEY = "gh300:progress:v1";
  const app = document.getElementById("app");

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ } };
  const qid = (t, q) => `${String(t).padStart(2, "0")}-${q.id}`;
  const all = TESTS.flatMap((t) => t.questions.map((q) => ({ ...q, uid: qid(t.test, q), test: t.test })));

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function home() {
    const p = load();
    const stat = (qs) => { const done = qs.filter((q) => p[q.uid]); return `${done.filter((q) => p[q.uid].ok).length}/${qs.length}`; };
    const wrong = all.filter((q) => p[q.uid] && !p[q.uid].ok);
    app.innerHTML = `
      <h1>Practice</h1>
      <div class="list">
        <a class="item primary" href="#/quiz/mixed">Random 20 <small>all tests</small></a>
        ${wrong.length ? `<a class="item" href="#/quiz/wrong">Retry wrong answers <small>${wrong.length}</small></a>` : ""}
        <a class="item" href="#/quiz/new">Unanswered only <small>${all.filter((q) => !p[q.uid]).length} left</small></a>
      </div>
      <h2>Practice tests</h2>
      <div class="list">${TESTS.map((t) => `<a class="item" href="#/quiz/${t.test}">Test ${String(t.test).padStart(2, "0")} <small>${stat(t.questions.map((q) => ({ uid: qid(t.test, q) })))} correct · ${t.questions.length} Q</small></a>`).join("")}</div>
      <h2>Infographics</h2>
      <div class="list">${INFOGRAPHICS.map(([f, n], i) => `<a class="item" href="infographics/${f}.infographic.html">${String(i + 1).padStart(2, "0")} · ${esc(n)}</a>`).join("")}</div>
      <h2>Progress</h2>
      <button class="item" id="reset">Reset progress <small>${Object.keys(p).length} answered</small></button>`;
    document.getElementById("reset").onclick = () => { if (confirm("Reset all progress?")) { save({}); home(); } };
  }

  function quiz(mode) {
    const p = load();
    let qs;
    if (mode === "mixed") qs = shuffle(all).slice(0, 20);
    else if (mode === "wrong") qs = shuffle(all.filter((q) => p[q.uid] && !p[q.uid].ok));
    else if (mode === "new") qs = shuffle(all.filter((q) => !p[q.uid])).slice(0, 20);
    else qs = (all.filter((q) => q.test === Number(mode)));
    if (!qs.length) { app.innerHTML = `<h1>Nothing here</h1><p>No questions for this mode.</p><a class="btn" href="#/">Back</a>`; return; }
    let i = 0, correctCount = 0;
    const missed = [];

    const render = () => {
      const q = qs[i];
      const multi = q.correct.length > 1;
      let sel = new Set(), checked = false;
      const pct = (i / qs.length) * 100;
      app.innerHTML = `
        <div class="meta"><span>Question ${i + 1} / ${qs.length}</span><span>Test ${String(q.test).padStart(2, "0")} #${q.id}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="q">
          <p class="stem">${fmt(q.stem)}</p>
          ${multi ? `<p class="hint">Select ${q.correct.length} answers</p>` : ""}
          <div id="opts">${q.options.map((o) => `<button class="opt" data-k="${o.key}"><b>${o.key}.</b><span>${fmt(o.text)}</span></button>`).join("")}</div>
          <div id="fb"></div>
          <button class="btn" id="go" disabled>Check</button>
        </div>`;
      const go = document.getElementById("go");
      const opts = [...document.querySelectorAll(".opt")];
      opts.forEach((b) => b.onclick = () => {
        if (checked) return;
        const k = b.dataset.k;
        if (!multi) sel.clear();
        sel.has(k) ? sel.delete(k) : sel.add(k);
        opts.forEach((o) => o.classList.toggle("sel", sel.has(o.dataset.k)));
        go.disabled = sel.size === 0;
      });
      go.onclick = () => {
        if (!checked) {
          checked = true;
          const ok = sel.size === q.correct.length && q.correct.every((k) => sel.has(k));
          opts.forEach((o) => {
            const k = o.dataset.k; o.disabled = true; o.classList.remove("sel");
            if (q.correct.includes(k)) o.classList.add("right"); else if (sel.has(k)) o.classList.add("wrong");
          });
          if (ok) correctCount++; else missed.push(q);
          const pr = load(); pr[q.uid] = { ok }; save(pr);
          document.getElementById("fb").innerHTML = `<div class="exp"><div class="verdict ${ok ? "ok" : "no"}">${ok ? "Correct" : "Incorrect — answer: " + q.correct.join(", ")}</div>${fmt(q.explanation)}</div>`;
          go.textContent = i + 1 < qs.length ? "Next" : "Finish";
        } else if (i + 1 < qs.length) { i++; render(); window.scrollTo(0, 0); }
        else finish();
      };
    };

    const finish = () => {
      const pct = Math.round((correctCount / qs.length) * 100);
      app.innerHTML = `
        <div class="score">${correctCount} / ${qs.length}</div>
        <p class="sub">${pct}% ${pct >= 70 ? "· pass range" : "· keep practicing"}</p>
        <a class="btn" href="#/quiz/wrong">Retry wrong answers (${missed.length})</a>
        <a class="btn ghost" href="#/">Home</a>`;
      const retry = app.querySelector(".btn");
      if (!missed.length) retry.remove();
      else retry.onclick = (e) => { e.preventDefault(); location.hash = "#/quiz/wrong"; route(); };
    };
    render();
  }

  function route() {
    const [, a, b] = location.hash.split("/");
    window.scrollTo(0, 0);
    if (a === "quiz" && b) quiz(b); else home();
  }
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
