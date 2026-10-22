import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { cfg } from "./firebase-config.js";


const configured = !cfg.apiKey.startsWith("SUA");
let auth, db;
if (configured) { const app = initializeApp(cfg); auth = getAuth(app); db = getFirestore(app); }

const WA = "5534996514968";
const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const money = n => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const num = v => parseFloat(String(v).replace(/\./g, "").replace(",", ".")) || 0;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

$("#wa-top").href = $("#wa-fab").href = waLink("Olá, João! Vim pelo site da Krypton Ops e gostaria de mais informações.");

let user = null, P = [], C = [], F = [], unsubs = [], charts = null;
const SAMPLE = [
  { name: "Auditoria de código", price: 1500, desc: "Revisão completa do código-fonte com relatório de vulnerabilidades e plano de correção." },
  { name: "Hardening + WAF", price: 2200, desc: "Configuração segura de servidor, cabeçalhos HTTP e firewall de aplicação." },
  { name: "Backup isolado", price: 490, desc: "Cópias criptografadas e armazenadas fora do ambiente principal, com restauração testada." }
];

/* ---------- ROTAS ---------- */
function route() {
  const r = location.hash.replace("#/", "");
  const page = r === "produtos" ? "produtos" : r === "krypton-admin" ? (user ? "admin" : "login") : "home";
  $$("[data-page]").forEach(s => s.classList.toggle("hidden", s.dataset.page !== page));
  $$("[data-nav]").forEach(a => a.classList.toggle("text-emerald-400", a.dataset.nav === page));
  $("#wa-fab").classList.toggle("hidden", page === "admin" || page === "login");
  if (page === "admin") initCharts();
  scrollTo(0, 0);
}
addEventListener("hashchange", route);
$$('a[href="#contato"]').forEach(a => a.addEventListener("click", e => { e.preventDefault(); $("#contato").scrollIntoView({ behavior: "smooth" }); }));

/* ---------- LOJA PÚBLICA ---------- */
function renderShop() {
  const box = $("#shop"); box.replaceChildren();
  const list = configured ? P : SAMPLE;
  if (!list.length) { box.append(el("p", "text-slate-400", "Novos produtos em breve.")); return; }
  list.forEach(p => {
    const c = el("article", "card flex flex-col");
    c.append(el("h3", "text-lg font-bold text-white", p.name), el("p", "mt-2 flex-1 text-sm text-slate-400", p.desc || ""), el("p", "mt-4 text-2xl font-extrabold text-emerald-400", money(p.price)));
    const a = el("a", "btn mt-4", "Pedir no WhatsApp"); a.target = "_blank"; a.rel = "noopener noreferrer";
    a.href = waLink(`Olá, João! Tenho interesse no produto "${p.name}" (${money(p.price)}).`);
    c.append(a); box.append(c);
  });
}

/* ---------- LISTAS DO ADMIN ---------- */
function rows(box, items, build, col) {
  box.replaceChildren();
  if (!items.length) { box.append(el("p", "py-4 text-sm text-slate-500", "Nenhum registro ainda.")); return; }
  items.forEach(it => {
    const r = el("div", "flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5");
    const info = el("div", "min-w-0"); build(info, it);
    const del = el("button", "btn2 !px-3 !py-1.5 !text-xs text-red-300", "Excluir");
    del.addEventListener("click", async () => { if (confirm("Excluir este registro?")) await deleteDoc(doc(db, col, it.id)); });
    r.append(info, del); box.append(r);
  });
}
const renderProd = () => rows($("#t-prod"), P, (i, p) => { i.append(el("p", "truncate font-semibold text-white", p.name), el("p", "text-xs text-slate-400", money(p.price))); }, "products");
function renderCli() {
  const q = $("#c-search").value.trim().toLowerCase();
  const list = C.filter(c => [c.name, c.email, c.phone, c.notes].join(" ").toLowerCase().includes(q));
  $("#c-count").textContent = `(${list.length})`;
  rows($("#t-cli"), list, (i, c) => {
    i.append(el("p", "truncate font-semibold text-white", c.name), el("p", "truncate text-xs text-slate-400", [c.phone, c.email].filter(Boolean).join(" · ")));
    if (c.notes) i.append(el("p", "truncate text-xs text-slate-500", c.notes));
  }, "clients");
}

/* ---------- FINANCEIRO + GRÁFICOS ---------- */
function initCharts() {
  if (charts || !window.Chart) return;
  Chart.defaults.color = "#94a3b8";
  const mk = (id, type, horizontal) => new Chart($(id), {
    type, data: { labels: [], datasets: [{ data: [], borderRadius: 6, backgroundColor: ["#a78bfa", "#22d3ee", "#f472b6", "#facc15", "#34d399", "#fb7185"] }] },
    options: { maintainAspectRatio: false, indexAxis: horizontal ? "y" : "x", plugins: { legend: { display: type === "doughnut" } },
      scales: type === "doughnut" ? {} : { x: { grid: { color: "#1e293b" } }, y: { grid: { color: "#1e293b" } } } }
  });
  charts = { a: mk("#c1", "bar"), b: mk("#c2", "doughnut"), c: mk("#c3", "bar", true) };
  renderFin();
}
function setChart(ch, labels, data) { ch.data.labels = labels; ch.data.datasets[0].data = data; ch.update(); }
function renderFin() {
  const sum = t => F.filter(f => f.tipo === t).reduce((s, f) => s + f.valor, 0);
  const rec = sum("Receita"), des = sum("Despesa"), div = sum("Dívida"), inv = sum("Investimento");
  $("#k-bruto").textContent = money(rec); $("#k-div").textContent = money(div); $("#k-liq").textContent = money(rec - des - div);
  const cats = {};
  F.filter(f => f.tipo === "Investimento").forEach(f => { const c = cats[f.categoria] ||= { v: 0, r: 0, n: 0 }; c.v += f.valor; c.r += f.retorno || 0; c.n++; });
  const names = Object.keys(cats), roi = names.map(n => +(cats[n].r / cats[n].n).toFixed(2));
  $("#k-best").textContent = names.length ? names[roi.indexOf(Math.max(...roi))] : "—";
  rows($("#t-fin"), F.slice(0, 8), (i, f) => {
    i.append(el("p", "truncate font-semibold text-white", `${f.tipo}: ${f.categoria}`), el("p", "text-xs text-slate-400", money(f.valor) + (f.tipo === "Investimento" ? ` · retorno de ${f.retorno || 0}%` : "")));
  }, "finance");
  if (!charts) return;
  setChart(charts.a, ["Receita", "Despesas", "Dívidas", "Investido"], [rec, des, div, inv]);
  setChart(charts.b, names, names.map(n => cats[n].v));
  setChart(charts.c, names, roi);
}

/* ---------- FIREBASE: TEMPO REAL ---------- */
const watch = (name, fn) => onSnapshot(query(collection(db, name), orderBy("createdAt", "desc")),
  s => fn(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.error(name, e));
if (configured) {
  watch("products", l => { P = l; renderShop(); renderProd(); });
  onAuthStateChanged(auth, u => {
    user = u; unsubs.forEach(f => f()); unsubs = [];
    if (u) unsubs = [watch("clients", l => { C = l; renderCli(); }), watch("finance", l => { F = l; renderFin(); })];
    else { C = []; F = []; }
    route();
  });
}
renderShop(); route();

/* ---------- FORMULÁRIOS ---------- */
async function save(col, data) { await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() }); }
function flash(node, text, ok) { node.textContent = text; node.className = `mt-3 text-center text-sm ${ok ? "text-emerald-400" : "text-red-400"}`; setTimeout(() => node.classList.add("hidden"), 5000); }

$("#lead-form").addEventListener("submit", async e => {
  e.preventDefault(); const msg = $("#l-msg");
  if ($("#l-site").value) return; // proteção anti-robô
  if (!configured) return flash(msg, "Configure o Firebase para receber solicitações.", false);
  try {
    if (Date.now() - Number(localStorage.getItem("lastLead") || 0) < 30000) return flash(msg, "Aguarde alguns segundos antes de enviar novamente.", false);
  } catch (_) {}
  try {
    await save("clients", { name: $("#l-name").value.trim(), phone: $("#l-phone").value.trim(), email: $("#l-email").value.trim(), notes: "Lead do site: " + $("#l-svc").value });
    try { localStorage.setItem("lastLead", Date.now()); } catch (_) {}
    e.target.reset(); flash(msg, "Solicitação enviada com sucesso! Entraremos em contato em breve.", true);
  } catch (err) { console.error(err); flash(msg, "Não foi possível enviar. Tente novamente ou use o WhatsApp.", false); }
});

$("#login-form").addEventListener("submit", async e => {
  e.preventDefault(); const err = $("#a-err"); err.classList.add("hidden");
  if (!configured) { err.textContent = "O Firebase ainda não foi configurado."; err.classList.remove("hidden"); return; }
  try { await signInWithEmailAndPassword(auth, $("#a-mail").value.trim(), $("#a-pass").value); e.target.reset(); }
  catch (_) { err.textContent = "E-mail ou senha inválidos."; err.classList.remove("hidden"); }
});
$("#logout").addEventListener("click", async () => { await signOut(auth); location.hash = "#/"; });

$("#f-prod").addEventListener("submit", async e => {
  e.preventDefault();
  await save("products", { name: $("#p-name").value.trim(), price: num($("#p-price").value), desc: $("#p-desc").value.trim() }); e.target.reset();
});
$("#f-cli").addEventListener("submit", async e => {
  e.preventDefault();
  await save("clients", { name: $("#c-name").value.trim(), phone: $("#c-phone").value.trim(), email: $("#c-mail").value.trim(), notes: $("#c-note").value.trim() }); e.target.reset();
});
$("#f-fin").addEventListener("submit", async e => {
  e.preventDefault();
  await save("finance", { tipo: $("#f-tipo").value, categoria: $("#f-cat").value.trim(), valor: num($("#f-val").value), retorno: num($("#f-ret").value) }); e.target.reset();
});
$("#c-search").addEventListener("input", renderCli);

$$(".tab").forEach(b => b.addEventListener("click", () => {
  $$(".tab").forEach(t => t.classList.toggle("on", t === b));
  $$("[data-tabc]").forEach(s => s.classList.toggle("show", s.dataset.tabc === b.dataset.tab));
}));
