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
  const K = { progress: "gh300:progress:v1", session: "gh300:session:v2", flags: "gh300:flags:v1" };
  const app = document.getElementById("app");
  const sr = document.getElementById("sr");

  // ---------- storage ----------
  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  const rm = (k) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } };

  // ---------- data ----------
  const pad = (n) => String(n).padStart(2, "0");
  const qid = (t, q) => `${pad(t)}-${q.id}`;
  const all = TESTS.flatMap((t) => t.questions.map((q) => ({ ...q, uid: qid(t.test, q), test: t.test })));
  const byId = new Map(all.map((q) => [q.uid, q]));

  // ---------- helpers ----------
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const announce = (m) => { sr.textContent = ""; setTimeout(() => { sr.textContent = m; }, 30); };
  const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}><path d="${d}"/></svg>`;
  const ICON = {
    check: svg("M5 12.5l4.5 4.5L19 7.5"),
    x: svg("M6 6l12 12M18 6L6 18"),
    flag: svg("M5 21V4m0 0h11l-2 4 2 4H5"),
    close: svg("M6 6l12 12M18 6L6 18"),
  };
  const ring = (pct, label, aria) => {
    const c = 2 * Math.PI * 44;
    return `<svg class="ring" viewBox="0 0 100 100" role="img" aria-label="${esc(aria)}"><circle class="ring-bg" cx="50" cy="50" r="44"/><circle class="ring-fg" cx="50" cy="50" r="44" stroke-dasharray="${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="50">${esc(label)}</text></svg>`;
  };
  const stats = (p) => {
    const answered = all.filter((q) => p[q.uid]).length;
    const correct = all.filter((q) => p[q.uid] && p[q.uid].ok).length;
    return { answered, correct, acc: answered ? Math.round((correct / answered) * 100) : 0 };
  };

  let cleanup = () => {};

  // ---------- sessions ----------
  function startFrom(qs, label) {
    if (!qs.length) return;
    wr(K.session, { ids: qs.map((q) => q.uid), i: 0, correct: 0, missed: [], label, done: false });
    if (location.hash === "#/quiz") route(); else location.hash = "#/quiz";
  }
  function start(mode) {
    const p = rd(K.progress, {}), f = rd(K.flags, {});
    if (mode === "resume") { location.hash = "#/quiz"; return; }
    if (mode === "mixed") startFrom(shuffle(all).slice(0, 20), "Random 20");
    else if (mode === "wrong") startFrom(shuffle(all.filter((q) => p[q.uid] && !p[q.uid].ok)), "Wrong answers");
    else if (mode === "new") startFrom(shuffle(all.filter((q) => !p[q.uid])).slice(0, 20), "Unanswered");
    else if (mode === "flagged") startFrom(all.filter((q) => f[q.uid]), "Flagged");
    else if (mode.startsWith("t:")) startFrom(all.filter((q) => q.test === Number(mode.slice(2))), `Test ${pad(mode.slice(2))}`);
  }
  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-start]");
    if (b && !b.disabled) start(b.dataset.start);
  });

  // ---------- views ----------
  function home() {
    document.title = "Practice · GH-300";
    const p = rd(K.progress, {}), f = rd(K.flags, {});
    const s = stats(p);
    const sess = rd(K.session, null);
    const resumable = sess && !sess.done && sess.ids.length;
    const wrong = all.filter((q) => p[q.uid] && !p[q.uid].ok).length;
    const fresh = all.length - s.answered;
    const flagged = Object.keys(f).filter((id) => byId.has(id)).length;
    const pct = (s.correct / all.length) * 100;
    app.innerHTML = `
      <h1 tabindex="-1" data-focus>Practice</h1>
      <section class="hero" aria-label="Overall progress">
        ${ring(pct, `${Math.round(pct)}%`, `${s.correct} of ${all.length} questions answered correctly`)}
        <div class="stats">
          <div class="stat"><b>${s.correct}<span class="muted"> / ${all.length}</span></b><span>answered correctly</span></div>
          <div class="stat"><b>${s.answered ? s.acc + "%" : "—"}</b><span>accuracy so far</span></div>
        </div>
      </section>
      ${resumable
        ? `<button class="btn" data-start="resume">Continue ${esc(sess.label)} <small>${sess.i}/${sess.ids.length}</small></button>`
        : `<button class="btn" data-start="mixed">Start random 20</button>`}
      <div class="chips">
        ${resumable ? `<button class="chip" data-start="mixed">New random 20</button>` : ""}
        <button class="chip" data-start="new" ${fresh ? "" : "disabled"}>Unanswered <b>${fresh}</b></button>
        <button class="chip" data-start="wrong" ${wrong ? "" : "disabled"}>Retry wrong <b>${wrong}</b></button>
        <button class="chip" data-start="flagged" ${flagged ? "" : "disabled"}>Flagged <b>${flagged}</b></button>
      </div>
      <h2>Practice tests</h2>
      <div class="grid">${TESTS.map((t) => {
        const done = t.questions.filter((q) => p[qid(t.test, q)]);
        const ok = done.filter((q) => p[qid(t.test, q)].ok).length;
        return `<button class="tile" data-start="t:${t.test}" aria-label="Test ${pad(t.test)}, ${ok} of ${t.questions.length} correct">
          <span class="t">TEST</span><span class="n">${pad(t.test)}</span>
          <div class="bar" aria-hidden="true"><i style="width:${(ok / t.questions.length) * 100}%"></i></div>
          <span class="t">${ok}/${t.questions.length} correct</span></button>`;
      }).join("")}</div>`;
  }

  function study() {
    document.title = "Study · GH-300";
    app.innerHTML = `
      <h1 tabindex="-1" data-focus>Study</h1>
      <p class="muted">12 infographics covering the exam domains.</p>
      <div class="rows">${INFOGRAPHICS.map(([f, n], i) => `<a class="row" href="infographics/${f}.infographic.html"><span class="no mono">${pad(i + 1)}</span><span class="grow">${esc(n)}</span><span class="end" aria-hidden="true">&rsaquo;</span></a>`).join("")}</div>`;
  }

  function progress() {
    document.title = "Progress · GH-300";
    const p = rd(K.progress, {}), f = rd(K.flags, {});
    const s = stats(p);
    app.innerHTML = `
      <h1 tabindex="-1" data-focus>Progress</h1>
      <section class="hero" aria-label="Overall">
        ${ring((s.answered / all.length) * 100, `${Math.round((s.answered / all.length) * 100)}%`, `${s.answered} of ${all.length} questions seen`)}
        <div class="stats">
          <div class="stat"><b>${s.answered}<span class="muted"> / ${all.length}</span></b><span>questions seen</span></div>
          <div class="stat"><b>${s.answered ? s.acc + "%" : "—"}</b><span>accuracy (pass range ≥ 70%)</span></div>
        </div>
      </section>
      <h2>By test</h2>
      <div class="rows">${TESTS.map((t) => {
        const done = t.questions.filter((q) => p[qid(t.test, q)]);
        const ok = done.filter((q) => p[qid(t.test, q)].ok).length;
        const acc = done.length ? Math.round((ok / done.length) * 100) : null;
        return `<div class="row"><span class="no mono">${pad(t.test)}</span><div class="grow"><div>Test ${pad(t.test)}</div><div class="bar" aria-hidden="true"><i style="width:${(done.length / t.questions.length) * 100}%"></i></div></div><span class="end">${done.length}/${t.questions.length} · ${acc == null ? "—" : acc + "%"}</span></div>`;
      }).join("")}</div>
      <h2>Data</h2>
      <button class="btn ghost" id="reset" ${s.answered || Object.keys(f).length ? "" : "disabled"}>Reset progress…</button>
      <dialog id="dlg" aria-labelledby="dlg-t">
        <form method="dialog">
          <h2 id="dlg-t">Delete all progress?</h2>
          <p>This removes ${s.answered} answers, your flags and the current quiz from this device. It can't be undone.</p>
          <div class="stack">
            <button class="btn danger" value="ok">Delete progress</button>
            <button class="btn ghost" value="cancel">Keep progress</button>
          </div>
        </form>
      </dialog>`;
    const dlg = document.getElementById("dlg");
    document.getElementById("reset").onclick = () => dlg.showModal();
    dlg.addEventListener("close", () => {
      if (dlg.returnValue === "ok") { rm(K.progress); rm(K.flags); rm(K.session); announce("Progress deleted"); progress(); focusHeading(); }
    });
  }

  function quiz() {
    let s = rd(K.session, null);
    const qs = s ? s.ids.map((id) => byId.get(id)).filter(Boolean) : [];
    if (!s || !qs.length) { location.replace("#/"); return; }
    if (s.done) { results(s, qs); return; }
    s.i = Math.min(s.i, qs.length - 1);
    document.title = `${s.label} · GH-300`;

    const render = () => {
      const q = qs[s.i];
      const multi = q.correct.length > 1;
      const need = q.correct.length;
      const flags = rd(K.flags, {});
      let sel = new Set(), checked = false, lastOk = false;

      app.innerHTML = `
        <div class="quiz-head">
          <button class="icon-btn" id="exit" aria-label="Exit quiz (progress is saved)">${ICON.close}</button>
          <span class="meta" aria-hidden="true">${pad(s.i + 1)} / ${pad(qs.length)}</span>
          <button class="icon-btn" id="flag" aria-pressed="${!!flags[q.uid]}" aria-label="Flag for review">${ICON.flag}</button>
        </div>
        <div class="bar" id="bar" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${s.i}"><i style="width:${(s.i / qs.length) * 100}%"></i></div>
        <article class="q">
          <p class="eyebrow">Question ${s.i + 1} of ${qs.length} · Test ${pad(q.test)} #${q.id}</p>
          <h1 class="stem" tabindex="-1" data-focus>${fmt(q.stem)}</h1>
          ${multi ? `<p class="hint" id="hint">Select ${need} answers · <span id="cnt">0</span>/${need}</p>` : ""}
          <div class="opts" role="group" aria-label="Answer options">${q.options.map((o) => `<button class="opt" data-k="${o.key}" aria-pressed="false"><span class="key mono">${o.key}</span><span class="txt">${fmt(o.text)}</span><span class="mark" aria-hidden="true"></span></button>`).join("")}</div>
          <div id="fb"></div>
        </article>
        <div class="actions"><button class="btn" id="go" ${multi ? "disabled" : "hidden"}>Check answer</button></div>`;

      const go = document.getElementById("go");
      const opts = [...app.querySelectorAll(".opt")];
      const paint = () => {
        opts.forEach((o) => { const on = sel.has(o.dataset.k); o.classList.toggle("sel", on); o.setAttribute("aria-pressed", on); });
        if (multi) { document.getElementById("cnt").textContent = sel.size; go.disabled = sel.size !== need; }
      };

      document.getElementById("exit").onclick = () => { location.hash = "#/"; };
      const flagBtn = document.getElementById("flag");
      flagBtn.onclick = () => {
        const fl = rd(K.flags, {});
        if (fl[q.uid]) delete fl[q.uid]; else fl[q.uid] = 1;
        wr(K.flags, fl);
        flagBtn.setAttribute("aria-pressed", !!fl[q.uid]);
        announce(fl[q.uid] ? "Flagged" : "Flag removed");
      };

      const check = () => {
        checked = true;
        lastOk = sel.size === need && q.correct.every((k) => sel.has(k));
        opts.forEach((o) => {
          const k = o.dataset.k, right = q.correct.includes(k), mine = sel.has(k);
          o.disabled = true; o.classList.remove("sel");
          if (right) o.classList.add("right"); else if (mine) o.classList.add("wrong"); else o.classList.add("dim");
          const mark = o.querySelector(".mark");
          if (right) mark.innerHTML = `${ICON.check}${mine ? "Correct" : "Answer"}`;
          else if (mine) mark.innerHTML = `${ICON.x}Your pick`;
        });
        const pr = rd(K.progress, {}); pr[q.uid] = { ok: lastOk }; wr(K.progress, pr);
        const answerText = q.correct.join(", ");
        document.getElementById("fb").innerHTML = `<div class="exp ${lastOk ? "ok" : "no"}" tabindex="-1" id="exp"><div class="verdict ${lastOk ? "ok" : "no"}">${lastOk ? ICON.check + "Correct" : ICON.x + "Incorrect — answer: " + esc(answerText)}</div><p class="exp-title">Why</p>${fmt(q.explanation)}</div>`;
        const bar = document.getElementById("bar");
        bar.setAttribute("aria-valuenow", s.i + 1);
        bar.firstElementChild.style.width = `${((s.i + 1) / qs.length) * 100}%`;
        go.hidden = false; go.disabled = false;
        go.textContent = s.i + 1 < qs.length ? "Next question" : "See results";
        go.focus({ preventScroll: true });
        document.getElementById("exp").scrollIntoView({ block: "nearest", behavior: "smooth" });
        announce(lastOk ? "Correct" : `Incorrect. Correct answer: ${answerText}`);
      };

      const pick = (k) => {
        if (checked) return;
        if (!multi) { sel = new Set([k]); paint(); check(); return; }
        if (sel.has(k)) sel.delete(k); else if (sel.size < need) sel.add(k); else { announce(`Already ${need} selected. Deselect one first.`); return; }
        paint();
      };
      opts.forEach((o) => { o.onclick = () => pick(o.dataset.k); });

      go.onclick = () => {
        if (!checked) { if (sel.size === need) check(); return; }
        if (lastOk) s.correct++; else s.missed.push(q.uid);
        s.i++;
        if (s.i >= qs.length) s.done = true;
        wr(K.session, s);
        if (s.done) { results(s, qs); focusHeading(); } else { render(); window.scrollTo(0, 0); focusHeading(); }
      };

      const onKey = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
        const key = e.key.toUpperCase();
        const idx = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
        const opt = opts.find((o, i) => o.dataset.k === key || i === idx);
        if (opt && !e.target.closest("input,textarea")) { e.preventDefault(); pick(opt.dataset.k); }
        else if (e.key === "Enter" && !e.target.closest("button,a") && !go.hidden && !go.disabled) { e.preventDefault(); go.click(); }
      };
      document.addEventListener("keydown", onKey);
      cleanup = () => document.removeEventListener("keydown", onKey);
    };
    render();
  }

  function results(s, qs) {
    document.title = `Results · GH-300`;
    const pct = Math.round((s.correct / qs.length) * 100);
    const pass = pct >= 70;
    const missed = s.missed.map((id) => byId.get(id)).filter(Boolean);
    app.innerHTML = `
      <div class="result">
        ${ring(pct, `${pct}%`, `Score ${s.correct} of ${qs.length}`)}
        <h1 class="verdict-line" tabindex="-1" data-focus>${s.correct} / ${qs.length} correct</h1>
        <p class="muted">${pass ? "In the pass range (70%+). Nice work." : "Below the 70% pass line. Review the misses below, then retry."}</p>
      </div>
      ${missed.length ? `<h2>Missed (${missed.length})</h2><div class="review">${missed.map((q) => `
        <details><summary>${fmt(q.stem.length > 140 ? q.stem.slice(0, 140) + "…" : q.stem)}</summary>
        <div class="body"><p><strong>Answer: ${q.correct.map((k) => `${k}. ${esc(q.options.find((o) => o.key === k)?.text || "")}`).join("; ")}</strong></p>${fmt(q.explanation)}</div></details>`).join("")}</div>` : ""}
      <div class="stack">
        ${missed.length ? `<button class="btn" id="retry">Retry ${missed.length} missed</button>` : ""}
        <button class="btn ${missed.length ? "ghost" : ""}" data-start="mixed">New random 20</button>
        <a class="btn ghost" href="#/">Back to practice</a>
      </div>`;
    const r = document.getElementById("retry");
    if (r) r.onclick = () => startFrom(missed, "Retry missed");
  }

  // ---------- router ----------
  function focusHeading() {
    const h = app.querySelector("[data-focus]");
    if (h) h.focus({ preventScroll: true });
  }
  function route() {
    cleanup(); cleanup = () => {};
    const a = location.hash.split("/")[1] || "";
    document.body.classList.toggle("in-quiz", a === "quiz");
    document.querySelectorAll(".tabs a").forEach((t) => {
      const on = (t.dataset.tab === "home" && (a === "" || a === "quiz")) || t.dataset.tab === a;
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    if (a === "quiz") quiz();
    else if (a === "study") study();
    else if (a === "progress") progress();
    else home();
    focusHeading();
  }
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
