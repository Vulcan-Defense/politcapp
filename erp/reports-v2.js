const node = (tag, className, text) => { const item = document.createElement(tag); if (className) item.className = className; if (text !== undefined) item.textContent = text; return item; };
const num = value => Number(value || 0).toLocaleString("pt-BR");
const money = value => (Number(value || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS = { aberta: "Aberta", triagem: "Triagem", em_andamento: "Em andamento", aguardando: "Aguardando", resolvida: "Resolvida", arquivada: "Arquivada" };
const CHANNELS = { presencial: "Presencial", telefone: "Telefone", whatsapp: "WhatsApp", email: "E-mail", rede_social: "Rede social" };
const STATUS_STEPS = ["pendente", "pago", "recebido", "atrasado", "cancelado"];
const PALETTE = ["#4f8cff", "#8c6cff", "#28c8a0", "#ffb54a", "#ef6688", "#60708c", "#3ec6e8", "#c084fc", "#f97316", "#a3e635"];
const empty = text => node("p", "report-empty", text);

function kpi(label, value, detail, tone = "info") { const card = node("article", `report-kpi ${tone}`); card.append(node("small", "", label), node("strong", "", value), node("span", "", detail)); return card; }

function donut(title, rows, labelKey = "status", subtotal = "") {
  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0), card = node("article", "report-card donut-card"), head = node("div", "report-card-head");
  head.append(node("div", "", title), node("small", "", `${subtotal || num(total)} total`)); card.append(head);
  const body = node("div", "donut-layout"), chart = node("div", "donut-chart"), center = node("span");
  center.append(node("strong", "", num(total)), node("small", "", "registros")); chart.append(center);
  if (total) { let cursor = 0; const stops = rows.map((row, i) => { const start = cursor; cursor += Number(row.total) / total * 100; return `${PALETTE[i % PALETTE.length]} ${start}% ${cursor}%`; }); chart.style.background = `conic-gradient(${stops.join(",")})`; }
  const legend = node("div", "chart-legend"); rows.forEach((row, i) => { const item = node("div"), label = node("span"); label.append(node("i", ""), document.createTextNode(STATUS[row.status] || CHANNELS[row[labelKey + "_key"]] || String(row[labelKey] || row.label || "Sem valor").replaceAll("_", " "))); label.querySelector("i").style.background = PALETTE[i % PALETTE.length]; item.append(label, node("strong", "", num(row.total))); legend.append(item); });
  if (!rows.length) legend.append(empty("Sem dados para este gráfico.")); body.append(chart, legend); card.append(body); return card;
}

function bars(title, rows, labelKey = "label") {
  const card = node("article", "report-card bar-card"), head = node("div", "report-card-head"); head.append(node("div", "", title), node("small", "", "Ranking")); card.append(head);
  const max = Math.max(1, ...rows.map(row => Number(row.total || 0))), list = node("div", "horizontal-bars");
  rows.forEach((row, i) => { const line = node("div", "bar-line"), label = node("div"); label.append(node("span", "", row[labelKey] || "Geral"), node("strong", "", num(row.total))); const track = node("div", "bar-track"), fill = node("i"); fill.style.width = `${Number(row.total || 0) / max * 100}%`; fill.style.background = PALETTE[i % PALETTE.length]; track.append(fill); line.append(label, track); list.append(line); });
  if (!rows.length) list.append(empty("Ainda não há dados para comparar.")); card.append(list); return card;
}

function trend(rows) {
  const card = node("article", "report-card trend-card"), head = node("div", "report-card-head"); head.append(node("div", "", "Evolução das demandas"), node("small", "", "Últimos 6 meses")); card.append(head);
  const values = new Map(rows.map(row => [row.label, Number(row.total || 0)])), months = [], today = new Date();
  for (let offset = 5; offset >= 0; offset--) { const date = new Date(today.getFullYear(), today.getMonth() - offset, 1), label = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; months.push({ label, value: values.get(key) || 0 }); }
  const max = Math.max(1, ...months.map(m => m.value)), chart = node("div", "trend-bars");
  months.forEach(m => { const column = node("div", "trend-column"), value = node("span", "", num(m.value)), bar = node("i"); bar.style.height = `${Math.max(4, m.value / max * 100)}%`; bar.title = `${m.value} demanda(s)`; column.append(value, bar, node("small", "", m.label)); chart.append(column); });
  card.append(chart); return card;
}

function financeCard(rows) {
  const card = node("article", "report-card finance-report-card"), head = node("div", "report-card-head"); head.append(node("div", "", "Resultado financeiro"), node("small", "", "Por situação")); card.append(head);
  const flow = rows.reduce((acc, row) => { const bucket = row.type === "receber" ? "receber" : "pagar"; acc[bucket] += Number(row.total || 0); return acc; }, { receber: 0, pagar: 0 }), balance = flow.receber - flow.pagar;
  const values = node("div", "finance-report-values"); [["A receber", flow.receber, "income"], ["A pagar", flow.pagar, "expense"], ["Saldo projetado", balance, balance >= 0 ? "income" : "expense"]].forEach(([label, value, tone]) => { const item = node("div"); item.append(node("small", "", label), node("strong", tone, money(value))); values.append(item); }); card.append(values);
  const list = node("div", "finance-report-list"); const byStatus = new Map(rows.map(row => [row.status, 0])); rows.forEach(row => byStatus.set(row.status, byStatus.get(row.status) + Number(row.total || 0))); STATUS_STEPS.forEach(status => { const value = byStatus.get(status) || 0; const row = node("div"), label = node("span"); label.append(node("i", ""), document.createTextNode(String(status || "sem status").replaceAll("_", " "))); label.querySelector("i").style.background = value > 0 ? (status === "pago" || status === "recebido" ? "#28c8a0" : status === "atrasado" ? "#ef6688" : "#ffb54a") : "#2a3750"; row.append(label, node("strong", "", money(value))); list.append(row); }); card.append(list); return card;
}

function kpiRow(k) {
  const section = node("section", "report-kpis"); if (!k) return section;
  section.append(kpi("Demandas totais", num(k.totalDemands), "Cadastradas", "info"), kpi("Demandas abertas", num(k.openDemands), "Fila ativa", "attention"), kpi("Demandas resolvidas", num(k.resolvedDemands), k.totalDemands ? `${Math.round(k.resolvedDemands / (k.totalDemands || 1) * 100)}% de êxito` : "—", "good"), kpi("Cidadãos registrados", num(k.citizensTotal), "Base de relacionamento", "info"), kpi("Projetos ativos", num(k.activeProjects), "Entregas em andamento", "info"), kpi("Atendimentos hoje", num(k.servicesToday), "No dia atual", "good"), kpi("Compromissos futuros", num(k.upcomingEvents), "Na agenda", "attention"));
  return section;
}

export function renderReports({ view, data }) {
  view.replaceChildren(); const k = data.kpis || {};
  const hero = node("section", "report-hero"); hero.append(node("small", "", "RELATÓRIOS · POLITICAPP ERP"), node("h2", "", "Painel consolidado de indicadores."), node("p", "", "Demandas, relacionamento, território e finanças em uma visão executiva.")); view.append(hero);
  view.append(kpiRow(k));
  const top = node("section", "report-grid charts-report-grid"); top.append(donut("Demandas por situação", data.status || [], "status"), bars("Principais temas", data.categories || []), trend(data.trend || [])); view.append(top);
  const lower = node("section", "report-grid lower-report-grid"); lower.append(financeCard(data.finance || []), bars("Apenas atendimentos por canal", data.channels || [], "channel"), donut("Cobertura territorial", data.territories || [], "label", `${num(k.citizensTotal)} cidadãos`)); view.append(lower);
}