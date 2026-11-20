/* =====================================================
   V7 BARBEARIA — CONFIGURAÇÃO (edite só esta parte)
   ===================================================== */

const CONFIG = {
    whatsapp: "5551999999999",          // DDI + DDD + número, só dígitos
    abre: "09:00",
    fecha: "20:00",
    passoMin: 30,                        // intervalo entre horários
    diasAbertos: [1, 2, 3, 4, 5, 6],     // 0 = domingo ... 6 = sábado
    diasMostrados: 14,                   // quantos dias abertos aparecem na escolha (a partir de hoje)
    // Para usar foto: foto: "img/carlos.jpg" (sem foto, aparece a inicial do nome)
    barbeiros: [
        { nome: "Carlos", foto: "", instagram: "carlos.v7" },   // instagram é opcional (sem o @)
        { nome: "Rafael", foto: "", instagram: "rafael.v7" },
        { nome: "Diego",  foto: "", instagram: "" }
    ],
    local: "V7 Barbearia",               // nome que aparece no evento do calendário
    endereco: "Rua Exemplo, 123 - Bairro, Cidade - UF",   // aparece no site, no calendário e no Maps
    instagram: "v7barbearia",            // sem o @
    pinPainel: "1234"                    // senha da Área do barbeiro
};

const SERVICOS = [
    { id: "corte",      nome: "Corte masculino", de: 39.90, preco: 25.90, duracao: 30 },
    { id: "barba",      nome: "Barba",           de: 29.90, preco: 19.90, duracao: 25 },
    { id: "combo",      nome: "Corte + barba",   de: 49.90, preco: 32.90, duracao: 60, destaque: true },
    { id: "acabamento", nome: "Acabamento",      de: 19.90, preco: 15.00, duracao: 10 }
];

/* =====================================================
   AUXILIARES
   ===================================================== */

const $ = (sel) => document.querySelector(sel);
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const paraMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const paraHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const isoData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dataBR = (iso) => iso.split("-").reverse().join("/");
const doISO = (iso) => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d); };
const diaSemana = (iso) => doISO(iso).toLocaleDateString("pt-BR", { weekday: "long" });
const servicoPorId = (id) => SERVICOS.find((s) => s.id === id);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nomesBarbeiros = CONFIG.barbeiros.map((b) => b.nome);

/* =====================================================
   ARMAZENAMENTO (localStorage — troque por API/Supabase depois)
   ===================================================== */

const CHAVE = "v7_agendamentos";
const CHAVE_CLIENTE = "v7_cliente";

function lerAgendamentos() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
}
function gravarAgendamentos(lista) {
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch { /* sem storage */ }
}
function lerCliente() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CLIENTE)) || {}; } catch { return {}; }
}
function gravarCliente(c) {
    try { localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(c)); } catch { /* sem storage */ }
}

/* =====================================================
   TEXTOS AUTOMÁTICOS
   ===================================================== */

const nomesDias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const textoDias = CONFIG.diasAbertos.length === 6 && !CONFIG.diasAbertos.includes(0)
    ? "Segunda a sábado"
    : CONFIG.diasAbertos.map((d) => nomesDias[d]).join(", ");
$("#info-funcionamento").textContent = `${textoDias}, ${CONFIG.abre} às ${CONFIG.fecha}`;
$("#ano").textContent = new Date().getFullYear();

const linkZap = (texto = "") => `https://wa.me/${CONFIG.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
$("#btn-whatsapp").href = linkZap("Olá! Gostaria de falar com a V7 Barbearia.");

// Endereço, Google Maps e Instagram
const linkMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.endereco)}`;
$("#info-endereco").textContent = CONFIG.endereco;
$("#link-mapa").href = linkMapa;
$("#como-chegar").href = linkMapa;
$("#endereco-confirmado").textContent = CONFIG.endereco;
$("#link-instagram").href = `https://instagram.com/${CONFIG.instagram}`;
$("#texto-instagram").textContent = `@${CONFIG.instagram}`;
$("#mapa-frame").src = `https://maps.google.com/maps?q=${encodeURIComponent(CONFIG.endereco)}&output=embed`;

/* =====================================================
   NAVEGAÇÃO ENTRE TELAS (#inicio / #sobre = home, #agendar = agendamento)
   ===================================================== */

const home = $("#home");
const telaAgendar = $("#agendar");

function rota() {
    const h = location.hash;
    const emAgendar = h === "#agendar";
    const jaEstava = !telaAgendar.hidden;

    home.hidden = emAgendar;
    telaAgendar.hidden = !emAgendar;
    document.body.classList.toggle("em-agendar", emAgendar);

    if (emAgendar) {
        if (!jaEstava) reiniciarFluxo();
        window.scrollTo(0, 0);
        return;
    }
    let alvo = null;
    try { alvo = h.length > 1 ? document.querySelector(h) : null; } catch { /* hash inválido */ }
    alvo ? alvo.scrollIntoView() : window.scrollTo(0, 0);
}
window.addEventListener("hashchange", rota);

/* =====================================================
   FLUXO DE AGENDAMENTO (5 etapas)
   ===================================================== */

const TITULOS = ["Escolha o profissional", "Escolha o serviço", "Escolha o dia e o horário", "Seus dados", "Tudo certo!"];
const estado = { etapa: 1, barbeiro: "", servicoId: "", data: "", hora: "" };
const hoje = new Date();

function irPara(n) {
    estado.etapa = n;
    document.querySelectorAll("[data-etapa]").forEach((s) => { s.hidden = Number(s.dataset.etapa) !== n; });
    $("#titulo-etapa").textContent = TITULOS[n - 1];
    $("#voltar").hidden = n === 5;
    $("#progresso").hidden = n === 5;
    document.querySelectorAll("#progresso i").forEach((i, k) => i.classList.toggle("ativo", k < n));

    if (n === 3) { renderDatas(); renderHorarios(); }
    if (n === 4) renderResumo();
    window.scrollTo(0, 0);
}

function reiniciarFluxo() {
    Object.assign(estado, { barbeiro: "", servicoId: "", data: "", hora: "" });
    irPara(1);
}

$("#voltar").addEventListener("click", () => {
    if (estado.etapa === 1) location.hash = "#inicio";
    else irPara(estado.etapa - 1);
});

/* ---- Etapa 1: profissional ---- */

const avatar = (b) => b.foto
    ? `<img class="avatar" src="${esc(b.foto)}" alt="${esc(b.nome)}">`
    : `<span class="avatar" aria-hidden="true">${esc(b.nome.charAt(0).toUpperCase())}</span>`;

$("#lista-barbeiros").innerHTML = [
    `<button type="button" class="barbeiro-card" data-barbeiro="">
        <span class="avatar" aria-hidden="true">★</span><strong>Sem preferência</strong><small>Primeiro disponível</small>
    </button>`,
    ...CONFIG.barbeiros.map((b) => `
    <button type="button" class="barbeiro-card" data-barbeiro="${esc(b.nome)}">
        ${avatar(b)}<strong>${esc(b.nome)}</strong><small>${b.instagram ? "@" + esc(b.instagram) : "Barbeiro"}</small>
    </button>`)
].join("");

$("#lista-barbeiros").addEventListener("click", (e) => {
    const card = e.target.closest("[data-barbeiro]");
    if (!card) return;
    estado.barbeiro = card.dataset.barbeiro;
    irPara(2);
});

/* ---- Etapa 2: serviço ---- */

$("#lista-servicos").innerHTML = SERVICOS.map((s) => `
    <button type="button" class="servico-item${s.destaque ? " destaque" : ""}" data-servico="${s.id}">
        <div>
            <strong>${s.nome}${s.destaque ? '<span class="servico-tag">Mais completo</span>' : ""}</strong>
            <small>${s.duracao} min</small>
        </div>
        <div class="preco"><s>${brl(s.de)}</s><b>${brl(s.preco)}</b></div>
    </button>`).join("");

$("#lista-servicos").addEventListener("click", (e) => {
    const item = e.target.closest("[data-servico]");
    if (!item) return;
    estado.servicoId = item.dataset.servico;
    estado.hora = "";
    irPara(3);
});

/* ---- Etapa 3: dia e horário (de hoje em diante) ---- */

function diasDisponiveis() {
    const dias = [];
    for (let i = 0; dias.length < CONFIG.diasMostrados && i < 60; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
        if (CONFIG.diasAbertos.includes(d.getDay())) dias.push(isoData(d));
    }
    return dias;
}

function renderDatas() {
    const dias = diasDisponiveis();
    if (!dias.includes(estado.data)) estado.data = dias[0];
    const hojeISO = isoData(hoje);

    $("#lista-datas").innerHTML = dias.map((iso) => {
        const d = doISO(iso);
        const rotulo = iso === hojeISO ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
        const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        return `<button type="button" class="data-chip${iso === estado.data ? " selecionado" : ""}" data-data="${iso}">
            <small>${rotulo}</small><strong>${d.getDate()}</strong><small>${mes}</small></button>`;
    }).join("");
}

$("#lista-datas").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-data]");
    if (!chip) return;
    estado.data = chip.dataset.data;
    estado.hora = "";
    renderDatas();
    renderHorarios();
});

function barbeiroLivre(data, inicio, duracao, preferido = "") {
    const fim = inicio + duracao;
    const ocupados = lerAgendamentos().filter((a) => a.data === data);
    const candidatos = preferido ? [preferido] : nomesBarbeiros;
    const livres = candidatos.filter((b) =>
        !ocupados.some((a) => a.barbeiro === b && inicio < a.fim && fim > a.inicio)
    );
    if (!livres.length) return null;
    // Distribui igualmente: escolhe o livre com menos atendimentos no dia
    const carga = (b) => ocupados.filter((a) => a.barbeiro === b).length;
    return livres.sort((x, y) => carga(x) - carga(y))[0];
}

function renderHorarios() {
    const box = $("#horarios");
    const s = servicoPorId(estado.servicoId);
    const agora = new Date();
    const ehHoje = estado.data === isoData(agora);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

    const botoes = [];
    for (let t = paraMin(CONFIG.abre); t + s.duracao <= paraMin(CONFIG.fecha); t += CONFIG.passoMin) {
        if (ehHoje && t <= minutosAgora) continue;
        const livre = barbeiroLivre(estado.data, t, s.duracao, estado.barbeiro);
        botoes.push(`<button type="button" class="horario-opcao" data-hora="${paraHHMM(t)}"${livre ? "" : ' disabled title="Horário esgotado"'}>${paraHHMM(t)}</button>`);
    }

    const temLivre = botoes.some((b) => !b.includes("disabled"));
    box.innerHTML = temLivre
        ? botoes.join("")
        : '<p class="horario-vazio">Sem horários disponíveis neste dia. Escolha outro dia acima.</p>';
}

$("#horarios").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hora]");
    if (!btn || btn.disabled) return;
    estado.hora = btn.dataset.hora;
    irPara(4);
});

/* ---- Etapa 4: resumo + dados ---- */

const inpNome = $("#nome");
const inpTel = $("#telefone");
const erro = $("#erro");

function renderResumo() {
    const s = servicoPorId(estado.servicoId);
    $("#resumo").innerHTML = `
        <div class="res-linha"><span>Profissional</span><strong>${esc(estado.barbeiro || "Primeiro disponível")}</strong></div>
        <div class="res-linha"><span>Serviço</span><strong>${s.nome}</strong></div>
        <div class="res-linha"><span>Data</span><strong>${diaSemana(estado.data)}, ${dataBR(estado.data)}</strong></div>
        <div class="res-linha"><span>Horário</span><strong>${estado.hora}</strong></div>
        <div class="res-linha total"><span>Valor</span><strong>${brl(s.preco)}</strong></div>`;

    const salvo = lerCliente();                 // lembra o cliente para a próxima vez
    if (!inpNome.value) inpNome.value = salvo.nome || "";
    if (!inpTel.value) inpTel.value = salvo.telefone || "";
    erro.textContent = "";
}

inpTel.addEventListener("input", () => {
    const n = inpTel.value.replace(/\D/g, "").slice(0, 11);
    inpTel.value = n.length > 6
        ? `(${n.slice(0, 2)}) ${n.slice(2, n.length > 10 ? 7 : 6)}-${n.slice(n.length > 10 ? 7 : 6)}`
        : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n;
});

$("#form-dados").addEventListener("submit", (e) => {
    e.preventDefault();

    const s = servicoPorId(estado.servicoId);
    const nome = inpNome.value.trim();
    const tel = inpTel.value.replace(/\D/g, "");

    if (nome.length < 2) return (erro.textContent = "Informe seu nome.");
    if (tel.length < 10) return (erro.textContent = "Informe um WhatsApp válido com DDD.");

    const inicio = paraMin(estado.hora);
    const barbeiro = barbeiroLivre(estado.data, inicio, s.duracao, estado.barbeiro);

    // Pode ter sido reservado por outra pessoa enquanto o cliente preenchia
    if (!barbeiro) {
        estado.hora = "";
        irPara(3);
        $("#horarios").insertAdjacentHTML("afterbegin", '<p class="horario-vazio">Esse horário acabou de ser reservado. Escolha outro.</p>');
        return;
    }

    const ag = { id: Date.now(), data: estado.data, inicio, fim: inicio + s.duracao, servico: s.id, barbeiro, nome, telefone: tel };
    gravarAgendamentos([...lerAgendamentos(), ag]);
    gravarCliente({ nome, telefone: inpTel.value });

    const dataTxt = `${diaSemana(ag.data)}, ${dataBR(ag.data)}`;
    $("#confirmacao-detalhes").innerHTML = `
        <li><span>Cliente:</span> ${esc(nome)}</li>
        <li><span>Serviço:</span> ${s.nome} (${brl(s.preco)})</li>
        <li><span>Data:</span> ${dataTxt}</li>
        <li><span>Horário:</span> ${estado.hora}</li>
        <li><span>Profissional:</span> ${esc(barbeiro)}</li>`;

    $("#confirmacao-whatsapp").href = linkZap(
        `Olá! Quero confirmar meu agendamento na V7 Barbearia:\n` +
        `Nome: ${nome}\nServiço: ${s.nome} (${brl(s.preco)})\n` +
        `Data: ${dataTxt}\nHorário: ${estado.hora}\nProfissional: ${barbeiro}`
    );

    prepararCalendario(ag);
    irPara(5);
});

/* =====================================================
   CALENDÁRIO DO CLIENTE (Google Agenda, iPhone e Android)
   ===================================================== */

const dtLocal = (iso, min) => iso.replaceAll("-", "") + "T" + paraHHMM(min).replace(":", "") + "00";

function dadosEvento(ag) {
    const s = servicoPorId(ag.servico);
    return {
        titulo: `${s.nome} — ${CONFIG.local}`,
        ini: dtLocal(ag.data, ag.inicio),
        fim: dtLocal(ag.data, ag.fim),
        desc: `Profissional: ${ag.barbeiro}\nValor: ${brl(s.preco)}`
    };
}

function linkGoogleAgenda(ag) {
    const ev = dadosEvento(ag);
    const p = new URLSearchParams({ action: "TEMPLATE", text: ev.titulo, dates: `${ev.ini}/${ev.fim}`, details: ev.desc, location: `${CONFIG.local}, ${CONFIG.endereco}` });
    return `https://calendar.google.com/calendar/render?${p}`;
}

function baixarICS(ag) {
    const ev = dadosEvento(ag);
    const t = (x) => x.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const carimbo = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const linhas = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//V7 Barbearia//Agendamento//PT-BR", "BEGIN:VEVENT",
        `UID:${ag.id}@v7barbearia`, `DTSTAMP:${carimbo}`, `DTSTART:${ev.ini}`, `DTEND:${ev.fim}`,
        `SUMMARY:${t(ev.titulo)}`, `DESCRIPTION:${t(ev.desc)}`, `LOCATION:${t(CONFIG.local + ", " + CONFIG.endereco)}`,
        "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Seu horário na V7 é daqui a 1 hora", "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
    ];
    const url = URL.createObjectURL(new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "agendamento-v7.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Um botão só: o site detecta o aparelho e usa o calendário certo.
// iPhone, iPad e Mac -> arquivo .ics (abre o app Calendário)
// Android e outros   -> Google Agenda
const ehApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
let agendamentoAtual = null;

function prepararCalendario(ag) { agendamentoAtual = ag; }

$("#cal-adicionar").addEventListener("click", () => {
    if (!agendamentoAtual) return;
    if (ehApple) baixarICS(agendamentoAtual);
    else window.open(linkGoogleAgenda(agendamentoAtual), "_blank", "noopener");
});
$("#cal-fallback").addEventListener("click", () => { if (agendamentoAtual) baixarICS(agendamentoAtual); });

/* =====================================================
   ÁREA DO BARBEIRO — só os agendamentos
   ===================================================== */

const painel = $("#painel");
const agendaData = $("#agenda-data");
const agendaBarbeiro = $("#agenda-barbeiro");
let painelLiberado = false;

agendaBarbeiro.innerHTML = '<option value="">Todos</option>' + nomesBarbeiros.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join("");

function renderAgenda() {
    const lista = lerAgendamentos()
        .filter((a) => a.data === agendaData.value && (!agendaBarbeiro.value || a.barbeiro === agendaBarbeiro.value))
        .sort((x, y) => x.inicio - y.inicio);

    $("#agenda-resumo").textContent = lista.length
        ? `${lista.length} agendamento${lista.length > 1 ? "s" : ""} em ${dataBR(agendaData.value)}`
        : "Nenhum agendamento neste dia.";

    $("#agenda-lista").innerHTML = lista.map((a) => {
        const s = servicoPorId(a.servico);
        const fone = a.telefone.length <= 11 ? "55" + a.telefone : a.telefone;
        const msg = `Olá, ${a.nome}! Seu horário na ${CONFIG.local} está confirmado:\n` +
            `${s ? s.nome : "Atendimento"} com ${a.barbeiro}\n` +
            `${diaSemana(a.data)}, ${dataBR(a.data)} às ${paraHHMM(a.inicio)}\n` +
            `Endereço: ${CONFIG.endereco}\nTe esperamos!`;
        return `
        <li class="ag-item">
            <div class="ag-hora">${paraHHMM(a.inicio)}<small>até ${paraHHMM(a.fim)}</small></div>
            <div class="ag-info"><strong>${esc(a.nome)}</strong><span>${s ? s.nome : ""} · ${esc(a.barbeiro)}</span></div>
            <div class="ag-acoes">
                <a href="https://wa.me/${fone}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Confirmar no WhatsApp</a>
                <button type="button" data-cancelar="${a.id}">Cancelar</button>
            </div>
        </li>`;
    }).join("");
}

function mostrarPainel() {
    $("#painel-login").hidden = painelLiberado;
    $("#painel-agenda").hidden = !painelLiberado;
    if (painelLiberado) {
        if (!agendaData.value) agendaData.value = isoData(new Date());
        renderAgenda();
    }
}

$("#abrir-painel").addEventListener("click", () => { mostrarPainel(); painel.showModal(); });
$("#painel-fechar").addEventListener("click", () => painel.close());
painel.addEventListener("click", (e) => { if (e.target === painel) painel.close(); });

$("#painel-login").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#pin").value === CONFIG.pinPainel) {
        painelLiberado = true;
        $("#pin").value = "";
        $("#pin-erro").textContent = "";
        mostrarPainel();
    } else {
        $("#pin-erro").textContent = "Senha incorreta.";
    }
});

agendaData.addEventListener("change", renderAgenda);
agendaBarbeiro.addEventListener("change", renderAgenda);

$("#agenda-lista").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cancelar]");
    if (!btn) return;
    if (!btn.dataset.confirmando) {              // 1º clique pede confirmação
        btn.dataset.confirmando = "1";
        btn.textContent = "Confirmar?";
        return;
    }
    gravarAgendamentos(lerAgendamentos().filter((a) => String(a.id) !== btn.dataset.cancelar));
    renderAgenda();
});

/* =====================================================
   INÍCIO
   ===================================================== */

rota();
