/* Zonke.me shell: hamburger drawer + one-section-per-page router */
(() => {
  const nav = document.getElementById("nav"), btn = document.getElementById("menuBtn");
  const app = document.getElementById("app"), home = location.pathname.split("/").pop() || "index.html";
  // hamburger
  btn.innerHTML = "<span></span><span></span><span></span>";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false");
  // neat grouped drawer: regroup the existing links (listeners stay attached)
  const links = [...nav.querySelectorAll("a:not(.btn)")], signup = nav.querySelector(".nav-signup");
  const pick = k => links.filter(a => k.some(x => a.getAttribute("href").endsWith(x)));
  const groups = [["Explore", ["#home", "#jobs", "#departments", "#freelancers", "#bounties"]], ["For you", ["client.html", "recruiter.html", "professional.html"]],
    ["More", ["#post-job", "#payments", "#blog", "#about", "#contact"]]];
  const scroll = document.createElement("div"); scroll.className = "nav-scroll";
  groups.forEach(([t, k]) => { const g = document.createElement("div"); g.className = "nav-group"; g.innerHTML = `<div class="nav-label">${t}</div>`;
    pick(k).forEach(a => g.appendChild(a)); scroll.appendChild(g); });
  const foot = document.createElement("div"); foot.className = "nav-foot"; foot.appendChild(signup);
  nav.append(scroll, foot);
  const backdrop = document.createElement("div"); backdrop.className = "nav-backdrop"; nav.after(backdrop);
  const sync = () => btn.setAttribute("aria-expanded", nav.classList.contains("active"));
  new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["class"] });
  const close = () => nav.classList.remove("active");
  nav.addEventListener("click", e => { if (e.target.closest("a")) close(); });
  document.addEventListener("click", e => { if (!nav.contains(e.target) && !btn.contains(e.target)) close(); });
  document.addEventListener("keydown", e => e.key === "Escape" && close());
  const logo = document.querySelector(".logo");
  logo.onclick = () => home === "index.html" ? (location.hash = "#home") : (location.href = "index.html#home");

  // group page blocks into views
  const alias = { cybersecurity: "departments", "how-it-works": "home" };
  const items = app ? [...app.children] : [...document.querySelectorAll("body > section")];
  const views = {}; let cur = "home";
  items.forEach(el => {
    if (el.id) cur = alias[el.id] || el.id;
    (views[cur] = views[cur] || []).push(el); el.dataset.view = cur;
  });
  function show(first) {
    const t = decodeURIComponent(location.hash.slice(1)), target = t && document.getElementById(t);
    const name = (target && target.closest("[data-view]") || {}).dataset?.view || (views[t] ? t : "home");
    items.forEach(el => {
      const on = el.dataset.view === name;
      el.classList.toggle("view-hidden", !on);
      el.classList.remove("view-in"); if (on) { void el.offsetWidth; el.classList.add("view-in"); }
    });
    links.forEach(a => {
      const u = new URL(a.href), file = u.pathname.split("/").pop() || "index.html";
      a.classList.toggle("current", file === home && (u.hash ? u.hash.slice(1) === name : home !== "index.html"));
    });
    window.scrollTo({ top: 0, behavior: first ? "auto" : "smooth" });
  }
  addEventListener("hashchange", () => show(false));
  show(true);
})();
