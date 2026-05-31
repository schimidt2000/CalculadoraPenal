/* ============================================================
   CALCULADORA PENAL — Frontend Logic
   ============================================================ */

// ── Tabela de frações para preview ───────────────────────────
const FRACOES = {
    COMUM:            { PRIMARIO: '16%',  REINCIDENTE: '20%'  },
    COMUM_VIOLENCIA:  { PRIMARIO: '25%',  REINCIDENTE: '30%'  },
    HEDIONDO:         { PRIMARIO: '40%',  REINCIDENTE: '60%'  },
    HEDIONDO_MORTE:   { PRIMARIO: '50%',  REINCIDENTE: '70%'  },
};

const FRACOES_LC = {
    COMUM:            { PRIMARIO: '1/3 (33,33%)',  REINCIDENTE: '1/2 (50,00%)' },
    COMUM_VIOLENCIA:  { PRIMARIO: '1/3 (33,33%)',  REINCIDENTE: '1/2 (50,00%)' },
    HEDIONDO:         { PRIMARIO: '2/3 (66,67%)',  REINCIDENTE: '2/3 (66,67%)' },
    HEDIONDO_MORTE:   { PRIMARIO: 'VEDADO',         REINCIDENTE: 'VEDADO' },
};

// ── Máscara: número do processo ──────────────────────────────
function mascaraProcesso(val) {
    const d = val.replace(/\D/g, '').substring(0, 20);
    let r = '';
    if (d.length > 0)  r = d.substring(0, Math.min(7, d.length));
    if (d.length > 7)  r += '-' + d.substring(7, Math.min(9, d.length));
    if (d.length > 9)  r += '.' + d.substring(9, Math.min(13, d.length));
    if (d.length > 13) r += '.' + d.substring(13, Math.min(14, d.length));
    if (d.length > 14) r += '.' + d.substring(14, Math.min(16, d.length));
    if (d.length > 16) r += '.' + d.substring(16, Math.min(20, d.length));
    return r;
}

// ── Máscara: WhatsApp brasileiro ─────────────────────────────
function mascaraWhatsApp(val) {
    const d = val.replace(/\D/g, '').substring(0, 11);
    if (d.length <= 2)  return d.length ? '(' + d : d;
    if (d.length <= 6)  return '(' + d.substring(0, 2) + ') ' + d.substring(2);
    if (d.length <= 10) return '(' + d.substring(0, 2) + ') ' + d.substring(2, 6) + '-' + d.substring(6);
    return '(' + d.substring(0, 2) + ') ' + d.substring(2, 7) + '-' + d.substring(7);
}

// ── Preview de frações ao selecionar tipo/status ─────────────
function atualizarPreviewFracoes() {
    const tipo   = document.getElementById('tipoCrime').value;
    const status = document.getElementById('statusApenado').value;
    const box    = document.getElementById('fracaoPreview');

    if (!tipo || !status) { box.style.display = 'none'; return; }

    const fp  = FRACOES[tipo]?.[status]    || '--';
    const flc = FRACOES_LC[tipo]?.[status] || '--';

    box.innerHTML =
        '<strong>Fração para Progressão:</strong> ' + fp +
        ' &nbsp;|&nbsp; <strong>Fração para Livramento Condicional:</strong> ' + flc;
    box.style.display = 'block';
}

// ── Exibir/esconder banner de erro ──────────────────────────
function mostrarErro(msg) {
    const b = document.getElementById('errorBanner');
    b.textContent = msg;
    b.classList.add('visible');
    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function limparErro() {
    const b = document.getElementById('errorBanner');
    b.classList.remove('visible');
    b.textContent = '';
}

// ── Validação básica do formulário ───────────────────────────
function validarFormulario(data) {
    if (!data.nomeCompleto.trim()) return 'Informe o nome completo.';
    if (!data.whatsapp.trim())     return 'Informe o número de WhatsApp.';
    if (!data.dataInicio)          return 'Informe a data de início do cumprimento.';

    const penaTotal = data.penaAnos + data.penaMeses + data.penaDias;
    if (penaTotal <= 0) return 'Informe a pena total (pelo menos 1 dia).';

    if (!data.tipoCrime)    return 'Selecione o tipo de crime.';
    if (!data.statusApenado) return 'Selecione o status do apenado.';

    const proc = data.numeroProcesso;
    if (proc) {
        const re = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
        if (!re.test(proc)) return 'Número de processo no formato inválido. Use: NNNNNNN-DD.AAAA.J.TT.OOOO';
    }

    return null;
}

// ── Preencher resultados na tela ─────────────────────────────
function exibirResultados(r) {
    document.getElementById('resNome').textContent           = r.nomeCompleto;
    document.getElementById('resPenaLiquida').textContent    = r.penaLiquida.descricao;
    document.getElementById('resDataBase').textContent       = r.dataBase;
    document.getElementById('resFracaoProgressao').textContent = r.fracaoProgressao;
    document.getElementById('resSemiaberto').textContent     = r.dataSemiaberto;
    document.getElementById('resAberto').textContent         = r.dataAberto;

    // Alerta regime aberto = fim da pena
    const alertaAberto = document.getElementById('alertaFimPena');
    if (r.alertaAbertoNaFimDaPena) {
        alertaAberto.classList.add('visible');
    } else {
        alertaAberto.classList.remove('visible');
    }

    // Card de Livramento Condicional
    const cardLC   = document.getElementById('cardLC');
    const lcLabel  = document.getElementById('lcRegimeLabel');
    const lcValor  = document.getElementById('resLC');
    const lcFracao = document.getElementById('resFracaoLC');

    cardLC.className = 'date-card';

    if (r.livramentoVedado) {
        cardLC.classList.add('card-vedado');
        lcLabel.textContent  = 'Livramento Condicional';
        lcValor.textContent  = 'Benefício VEDADO / Proibido por Lei';
        lcFracao.textContent = 'Crime Hediondo com Resultado Morte';
    } else {
        cardLC.classList.add('card-lc');
        lcLabel.textContent  = 'Livramento Condicional';
        lcValor.textContent  = r.dataLivramentoCondicional || '--';
        lcFracao.textContent = r.fracaoLC ? 'Fração: ' + r.fracaoLC : '';
    }

    document.getElementById('formView').classList.add('hidden');
    document.getElementById('resultsView').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Voltar ao formulário ─────────────────────────────────────
function voltarFormulario() {
    document.getElementById('resultsView').classList.add('hidden');
    document.getElementById('formView').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Submissão do formulário ──────────────────────────────────
document.getElementById('calculadoraForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    limparErro();

    const form = e.target;
    const payload = {
        nomeCompleto:    form.nomeCompleto.value.trim(),
        whatsapp:        form.whatsapp.value.trim(),
        email:           form.email.value.trim() || null,
        numeroProcesso:  form.numeroProcesso.value.trim() || null,
        penaAnos:        parseInt(form.penaAnos.value,    10) || 0,
        penaMeses:       parseInt(form.penaMeses.value,   10) || 0,
        penaDias:        parseInt(form.penaDias.value,    10) || 0,
        dataInicio:      form.dataInicio.value,
        detracaoAnos:    parseInt(form.detracaoAnos.value,  10) || 0,
        detracaoMeses:   parseInt(form.detracaoMeses.value, 10) || 0,
        detracaoDias:    parseInt(form.detracaoDias.value,  10) || 0,
        tipoCrime:       form.tipoCrime.value,
        statusApenado:   form.statusApenado.value,
    };

    const erroLocal = validarFormulario(payload);
    if (erroLocal) { mostrarErro(erroLocal); return; }

    // Loading state
    const btn = document.getElementById('btnCalcular');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch('/api/calcular', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
            mostrarErro(json.erro || 'Erro ao calcular. Verifique os dados e tente novamente.');
            return;
        }

        exibirResultados(json);

    } catch (err) {
        mostrarErro('Falha de comunicação com o servidor. Verifique sua conexão e tente novamente.');
        console.error(err);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});

// ── Eventos de máscara ────────────────────────────────────────
// Rastreia quantos dígitos existiam antes do cursor, aplica a máscara e
// reposiciona o cursor após o mesmo dígito no novo valor formatado.
// Isso evita o salto de cursor causado pelos caracteres especiais da máscara.
function aplicarMascaraComCursor(input, mascaraFn) {
    const cursorPos = input.selectionStart;
    const digitsBeforeCursor = input.value.substring(0, cursorPos).replace(/\D/g, '').length;
    const masked = mascaraFn(input.value);
    input.value = masked;

    if (digitsBeforeCursor === 0) {
        input.setSelectionRange(0, 0);
        return;
    }
    let count = 0;
    let newPos = masked.length;
    for (let i = 0; i < masked.length; i++) {
        if (/\d/.test(masked[i])) {
            count++;
            if (count === digitsBeforeCursor) { newPos = i + 1; break; }
        }
    }
    input.setSelectionRange(newPos, newPos);
}

document.getElementById('numeroProcesso').addEventListener('input', function () {
    aplicarMascaraComCursor(this, mascaraProcesso);
});

document.getElementById('whatsapp').addEventListener('input', function () {
    aplicarMascaraComCursor(this, mascaraWhatsApp);
});

document.getElementById('tipoCrime').addEventListener('change',    atualizarPreviewFracoes);
document.getElementById('statusApenado').addEventListener('change', atualizarPreviewFracoes);

// ── Números não negativos ─────────────────────────────────────
document.querySelectorAll('input[type="number"]').forEach(function (inp) {
    inp.addEventListener('change', function () {
        if (parseInt(this.value, 10) < 0 || isNaN(parseInt(this.value, 10))) {
            this.value = 0;
        }
    });
});
