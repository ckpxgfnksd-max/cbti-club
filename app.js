// ============================================================
// CBTI — Crypto Behavioral Type Indicator
// App: quiz engine, scoring, rendering, scatter plot
// ============================================================

const QUESTIONS_PER_PAGE = 4;

const state = {
  answers: {},       // { q1: 2, q2: 3, ... }
  shuffledQs: [],    // shuffled question order
  currentPage: 0,    // current quiz page index
  totalPages: 0,     // total pages
  result: null,      // computed persona
  dimScores: {},     // { IM1: 4, IM2: 2, ... }
  dimLevels: {},     // { IM1: 'M', IM2: 'L', ... }
  scatterPos: null,  // { risk: 65, conviction: 40 }
};

// ── Utilities ──

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sumToLevel(sum) {
  if (sum <= 2) return 'L';
  if (sum <= 4) return 'M';
  return 'H';
}

function levelToNum(level) {
  return level === 'H' ? 3 : level === 'M' ? 2 : 1;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Quiz rendering ──

function startTest() {
  state.answers = {};
  state.shuffledQs = shuffle(questions);
  state.currentPage = 0;
  state.totalPages = Math.ceil(state.shuffledQs.length / QUESTIONS_PER_PAGE);
  showScreen('quiz');
  renderPage(0);
}

// ── Pagination ──

function getPageQuestions(pageIndex) {
  const start = pageIndex * QUESTIONS_PER_PAGE;
  return state.shuffledQs.slice(start, start + QUESTIONS_PER_PAGE);
}

function renderPage(pageIndex) {
  state.currentPage = pageIndex;
  const container = document.getElementById('questions-list');
  container.innerHTML = '';
  container.classList.remove('page-enter');

  const pageQs = getPageQuestions(pageIndex);
  const globalOffset = pageIndex * QUESTIONS_PER_PAGE;

  pageQs.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    if (state.answers[q.id] !== undefined) card.classList.add('answered');
    card.id = 'card-' + q.id;

    const dim = dimensionMeta[q.dim];
    const globalIdx = globalOffset + i + 1;

    card.innerHTML =
      '<div class="question-header">' +
        '<span class="question-num"># ' + globalIdx + '</span>' +
        '<span class="question-dim">' + (dim ? dim.en : q.dim) + '</span>' +
      '</div>' +
      '<div class="question-text">' + q.text + '</div>' +
      '<div class="question-text-en">' + q.en + '</div>' +
      '<div class="option-list">' +
        q.options.map(function(opt, oi) {
          var selected = state.answers[q.id] === opt.value ? ' selected' : '';
          return '<button class="option-btn' + selected + '" data-qid="' + q.id + '" data-value="' + opt.value + '">' +
            '<span class="option-label">' + String.fromCharCode(65 + oi) + '</span>' +
            '<span class="option-text-wrap">' +
              '<span>' + opt.label + '</span>' +
              '<span class="option-text-en">' + opt.en + '</span>' +
            '</span>' +
          '</button>';
        }).join('') +
      '</div>';

    container.appendChild(card);
  });

  // Bind clicks
  container.querySelectorAll('.option-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qid = btn.dataset.qid;
      var value = parseInt(btn.dataset.value);
      state.answers[qid] = value;

      var card = btn.closest('.question-card');
      card.querySelectorAll('.option-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      card.classList.add('answered');

      updateProgress();
      updateNav();
      checkAutoAdvance();
    });
  });

  // Animate in
  requestAnimationFrame(function() { container.classList.add('page-enter'); });

  updateProgress();
  updateNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkAutoAdvance() {
  if (state.currentPage >= state.totalPages - 1) return; // don't auto on last page
  var pageQs = getPageQuestions(state.currentPage);
  var allAnswered = pageQs.every(function(q) { return state.answers[q.id] !== undefined; });
  if (allAnswered) {
    setTimeout(function() { nextPage(); }, 400);
  }
}

function nextPage() {
  // On last page, submit if all 30 answered
  if (state.currentPage >= state.totalPages - 1) {
    if (Object.keys(state.answers).length >= state.shuffledQs.length) {
      submitQuiz();
    }
    return;
  }

  var pageQs = getPageQuestions(state.currentPage);
  var allAnswered = pageQs.every(function(q) { return state.answers[q.id] !== undefined; });
  if (!allAnswered) return;

  renderPage(state.currentPage + 1);
}

function prevPage() {
  if (state.currentPage <= 0) return;
  renderPage(state.currentPage - 1);
}

function updateProgress() {
  var total = state.shuffledQs.length;
  var answered = Object.keys(state.answers).length;
  var pct = (answered / total) * 100;

  document.querySelector('.progress-bar-fill').style.width = pct + '%';
  document.querySelector('.progress-text').textContent = answered + ' / ' + total;
  document.querySelector('.page-indicator').textContent = (state.currentPage + 1) + ' / ' + state.totalPages;
}

function updateNav() {
  var prevBtn = document.querySelector('.btn-prev');
  var nextBtn = document.querySelector('.btn-next');

  // Back button: hide on first page
  prevBtn.style.visibility = state.currentPage === 0 ? 'hidden' : 'visible';

  // Next button: check if all current page questions answered
  var pageQs = getPageQuestions(state.currentPage);
  var allAnswered = pageQs.every(function(q) { return state.answers[q.id] !== undefined; });

  if (state.currentPage >= state.totalPages - 1) {
    nextBtn.textContent = 'See Results ✨';
  } else {
    nextBtn.textContent = 'Next →';
  }

  if (allAnswered) {
    nextBtn.classList.remove('disabled');
  } else {
    nextBtn.classList.add('disabled');
  }
}

function submitQuiz() {
  computeResult();
  showScreen('result');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      renderResult();
    });
  });
}

// ── Scoring ──

function computeResult() {
  // Sum scores per dimension
  const dimSums = {};
  for (const dim of Object.keys(dimensionMeta)) {
    dimSums[dim] = 0;
  }
  for (const q of questions) {
    if (state.answers[q.id] !== undefined) {
      dimSums[q.dim] = (dimSums[q.dim] || 0) + state.answers[q.id];
    }
  }

  // Convert to levels
  const dimLevels = {};
  for (const [dim, sum] of Object.entries(dimSums)) {
    dimLevels[dim] = sumToLevel(sum);
  }

  state.dimScores = dimSums;
  state.dimLevels = dimLevels;

  // Build pattern string: IM1 IM2 IM3 - EM1 EM2 EM3 - MW1 MW2 MW3 - TS1 TS2 TS3 - SB1 SB2 SB3
  const dimOrder = ['IM1','IM2','IM3','EM1','EM2','EM3','MW1','MW2','MW3','TS1','TS2','TS3','SB1','SB2','SB3'];
  const pattern = dimOrder.map(d => dimLevels[d]).join('');

  // Find closest persona by pattern matching (Hamming distance)
  let bestMatch = null;
  let bestDist = Infinity;

  for (const [code, persona] of Object.entries(personas)) {
    const pPattern = persona.pattern.replace(/-/g, '');
    let dist = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== pPattern[i]) {
        // Weight the distance: H-L = 2, H-M or M-L = 1
        const a = levelToNum(pattern[i]);
        const b = levelToNum(pPattern[i]);
        dist += Math.abs(a - b);
      }
    }
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = persona;
    }
  }

  state.result = bestMatch;

  // Compute scatter position from dimension scores
  const riskScore = computeAxisScore(scatterWeights.risk, dimSums);
  const convictionScore = computeAxisScore(scatterWeights.conviction, dimSums);
  state.scatterPos = { risk: riskScore, conviction: convictionScore };
}

function computeAxisScore(weights, dimSums) {
  let weighted = 0;
  let totalWeight = 0;
  for (const [dim, w] of Object.entries(weights)) {
    const raw = dimSums[dim] || 4; // default midpoint (2-6 range, mid=4)
    var normalized = ((raw - 2) / 4) * 100; // 2-6 → 0-100
    // Negative weight = inverse: high score on this dim means LOW on the axis
    if (w < 0) normalized = 100 - normalized;
    weighted += normalized * Math.abs(w);
    totalWeight += Math.abs(w);
  }
  var score = weighted / totalWeight;
  // Spread from center: push toward edges slightly so dots don't cluster in the middle
  score = 50 + (score - 50) * 1.3;
  return Math.max(5, Math.min(95, score));
}

// ── Result rendering ──

function renderResult() {
  const p = state.result;
  if (!p) return;

  document.getElementById('persona-badge').textContent = '你的加密人格 / Your Crypto Persona';
  const memeImg = document.getElementById('persona-meme');
  // Reset state from previous render
  memeImg.onerror = null;
  memeImg.style.display = '';
  // Set new image
  const imgSrc = 'assets/personas/' + p.code + '.jpg';
  memeImg.alt = p.cn;
  memeImg.onerror = function() { this.style.display = 'none'; };
  memeImg.src = imgSrc;
  document.getElementById('persona-code').textContent = p.code;
  document.getElementById('persona-cn').textContent = p.cn;
  document.getElementById('persona-en').textContent = p.en;
  document.getElementById('persona-intro').textContent = p.intro;
  document.getElementById('persona-intro-en').textContent = p.introEn;
  document.getElementById('persona-desc').textContent = p.desc;
  document.getElementById('persona-desc-en').textContent = p.descEn;

  renderDimensions();
  renderScatter();
}

function renderDimensions() {
  const container = document.getElementById('dims-list');
  container.innerHTML = '';

  // Group by model
  const groups = {};
  for (const [dim, meta] of Object.entries(dimensionMeta)) {
    if (!groups[meta.model]) groups[meta.model] = [];
    groups[meta.model].push({ dim, ...meta });
  }

  const colors = {
    '投资心态 Investment Mindset': 'var(--green)',
    '情绪管理 Emotional Control': 'var(--orange)',
    '市场观 Market Worldview': 'var(--blue)',
    '交易风格 Trading Style': 'var(--purple)',
    '社交行为 Social Behavior': 'var(--yellow)',
  };

  for (const [model, dims] of Object.entries(groups)) {
    const group = document.createElement('div');
    group.className = 'dim-group';
    const color = colors[model] || 'var(--accent)';

    group.innerHTML = `<div class="dim-group-title" style="color: ${color}">${model}</div>`;

    for (const d of dims) {
      const score = state.dimScores[d.dim] || 2;
      const level = state.dimLevels[d.dim] || 'L';
      const pct = ((score - 2) / 4) * 100; // 2-6 → 0-100

      const row = document.createElement('div');
      row.className = 'dim-row';
      row.innerHTML = `
        <span class="dim-label">${d.en}</span>
        <div class="dim-bar-track">
          <div class="dim-bar-fill" style="width: ${pct}%; background: ${color}"></div>
        </div>
        <span class="dim-level ${level}">${level}</span>
      `;
      group.appendChild(row);
    }

    container.appendChild(group);
  }
}

function renderScatter() {
  const canvas = document.getElementById('scatter-canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;
  const size = Math.min(parent.clientWidth, parent.clientHeight) || 360;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const pad = 40;
  const plotSize = size - pad * 2;

  // Background quadrants
  const qColors = [
    { x: 0, y: 0, color: 'rgba(0, 212, 170, 0.06)' },  // Smart Money (low risk, high conviction)
    { x: 1, y: 0, color: 'rgba(170, 102, 255, 0.06)' }, // Diamond Degen (high risk, high conviction)
    { x: 0, y: 1, color: 'rgba(255, 204, 0, 0.06)' },   // Rotating Andy (low risk, low conviction)
    { x: 1, y: 1, color: 'rgba(255, 68, 102, 0.06)' },  // Gambler (high risk, low conviction)
  ];

  qColors.forEach(q => {
    ctx.fillStyle = q.color;
    ctx.fillRect(pad + q.x * plotSize / 2, pad + q.y * plotSize / 2, plotSize / 2, plotSize / 2);
  });

  // Grid lines
  ctx.strokeStyle = '#2a2a3e';
  ctx.lineWidth = 1;

  // Midpoint dashed lines
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad + plotSize / 2, pad);
  ctx.lineTo(pad + plotSize / 2, pad + plotSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad, pad + plotSize / 2);
  ctx.lineTo(pad + plotSize, pad + plotSize / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Border
  ctx.strokeStyle = '#2a2a3e';
  ctx.strokeRect(pad, pad, plotSize, plotSize);

  // Axis labels
  ctx.fillStyle = '#8888a0';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Risk Appetite / 风险偏好 →', pad + plotSize / 2, size - 5);
  ctx.save();
  ctx.translate(12, pad + plotSize / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Conviction / 信念强度 →', 0, 0);
  ctx.restore();

  // Quadrant labels
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#00d4aa66';
  ctx.fillText('Smart Money', pad + plotSize * 0.25, pad + plotSize * 0.08);
  ctx.fillStyle = '#aa66ff66';
  ctx.fillText('Diamond Degen', pad + plotSize * 0.75, pad + plotSize * 0.08);
  ctx.fillStyle = '#ffcc0066';
  ctx.fillText('Rotating Andy', pad + plotSize * 0.25, pad + plotSize * 0.95);
  ctx.fillStyle = '#ff446666';
  ctx.fillText('Absolute Gambler', pad + plotSize * 0.75, pad + plotSize * 0.95);

  // Plot all personas as small dots
  ctx.globalAlpha = 0.3;
  for (const [code, p] of Object.entries(personas)) {
    if (code === state.result.code) continue;
    const x = pad + (p.scatter.risk / 100) * plotSize;
    const y = pad + (1 - p.scatter.conviction / 100) * plotSize;
    ctx.fillStyle = getQuadrantColor(p.scatter.risk, p.scatter.conviction);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Plot user position (big dot + label)
  const ux = pad + (state.scatterPos.risk / 100) * plotSize;
  const uy = pad + (1 - state.scatterPos.conviction / 100) * plotSize;

  // Glow
  const glow = ctx.createRadialGradient(ux, uy, 0, ux, uy, 20);
  glow.addColorStop(0, 'rgba(0, 212, 170, 0.4)');
  glow.addColorStop(1, 'rgba(0, 212, 170, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ux, uy, 20, 0, Math.PI * 2);
  ctx.fill();

  // Dot
  ctx.fillStyle = '#00d4aa';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ux, uy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Label
  ctx.fillStyle = '#00d4aa';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.result.code, ux, uy - 14);
}

function getQuadrantColor(risk, conviction) {
  if (risk < 50 && conviction >= 50) return '#00d4aa';
  if (risk >= 50 && conviction >= 50) return '#aa66ff';
  if (risk < 50 && conviction < 50) return '#ffcc00';
  return '#ff4466';
}

// ── Share ──

function getShareText() {
  const p = state.result;
  const risk = state.scatterPos.risk;
  const conv = state.scatterPos.conviction;
  const quadrantMap = {
    sm: { en: 'Smart Money', cn: '聪明钱' },
    dd: { en: 'Diamond Degen', cn: '钻石赌狗' },
    ra: { en: 'Rotating Andy', cn: '旋转安迪' },
    ag: { en: 'Absolute Gambler', cn: '纯赌怪' },
  };
  const qKey = risk < 50 && conv >= 50 ? 'sm'
    : risk >= 50 && conv >= 50 ? 'dd'
    : risk < 50 && conv < 50 ? 'ra' : 'ag';
  const q = quadrantMap[qKey];

  return [
    `我的加密人格是 ${p.code}「${p.cn}」${p.en}`,
    `My crypto persona is ${p.code}「${p.cn}」${p.en}`,
    ``,
    `"${p.intro}"`,
    `"${p.introEn}"`,
    ``,
    `象限 Quadrant: ${q.cn} ${q.en}`,
    `风险 Risk: ${Math.round(risk)}% | 信念 Conviction: ${Math.round(conv)}%`,
    ``,
    `来测测你的加密人格 👉 https://cbti.club`,
    `Take the test 👉 https://cbti.club`,
    ``,
    `#CBTI #CryptoPersonality`
  ].join('\n');
}

function shareResult() {
  const text = getShareText();
  const twitterUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
  window.open(twitterUrl, '_blank');
}

function copyShareText() {
  const text = getShareText();
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-copy');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function retryTest() {
  showScreen('landing');
}

function copyAddress(el) {
  const addr = el.querySelector('code').textContent;
  navigator.clipboard.writeText(addr).then(() => {
    const copyEl = el.querySelector('.tips-copy');
    copyEl.textContent = 'copied!';
    setTimeout(() => { copyEl.textContent = 'copy'; }, 2000);
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  showScreen('landing');
});
