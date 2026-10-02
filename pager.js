/* Shared search + pagination helpers */
function makePager({ grid, sel, per, test, bar }) {
    let page = 1;
    const api = {
        refresh(reset) {
            if (reset) page = 1;
            const all = [...grid.querySelectorAll(sel)];
            const hits = all.filter(test);
            const pages = Math.max(1, Math.ceil(hits.length / per));
            page = Math.min(page, pages);
            all.forEach(e => e.style.display = "none");
            hits.slice((page - 1) * per, page * per).forEach(e => e.style.display = "");
            let h = "";
            if (!hits.length) h = '<p class="no-results">No results found. Try a different search.</p>';
            else if (pages > 1) {
                h = `<button class="page-btn" data-p="${page - 1}" ${page === 1 ? "disabled" : ""}>&lsaquo; Prev</button>`;
                for (let i = 1; i <= pages; i++) h += `<button class="page-btn ${i === page ? "active" : ""}" data-p="${i}">${i}</button>`;
                h += `<button class="page-btn" data-p="${page + 1}" ${page === pages ? "disabled" : ""}>Next &rsaquo;</button>`;
            }
            bar.innerHTML = h;
        }
    };
    bar.addEventListener("click", e => {
        const b = e.target.closest("[data-p]");
        if (!b || b.disabled) return;
        page = +b.dataset.p;
        api.refresh();
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    api.refresh();
    return api;
}

function smartList(grid, sel, per, placeholder, cats) {
    const opts = cats ? `<select><option value="all">All categories</option>${Object.entries(cats).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>` : "";
    grid.insertAdjacentHTML("beforebegin", `<div class="list-tools ${cats ? "" : "single"}"><input type="search" placeholder="${placeholder}">${opts}</div>`);
    grid.insertAdjacentHTML("afterend", '<div class="pagination"></div>');
    const q = grid.previousElementSibling.querySelector("input");
    const c = grid.previousElementSibling.querySelector("select");
    const p = makePager({ grid, sel, per, bar: grid.nextElementSibling,
        test: el => el.textContent.toLowerCase().includes(q.value.toLowerCase()) && (!c || c.value === "all" || el.dataset.category === c.value) });
    q.addEventListener("input", () => p.refresh(true));
    if (c) c.addEventListener("change", () => p.refresh(true));
    return p;
}
