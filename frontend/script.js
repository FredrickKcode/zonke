/* =====================================================
   ZONKE.ME JAVASCRIPT
   Frontend interactions
   ===================================================== */


/* ================= MOBILE MENU ================= */

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", function () {

    nav.classList.toggle("active");

});


/* Close mobile menu after clicking a link */

const navLinks = document.querySelectorAll("#nav a");

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        nav.classList.remove("active");

    });

});


/* ================= JOB SEARCH ================= */

const searchInput = document.getElementById("jobSearch");
const categorySelect = document.getElementById("jobCategory");
const jobCards = document.querySelectorAll(".job-card");


function filterJobs() {
    jobPager.refresh(true);
}


searchInput.addEventListener(
    "input",
    filterJobs
);


categorySelect.addEventListener(
    "change",
    filterJobs
);


/* ================= DATA ================= */

const freelancers = [
    { name: "Web Developer", role: "Frontend Developer", rating: "4.9", rate: "R250/hour", img: "images/developer.jpg",
      bio: "Builds responsive websites and modern frontend interfaces.", skills: ["HTML", "CSS", "JavaScript", "React"], projects: "40+ projects completed", location: "Johannesburg" },
    { name: "Security Specialist", role: "Cybersecurity Analyst", rating: "4.8", rate: "R350/hour", img: "images/cybersecurity.jpg",
      bio: "Helps businesses identify risks and improve security.", skills: ["SIEM", "Networking", "Risk Assessment"], projects: "30+ projects completed", location: "Remote" },
    { name: "Creative Designer", role: "UI/UX Designer", rating: "4.7", rate: "R280/hour", img: "images/uiux.jpg",
      bio: "Creates clean and accessible digital experiences.", skills: ["Figma", "UX Research", "Prototyping"], projects: "35+ projects completed", location: "Cape Town" },
    { name: "Thabo Mokoena", role: "Software Developer", rating: "4.8", rate: "R300/hour", img: "",
      bio: "Backend developer who builds reliable APIs and automation tools.", skills: ["Python", "Java", "Git", "SQL"], projects: "25+ projects completed", location: "Pretoria" },
    { name: "Naledi Dlamini", role: "Graphic Designer", rating: "4.9", rate: "R220/hour", img: "",
      bio: "Brand identity and campaign visuals for growing businesses.", skills: ["Photoshop", "Illustrator", "Branding"], projects: "50+ projects completed", location: "Durban" },
    { name: "Ayesha Patel", role: "Digital Marketer", rating: "4.6", rate: "R200/hour", img: "",
      bio: "SEO and social media campaigns that bring in real customers.", skills: ["SEO", "Social Media", "Analytics"], projects: "28+ projects completed", location: "Remote" }
];

[["Sipho Nkosi","Full-Stack Developer","JavaScript, Node, MongoDB"],["Lerato Khumalo","Brand Designer","Logo, Print, Figma"],["Pieter van Wyk","Penetration Tester","Kali, OWASP, Reports"],
["Zanele Mthembu","Content Marketer","Copywriting, SEO, Blogs"],["Kabelo Sithole","Mobile Developer","Flutter, Kotlin, Firebase"],["Fatima Hassan","Video Editor","Premiere, Motion, Reels"]
].forEach(([n, r, k], i) => freelancers.push({ name: n, role: r, rating: (4.5 + i / 10).toFixed(1), rate: "R" + (200 + i * 20) + "/hour", img: "",
    bio: r + " ready to take on new projects.", skills: k.split(", "), projects: (10 + i * 4) + "+ projects completed", location: "South Africa" }));

const posts = [
    { title: "How to Win Your First Freelance Job", date: "20 Sep, 2026", img: "images/developer.jpg", pos: "center",
      text: ["Start with a clear profile: a friendly photo, a short bio and two or three examples of your work.",
             "When you apply, explain how you will solve that client's problem, not just why you are great.",
             "Reply quickly, be honest about timelines, and ask for a review when the work is done."] },
    { title: "Staying Safe Online as a Freelancer", date: "12 Sep, 2026", img: "images/cybersecurity.jpg", pos: "center",
      text: ["Use a strong, unique password and turn on two-factor login wherever you can.",
             "Keep all payments and messages on the platform, and be careful with unexpected links or files.",
             "If an offer sounds too good to be true, it usually is."] },
    { title: "Why Good UX Matters for Every Business", date: "3 Sep, 2026", img: "images/uiux.jpg", pos: "center",
      text: ["People leave a website that confuses them within seconds.",
             "Simple navigation, readable text and fast pages make customers feel confident.",
             "Even a small design fix can turn more visitors into paying clients."] },
    { title: "Learning to Code: Where to Start in South Africa", date: "25 Aug, 2026", img: "images/software.jpg", pos: "right",
      text: ["Pick one language, such as Python or JavaScript, and build small projects every week.",
             "Use free courses and community groups to stay motivated.",
             "Put your projects online so clients can see what you can do."] },
    { title: "The Art of Pricing Your Freelance Work", date: "14 Aug, 2026", img: "images/developer.jpg", pos: "bottom",
      text: ["Work out your monthly costs and how many hours you can realistically bill.",
             "Charge for the value you deliver, not only your time.",
             "Agree the price and deliverables in writing before you start."] },
    { title: "Building a Portfolio That Gets You Hired", date: "2 Aug, 2026", img: "images/uiux.jpg", pos: "top",
      text: ["Show three to five of your best projects, not everything you have ever done.",
             "For each one, explain the problem, your solution and the result.",
             "Keep it simple, fast to load and easy to contact you from."] }
];

let dbFreelancers = [];
let dbPosts = [];
let dbBounties = [];

function normalizeFreelancer(f) {
    const firstName = f.first_name || "";
    const lastName = f.last_name || "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || f.name || "Freelancer";
    const role = f.title || f.role || "Freelancer";
    const skills = (f.skills || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 6);
    return {
        freelancer_id: f.freelancer_id,
        user_id: f.user_id,
        name,
        role,
        rating: f.avg_rating ? Number(f.avg_rating).toFixed(1) : "4.8",
        rate: f.hourly_rate ? `R${Number(f.hourly_rate).toLocaleString("en-ZA")}/hour` : "Rate on request",
        img: "",
        bio: f.bio || `${role} ready to take on new projects.`,
        skills: skills.length ? skills : ["Project delivery", "Collaboration"],
        projects: `${f.projects_completed || 0}+ projects completed`,
        location: f.location || "South Africa"
    };
}

function normalizePost(post) {
    return {
        title: post.title || "Zonke update",
        date: post.published_at ? new Date(post.published_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "Recently",
        img: post.image_url || "images/developer.jpg",
        pos: "center",
        text: [
          post.body ? post.body.replace(/<[^>]*>/g, "").slice(0, 180) + "..." : "Read the latest platform update.",
          "Learn how to make the most of your profile and projects.",
          "Stay connected with clients and communities on Zonke."
        ]
    };
}

function normalizeBounty(bounty) {
    return {
        bounty_id: bounty.bounty_id,
        tag: bounty.category_name || bounty.category || "General",
        title: bounty.title,
        description: bounty.description,
        reward: `R${Number(bounty.reward || 0).toLocaleString("en-ZA")}`,
        difficulty: bounty.difficulty ? bounty.difficulty.charAt(0).toUpperCase() + bounty.difficulty.slice(1) : "Medium",
        submissions: `${bounty.submission_count || 0} Submissions`,
        deadline: bounty.deadline ? new Date(`${bounty.deadline}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : "Open" 
    };
}

/* ================= SAVED STATE (connects the whole site) ================= */

const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem("zonke_" + k)) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("zonke_" + k, JSON.stringify(v)); } catch (e) {} }
};

let user = sessionStorage.getItem("zonke_token") ? store.get("user", null) : null;
if (!user) store.set("user", null);
const savedJobs = store.get("jobs", []);
store.get("freelancers", []).forEach(f => freelancers.push(f));

const initials = n => n.split(" ").map(w => w[0]).slice(0, 2).join("");


/* ================= MODAL ================= */

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");

function openModal(html) {
    modalBody.innerHTML = html;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function formModal(title, sub, fields, buttonText, doneText, onSubmit) {
    openModal(`<h3>${title}</h3><p class="sub">${sub}</p>
        <form id="modalForm">${fields}
        <button class="btn primary" type="submit">${buttonText}</button>
        <p class="form-message" id="modalMsg"></p></form>`);
    document.getElementById("modalForm").addEventListener("submit", async e => {
        e.preventDefault();
        const msg = document.getElementById("modalMsg");
        const submit = e.target.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            if (onSubmit) await onSubmit(e.target);
            msg.textContent = doneText;
            msg.style.color = "#15803d";
            e.target.querySelectorAll("input,textarea,select,button").forEach(el => el.disabled = true);
            setTimeout(closeModal, 2200);
        } catch (error) {
            msg.textContent = error.message || "Could not submit this form.";
            msg.style.color = "#dc2626";
            submit.disabled = false;
        }
    });
}

const field = (label, type, ph = "") => {
    let v = "";
    if (user && /name/i.test(label)) v = user.name;
    if (user && /email/i.test(label)) v = user.email;
    return `<div class="form-group"><label>${label}</label><input type="${type}" placeholder="${ph}" value="${v}" required></div>`;
};


/* ================= SIGN UP ================= */

async function apiRequest(path, payload, authenticated = true) {
    const headers = { "Content-Type": "application/json" };
    const token = sessionStorage.getItem("zonke_token");
    if (authenticated && token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`http://localhost:3001/api${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
}

function saveAuthSession(result) {
    sessionStorage.setItem("zonke_token", result.token);
    user = {
        name: `${result.user.firstName} ${result.user.lastName}`.trim(),
        email: result.user.email,
        type: result.user.role
    };
    store.set("user", user);
    updateAuth();
    loadPaymentProjects();
}

function openAuth(mode = "register") {
    const registering = mode === "register";
    openModal(`<h3>${registering ? "Create your account" : "Log in"}</h3>
        <p class="sub">${registering ? "Join Zonke.me." : "Welcome back to Zonke.me."}</p>
        <form id="authForm">
            ${registering ? '<div class="form-group"><label>Full Name</label><input name="full_name" required></div>' : ""}
            <div class="form-group"><label>Email Address</label><input name="email" type="email" required></div>
            <div class="form-group"><label>Password</label><input name="password" type="password" minlength="10" required></div>
            ${registering ? '<div class="form-group"><label>Account Type</label><select name="role" required><option value="">Select account type</option><option value="freelancer">Freelancer</option><option value="client">Client</option><option value="recruiter">Recruiter</option></select></div>' : ""}
            <button class="btn primary" type="submit">${registering ? "Create Account" : "Log In"}</button>
            <p class="form-message" id="authMessage"></p>
            <button class="btn secondary" id="authSwitch" type="button">${registering ? "Already have an account? Log in" : "Create an account"}</button>
        </form>`);
    document.getElementById("authSwitch").onclick = () => openAuth(registering ? "login" : "register");
    document.getElementById("authForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        const message = document.getElementById("authMessage");
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            const result = await apiRequest(registering ? "/register" : "/login", data, false);
            saveAuthSession(result);
            message.textContent = registering ? "Account created and signed in." : "You are now signed in.";
            message.style.color = "#15803d";
            form.querySelectorAll("input,select,button").forEach(element => element.disabled = true);
            setTimeout(closeModal, 1200);
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#dc2626";
            button.disabled = false;
        }
    });
}

function openSignup() {
    openAuth("register");
}

const navSignup = document.getElementById("navSignup");

function updateAuth() {
    navSignup.textContent = user ? "Hi, " + user.name.split(" ")[0] : "Sign Up";
}

function openAccount() {
    openModal(`<h3>${user.name}</h3><p class="sub">${user.type} &middot; ${user.email}</p>
        <p>You are signed in. Your details are pre-filled on applications, hire requests and messages.</p>
        <div class="modal-actions"><button class="btn secondary" id="logoutBtn">Log Out</button></div>`);
    document.getElementById("logoutBtn").onclick = () => {
        user = null;
        sessionStorage.removeItem("zonke_token");
        store.set("user", null);
        updateAuth();
        closeModal();
    };
}

navSignup.addEventListener("click", () => { nav.classList.remove("active"); user ? openAccount() : openSignup(); });
updateAuth();

/* ================= APPLY ================= */

document.getElementById("jobGrid").addEventListener("click", e => {
    const btn = e.target.closest(".apply-btn");
    if (!btn) return;
    const card = btn.closest(".job-card");
    const title = card.querySelector("h3").textContent;
    const company = card.querySelector(".company").textContent;
    const info = card.querySelector(".job-info").innerText.replace(/\n/g, "  ");
    const jobId = card.dataset.jobId;
    formModal("Apply: " + title, company + " &middot; " + info,
        `<div class="form-group"><label>Proposed amount (R)</label><input name="proposed_amount" type="number" min="1" required></div>
         <div class="form-group"><label>Why are you a good fit?</label><textarea name="cover_letter" rows="4" required></textarea></div>`,
        "Submit Application", "Application saved for " + title + "!", async form => {
            if (!jobId) throw new Error("This sample listing is not stored in the database, so it cannot accept applications yet.");
            await apiRequest("/proposals", {
                job_id: Number(jobId),
                proposed_amount: Number(form.elements.proposed_amount.value),
                cover_letter: form.elements.cover_letter.value
            });
        });
});


/* ================= FREELANCER PROFILES ================= */

const grid = document.getElementById("freelancerGrid");

function freelancerPool() {
    return [...dbFreelancers.map(normalizeFreelancer), ...freelancers];
}

function renderFreelancers() {
    const list = freelancerPool();
    grid.innerHTML = list.map((f, i) => `
    <article class="profile-card" data-i="${i}">
        <div class="avatar">${initials(f.name)}</div>
        <h3>${f.name}</h3>
        <p class="role">${f.role}</p>
        <p class="rating">★★★★★ ${f.rating}</p>
        <p>${f.bio}</p>
        <strong>${f.rate}</strong>
        <button class="btn primary hire-btn" data-i="${i}">View Profile</button>
    </article>`).join("");
}
renderFreelancers();
var fpager = smartList(grid, ".profile-card", 6, "Search freelancers by name, role or skill…");

function openProfile(i) {
    const list = freelancerPool();
    const f = list[i];
    if (!f) return;
    openModal(`
        <div class="avatar">${initials(f.name)}</div>
        <h3>${f.name}</h3>
        <p class="sub">${f.role} &middot; ${f.location}</p>
        <p class="rating">★★★★★ ${f.rating} &nbsp;|&nbsp; ${f.projects}</p>
        <p>${f.bio}</p>
        <div class="chips">${f.skills.map(s => `<span class="chip">${s}</span>`).join("")}</div>
        <p><strong>${f.rate}</strong></p>
        <div class="modal-actions">
            <button class="btn primary" id="hireNow">Hire Now</button>
            <button class="btn secondary" id="msgFl">Send Message</button>
        </div>`);
    document.getElementById("hireNow").onclick = () => formModal("Hire " + f.name, f.role + " &middot; " + f.rate,
        `<div class="form-group"><label>Project details</label><textarea name="project_details" rows="4" required></textarea></div>`,
        "Send Hire Request", "Hire request saved for " + f.name + "!", async form => {
            if (!f.freelancer_id) throw new Error("This sample profile is not stored in the database, so it cannot receive a request yet.");
            await apiRequest("/hire-requests", {
                freelancer_id: Number(f.freelancer_id),
                project_details: form.elements.project_details.value
            });
        });
    document.getElementById("msgFl").onclick = () => formModal("Message " + f.name, f.role,
        `<div class="form-group"><label>Message</label><textarea name="body" rows="4" required></textarea></div>`,
        "Send Message", "Message saved!", async form => {
            if (!f.user_id) throw new Error("This sample profile is not stored in the database, so it cannot receive a message yet.");
            await apiRequest("/messages", { recipient_id: Number(f.user_id), body: form.elements.body.value });
        });
}

grid.addEventListener("click", e => {
    const card = e.target.closest(".profile-card");
    if (card) openProfile(Number(card.dataset.i));
});

async function loadDatabaseFreelancers() {
    try {
        const response = await fetch("http://localhost:3001/api/freelancers");
        if (!response.ok) throw new Error("Freelancers API request failed");
        const rows = await response.json();
        dbFreelancers = Array.isArray(rows) ? rows : [];
        renderFreelancers();
        if (fpager) fpager.refresh(true);
    } catch (error) {
        console.warn("Database freelancers unavailable:", error.message);
    }
}


/* ================= BLOG ================= */

const blogGrid = document.getElementById("blogGrid");

function renderBlogPosts() {
    const list = [...dbPosts.map(normalizePost), ...posts];
    blogGrid.innerHTML = list.map((p, i) => `
    <article class="blog-card" data-i="${i}">
        <img src="${p.img}" alt="${p.title}" style="object-position:${p.pos}">
        <div class="blog-overlay">
            <h3>${p.title}</h3>
            <span class="blog-date">${p.date}</span>
        </div>
    </article>`).join("");
    smartList(blogGrid, ".blog-card", 6, "Search articles…");
}

renderBlogPosts();

blogGrid.addEventListener("click", e => {
    const card = e.target.closest(".blog-card");
    if (!card) return;
    const list = [...dbPosts.map(normalizePost), ...posts];
    const p = list[Number(card.dataset.i)];
    if (!p) return;
    openModal(`<img class="modal-img" src="${p.img}" alt="${p.title}">
        <h3>${p.title}</h3><p class="sub">${p.date}</p>${p.text.map(t => `<p>${t}</p>`).join("")}`);
});

async function loadDatabaseBlogPosts() {
    try {
        const response = await fetch("http://localhost:3001/api/blog");
        if (!response.ok) throw new Error("Blog API request failed");
        const rows = await response.json();
        dbPosts = Array.isArray(rows) ? rows : [];
        renderBlogPosts();
    } catch (error) {
        console.warn("Database blog posts unavailable:", error.message);
    }
}


/* ================= DEPARTMENTS ================= */

document.querySelectorAll(".dept-card").forEach(card => {
    card.addEventListener("click", () => {
        categorySelect.value = card.dataset.dept;
        filterJobs();
    });
});


/* ================= BOUNTIES ================= */

function bindBountyButtons() {
    document.querySelectorAll(".bounty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".bounty-card");
            const title = card.querySelector("h3").textContent;
            formModal("Submit: " + title, card.querySelector(".bounty-details span").textContent,
                '<div class="form-group"><label>Link to your solution</label><input name="solution_url" type="url" placeholder="https://" required></div>',
                "Submit Solution", "Solution saved to the database.", async form => {
                    if (!card.dataset.bountyId) throw new Error("This sample bounty is not stored in the database yet.");
                    await apiRequest("/bounty-submissions", {
                        bounty_id: Number(card.dataset.bountyId),
                        solution_url: form.elements.solution_url.value
                    });
                });
        });
    });
}

bindBountyButtons();

function renderBounties(list) {
    const grid = document.querySelector(".bounty-grid");
    if (!grid || !list.length) return;
    grid.innerHTML = list.map((bounty) => `
        <article class="bounty-card" data-bounty-id="${Number(bounty.bounty_id) || ""}">
            <span class="tag">${esc(bounty.tag || "General")}</span>
            <h3>${esc(bounty.title)}</h3>
            <p>${esc(bounty.description)}</p>
            <div class="bounty-details">
                <span>💰 Reward: ${esc(bounty.reward)}</span>
                <span>⚡ Difficulty: ${esc(bounty.difficulty)}</span>
                <span>👥 ${esc(bounty.submissions)}</span>
                <span>📅 Deadline: ${esc(bounty.deadline)}</span>
            </div>
            <button class="btn primary bounty-btn">Submit Solution</button>
        </article>
    `).join("");
    bindBountyButtons();
}

async function loadDatabaseBounties() {
    try {
        const response = await fetch("http://localhost:3001/api/bounties");
        if (!response.ok) throw new Error("Bounties API request failed");
        const rows = await response.json();
        dbBounties = Array.isArray(rows) ? rows.map(normalizeBounty) : [];
        renderBounties(dbBounties.length ? dbBounties : []);
    } catch (error) {
        console.warn("Database bounties unavailable:", error.message);
    }
}


/* ================= POST JOB FORM (adds a live job card) ================= */

const postJobForm = document.getElementById("postJobForm");
const jobMessage = document.getElementById("jobMessage");
const jobGrid = document.getElementById("jobGrid");
const jobLoadStatus = document.getElementById("jobLoadStatus");

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function addJobCard(j) {
    jobGrid.insertAdjacentHTML("afterbegin", `
        <article class="job-card" data-category="${esc(j.category)}">
            <div class="job-top"><span class="tag">${esc(j.category[0].toUpperCase() + j.category.slice(1))}</span><span class="status">Open</span></div>
            <h3>${esc(j.title)}</h3>
            <p class="company">${esc(j.company)}</p>
            <p>${esc(j.desc)}</p>
            <div class="job-info"><span>📍 Remote</span><span>💰 R${esc(Number(j.budget).toLocaleString("en-ZA"))}</span><span>📅 ${esc(j.deadline)}</span></div>
            <p class="skills">New listing</p>
            <button class="btn primary apply-btn">Apply Now</button>
        </article>`);
}

jobGrid.innerHTML = "";
savedJobs.forEach(addJobCard);

var jobPager = makePager({ grid: jobGrid, sel: ".job-card", per: 6, bar: (jobGrid.insertAdjacentHTML("afterend", '<div class="pagination"></div>'), jobGrid.nextElementSibling),
    test: card => card.textContent.toLowerCase().includes(searchInput.value.toLowerCase()) &&
        (categorySelect.value === "all" || card.dataset.category === categorySelect.value) });

function addDatabaseJobCard(job) {
    const rawCategory = String(job.category || "other").toLowerCase();
    const categoryAliases = {
        "web-development": "development",
        "software-development": "development",
        "cyber-security": "cybersecurity",
        "digital-marketing": "marketing",
        "graphic-design": "design",
        "ui-ux-design": "design"
    };
    const category = categoryAliases[rawCategory] || rawCategory;
    const categoryLabel = rawCategory.replace(/[-_]+/g, " ").replace(/\\b\\w/g, letter => letter.toUpperCase());
    const budgetMin = Number(job.budget_min);
    const budgetMax = Number(job.budget_max);
    const budget = job.budget_min != null && job.budget_max != null
        ? `R${budgetMin.toLocaleString("en-ZA")} - R${budgetMax.toLocaleString("en-ZA")}`
        : job.budget_max != null
            ? `Up to R${budgetMax.toLocaleString("en-ZA")}`
            : job.budget_min != null
                ? `From R${budgetMin.toLocaleString("en-ZA")}`
                : "Budget not specified";
    const deadline = job.deadline
        ? new Date(`${String(job.deadline).slice(0, 10)}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
        : "No deadline";

    jobGrid.insertAdjacentHTML("beforeend", `
        <article class="job-card database-job-card" data-job-id="${Number(job.job_id)}" data-category="${esc(category)}">
            <div class="job-top"><span class="tag">${esc(categoryLabel)}</span><span class="status">Open</span></div>
            <h3>${esc(job.title)}</h3>
            <p class="company">${esc(job.poster_name || "Zonke Client")}</p>
            <p>${esc(job.description || "")}</p>
            <div class="job-info"><span>📍 ${esc(job.location || "Remote")}</span><span>💰 ${esc(budget)}</span><span>📅 ${esc(deadline)}</span></div>
            <p class="skills">${esc(job.required_skills || "No specific skills listed")}</p>
            <button class="btn primary apply-btn">Apply Now</button>
        </article>`);
}

async function loadDatabaseJobs() {
    try {
        const response = await fetch("http://localhost:3001/api/jobs");
        if (!response.ok) throw new Error("Jobs API request failed");
        const jobs = await response.json();
        jobGrid.querySelectorAll(".database-job-card").forEach(card => card.remove());
        jobs.forEach(addDatabaseJobCard);
        jobLoadStatus.textContent = jobs.length || savedJobs.length
            ? ""
            : "No open jobs were returned by the database.";
    } catch (error) {
        jobLoadStatus.textContent = "Database jobs are unavailable. Start the API to load jobs from the database.";
    }
    jobPager.refresh(true);
}

loadDatabaseJobs();
loadDatabaseFreelancers();
loadDatabaseBlogPosts();
loadDatabaseBounties();

postJobForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const fields = postJobForm.elements;
    const token = sessionStorage.getItem("zonke_token");

    if (!token) {
        jobMessage.textContent = "Please log in before posting a job.";
        jobMessage.style.color = "#dc2626";
        return;
    }

    const amount = Number(fields[2].value);
    const job = {
        title: fields[0].value.trim(),
        category: fields[1].value.trim().toLowerCase(),
        budget_min: amount,
        budget_max: amount,
        deadline: fields[3].value,
        description: fields[4].value.trim(),
        location: "Remote"
    };

    try {
        const response = await fetch("http://localhost:3001/api/jobs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(job)
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not post the job.");
        }

        postJobForm.reset();
        await loadDatabaseJobs();
        filterJobs();
        jobMessage.textContent = "Your job was saved to the database.";
        jobMessage.style.color = "#15803d";
        setTimeout(() => document.getElementById("jobs").scrollIntoView(), 700);
    } catch (error) {
        jobMessage.textContent = error.message || "Could not connect to the API.";
        jobMessage.style.color = "#dc2626";
    }
});


/* ================= FREELANCER SIGN UP (adds a live profile) ================= */

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

    signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const f = signupForm.elements;
    try {
        const result = await apiRequest("/register", {
            full_name: f[0].value,
            email: f[1].value,
            password: f[2].value,
            role: "freelancer",
            hourly_rate: f[3].value || null,
            skills: f[4].value,
            portfolio_url: f[5].value
        }, false);
        saveAuthSession(result);
        signupForm.reset();
        await loadDatabaseFreelancers();
        signupMessage.textContent = "Your profile was saved to the database.";
        signupMessage.style.color = "#15803d";
    } catch (error) {
        signupMessage.textContent = error.message;
        signupMessage.style.color = "#dc2626";
    }
});


/* ================= PAYMENT ================= */

const paymentForm =
    document.getElementById("paymentForm");

const paymentMessage =
    document.getElementById("paymentMessage");


async function loadPaymentProjects() {
    const projectSelect = document.getElementById("paymentProject");
    const token = sessionStorage.getItem("zonke_token");
    projectSelect.innerHTML = '<option value="">Select a project</option>';
    if (!token) return;
    if (!user || user.type !== "client") {
        projectSelect.innerHTML = '<option value="">Client account required</option>';
        return;
    }
    try {
        const response = await fetch("http://localhost:3001/api/projects/mine", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const projects = await response.json();
        if (!response.ok) throw new Error(projects.error || "Could not load projects");
        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project.project_id;
            option.textContent = `${project.title} (#${project.project_id}) - R${Number(project.agreed_amount).toLocaleString("en-ZA")}`;
            projectSelect.append(option);
        });
    } catch (error) {
        paymentMessage.textContent = error.message;
        paymentMessage.style.color = "#dc2626";
    }
}

loadPaymentProjects();

paymentForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const project_id = Number(document.getElementById("paymentProject").value);
    const amount = Number(document.getElementById("paymentAmount").value);
    const method = document.getElementById("paymentMethod").value;
    if (!project_id || !Number.isFinite(amount) || amount <= 0 || !method) {
        paymentMessage.textContent = "Select a project, payment method, and valid amount.";
        paymentMessage.style.color = "#dc2626";
        return;
    }
    try {
        const result = await apiRequest("/payments", { project_id, amount, method });
        paymentMessage.textContent = `Payment request #${result.paymentId} is pending. No money has been charged.`;
        paymentMessage.style.color = "#15803d";
    } catch (error) {
        paymentMessage.textContent = error.message;
        paymentMessage.style.color = "#dc2626";
    }
});


/* ================= CONTACT FORM ================= */

const contactForm =
    document.getElementById("contactForm");

const contactMessage =
    document.getElementById("contactMessage");


contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const fields = contactForm.elements;
    try {
        await apiRequest("/contact", {
            full_name: fields[0].value,
            email: fields[1].value,
            subject: fields[2].value,
            message: fields[3].value
        }, false);
        contactMessage.textContent = "Your message was saved. Thank you for contacting us.";
        contactMessage.style.color = "#15803d";
        contactForm.reset();
    } catch (error) {
        contactMessage.textContent = error.message;
        contactMessage.style.color = "#dc2626";
    }
});


/* ================= FILE NAME ================= */

const jobFile =
    document.getElementById("jobFile");


if (jobFile) {

    jobFile.addEventListener("change", function () {

        if (jobFile.files.length > 0) {

            console.log(
                "Selected file:",
                jobFile.files[0].name
            );

        }

    });

}


/* ================= CURRENT YEAR ================= */

document.getElementById("year").textContent =
    new Date().getFullYear();


/* ================= CONSOLE MESSAGE ================= */

console.log(
    "Zonke.me frontend loaded successfully."
);