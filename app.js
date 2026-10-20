/* ========================================================
   HARPIA NUTRIÇÃO ANIMAL - SISTEMA DE AVALIAÇÃO DE DESEMPENHO
   Lógica e Controle da Aplicação
   ======================================================== */

// 1. ESTRUTURA DAS SEÇÕES E PERGUNTAS (22 PERGUNTAS / 8 SEÇÕES)
const SECTIONS = [
  {
    id: 's1',
    title: '1. Comprometimento',
    short: 'Comprometimento',
    questions: [
      { id: 's1q1', text: 'Cumpre horários?' },
      { id: 's1q2', text: 'Assume responsabilidade pelos erros?' },
      { id: 's1q3', text: 'Demonstra interesse pelo trabalho?' }
    ]
  },
  {
    id: 's2',
    title: '2. Qualidade do Trabalho',
    short: 'Qualidade',
    questions: [
      { id: 's2q1', text: 'Comete poucos erros?' },
      { id: 's2q2', text: 'Tem atenção aos detalhes?' },
      { id: 's2q3', text: 'Entrega um trabalho confiável?' }
    ]
  },
  {
    id: 's3',
    title: '3. Produtividade',
    short: 'Produtividade',
    questions: [
      { id: 's3q1', text: 'Mantém um bom ritmo de trabalho?' },
      { id: 's3q2', text: 'Aproveita bem o tempo?' }
    ]
  },
  {
    id: 's4',
    title: '4. Trabalho em Equipe',
    short: 'Equipe',
    questions: [
      { id: 's4q1', text: 'Respeita os colegas?' },
      { id: 's4q2', text: 'Coopera quando necessário?' },
      { id: 's4q3', text: 'Contribui para um bom ambiente?' }
    ]
  },
  {
    id: 's5',
    title: '5. Comunicação',
    short: 'Comunicação',
    questions: [
      { id: 's5q1', text: 'Escuta orientações?' },
      { id: 's5q2', text: 'Comunica problemas?' }
    ]
  },
  {
    id: 's6',
    title: '6. Organização',
    short: 'Organização',
    questions: [
      { id: 's6q1', text: 'Mantém o local organizado?' },
      { id: 's6q2', text: 'Cuida dos materiais?' },
      { id: 's6q3', text: 'Segue processos?' }
    ]
  },
  {
    id: 's7',
    title: '7. Capacidade Técnica',
    short: 'Técnica',
    questions: [
      { id: 's7q1', text: 'Domina as atividades?' },
      { id: 's7q2', text: 'Aprende rapidamente?' }
    ]
  },
  {
    id: 's8',
    title: '8. Evolução',
    short: 'Evolução',
    questions: [
      { id: 's8q1', text: 'Melhorou nos últimos meses?' },
      { id: 's8q2', text: 'Aceita feedback?' },
      { id: 's8q3', text: 'Coloca em prática as orientações?' },
      { id: 's8q4', text: 'Demonstra vontade de evoluir?' }
    ]
  }
];

const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions);
const TOTAL_QUESTIONS = ALL_QUESTIONS.length; // 22

const STORAGE_KEY = 'harpia_colaboradores_v2';

// 2. UTILITÁRIOS E CÁLCULOS
const uid = () => 'id-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const fmt = (num) => (num !== null && num !== undefined && !isNaN(num)) ? num.toFixed(2).replace('.', ',') : '-';
const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Faixas de diagnóstico institucional Harpia
function getDiagnostic(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      label: 'Aguardando Avaliação',
      class: 'diag-sem-dados',
      color: '#8c9b93',
      description: 'Colaborador cadastrado sem avaliações registradas até o momento.'
    };
  }
  if (score >= 3.50) {
    return {
      label: 'Excelente',
      class: 'diag-excelente',
      color: 'var(--c-4)',
      description: 'Desempenho de destaque, superando os padrões esperados da função. Profissional com elevado nível de entrega, pontualidade, qualidade e referência positiva para a equipe.'
    };
  }
  if (score >= 2.80) {
    return {
      label: 'Bom',
      class: 'diag-bom',
      color: 'var(--c-3)',
      description: 'Desempenho consistente e alinhado aos padrões da empresa. Cumpre adequadamente suas responsabilidades com boa comunicação, trabalho em equipe e produtividade regular.'
    };
  }
  if (score >= 2.00) {
    return {
      label: 'Regular',
      class: 'diag-regular',
      color: 'var(--c-2)',
      description: 'Desempenho intermediário com pontos de atenção que demandam desenvolvimento. Recomenda-se feedback estruturado da liderança e plano de acompanhamento em curto prazo.'
    };
  }
  return {
    label: 'Insatisfatório',
    class: 'diag-insatisfatorio',
    color: 'var(--c-1)',
    description: 'Desempenho abaixo do mínimo esperado pela organização. Requer intervenção imediata da liderança, alinhamento rígido de metas e acompanhamento diário com prazos definidos.'
  };
}

// Média aritmética de uma lista de números
function calcMean(arr) {
  const valid = arr.filter(n => typeof n === 'number' && !isNaN(n));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Média de uma seção para uma avaliação específica
function getSectionAverageForEval(evalObj, section) {
  const scores = section.questions.map(q => evalObj.respostas[q.id]).filter(v => typeof v === 'number');
  return calcMean(scores);
}

// Média consolidada de uma seção para um colaborador (entre todas as avaliações de todos os líderes)
function getConsolidatedSectionAverage(colab, section) {
  if (!colab.avaliacoes || !colab.avaliacoes.length) return null;
  const allScores = colab.avaliacoes.flatMap(ev => 
    section.questions.map(q => ev.respostas[q.id]).filter(v => typeof v === 'number')
  );
  return calcMean(allScores);
}

// Média Global de um colaborador (média de todas as notas recebidas de todos os líderes)
function getGlobalAverage(colab) {
  if (!colab.avaliacoes || !colab.avaliacoes.length) return null;
  const allScores = colab.avaliacoes.flatMap(ev => 
    Object.values(ev.respostas).filter(v => typeof v === 'number')
  );
  return calcMean(allScores);
}

// 3. GERENCIAMENTO DE ESTADO E PERSISTÊNCIA
function loadColaboradores() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      throw new Error('Formato inválido');
    }
  } catch (err) {
    console.error('Erro ao ler dados salvos', err);
    // Guarda uma cópia dos dados ilegíveis e NÃO sobrescreve com exemplos
    try { localStorage.setItem(STORAGE_KEY + '_corrompido_' + Date.now(), raw || ''); } catch (e) { /* ignore */ }
    window.__dadosCorrompidos = true;
    return [];
  }

  // Exemplos iniciais para apresentação imediata
  const initial = [
    {
      id: 'colab-1',
      nome: 'Juliana Fernandes',
      setor: 'Nutrição e Qualidade',
      criadoEm: '2026-10-15',
      avaliacoes: [
        {
          id: 'ev-1',
          lider: 'Rodrigo Mello (Supervisão)',
          data: '2026-10-18',
          respostas: {
            s1q1: 4, s1q2: 4, s1q3: 4,
            s2q1: 4, s2q2: 3, s2q3: 4,
            s3q1: 3, s3q2: 4,
            s4q1: 4, s4q2: 4, s4q3: 4,
            s5q1: 3, s5q2: 4,
            s6q1: 4, s6q2: 4, s6q3: 3,
            s7q1: 4, s7q2: 4,
            s8q1: 4, s8q2: 4, s8q3: 4, s8q4: 4
          },
          observacoes: 'Excelente profissional, domínio técnico muito apurado na formulação e excelente relação com toda a equipe.',
          mediaAvaliacao: 3.82
        }
      ]
    },
    {
      id: 'colab-2',
      nome: 'Carlos Eduardo Santos',
      setor: 'Produção / Fábrica de Ração',
      criadoEm: '2026-10-16',
      avaliacoes: [
        {
          id: 'ev-2',
          lider: 'Marcos Silva (Gerente Industrial)',
          data: '2026-10-17',
          respostas: {
            s1q1: 3, s1q2: 3, s1q3: 3,
            s2q1: 3, s2q2: 2, s2q3: 3,
            s3q1: 3, s3q2: 3,
            s4q1: 3, s4q2: 3, s4q3: 3,
            s5q1: 2, s5q2: 3,
            s6q1: 3, s6q2: 3, s6q3: 2,
            s7q1: 3, s7q2: 3,
            s8q1: 3, s8q2: 3, s8q3: 3, s8q4: 3
          },
          observacoes: 'Bom ritmo de produção. Recomendamos atenção redobrada aos detalhes dos processos e à conservação das ferramentas.',
          mediaAvaliacao: 2.91
        }
      ]
    }
  ];
  saveColaboradores(initial);
  return initial;
}

function saveColaboradores(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Erro ao salvar no localStorage', err);
    alert('Não foi possível salvar os dados neste navegador (armazenamento cheio ou bloqueado). Use "Exportar backup" para não perder informações.');
    return false;
  }
}

let colaboradores = loadColaboradores();
let activeColabId = null;
let currentEvalAnswers = {}; // { [qId]: number }

// 4. ELEMENTOS DO DOM
const viewList = document.getElementById('view-list');
const viewEval = document.getElementById('view-eval');
const viewReport = document.getElementById('view-report');

const colabListContainer = document.getElementById('colab-list-container');
const filterInput = document.getElementById('filter-colab');
const btnShowAddColab = document.getElementById('btn-show-add-colab');
const addColabCard = document.getElementById('add-colab-card');
const btnCancelAddColab = document.getElementById('btn-cancel-add-colab');
const btnCancelAddColab2 = document.getElementById('btn-cancel-add-colab-2');
const formNewColab = document.getElementById('form-new-colab');

// Elementos da Tela de Avaliação
const btnEvalBack = document.getElementById('btn-eval-back');
const btnEvalCancel = document.getElementById('btn-eval-cancel');
const evalTargetNome = document.getElementById('eval-target-nome');
const evalTargetSetor = document.getElementById('eval-target-setor');
const evalTargetHistory = document.getElementById('eval-target-history');
const evalLeadersList = document.getElementById('eval-leaders-list');
const btnAddLeader = document.getElementById('btn-add-leader');
const evalDate = document.getElementById('eval-date');
const evalNotesContainer = document.getElementById('eval-notes-container');
const evalSectionsContainer = document.getElementById('eval-sections-container');
const formEval = document.getElementById('form-eval');
const liveAnsweredCount = document.getElementById('live-answered-count');
const liveEvalAvg = document.getElementById('live-eval-avg');
const liveSelfAvg = document.getElementById('live-self-avg');

// Elementos da Tela de Relatório
const btnReportBack = document.getElementById('btn-report-back');
const btnPrintPdf = document.getElementById('btn-print-pdf');
const printableReport = document.getElementById('printable-report');

// 5. NAVEGAÇÃO DE TELAS (PÁGINA INTEIRA - SEM POP-UPS)
function navigateTo(viewName) {
  viewList.classList.add('hidden');
  viewEval.classList.add('hidden');
  viewReport.classList.add('hidden');

  if (viewName === 'list') {
    viewList.classList.remove('hidden');
    renderColaboradoresList();
  } else if (viewName === 'eval') {
    viewEval.classList.remove('hidden');
  } else if (viewName === 'report') {
    viewReport.classList.remove('hidden');
  }
  window.scrollTo(0, 0);
}

// 6. TELA 1: LISTA CONTÍNUA DE COLABORADORES
function renderColaboradoresList() {
  const query = filterInput.value.toLowerCase().trim();
  const filtered = colaboradores.filter(c => 
    c.nome.toLowerCase().includes(query) || 
    c.setor.toLowerCase().includes(query)
  );

  if (!filtered.length) {
    colabListContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum colaborador encontrado</h3>
        <p>${colaboradores.length ? 'Nenhum resultado corresponde à sua pesquisa.' : 'Cadastre o primeiro colaborador para iniciar as avaliações.'}</p>
      </div>
    `;
    return;
  }

  colabListContainer.innerHTML = filtered.map(c => {
    const globalAvg = getGlobalAverage(c);
    const diag = getDiagnostic(globalAvg);
    const numEvals = c.avaliacoes ? c.avaliacoes.length : 0;
    const evalsText = numEvals === 1 ? '1 avaliação realizada' : `${numEvals} avaliações realizadas`;

    return `
      <div class="colab-card">
        <div class="colab-main-info">
          <div class="colab-nome">${escapeHtml(c.nome)}</div>
          <div class="colab-setor-tag">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
            ${escapeHtml(c.setor)}
          </div>
          <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 2px;">
            ${evalsText}
          </div>
        </div>

        <div class="colab-metrics">
          <div class="metric-block">
            <span class="metric-label">MÉDIA GLOBAL</span>
            <div class="metric-value-box">
              <span class="metric-score" style="color: ${diag.color}">${fmt(globalAvg)}</span>
              <span class="metric-scale">/ 4,00</span>
            </div>
            <span class="diag-badge ${diag.class}">${diag.label}</span>
          </div>
        </div>

        <div class="colab-actions">
          <button class="btn btn-primary" onclick="openEvaluationForm('${c.id}')" title="Avaliar este colaborador">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
            + Avaliar
          </button>
          
          <button class="btn btn-secondary" onclick="openReportView('${c.id}')" title="Visualizar diagnóstico e baixar PDF">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 011-1h2v8H6V4h5v4z" clip-rule="evenodd"/></svg>
            PDF / Relatório
          </button>

          <button class="btn btn-secondary" onclick="editColaborador('${c.id}')" title="Editar nome e setor">Editar</button>

          <button class="btn btn-danger-outline" onclick="deleteColaborador('${c.id}')" title="Excluir colaborador e todo o histórico">
            <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 7. EXCLUSÃO DE COLABORADOR (APAGA HISTÓRICO JUNTO)
window.deleteColaborador = function(id) {
  const colab = colaboradores.find(c => c.id === id);
  if (!colab) return;

  const count = colab.avaliacoes ? colab.avaliacoes.length : 0;
  const msg = `Tem certeza que deseja excluir o colaborador "${colab.nome}"?\n\nATENÇÃO: Todo o histórico de ${count} avaliação(ões) associado a ele será apagado permanentemente.`;
  
  if (confirm(msg)) {
    colaboradores = colaboradores.filter(c => c.id !== id);
    saveColaboradores(colaboradores);
    renderColaboradoresList();
  }
};

// Cadastro de novo colaborador
btnShowAddColab.addEventListener('click', () => {
  formNewColab.reset();
  editingColabId = null;
  addColabCard.querySelector('h3').textContent = 'Cadastrar Novo Colaborador';
  addColabCard.classList.remove('hidden');
  document.getElementById('new-colab-nome').focus();
});

function hideAddColabCard() {
  addColabCard.classList.add('hidden');
  formNewColab.reset();
  editingColabId = null;
  addColabCard.querySelector('h3').textContent = 'Cadastrar Novo Colaborador';
}
btnCancelAddColab.addEventListener('click', hideAddColabCard);
btnCancelAddColab2.addEventListener('click', hideAddColabCard);

let editingColabId = null;

window.editColaborador = function(id) {
  const c = colaboradores.find(x => x.id === id);
  if (!c) return;
  editingColabId = id;
  document.getElementById('new-colab-nome').value = c.nome;
  document.getElementById('new-colab-setor').value = c.setor;
  addColabCard.querySelector('h3').textContent = 'Editar Colaborador';
  addColabCard.classList.remove('hidden');
  window.scrollTo(0, 0);
  document.getElementById('new-colab-nome').focus();
};

formNewColab.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('new-colab-nome').value.trim();
  const setor = document.getElementById('new-colab-setor').value.trim();
  if (!nome || !setor) return;

  const dup = colaboradores.find(c => c.id !== editingColabId &&
    c.nome.toLowerCase() === nome.toLowerCase() && c.setor.toLowerCase() === setor.toLowerCase());
  if (dup) {
    alert('Já existe um colaborador com este nome e setor.');
    return;
  }

  if (editingColabId) {
    const c = colaboradores.find(x => x.id === editingColabId);
    if (c) { c.nome = nome; c.setor = setor; }
  } else {
    colaboradores.unshift({
      id: uid(),
      nome,
      setor,
      criadoEm: new Date().toISOString().slice(0, 10),
      avaliacoes: []
    });
  }

  saveColaboradores(colaboradores);
  hideAddColabCard();
  renderColaboradoresList();
});

// Exclusão de uma avaliação individual (a partir do relatório)
window.deleteEvaluation = function(colabId, evalId) {
  const c = colaboradores.find(x => x.id === colabId);
  if (!c) return;
  const ev = c.avaliacoes.find(a => a.id === evalId);
  if (!ev) return;
  if (!confirm(`Excluir a avaliação feita por "${ev.lider}"? As médias serão recalculadas.`)) return;
  c.avaliacoes = c.avaliacoes.filter(a => a.id !== evalId);
  saveColaboradores(colaboradores);
  renderPrintableReport(c);
};

// Backup e restauração dos dados
function exportBackup() {
  const blob = new Blob([JSON.stringify({ versao: 2, exportadoEm: new Date().toISOString(), colaboradores }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-avaliacoes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isValidColab(c) {
  return c && typeof c.id === 'string' && typeof c.nome === 'string' && typeof c.setor === 'string' &&
    Array.isArray(c.avaliacoes) &&
    c.avaliacoes.every(a => a && typeof a.id === 'string' && a.respostas && typeof a.respostas === 'object');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const list = Array.isArray(parsed) ? parsed : parsed.colaboradores;
      if (!Array.isArray(list) || !list.every(isValidColab)) throw new Error('inválido');
      if (!confirm(`Restaurar backup com ${list.length} colaborador(es)?\n\nISTO SUBSTITUI todos os dados atuais deste navegador.`)) return;
      colaboradores = list;
      saveColaboradores(colaboradores);
      renderColaboradoresList();
      alert('Backup restaurado com sucesso.');
    } catch (err) {
      alert('Arquivo de backup inválido. Nenhum dado foi alterado.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('btn-export').addEventListener('click', exportBackup);
document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
document.getElementById('file-import').addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

filterInput.addEventListener('input', renderColaboradoresList);

// 8. TELA 2: FORMULÁRIO DE AVALIAÇÃO EM PÁGINA INTEIRA (VÁRIOS LÍDERES + AUTOAVALIAÇÃO)
const MAX_LEADERS = 5;
let evalColumns = [];   // [{ nome, answers: {qid: nota}, notes }]
let selfAnswers = {};   // autoavaliação do colaborador (NÃO entra na média dos líderes)
let selfNotes = '';

const newLeaderColumn = () => ({ nome: '', answers: {}, notes: '' });
const getColAnswers = (col) => col === 'self' ? selfAnswers : (evalColumns[Number(col)] || {}).answers;
const leaderLabel = (i) => (evalColumns[i] && evalColumns[i].nome.trim()) || `Líder ${i + 1}`;

window.openEvaluationForm = function(colabId) {
  const colab = colaboradores.find(c => c.id === colabId);
  if (!colab) return;

  activeColabId = colabId;
  evalColumns = [newLeaderColumn()];
  selfAnswers = colab.autoavaliacao && colab.autoavaliacao.respostas ? { ...colab.autoavaliacao.respostas } : {};
  selfNotes = colab.autoavaliacao && colab.autoavaliacao.observacoes ? colab.autoavaliacao.observacoes : '';

  evalTargetNome.textContent = colab.nome;
  evalTargetSetor.textContent = colab.setor;
  const numEvals = colab.avaliacoes ? colab.avaliacoes.length : 0;
  evalTargetHistory.textContent = `${numEvals} avaliações anteriores registradas`;

  evalDate.value = new Date().toISOString().slice(0, 10);

  renderEvaluationForm();
  navigateTo('eval');
};

function renderEvaluationForm() {
  renderLeaderInputs();
  renderEvaluationQuestions();
  renderNotesFields();
  updateLiveEvaluationSummary();
}

function renderLeaderInputs() {
  evalLeadersList.innerHTML = evalColumns.map((c, i) => `
    <div class="leader-input-row">
      <div class="form-group" style="flex:1; min-width:220px;">
        <label for="leader-name-${i}">Líder ${i + 1} * (Obrigatório)</label>
        <input type="text" id="leader-name-${i}" value="${escapeHtml(c.nome)}" placeholder="Nome completo do líder" oninput="setLeaderName(${i}, this.value)">
      </div>
      ${evalColumns.length > 1 ? `<button type="button" class="btn btn-danger-outline" onclick="removeLeaderColumn(${i})">Remover</button>` : ''}
    </div>
  `).join('');
  btnAddLeader.disabled = evalColumns.length >= MAX_LEADERS;
}

window.setLeaderName = function(i, value) {
  evalColumns[i].nome = value;
  document.querySelectorAll(`[data-name-col="${i}"]`).forEach(el => { el.textContent = leaderLabel(i); });
};

window.removeLeaderColumn = function(i) {
  if (evalColumns.length <= 1) return;
  const c = evalColumns[i];
  if (Object.keys(c.answers).length && !confirm(`Remover a coluna de "${leaderLabel(i)}"? As notas já marcadas nela serão perdidas.`)) return;
  evalColumns.splice(i, 1);
  renderEvaluationForm();
};

btnAddLeader.addEventListener('click', () => {
  if (evalColumns.length >= MAX_LEADERS) return;
  evalColumns.push(newLeaderColumn());
  renderEvaluationForm();
  const input = document.getElementById(`leader-name-${evalColumns.length - 1}`);
  if (input) input.focus();
});

window.setLeaderNotes = function(i, v) { if (evalColumns[i]) evalColumns[i].notes = v; };
window.setSelfNotes = function(v) { selfNotes = v; };

function renderNotesFields() {
  evalNotesContainer.innerHTML = evalColumns.map((c, i) => `
    <div class="form-group" style="margin-bottom:14px;">
      <label>Observações de <span data-name-col="${i}">${escapeHtml(leaderLabel(i))}</span></label>
      <textarea rows="3" placeholder="Considerações, pontos de destaque, combinados ou metas..." oninput="setLeaderNotes(${i}, this.value)">${escapeHtml(c.notes)}</textarea>
    </div>
  `).join('') + `
    <div class="form-group">
      <label>Comentários da autoavaliação do colaborador (opcional)</label>
      <textarea rows="3" placeholder="O que o colaborador tem a dizer sobre o próprio desempenho..." oninput="setSelfNotes(this.value)">${escapeHtml(selfNotes)}</textarea>
    </div>
  `;
}

function renderEvaluationQuestions() {
  const colW = 172;
  const cols = [...evalColumns.map((c, i) => String(i)), 'self'];
  evalSectionsContainer.style.minWidth = `${280 + cols.length * colW}px`;

  const headsHtml = cols.map(col => col === 'self'
    ? `<div class="grid-col-head self">Autoavaliação<small>não soma na nota</small></div>`
    : `<div class="grid-col-head"><span data-name-col="${col}">${escapeHtml(leaderLabel(Number(col)))}</span></div>`
  ).join('');

  evalSectionsContainer.innerHTML = SECTIONS.map(s => `
    <div class="eval-section-card">
      <div class="eval-section-header">
        <h4 class="eval-section-title">${escapeHtml(s.title)}</h4>
        <div class="grid-col-heads">${headsHtml}</div>
      </div>
      <div>
        ${s.questions.map(q => `
          <div class="question-row" data-qid="${q.id}">
            <div class="question-text">${escapeHtml(q.text)}</div>
            <div class="grid-cells">
              ${cols.map(col => {
                const sel = (getColAnswers(col) || {})[q.id];
                return `<div class="grid-cell ${col === 'self' ? 'self' : ''}">
                  <div class="rating-buttons" role="group" aria-label="Nota de 1 a 4">
                    ${[1, 2, 3, 4].map(val => `
                      <button type="button" class="rate-btn ${sel === val ? 'selected' : ''}"
                        data-col="${col}" data-qid="${q.id}" data-value="${val}" title="Nota ${val}"
                        onclick="selectRating('${col}', '${q.id}', ${val})">${val}</button>
                    `).join('')}
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

window.selectRating = function(col, qid, value) {
  const answers = getColAnswers(col);
  if (!answers) return;
  // Se clicar na mesma nota já selecionada, desmarca
  if (answers[qid] === value) delete answers[qid];
  else answers[qid] = value;

  document.querySelectorAll(`.rate-btn[data-col="${col}"][data-qid="${qid}"]`).forEach(btn => {
    btn.classList.toggle('selected', answers[qid] === Number(btn.getAttribute('data-value')));
  });

  updateLiveEvaluationSummary();
};

function updateLiveEvaluationSummary() {
  const answered = evalColumns.reduce((n, c) => n + Object.keys(c.answers).length, 0);
  liveAnsweredCount.textContent = `${answered}/${TOTAL_QUESTIONS * evalColumns.length}`;

  const leaderScores = evalColumns.flatMap(c => Object.values(c.answers));
  liveEvalAvg.textContent = fmt(calcMean(leaderScores));
  liveSelfAvg.textContent = fmt(calcMean(Object.values(selfAnswers)));
}

// Salvar Avaliação (uma avaliação por líder + autoavaliação separada)
formEval.addEventListener('submit', (e) => {
  e.preventDefault();

  const colab = colaboradores.find(c => c.id === activeColabId);
  if (!colab) return;

  const names = new Set();
  for (let i = 0; i < evalColumns.length; i++) {
    const c = evalColumns[i];
    const nome = c.nome.trim();
    if (!nome) {
      alert(`Por favor, preencha o nome do Líder ${i + 1}.`);
      const inp = document.getElementById(`leader-name-${i}`);
      if (inp) inp.focus();
      return;
    }
    if (names.has(nome.toLowerCase())) {
      alert(`O líder "${nome}" aparece mais de uma vez. Use nomes diferentes ou remova a coluna repetida.`);
      return;
    }
    names.add(nome.toLowerCase());

    const faltam = ALL_QUESTIONS.filter(q => !c.answers[q.id]);
    if (faltam.length) {
      alert(`Faltam ${faltam.length} pergunta(s) sem nota na coluna de "${nome}". Responda todas as ${TOTAL_QUESTIONS} perguntas (notas de 1 a 4).`);
      const row = document.querySelector(`.question-row[data-qid="${faltam[0].id}"]`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  const selfCount = Object.keys(selfAnswers).length;
  if (selfCount > 0 && selfCount < TOTAL_QUESTIONS) {
    alert(`A autoavaliação está incompleta (${selfCount}/${TOTAL_QUESTIONS}). Responda todas as perguntas ou desmarque todas para deixá-la em branco.`);
    return;
  }

  const data = evalDate.value || new Date().toISOString().slice(0, 10);
  if (!colab.avaliacoes) colab.avaliacoes = [];

  evalColumns.forEach(c => {
    colab.avaliacoes.push({
      id: uid(),
      lider: c.nome.trim(),
      data,
      respostas: { ...c.answers },
      observacoes: c.notes.trim(),
      mediaAvaliacao: calcMean(Object.values(c.answers))
    });
  });

  // Autoavaliação: nota à parte, nunca entra na média dos líderes
  if (selfCount === TOTAL_QUESTIONS || selfNotes.trim()) {
    colab.autoavaliacao = {
      data,
      respostas: { ...selfAnswers },
      observacoes: selfNotes.trim(),
      media: calcMean(Object.values(selfAnswers))
    };
  }

  saveColaboradores(colaboradores);

  alert(`Avaliação de ${colab.nome} salva com sucesso por ${evalColumns.map(c => c.nome.trim()).join(', ')}!`);
  navigateTo('list');
});

btnEvalBack.addEventListener('click', () => navigateTo('list'));
btnEvalCancel.addEventListener('click', () => {
  if (confirm('Deseja cancelar o preenchimento? As respostas não salvas serão perdidas.')) {
    navigateTo('list');
  }
});

btnEvalBack.addEventListener('click', () => navigateTo('list'));
btnEvalCancel.addEventListener('click', () => {
  if (confirm('Deseja cancelar o preenchimento? As respostas não salvas serão perdidas.')) {
    navigateTo('list');
  }
});

// 9. TELA 3: RELATÓRIO / PDF CONSOLIDADO (A4 EXATO)
window.openReportView = function(colabId) {
  const colab = colaboradores.find(c => c.id === colabId);
  if (!colab) return;

  activeColabId = colabId;
  renderPrintableReport(colab);
  navigateTo('report');
};

function renderPrintableReport(colab) {
  const globalAvg = getGlobalAverage(colab);
  const diag = getDiagnostic(globalAvg);
  const evals = colab.avaliacoes || [];
  const totalEvals = evals.length;
  const auto = colab.autoavaliacao || null;
  const autoAnswers = auto && auto.respostas ? auto.respostas : {};
  const autoAvg = calcMean(Object.values(autoAnswers));

  // Lista dos líderes avaliadores únicos
  const lideresNomes = evals.map(e => e.lider);
  const lideresStr = lideresNomes.length ? lideresNomes.join(', ') : 'Nenhum líder registrado';

  const nCols = evals.length;
  const qW = nCols >= 4 ? 30 : 38;

  const leaderHeadersHtml = evals.map((e, idx) =>
    `<th class="center" style="font-size: 0.7rem;">${escapeHtml(e.lider || `Líder ${idx + 1}`)}</th>`
  ).join('');

  // Linhas da tabela: uma nota por pergunta (agrupadas por seção apenas visualmente)
  const colSpan = 1 + nCols + 2;
  const tableRowsHtml = SECTIONS.map(s => {
    const qRows = s.questions.map(q => {
      const vals = evals.map(e => (typeof e.respostas[q.id] === 'number' ? e.respostas[q.id] : null));
      const avg = calcMean(vals);
      const qDiag = getDiagnostic(avg);
      const selfVal = typeof autoAnswers[q.id] === 'number' ? autoAnswers[q.id] : null;
      return `
        <tr>
          <td>${escapeHtml(q.text)}</td>
          ${vals.map(v => `<td class="center">${v === null ? '-' : v}</td>`).join('')}
          <td class="center" style="font-weight: 700; color: ${qDiag.color};">${fmt(avg)}</td>
          <td class="center self-col">${selfVal === null ? '' : selfVal}</td>
        </tr>`;
    }).join('');
    return `<tr class="sec-row"><td colspan="${colSpan}">${escapeHtml(s.title)}</td></tr>${qRows}`;
  }).join('');

  // Linha totalizadora
  const totalLeaderCells = evals.map(e => `<td class="center">${fmt(calcMean(Object.values(e.respostas)))}</td>`).join('');
  const totalRowHtml = `
    <tr class="total-row">
      <td>MÉDIA GERAL CONSOLIDADA</td>
      ${totalLeaderCells}
      <td class="center" style="font-size: 0.95rem; color: ${diag.color};">${fmt(globalAvg)}</td>
      <td class="center self-col">${autoAvg === null ? '' : fmt(autoAvg)}</td>
    </tr>
  `;

  // Lista de Observações dos Líderes
  const notesWithText = evals.filter(e => e.observacoes && e.observacoes.trim().length > 0);
  let notesHtml = '';
  if (notesWithText.length) {
    notesHtml = `
      <div class="rep-notes-list">
        ${notesWithText.map(e => `
          <div class="rep-note-item">
            <div class="rep-note-meta">
              <span>Avaliador: ${escapeHtml(e.lider)}</span>
              <span>Data: ${e.data ? new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
            </div>
            <div class="rep-note-text">${escapeHtml(e.observacoes)}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    notesHtml = `
      <div class="rep-note-item" style="color: var(--ink-muted); font-style: italic;">
        Nenhuma observação textual registrada pelos líderes avaliadores.
      </div>
    `;
  }

  // Campo de autoavaliação do colaborador (preenchido no app ou à mão no PDF impresso)
  const autoText = auto && auto.observacoes ? auto.observacoes.trim() : '';
  const autoBoxHtml = `
    <div class="rep-section-title">Autoavaliação do Colaborador</div>
    <div class="rep-self-box">
      <div class="rep-self-note">Nota à parte: <strong>não compõe a Média Global</strong> calculada pelos líderes.</div>
      <div class="rep-self-score">Nota da autoavaliação (1 a 4):
        <span class="rep-self-score-box">${autoAvg === null ? '' : fmt(autoAvg)}</span>
      </div>
      <div class="rep-self-label">Comentários do colaborador:</div>
      ${autoText
        ? `<div class="rep-note-text" style="margin-bottom:6px;">${escapeHtml(autoText)}</div>`
        : `<div class="rep-self-line"></div><div class="rep-self-line"></div><div class="rep-self-line"></div><div class="rep-self-line"></div>`}
    </div>
  `;

  // Montagem do Relatório A4
  printableReport.innerHTML = `
    <!-- CABEÇALHO HARPIA -->
    <div class="rep-header">
      <div class="rep-brand">
        <img src="/logo.jpg" alt="Harpia Nutrição Animal" class="rep-logo-img">
      </div>
      <div class="rep-title-block">
        <div class="rep-doc-title">Diagnóstico de Desempenho</div>
        <div class="rep-doc-sub">Relatório Individual Consolidado</div>
      </div>
    </div>

    <!-- DADOS DO COLABORADOR E MÉDIA GLOBAL -->
    <div class="rep-summary-grid">
      <div class="rep-info-col">
        <p><strong>Colaborador(a):</strong> ${escapeHtml(colab.nome)}</p>
        <p><strong>Setor / Departamento:</strong> ${escapeHtml(colab.setor)}</p>
        <p><strong>Líder(es) Avaliador(es):</strong> ${escapeHtml(lideresStr)}</p>
        <p><strong>Total de Avaliações:</strong> ${totalEvals} avaliação(ões) consolidada(s)</p>
      </div>
      <div class="rep-score-col">
        <div class="rep-score-label">Média Global</div>
        <div class="rep-score-number" style="color: ${diag.color}">${fmt(globalAvg)}</div>
        <span class="diag-badge ${diag.class}">${diag.label}</span>
      </div>
    </div>

    <!-- DIAGNÓSTICO AUTOMÁTICO -->
    <div class="rep-diag-box" style="border-left-color: ${diag.color};">
      <div class="rep-diag-header">
        <span class="rep-diag-title">Diagnóstico Geral: ${diag.label}</span>
        <span style="font-size: 0.75rem; font-weight: 700; color: ${diag.color};">Média: ${fmt(globalAvg)} / 4,00</span>
      </div>
      <div class="rep-diag-desc">${diag.description}</div>
    </div>

    <!-- TABELA DE NOTAS POR PERGUNTA -->
    <div class="rep-section-title">Notas por Pergunta</div>
    <table class="rep-table">
      <thead>
        <tr>
          <th style="width: ${qW}%;">Pergunta</th>
          ${leaderHeadersHtml}
          <th class="center">Média</th>
          <th class="center self-col">Autoaval.<br><span style="font-weight:400; font-size:0.62rem;">(não soma)</span></th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        ${totalRowHtml}
      </tbody>
    </table>

    ${autoBoxHtml}

    <!-- OBSERVAÇÕES DOS LÍDERES (ao final) -->
    <div class="rep-section-title">Observações e Apontamentos dos Líderes</div>
    ${notesHtml}

    <!-- ASSINATURAS INSTITUCIONAIS -->
    <div class="rep-signatures">
      <div class="sign-line">
        <strong>${escapeHtml(colab.nome)}</strong><br>
        Colaborador(a) Avaliado(a)
      </div>
      <div class="sign-line">
        <strong>Liderança / Gestão de Pessoas</strong><br>
        Harpia Nutrição Animal
      </div>
    </div>

    <div class="rep-footer">
      Documento gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Harpia Nutrição Animal
    </div>

    <div class="no-print rep-history">
      <div class="rep-section-title">Histórico de avaliações (não sai no PDF)</div>
      ${evals.length ? evals.map(e => `
        <div class="history-row">
          <span><strong>${escapeHtml(e.lider)}</strong> · ${e.data ? new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} · média ${fmt(calcMean(Object.values(e.respostas)))}</span>
          <button class="btn btn-danger-outline" onclick="deleteEvaluation('${colab.id}', '${e.id}')">Excluir avaliação</button>
        </div>`).join('') : '<p class="subtitle">Nenhuma avaliação registrada ainda.</p>'}
      ${auto ? `
        <div class="history-row">
          <span><strong>Autoavaliação</strong> · ${auto.data ? new Date(auto.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} · nota ${fmt(autoAvg)} (não soma na média)</span>
          <button class="btn btn-danger-outline" onclick="deleteSelfEvaluation('${colab.id}')">Excluir autoavaliação</button>
        </div>` : ''}
    </div>
  `;
}

window.deleteSelfEvaluation = function(colabId) {
  const c = colaboradores.find(x => x.id === colabId);
  if (!c || !c.autoavaliacao) return;
  if (!confirm('Excluir a autoavaliação deste colaborador?')) return;
  delete c.autoavaliacao;
  saveColaboradores(colaboradores);
  renderPrintableReport(c);
};

btnReportBack.addEventListener('click', () => navigateTo('list'));
btnPrintPdf.addEventListener('click', () => {
  window.print();
});

// 10. INICIALIZAÇÃO
if (window.__dadosCorrompidos) {
  alert('Os dados salvos neste navegador estavam ilegíveis. Uma cópia foi preservada e o app foi aberto vazio. Se você tiver um backup, use "Restaurar backup".');
}
renderColaboradoresList();
