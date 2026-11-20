/* =====================================================
   V7 BARBEARIA — CONFIGURAÇÕES (edite só esta parte)
===================================================== */

const CONFIG = {
    whatsapp: "5551999999999",          // DDI + DDD + número, só dígitos

    abre: "09:00",
    fecha: "20:00",
    passoMin: 30,                        // intervalo entre horários

    diasAbertos: [1, 2, 3, 4, 5, 6],     // 0 = domingo ... 6 = sábado
    diasMostrados: 14,                   // quantos dias abertos aparecem (a partir de hoje)

    // foto: "img/carlos.jpg" (sem foto, aparece a inicial do nome)
    barbeiros: [
        { nome: "Carlos", foto: "", instagram: "carlos.v7" },
        { nome: "Rafael", foto: "", instagram: "rafael.v7" },
        { nome: "Diego", foto: "", instagram: "diego.v7" }
    ],

    local: "V7 Barbearia",
    endereco: "Rua Exemplo, 123 - Bairro, Cidade - UF",
    instagram: "v7barbearia",            // sem o @

    pinPainel: "1234"                    // senha da Área do barbeiro
};


/* =====================================================
   SERVIÇOS
===================================================== */

const SERVICOS = [
    { id: "corte", nome: "Corte masculino", de: 39.90, preco: 25.90, duracao: 30 },
    { id: "barba", nome: "Barba", de: 29.90, preco: 19.90, duracao: 25 },
    { id: "combo", nome: "Corte + barba", de: 49.90, preco: 32.90, duracao: 60, destaque: true },
    { id: "acabamento", nome: "Acabamento", de: 19.90, preco: 15.00, duracao: 10 }
];


/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

const $ = seletor => document.querySelector(seletor);

const CHAVE = "v7_agendamentos";
const CHAVE_CLIENTE = "v7_cliente";

const brl = valor => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const apenasNumeros = valor => String(valor || "").replace(/\D/g, "");

const paraMin = hora => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
};

const paraHHMM = minutos =>
    `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

const isoData = data =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

const dataBR = iso => iso ? iso.split("-").reverse().join("/") : "";
const servicoPorId = id => SERVICOS.find(s => s.id === id);

const nomesDias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
}

function formatarTelefone(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11);

    if (!numeros.length) return "";
    if (numeros.length <= 2) return `(${numeros}`;

    const ddd = numeros.slice(0, 2);
    const numero = numeros.slice(2);

    if (numeros.length <= 6) return `(${ddd}) ${numero}`;
    if (numeros.length === 11) return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;

    return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
}

function telefoneValido(valor) {
    const n = apenasNumeros(valor);
    return n.length === 10 || n.length === 11;
}

function aplicarMascaraTelefone(campo) {
    if (!campo) return;
    campo.addEventListener("input", () => { campo.value = formatarTelefone(campo.value); });
}

aplicarMascaraTelefone($("#telefone"));
aplicarMascaraTelefone($("#cancel-telefone"));


/* =====================================================
   ARMAZENAMENTO (localStorage — troque por Supabase depois)
===================================================== */

function lerAgendamentos() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE));
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function gravarAgendamentos(lista) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(lista));
        return true;
    } catch (erro) {
        console.error(erro);
        return false;
    }
}

function lerCliente() {
    try { return JSON.parse(localStorage.getItem(CHAVE_CLIENTE)) || {}; } catch { return {}; }
}

function gravarCliente(cliente) {
    try { localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(cliente)); return true; } catch { return false; }
}

function agendamentoAtivo(a) {
    return a.status !== "cancelado" && a.cancelado !== true;
}


/* =====================================================
   TEXTOS E LINKS AUTOMÁTICOS
===================================================== */

const linkZap = texto => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;

if ($("#ano")) $("#ano").textContent = new Date().getFullYear();

const diasPadrao = CONFIG.diasAbertos.length === 6 && !CONFIG.diasAbertos.includes(0);   // segunda a sábado

if ($("#info-funcionamento")) {
    const dias = diasPadrao ? "Segunda a sábado" : CONFIG.diasAbertos.map(d => nomesDias[d]).join(", ");
    $("#info-funcionamento").textContent = `${dias}, ${CONFIG.abre} às ${CONFIG.fecha}`;
}

// Etiquetas da tela inicial (calculadas do CONFIG e dos SERVICOS)
if ($("#hero-chips")) {
    const menorPreco = Math.min(...SERVICOS.map(s => s.preco));
    const dias = diasPadrao ? "Seg a sáb" : CONFIG.diasAbertos.map(d => nomesDias[d].slice(0, 3)).join(", ");

    $("#hero-chips").innerHTML = [
        `${CONFIG.barbeiros.length} barbeiros`,
        `${dias} · ${CONFIG.abre} às ${CONFIG.fecha}`,
        `Serviços a partir de ${brl(menorPreco)}`
    ].map(texto => `<li>${texto}</li>`).join("");
}

["#header-whatsapp", "#footer-whatsapp", "#btn-whatsapp"].forEach(seletor => {
    const link = $(seletor);
    if (link) link.href = linkZap("Olá! Gostaria de falar com a V7 Barbearia.");
});

const linkMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.endereco)}`;

if ($("#info-endereco")) $("#info-endereco").textContent = CONFIG.endereco;
if ($("#link-mapa")) $("#link-mapa").href = linkMapa;
if ($("#mapa-frame")) $("#mapa-frame").src = `https://maps.google.com/maps?q=${encodeURIComponent(CONFIG.endereco)}&output=embed`;
if ($("#como-chegar")) $("#como-chegar").href = linkMapa;
if ($("#endereco-confirmado")) $("#endereco-confirmado").textContent = CONFIG.endereco;
if ($("#link-instagram")) $("#link-instagram").href = `https://instagram.com/${CONFIG.instagram}`;
if ($("#texto-instagram")) $("#texto-instagram").textContent = `@${CONFIG.instagram}`;


/* =====================================================
   MENU MOBILE
===================================================== */

const botaoMenu = $("#menu-toggle");
const menuMobile = $("#navigation");

function fecharMenuMobile() {
    if (!botaoMenu || !menuMobile) return;

    menuMobile.classList.remove("aberto");
    botaoMenu.classList.remove("ativo");
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.setAttribute("aria-label", "Abrir menu");
}

if (botaoMenu && menuMobile) {
    botaoMenu.addEventListener("click", () => {
        const aberto = menuMobile.classList.toggle("aberto");

        botaoMenu.classList.toggle("ativo", aberto);
        botaoMenu.setAttribute("aria-expanded", String(aberto));
        botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });

    menuMobile.querySelectorAll("a").forEach(link => link.addEventListener("click", fecharMenuMobile));
}

// fecha o menu ao tocar fora dele ou apertar ESC
document.addEventListener("click", evento => {
    if (menuMobile.classList.contains("aberto") && !evento.target.closest("#navigation, #menu-toggle")) {
        fecharMenuMobile();
    }
});
document.addEventListener("keydown", evento => { if (evento.key === "Escape") fecharMenuMobile(); });


/* =====================================================
   NAVEGAÇÃO ENTRE TELAS (#agendar = agendamento)
===================================================== */

const home = $("#home");
const telaAgendar = $("#agendar");
const secoes = document.querySelectorAll("[data-etapa]");

function rota() {
    const emAgendar = location.hash === "#agendar";
    const jaEstavaAgendando = !telaAgendar.hidden;

    home.hidden = emAgendar;
    telaAgendar.hidden = !emAgendar;
    document.body.classList.toggle("em-agendar", emAgendar);

    if (emAgendar) {
        if (!jaEstavaAgendando) reiniciarFluxo();
        fecharMenuMobile();
        window.scrollTo(0, 0);
        return;
    }

    fecharMenuMobile();

    const alvo = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;

    if (alvo) {
        setTimeout(() => alvo.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } else {
        window.scrollTo(0, 0);
    }
}

window.addEventListener("hashchange", rota);


/* =====================================================
   ESTADO DO AGENDAMENTO
===================================================== */

const TITULOS = ["Escolha o profissional", "Escolha o serviço", "Escolha o dia e o horário", "Seus dados", "Tudo certo!"];

const estado = { etapa: 1, barbeiro: "", servicoId: "", data: "", hora: "" };

let ultimoAgendamento = null;

function reiniciarFluxo() {
    estado.etapa = 1;
    estado.barbeiro = "";
    estado.servicoId = "";
    estado.data = "";
    estado.hora = "";

    const cliente = lerCliente();

    $("#nome").value = cliente.nome || "";
    $("#telefone").value = formatarTelefone(cliente.telefone || "");
    $("#erro").textContent = "";

    renderBarbeiros();
    atualizarEtapa();
}


/* ---------- Etapa 1: barbeiros ---------- */

function renderBarbeiros() {
    const lista = $("#lista-barbeiros");
    lista.innerHTML = "";

    CONFIG.barbeiros.forEach(barbeiro => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "barbeiro-card";

        const avatar = barbeiro.foto
            ? `<img class="avatar" src="${escaparHTML(barbeiro.foto)}" alt="${escaparHTML(barbeiro.nome)}">`
            : `<div class="avatar" aria-hidden="true">${escaparHTML(barbeiro.nome.charAt(0))}</div>`;

        botao.innerHTML = `
            ${avatar}
            <strong>${escaparHTML(barbeiro.nome)}</strong>
            <small>Selecionar profissional</small>
            ${barbeiro.instagram ? `<span class="barbeiro-instagram">@${escaparHTML(barbeiro.instagram)}</span>` : ""}
        `;

        botao.addEventListener("click", () => {
            estado.barbeiro = barbeiro.nome;
            estado.servicoId = "";
            estado.data = "";
            estado.hora = "";
            estado.etapa = 2;

            renderServicos();
            atualizarEtapa();
        });

        lista.appendChild(botao);
    });
}


/* ---------- Etapa 2: serviços ---------- */

function renderServicos() {
    const lista = $("#lista-servicos");
    lista.innerHTML = "";

    SERVICOS.forEach(servico => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "servico-item";
        if (servico.destaque) botao.classList.add("destaque");

        botao.innerHTML = `
            <span>
                <strong>${escaparHTML(servico.nome)}</strong>
                <small>${servico.duracao} minutos</small>
            </span>
            <span class="preco">
                <s>${brl(servico.de)}</s>
                <b>${brl(servico.preco)}</b>
            </span>
        `;

        botao.addEventListener("click", () => {
            estado.servicoId = servico.id;
            estado.data = "";
            estado.hora = "";
            estado.etapa = 3;

            renderDatas();
            atualizarEtapa();
        });

        lista.appendChild(botao);
    });
}


/* ---------- Horários ocupados ---------- */

function horarioOcupado(hora, duracao, data = estado.data, barbeiro = estado.barbeiro) {
    const inicioNovo = paraMin(hora);
    const fimNovo = inicioNovo + duracao;

    return lerAgendamentos().some(a => {
        if (!agendamentoAtivo(a)) return false;
        if (a.data !== data || a.barbeiro !== barbeiro || !a.hora) return false;

        const servico = servicoPorId(a.servicoId);
        const duracaoExistente = servico ? servico.duracao : CONFIG.passoMin;

        const inicioExistente = paraMin(a.hora);
        const fimExistente = inicioExistente + duracaoExistente;

        // dois horários se chocam quando um começa antes de o outro terminar
        return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });
}


/* ---------- Etapa 3: datas ---------- */

function renderDatas() {
    const lista = $("#lista-datas");
    lista.innerHTML = "";

    const hoje = new Date();
    const diasDisponiveis = [];

    for (let deslocamento = 0; diasDisponiveis.length < CONFIG.diasMostrados && deslocamento < 90; deslocamento++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + deslocamento);

        if (CONFIG.diasAbertos.includes(data.getDay())) diasDisponiveis.push(data);
    }

    if (!diasDisponiveis.length) {
        lista.textContent = "Não há datas disponíveis.";
        $("#horarios").innerHTML = "";
        return;
    }

    const datasISO = diasDisponiveis.map(isoData);
    if (!datasISO.includes(estado.data)) estado.data = datasISO[0];

    const hojeISO = isoData(hoje);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const amanhaISO = isoData(amanha);

    diasDisponiveis.forEach(data => {
        const iso = isoData(data);
        const rotulo = iso === hojeISO ? "hoje" : iso === amanhaISO ? "amanhã" : nomesDias[data.getDay()].slice(0, 3);
        const mes = data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "data-chip";
        if (iso === estado.data) botao.classList.add("selecionado");
        botao.setAttribute("aria-pressed", String(iso === estado.data));

        botao.innerHTML = `
            <small>${rotulo}</small>
            <strong>${String(data.getDate()).padStart(2, "0")}</strong>
            <small>${mes}</small>
        `;

        botao.addEventListener("click", () => {
            estado.data = iso;
            estado.hora = "";

            // só troca a marcação (não refaz a lista, para a rolagem não voltar ao começo)
            lista.querySelectorAll(".data-chip").forEach(chip => {
                const ativo = chip === botao;
                chip.classList.toggle("selecionado", ativo);
                chip.setAttribute("aria-pressed", String(ativo));
            });

            renderHorarios();
        });

        lista.appendChild(botao);
    });

    renderHorarios();
}


/* ---------- Etapa 3: horários (Manhã / Tarde / Noite) ---------- */

function renderHorarios() {
    const lista = $("#horarios");
    lista.innerHTML = "";

    const servico = servicoPorId(estado.servicoId);

    if (!servico || !estado.data || !estado.barbeiro) {
        lista.textContent = "Escolha um profissional, serviço e data.";
        return;
    }

    const agora = new Date();
    const hojeISO = isoData(agora);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

    let disponiveis = 0;
    let periodoAtual = "";

    for (let minutos = paraMin(CONFIG.abre); minutos + servico.duracao <= paraMin(CONFIG.fecha); minutos += CONFIG.passoMin) {
        const passado = estado.data < hojeISO || (estado.data === hojeISO && minutos <= minutosAgora);
        if (passado) continue;                       // horários que já passaram nem aparecem

        const hora = paraHHMM(minutos);
        const periodo = minutos < 720 ? "Manhã" : minutos < 1080 ? "Tarde" : "Noite";

        if (periodo !== periodoAtual) {
            periodoAtual = periodo;

            const titulo = document.createElement("p");
            titulo.className = "periodo";
            titulo.textContent = periodo;
            lista.appendChild(titulo);
        }

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "horario-opcao";
        botao.textContent = hora;

        if (horarioOcupado(hora, servico.duracao)) {
            botao.classList.add("indisponivel");
            botao.disabled = true;
            botao.title = "Horário ocupado";
        } else {
            disponiveis++;

            botao.addEventListener("click", () => {
                estado.hora = hora;
                estado.etapa = 4;

                renderResumo();
                $("#erro").textContent = "";
                atualizarEtapa();
            });
        }

        lista.appendChild(botao);
    }

    if (!disponiveis) {
        lista.innerHTML = '<p class="horario-vazio">Sem horários livres neste dia. Escolha outro dia acima.</p>';
    }
}


/* ---------- Etapa 4: resumo ---------- */

function renderResumo() {
    const servico = servicoPorId(estado.servicoId);
    if (!servico) return;

    $("#resumo").innerHTML = `
        <div class="res-linha"><span>Profissional</span><strong>${escaparHTML(estado.barbeiro)}</strong></div>
        <div class="res-linha"><span>Serviço</span><strong>${escaparHTML(servico.nome)}</strong></div>
        <div class="res-linha"><span>Data</span><strong>${dataBR(estado.data)}</strong></div>
        <div class="res-linha"><span>Horário</span><strong>${escaparHTML(estado.hora)}</strong></div>
        <div class="res-linha total"><span>Total</span><strong>${brl(servico.preco)}</strong></div>
    `;
}


/* ---------- Mostrar só a etapa atual ---------- */

function atualizarEtapa() {
    secoes.forEach(secao => {
        secao.hidden = Number(secao.dataset.etapa) !== estado.etapa;
    });

    $("#titulo-etapa").textContent = TITULOS[estado.etapa - 1];

    $("#progresso").querySelectorAll("i").forEach((barra, indice) => {
        barra.style.background = indice < Math.min(estado.etapa, 4) ? "var(--gold)" : "var(--line)";
    });

    // Voltar fica disponível em todas as etapas, menos na última (na etapa 1 leva ao início)
    $("#voltar").style.visibility = estado.etapa === 5 ? "hidden" : "visible";

    // Linha com o que já foi escolhido: "Carlos · Corte masculino · 25/11 às 14:00"
    const servico = servicoPorId(estado.servicoId);
    const partes = [];

    if (estado.etapa >= 2 && estado.etapa <= 4 && estado.barbeiro) partes.push(estado.barbeiro);
    if (estado.etapa >= 3 && estado.etapa <= 4 && servico) partes.push(servico.nome);
    if (estado.etapa === 4 && estado.data) partes.push(`${dataBR(estado.data).slice(0, 5)} às ${estado.hora}`);

    $("#escolhas").textContent = partes.join(" · ");
    $("#escolhas").hidden = !partes.length;

    if (estado.etapa === 5 && navigator.vibrate) navigator.vibrate(40);   // vibra ao confirmar (Android)
}


/* ---------- Botão voltar ---------- */

$("#voltar").addEventListener("click", () => {
    if (estado.etapa === 1) {
        location.hash = "#inicio";
        return;
    }

    estado.etapa--;

    if (estado.etapa === 1) renderBarbeiros();
    if (estado.etapa === 2) renderServicos();
    if (estado.etapa === 3) renderDatas();
    if (estado.etapa === 4) renderResumo();

    atualizarEtapa();
});


/* ---------- Confirmar agendamento ---------- */

$("#form-dados").addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = $("#nome").value.trim();
    const telefone = apenasNumeros($("#telefone").value);
    const servico = servicoPorId(estado.servicoId);

    $("#erro").textContent = "";

    if (nome.length < 2) {
        $("#erro").textContent = "Informe seu nome corretamente.";
        return;
    }

    if (!telefoneValido(telefone)) {
        $("#erro").textContent = "Informe um WhatsApp válido com DDD.";
        return;
    }

    if (!servico || !estado.barbeiro || !estado.data || !estado.hora) {
        $("#erro").textContent = "Confira os dados do seu agendamento.";
        return;
    }

    if (horarioOcupado(estado.hora, servico.duracao)) {
        $("#erro").textContent = "Esse horário acabou de ser reservado. Escolha outro.";
        estado.etapa = 3;
        renderDatas();
        atualizarEtapa();
        return;
    }

    const agora = new Date();
    const hojeISO = isoData(agora);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

    if (estado.data < hojeISO || (estado.data === hojeISO && paraMin(estado.hora) <= minutosAgora)) {
        $("#erro").textContent = "Esse horário já passou. Escolha outro.";
        estado.etapa = 3;
        renderDatas();
        atualizarEtapa();
        return;
    }

    const agendamento = {
        id: `v7-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nome,
        telefone,
        barbeiro: estado.barbeiro,
        servicoId: estado.servicoId,
        data: estado.data,
        hora: estado.hora,
        status: "ativo",
        criadoEm: new Date().toISOString()
    };

    const lista = lerAgendamentos();
    lista.push(agendamento);

    if (!gravarAgendamentos(lista)) {
        $("#erro").textContent = "Não foi possível salvar o agendamento neste navegador.";
        return;
    }

    gravarCliente({ nome, telefone });
    ultimoAgendamento = agendamento;

    mostrarConfirmacao(agendamento);

    estado.etapa = 5;
    atualizarEtapa();
});


/* ---------- Etapa 5: confirmação ---------- */

function mostrarConfirmacao(agendamento) {
    const servico = servicoPorId(agendamento.servicoId);
    if (!servico) return;

    $("#confirmacao-detalhes").innerHTML = `
        <li><span>Cliente:</span> ${escaparHTML(agendamento.nome)}</li>
        <li><span>Profissional:</span> ${escaparHTML(agendamento.barbeiro)}</li>
        <li><span>Serviço:</span> ${escaparHTML(servico.nome)}</li>
        <li><span>Data:</span> ${dataBR(agendamento.data)}</li>
        <li><span>Horário:</span> ${escaparHTML(agendamento.hora)}</li>
        <li><span>Valor:</span> ${brl(servico.preco)}</li>
    `;

    $("#confirmacao-whatsapp").href = linkZap(
        `Olá! Meu agendamento na ${CONFIG.local} foi realizado.\n\n` +
        `Nome: ${agendamento.nome}\n` +
        `Profissional: ${agendamento.barbeiro}\n` +
        `Serviço: ${servico.nome}\n` +
        `Data: ${dataBR(agendamento.data)}\n` +
        `Horário: ${agendamento.hora}`
    );
}


/* =====================================================
   CALENDÁRIO (arquivo .ics)
===================================================== */

function escaparICS(valor) {
    return String(valor || "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
}

function gerarCalendario() {
    const a = ultimoAgendamento;

    if (!a) {
        alert("Nenhum agendamento encontrado.");
        return;
    }

    const servico = servicoPorId(a.servicoId);
    if (!servico) return;

    const inicio = new Date(`${a.data}T${a.hora}:00`);
    const fim = new Date(inicio.getTime() + servico.duracao * 60000);

    const formatoICS = data => data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const conteudo = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//V7 Barbearia//Agendamento//PT-BR",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${escaparICS(a.id)}@v7barbearia`,
        `DTSTART:${formatoICS(inicio)}`,
        `DTEND:${formatoICS(fim)}`,
        `SUMMARY:${escaparICS(CONFIG.local + " - " + servico.nome)}`,
        `DESCRIPTION:${escaparICS("Profissional: " + a.barbeiro)}`,
        `LOCATION:${escaparICS(CONFIG.endereco)}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([conteudo], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "agendamento-v7.ics";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Um botão só: o site detecta o aparelho.
// iPhone, iPad e Mac -> arquivo .ics (abre o app Calendário)
// Android e outros   -> Google Agenda já preenchido
const ehApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

function abrirCalendario() {
    const a = ultimoAgendamento;
    const servico = a && servicoPorId(a.servicoId);
    if (!a || !servico) return;

    if (ehApple) {
        gerarCalendario();
        return;
    }

    const inicio = new Date(`${a.data}T${a.hora}:00`);
    const fim = new Date(inicio.getTime() + servico.duracao * 60000);
    const formato = data => data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const parametros = new URLSearchParams({
        action: "TEMPLATE",
        text: `${CONFIG.local} - ${servico.nome}`,
        dates: `${formato(inicio)}/${formato(fim)}`,
        details: `Profissional: ${a.barbeiro}`,
        location: `${CONFIG.local}, ${CONFIG.endereco}`
    });

    window.open(`https://calendar.google.com/calendar/render?${parametros}`, "_blank", "noopener");
}

$("#cal-adicionar").addEventListener("click", abrirCalendario);
$("#cal-fallback").addEventListener("click", gerarCalendario);   // sempre baixa o arquivo .ics


/* =====================================================
   CANCELAMENTO PELO CLIENTE
===================================================== */

let cancelamentosEncontrados = [];

function mostrarMensagemCancelamento(mensagem, sucesso = false) {
    const erro = $("#erro-cancelamento");
    erro.textContent = mensagem;
    erro.style.color = sucesso ? "var(--gold)" : "#ff6b6b";
}

function buscarAgendamentosDoCliente(telefone) {
    return lerAgendamentos()
        .map((agendamento, indice) => ({ agendamento, indice }))
        .filter(item => apenasNumeros(item.agendamento.telefone) === telefone && agendamentoAtivo(item.agendamento));
}

function atualizarLinkCancelamento() {
    const seletor = $("#cancel-agendamento");
    const link = $("#cancelar-whatsapp");
    if (!seletor || !link) return;

    const indice = Number(seletor.value);
    const item = cancelamentosEncontrados.find(registro => registro.indice === indice);

    if (!item) {
        link.href = linkZap("Olá! Gostaria de solicitar o cancelamento de um agendamento.");
        return;
    }

    const a = item.agendamento;
    const servico = servicoPorId(a.servicoId);

    link.href = linkZap(
        `Olá! Gostaria de solicitar o cancelamento do meu agendamento.\n\n` +
        `Nome: ${a.nome}\n` +
        `Profissional: ${a.barbeiro}\n` +
        `Serviço: ${servico ? servico.nome : "Não informado"}\n` +
        `Data: ${dataBR(a.data)}\n` +
        `Horário: ${a.hora}`
    );
}

function atualizarListaCancelamentos() {
    const resultado = $("#resultado-cancelamento");
    const seletor = $("#cancel-agendamento");

    seletor.innerHTML = "";

    if (!cancelamentosEncontrados.length) {
        resultado.hidden = true;
        return;
    }

    cancelamentosEncontrados.forEach(item => {
        const a = item.agendamento;
        const servico = servicoPorId(a.servicoId);

        const opcao = document.createElement("option");
        opcao.value = String(item.indice);
        opcao.textContent = `${dataBR(a.data)} às ${a.hora} — ${servico ? servico.nome : "Serviço"} — ${a.barbeiro}`;

        seletor.appendChild(opcao);
    });

    resultado.hidden = false;
    atualizarLinkCancelamento();
}

$("#form-cancelamento").addEventListener("submit", evento => {
    evento.preventDefault();
    mostrarMensagemCancelamento("");

    const telefone = apenasNumeros($("#cancel-telefone").value);

    if (!telefoneValido(telefone)) {
        $("#resultado-cancelamento").hidden = true;
        mostrarMensagemCancelamento("Informe um WhatsApp válido com DDD.");
        return;
    }

    cancelamentosEncontrados = buscarAgendamentosDoCliente(telefone);

    if (!cancelamentosEncontrados.length) {
        $("#resultado-cancelamento").hidden = true;
        mostrarMensagemCancelamento("Não encontramos agendamentos ativos com esse WhatsApp neste navegador.");
        return;
    }

    atualizarListaCancelamentos();
    mostrarMensagemCancelamento(`Encontramos ${cancelamentosEncontrados.length} agendamento(s).`, true);
});

$("#cancel-agendamento").addEventListener("change", atualizarLinkCancelamento);

$("#cancelar-site").addEventListener("click", () => {
    const indice = Number($("#cancel-agendamento").value);
    const telefone = apenasNumeros($("#cancel-telefone").value);

    const lista = lerAgendamentos();
    const a = lista[indice];

    if (!a || !agendamentoAtivo(a)) {
        mostrarMensagemCancelamento("Esse agendamento não está mais disponível para cancelamento.");
        return;
    }

    if (apenasNumeros(a.telefone) !== telefone) {
        mostrarMensagemCancelamento("O telefone informado não corresponde ao agendamento.");
        return;
    }

    if (!confirm(`Deseja realmente cancelar o agendamento de ${dataBR(a.data)} às ${a.hora}?`)) return;

    lista[indice] = { ...a, status: "cancelado", canceladoEm: new Date().toISOString() };

    if (!gravarAgendamentos(lista)) {
        mostrarMensagemCancelamento("Não foi possível registrar o cancelamento.");
        return;
    }

    cancelamentosEncontrados = buscarAgendamentosDoCliente(telefone);
    atualizarListaCancelamentos();

    mostrarMensagemCancelamento("Agendamento cancelado com sucesso!", true);
});

$("#cancelar-whatsapp").href = linkZap("Olá! Gostaria de solicitar o cancelamento de um agendamento.");


/* =====================================================
   ÁREA DO BARBEIRO
===================================================== */

const painel = $("#painel");

$("#abrir-painel").addEventListener("click", () => {
    $("#painel-login").hidden = false;
    $("#painel-agenda").hidden = true;
    $("#pin").value = "";
    $("#pin-erro").textContent = "";

    painel.showModal();
});

$("#painel-fechar").addEventListener("click", () => painel.close());
painel.addEventListener("click", evento => { if (evento.target === painel) painel.close(); });

$("#painel-login").addEventListener("submit", evento => {
    evento.preventDefault();

    if ($("#pin").value !== CONFIG.pinPainel) {
        $("#pin-erro").textContent = "Senha incorreta.";
        return;
    }

    $("#painel-login").hidden = true;
    $("#painel-agenda").hidden = false;

    $("#agenda-data").value = isoData(new Date());

    $("#agenda-barbeiro").innerHTML =
        '<option value="">Todos os barbeiros</option>' +
        CONFIG.barbeiros.map(b => `<option value="${escaparHTML(b.nome)}">${escaparHTML(b.nome)}</option>`).join("");

    renderPainel();
});

function renderPainel() {
    const data = $("#agenda-data").value;
    const barbeiro = $("#agenda-barbeiro").value;

    const lista = lerAgendamentos()
        .filter(a => a.data === data && agendamentoAtivo(a) && (!barbeiro || a.barbeiro === barbeiro))
        .sort((a, b) => paraMin(a.hora) - paraMin(b.hora));

    $("#agenda-resumo").textContent = `${lista.length} agendamento(s) encontrado(s).`;

    const container = $("#agenda-lista");

    if (!lista.length) {
        container.innerHTML = "<li>Nenhum agendamento ativo para esta data.</li>";
        return;
    }

    container.innerHTML = lista.map(a => {
        const servico = servicoPorId(a.servicoId);
        const fone = a.telefone.length <= 11 ? "55" + a.telefone : a.telefone;

        const mensagem =
            `Olá, ${a.nome}! Seu horário na ${CONFIG.local} está confirmado:\n` +
            `${servico ? servico.nome : "Atendimento"} com ${a.barbeiro}\n` +
            `${dataBR(a.data)} às ${a.hora}\n` +
            `Endereço: ${CONFIG.endereco}\nTe esperamos!`;

        return `
            <li class="agenda-item">
                <strong>${escaparHTML(a.hora)} — ${escaparHTML(a.nome)}</strong><br>
                ${escaparHTML(a.barbeiro)} | ${escaparHTML(servico ? servico.nome : "Serviço")}<br>
                ${escaparHTML(a.telefone)}<br>
                <a class="btn-ghost painel-zap" href="https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}" target="_blank" rel="noopener">
                    Confirmar no WhatsApp
                </a>
                <button type="button" class="btn cancelar-reserva-painel" data-id="${escaparHTML(a.id)}">
                    Cancelar reserva
                </button>
            </li>
        `;
    }).join("");
}

$("#agenda-lista").addEventListener("click", evento => {
    const botao = evento.target.closest(".cancelar-reserva-painel");
    if (!botao) return;

    const lista = lerAgendamentos();
    const indice = lista.findIndex(a => a.id === botao.dataset.id);

    if (indice === -1) {
        alert("Não foi possível localizar essa reserva.");
        renderPainel();
        return;
    }

    const agendamento = lista[indice];

    if (!agendamentoAtivo(agendamento)) {
        alert("Essa reserva já foi cancelada.");
        renderPainel();
        return;
    }

    const confirmar = confirm(
        `Deseja cancelar esta reserva?\n\n` +
        `Cliente: ${agendamento.nome}\n` +
        `Profissional: ${agendamento.barbeiro}\n` +
        `Data: ${dataBR(agendamento.data)}\n` +
        `Horário: ${agendamento.hora}`
    );

    if (!confirmar) return;

    lista[indice] = {
        ...agendamento,
        status: "cancelado",
        canceladoEm: new Date().toISOString(),
        canceladoPor: "barbeiro"
    };

    if (!gravarAgendamentos(lista)) {
        alert("Erro ao salvar o cancelamento. Tente novamente.");
        return;
    }

    renderPainel();

    // atualiza a consulta do cliente, se estiver aberta
    const telefone = apenasNumeros(agendamento.telefone);

    if (apenasNumeros($("#cancel-telefone").value) === telefone) {
        cancelamentosEncontrados = buscarAgendamentosDoCliente(telefone);
        atualizarListaCancelamentos();
    }

    alert("Reserva cancelada com sucesso!\n\nO horário foi liberado na agenda deste navegador.");
});

$("#agenda-data").addEventListener("change", renderPainel);
$("#agenda-barbeiro").addEventListener("change", renderPainel);


/* =====================================================
   BOTÃO FIXO "AGENDAR" NO CELULAR
   (aparece depois da tela inicial; some no rodapé e no agendamento)
===================================================== */

const botaoFixo = $(".cta-fixo");

if (botaoFixo && "IntersectionObserver" in window) {
    let heroVisivel = true;
    let rodapeVisivel = false;

    const atualizarBotaoFixo = () => botaoFixo.classList.toggle(
        "visivel",
        !heroVisivel && !rodapeVisivel && !document.body.classList.contains("em-agendar")
    );

    new IntersectionObserver(entradas => { heroVisivel = entradas[0].isIntersecting; atualizarBotaoFixo(); })
        .observe($("#inicio"));

    new IntersectionObserver(entradas => { rodapeVisivel = entradas[0].isIntersecting; atualizarBotaoFixo(); })
        .observe($("#contato"));

    window.addEventListener("hashchange", () => setTimeout(atualizarBotaoFixo, 0));
}


/* =====================================================
   SEÇÕES ENTRAM SUAVEMENTE AO ROLAR
===================================================== */

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observador = new IntersectionObserver((entradas, obs) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visivel");
                obs.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(
        ".sobre-conteudo, .sobre-imagem, .mapa-conteudo, .cancelamento-conteudo, .footer-conteudo"
    ).forEach(elemento => {
        elemento.classList.add("reveal");
        observador.observe(elemento);
    });
}


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

renderBarbeiros();
rota();
