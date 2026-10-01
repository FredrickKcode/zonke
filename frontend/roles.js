/* Client / Recruiter / Professional pages */
const CATS = { development: "Development", design: "Design", cybersecurity: "Cybersecurity", marketing: "Marketing" };
const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem("zonke_" + k)) || d; } catch (e) { return d; } },
             set(k, v) { try { localStorage.setItem("zonke_" + k, JSON.stringify(v)); } catch (e) {} } };
const ini = n => n.split(" ").map(w => w[0]).slice(0, 2).join("");
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ROLE = { development: ["Full-Stack Developer", "Mobile Developer", "Backend Developer"], design: ["UI/UX Designer", "Brand Designer", "Graphic Designer"],
    cybersecurity: ["Security Analyst", "Penetration Tester", "Compliance Advisor"], marketing: ["SEO Specialist", "Content Marketer", "Social Media Manager"] };
const SKILL = { development: ["JavaScript", "Python", "React", "SQL"], design: ["Figma", "Photoshop", "Branding", "Prototyping"],
    cybersecurity: ["SIEM", "OWASP", "Networking", "Audits"], marketing: ["SEO", "Copywriting", "Analytics", "Ads"] };
const NAMES = ["Thabo Mokoena", "Naledi Dlamini", "Ayesha Patel", "Sipho Nkosi", "Lerato Khumalo", "Pieter van Wyk", "Zanele Mthembu", "Kabelo Sithole",
    "Fatima Hassan", "Johan Botha", "Nomsa Zulu", "Tumelo Ndlovu", "Anele Cele", "Riaan Steyn"];
const keys = Object.keys(CATS);
let talent = NAMES.map((n, i) => { const c = keys[i % 4];
    return { name: n, cat: c, role: ROLE[c][i % 3], rating: (4.4 + (i % 6) / 10).toFixed(1), rate: "R" + (200 + i * 15) + "/hour", skills: SKILL[c], projects: (12 + i * 3) + "+ projects", location: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Remote"][i % 5], bio: ROLE[c][i % 3] + " open to new work." }; });
ls.get("freelancers", []).forEach(f => talent.push({ ...f, cat: f.cat || "development" }));

let jobs = [["React Dashboard Build", "development", "Nova Analytics", 8000], ["Mobile App Bug Fixes", "development", "Kasi Apps", 4500], ["API Integration", "development", "PayLink", 9500],
    ["Brand Logo Package", "design", "Bright Studio", 3000], ["Mobile UI Redesign", "design", "FitTrack", 7000], ["Social Media Graphics", "design", "Urban Eats", 2500],
    ["Network Security Audit", "cybersecurity", "SafeNet SA", 12000], ["Phishing Awareness Training", "cybersecurity", "MedCare", 6000],
    ["SEO Content Plan", "marketing", "GreenLeaf", 3500], ["Facebook Ads Campaign", "marketing", "Shop Local", 4000], ["Email Newsletter Setup", "marketing", "Bloom Co", 2800], ["WordPress Site Fix", "development", "Legal Hub", 3200]
].map(j => ({ title: j[0], category: j[1], company: j[2], budget: j[3], deadline: "Open", desc: "Looking for a reliable freelancer to complete this project." }));
ls.get("jobs", []).forEach(j => jobs.unshift(j));

/* ---------- modal ---------- */
document.body.insertAdjacentHTML("beforeend", '<div class="modal-overlay" id="modal"><div class="modal-box"><button class="modal-close" id="mClose" type="button">&times;</button><div id="mBody"></div></div></div>');
const modal = document.getElementById("modal"), mBody = document.getElementById("mBody");
const closeModal = () => modal.classList.remove("open");
document.getElementById("mClose").onclick = closeModal;
modal.onclick = e => { if (e.target === modal) closeModal(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
const fld = (l, t = "text") => `<div class="form-group"><label>${l}</label><input type="${t}" required></div>`;
async function apiRequest(path, method = "GET", payload = null, authenticated = true) {
    const headers = {};
    const token = sessionStorage.getItem("zonke_token");
    if (authenticated && !token) throw new Error("Please log in before using this feature.");
    if (token && authenticated) headers.Authorization = `Bearer ${token}`;
    if (payload) headers["Content-Type"] = "application/json";
    const response = await fetch(`http://localhost:3001/api${path}`, {
        method,
        headers,
        ...(payload ? { body: JSON.stringify(payload) } : {})
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
}

async function loadDatabaseTalent() {
    const rows = await apiRequest("/freelancers", "GET", null, false);
    return rows.map(row => ({
        freelancer_id: row.freelancer_id,
        user_id: row.user_id,
        name: `${row.first_name} ${row.last_name}`.trim(),
        cat: row.category || "development",
        role: row.title || "Freelancer",
        rating: row.avg_rating ? Number(row.avg_rating).toFixed(1) : "New",
        rate: row.hourly_rate ? `R${Number(row.hourly_rate).toLocaleString("en-ZA")}/hour` : "Rate on request",
        skills: String(row.skills || "").split(",").map(skill => skill.trim()).filter(Boolean),
        projects: `${row.projects_completed || 0}+ projects`,
        location: row.location || "South Africa",
        bio: row.bio || "Available for new projects."
    }));
}

function replaceTalentGrid(gridId, pager, cardFactory) {
    const target = document.getElementById(gridId);
    target.innerHTML = talent.map(cardFactory).join("");
    pager.refresh(true);
}

function formModal(title, sub, fields, btn, done, onSubmit) {
    mBody.innerHTML = `<h3>${title}</h3><p class="sub">${sub}</p><form id="mForm">${fields}<button class="btn primary" type="submit">${btn}</button><p class="form-message" id="mMsg"></p></form>`;
    modal.classList.add("open");
    document.getElementById("mForm").onsubmit = async e => {
        e.preventDefault();
        const form = e.currentTarget;
        const message = document.getElementById("mMsg");
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            if (onSubmit) await onSubmit(form);
            message.textContent = done;
            message.style.color = "#15803d";
            form.querySelectorAll("input,textarea,button").forEach(x => x.disabled = true);
            setTimeout(closeModal, 1800);
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#dc2626";
            submit.disabled = false;
        }
    };
}

/* ---------- building blocks ---------- */
const hero = (t, s, cta, href) => `<section class="role-hero"><p class="eyebrow" style="color:#bfdbfe">ZONKE.ME</p><h1>${t}</h1><p>${s}</p><a class="btn light-btn" href="${href}">${cta}</a></section>`;
const stats = a => `<div class="stat-strip">${a.map(x => `<div><strong>${x[0]}</strong>${x[1]}</div>`).join("")}</div>`;
const steps = a => `<section class="section"><div class="section-heading"><h2>How It Works</h2></div><div class="steps">${a.map((x, i) => `<div class="step"><b>${i + 1}</b><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("")}</div></section>`;
const sec = (id, t, s, inner, cls = "") => `<section class="section ${cls}" id="${id}"><div class="section-heading"><h2>${t}</h2><p>${s}</p></div>${inner}</section>`;
const catOpts = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
const jobForm = (id, btn) => `<form class="form-card" id="${id}"><div class="form-row"><div class="form-group"><label>Title</label><input required></div>
    <div class="form-group"><label>Department</label><select>${catOpts}</select></div></div><div class="form-row"><div class="form-group"><label>Budget (R)</label><input type="number" min="1" required></div>
    <div class="form-group"><label>Deadline</label><input type="date" required></div></div><div class="form-group"><label>Description</label><textarea rows="4" required></textarea></div>
    <button class="btn primary" type="submit">${btn}</button><p class="form-message"></p></form>`;
const talentCard = (t, i, btn) => `<article class="profile-card" data-category="${t.cat}" data-i="${i}"><div class="avatar">${ini(t.name)}</div><h3>${esc(t.name)}</h3>
    <p class="role">${esc(t.role)} &middot; ${esc(t.location)}</p><p class="rating">★ ${t.rating} &nbsp;|&nbsp; ${esc(t.projects)}</p>
    <div class="skill-row">${t.skills.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div><strong>${esc(t.rate)}</strong>
    <button class="btn secondary" data-act="view">View</button> <button class="btn primary" data-act="main">${btn}</button></article>`;
const jobCard = (j, i) => `<article class="job-card" data-category="${j.category}" data-i="${i}"><div class="job-top"><span class="tag">${CATS[j.category]}</span><span class="status">Open</span></div>
    <h3>${esc(j.title)}</h3><p class="company">${esc(j.company)}</p><p>${esc(j.desc)}</p><div class="job-info"><span>💰 R${Number(j.budget).toLocaleString("en-ZA")}</span><span>📅 ${esc(j.deadline)}</span></div>
    <button class="btn primary" data-act="main">Apply Now</button></article>`;

function postHandler(id, who) {
    const f = document.getElementById(id); if (!f) return;
    f.onsubmit = async e => {
        e.preventDefault();
        const x = f.elements;
        const message = f.querySelector(".form-message");
        try {
            const amount = Number(x[2].value);
            await apiRequest("/jobs", "POST", {
                title: x[0].value.trim(),
                category: x[1].value,
                budget_min: amount,
                budget_max: amount,
                deadline: x[3].value,
                description: x[4].value.trim(),
                location: "Remote"
            });
            f.reset();
            message.textContent = "Job saved to the database and is live on Find Work.";
            message.style.color = "#15803d";
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#dc2626";
        }
    };
}
function viewTalent(t) {
    mBody.innerHTML = `<div class="avatar">${ini(t.name)}</div><h3>${esc(t.name)}</h3><p class="sub">${esc(t.role)} &middot; ${esc(t.location)}</p><p class="rating">★ ${t.rating} | ${esc(t.projects)}</p>
        <p>${esc(t.bio)}</p><div class="chips">${t.skills.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div><p><strong>${esc(t.rate)}</strong></p>`;
    modal.classList.add("open");
}
function grid(id, items, card, per, ph, cats, onMain) {
    const g = document.getElementById(id); g.innerHTML = items.map(card).join("");
    const p = smartList(g, ".profile-card, .job-card", per, ph, cats ? CATS : null);
    g.onclick = e => { const b = e.target.closest("[data-act]"), c = e.target.closest("[data-i]"); if (!b || !c) return;
        b.dataset.act === "view" ? viewTalent(items[c.dataset.i]) : onMain(items[c.dataset.i], b, p); };
    return p;
}

/* ---------- pages ---------- */
const app = document.getElementById("app"), role = document.body.dataset.role;

if (role === "client") {
    app.innerHTML = hero("Hire Top Talent for Any Project", "Post a project, compare vetted professionals and hire with confidence.", "Browse Talent", "#talent") +
        stats([["14+", "Skilled professionals"], ["4", "Departments"], ["24h", "Average first proposal"]]) +
        steps([["Post your project", "Describe what you need, your budget and deadline."], ["Review talent", "Search profiles by skill, department and rating."], ["Hire and pay securely", "Send a request and pay once the work is done."]]) +
        sec("post", "Post a Project", "Tell professionals what you need.", jobForm("clientForm", "Post Project"), "purple-section") +
        sec("talent", "Find Talent", "Search and filter our professionals.", '<div class="job-grid" id="talentGrid"></div>');
    postHandler("clientForm", "Zonke Client");
    const talentCardForClient = (t, i) => talentCard(t, i, "Hire");
    const talentPager = grid("talentGrid", talent, talentCardForClient, 6, "Search by name, role or skill…", true, t =>
        formModal("Hire " + esc(t.name), esc(t.role) + " · " + esc(t.rate), '<div class="form-group"><label>Project details</label><textarea rows="4" required></textarea></div>', "Send Hire Request", "Hire request saved for " + t.name + "!", async form => {
            if (!t.freelancer_id) throw new Error("This sample profile is not stored in the database yet.");
            await apiRequest("/hire-requests", "POST", { freelancer_id: t.freelancer_id, project_details: form.elements[0].value });
        }));
    loadDatabaseTalent().then(rows => {
        if (!rows.length) return;
        talent.splice(0, talent.length, ...rows);
        replaceTalentGrid("talentGrid", talentPager, talentCardForClient);
    }).catch(error => console.warn("Database freelancers unavailable:", error.message));
}

if (role === "recruiter") {
    let short = ls.get("short", []);
    app.innerHTML = hero("Build Your Team Faster", "Search candidates, shortlist the best and post openings in minutes.", "Search Candidates", "#candidates") +
        stats([["14+", "Candidates"], ["4", "Departments"], ["1 click", "To shortlist"]]) +
        sec("candidates", "Candidate Search", "Filter by department, name or skill.", '<div class="job-grid" id="candGrid"></div>') +
        sec("shortlist", "Your Shortlist", "Candidates you have saved.", '<div class="payment-history mini-list" id="shortBox"></div>', "purple-section") +
        sec("opening", "Post a Job Opening", "Reach professionals across all departments.", jobForm("recForm", "Post Opening"));
    postHandler("recForm", "Recruiter");
    const box = document.getElementById("shortBox");
    const drawShort = () => box.innerHTML = short.length ? short.map(n => `<div class="history-item"><span>${esc(n)}</span><span class="pending">Shortlisted</span></div>`).join("") : "<p>No candidates shortlisted yet.</p>";
    drawShort();
    const recruiterTalentCard = (t, i) => talentCard(t, i, short.includes(t.name) ? "★ Shortlisted" : "Shortlist");
    const p = grid("candGrid", talent, recruiterTalentCard, 6, "Search candidates by name, role or skill…", true, (t, b) => {
        short = short.includes(t.name) ? short.filter(n => n !== t.name) : short.concat(t.name); ls.set("short", short);
        b.textContent = short.includes(t.name) ? "★ Shortlisted" : "Shortlist"; drawShort(); });
    loadDatabaseTalent().then(rows => {
        if (!rows.length) return;
        talent.splice(0, talent.length, ...rows);
        replaceTalentGrid("candGrid", p, recruiterTalentCard);
    }).catch(error => console.warn("Database freelancers unavailable:", error.message));
}

if (role === "professional") {
    let apps = [];
    app.innerHTML = hero("Find Work That Fits Your Skills", "Build your profile, browse open projects and apply in seconds.", "Browse Jobs", "#board") +
        steps([["Create your profile", "Show your skills and hourly rate."], ["Apply to projects", "Search jobs by department and budget."], ["Get hired and paid", "Deliver great work and build your reputation."]]) +
        sec("profile", "Create Your Professional Profile", "Clients and recruiters will find you in search.",
            `<form class="form-card" id="proForm"><div class="form-row">${fld("Full Name")}${fld("Job Title")}</div><div class="form-row">${fld("Hourly Rate (R)", "number")}${fld("Skills (comma separated)")}</div>
             <div class="form-group"><label>Department</label><select>${catOpts}</select></div><button class="btn primary" type="submit">Publish Profile</button><p class="form-message"></p></form>`, "purple-section") +
        sec("board", "Job Board", "Search open projects.", '<div class="job-grid" id="jobGridP"></div>') +
        sec("apps", "My Applications", "Projects you have applied for.", '<div class="payment-history mini-list" id="appBox"></div>', "purple-section");
    document.getElementById("proForm").onsubmit = async e => {
        e.preventDefault();
        const x = e.target.elements;
        const message = e.target.querySelector(".form-message");
        try {
            await apiRequest("/freelancer/profile", "PUT", {
                title: x[1].value,
                hourly_rate: Number(x[2].value),
                skills: x[3].value,
                category: x[4].value
            });
            message.textContent = "Your profile was saved to the database.";
            message.style.color = "#15803d";
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#dc2626";
        }
    };
    const box = document.getElementById("appBox");
    const drawApps = () => box.innerHTML = apps.length ? apps.map(a => `<div class="history-item"><span>${esc(a)}</span><span class="paid">Applied</span></div>`).join("") : "<p>You have not applied to any projects yet.</p>";
    drawApps();
    const renderJobCard = (j, i) => `<article class="job-card" data-job-id="${Number(j.job_id) || ""}" data-category="${j.category}" data-i="${i}"><div class="job-top"><span class="tag">${CATS[j.category] || j.category}</span><span class="status">Open</span></div>
        <h3>${esc(j.title)}</h3><p class="company">${esc(j.company)}</p><p>${esc(j.desc)}</p><div class="job-info"><span>💰 R${Number(j.budget).toLocaleString("en-ZA")}</span><span>📅 ${esc(j.deadline)}</span></div>
        <button class="btn primary" data-act="main">Apply Now</button></article>`;
    const jobsPager = grid("jobGridP", jobs, renderJobCard, 6, "Search jobs by title, company or skill…", true, j =>
        formModal("Apply: " + esc(j.title), esc(j.company), '<div class="form-group"><label>Proposed amount (R)</label><input type="number" min="1" required></div><div class="form-group"><label>Why are you a good fit?</label><textarea rows="4" required></textarea></div>', "Submit Application", "Application saved!", async form => {
            if (!j.job_id) throw new Error("This sample job is not stored in the database yet.");
            await apiRequest("/proposals", "POST", {
                job_id: j.job_id,
                proposed_amount: Number(form.elements[0].value),
                cover_letter: form.elements[1].value
            });
        }));
    apiRequest("/jobs", "GET", null, false).then(rows => {
        if (!rows.length) return;
        jobs.splice(0, jobs.length, ...rows.map(row => ({
            job_id: row.job_id,
            title: row.title,
            category: row.category || "development",
            company: row.poster_name || "Zonke Client",
            budget: row.budget_max || row.budget_min || 0,
            deadline: row.deadline || "Open",
            desc: row.description || ""
        })));
        document.getElementById("jobGridP").innerHTML = jobs.map(renderJobCard).join("");
        jobsPager.refresh(true);
    }).catch(error => console.warn("Database jobs unavailable:", error.message));
    apiRequest("/proposals/mine").then(rows => {
        apps.splice(0, apps.length, ...rows.map(proposal => `${proposal.job_title} - ${proposal.status}`));
        drawApps();
    }).catch(error => {
        if (sessionStorage.getItem("zonke_token")) console.warn("Applications unavailable:", error.message);
    });
}
