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
  // Body class drives video visibility as a :has() fallback; pause the video on result.
  document.body.className = 'screen-' + id;
  // Pause the bg video on result (saves battery + removes distraction).
  if (typeof BgVideo !== 'undefined') {
    if (id === 'result') BgVideo.pause();
    else BgVideo.resume();
  }
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

  // Use raw dimension sums (2-6 each) for precise matching
  // Each persona has a scoring function that returns affinity score
  var L = dimLevels;
  var S = dimSums;

  // Classify into quadrant first based on key dimensions
  var riskRaw = S.IM1 || 4;        // 2-6, high = risky
  var convRaw = S.IM2 || 4;        // 2-6, high = convicted
  var fomoRaw = S.EM1 || 4;        // 2-6, high = FOMO resistant
  var lossRaw = S.EM2 || 4;        // 2-6, high = loss tolerant
  var greedRaw = S.EM3 || 4;       // 2-6, high = greed managed
  var bullRaw = S.MW1 || 4;        // 2-6, high = bullish
  var narrRaw = S.MW2 || 4;        // 2-6, high = narrative driven
  var philoRaw = S.MW3 || 4;       // 2-6, high = pragmatic
  var timeRaw = S.TS1 || 4;        // 2-6, high = long term
  var deciRaw = S.TS2 || 4;        // 2-6, high = analytical
  var execRaw = S.TS3 || 4;        // 2-6, high = systematic
  var shareRaw = S.SB1 || 4;       // 2-6, high = shares alpha
  var commRaw = S.SB2 || 4;        // 2-6, high = active community
  var indepRaw = S.SB3 || 4;       // 2-6, high = independent

  // Each persona: 3 key dimensions weighted 3, 2 secondary weighted 2 = total weight always 13
  // This ensures no persona's score dominates by having more terms
  var scores = {};
  for (var k in personas) scores[k] = 0;

  // ── Smart Money (low risk + high conviction) ──
  scores.HODL  = (7-riskRaw)*3 + convRaw*3 + timeRaw*3 + lossRaw*2 + (7-shareRaw)*2;
  scores.SNPR  = deciRaw*3 + (7-shareRaw)*3 + convRaw*3 + fomoRaw*2 + (7-riskRaw)*2;
  scores.FARM  = execRaw*3 + greedRaw*3 + (7-riskRaw)*3 + deciRaw*2 + (7-narrRaw)*2;
  scores.BUIDL = commRaw*3 + timeRaw*3 + (7-narrRaw)*3 + convRaw*2 + (7-riskRaw)*2;
  scores.ALPHA = indepRaw*3 + (7-shareRaw)*3 + deciRaw*3 + convRaw*2 + fomoRaw*2;
  scores.WHALE = (7-shareRaw)*3 + convRaw*3 + (7-commRaw)*3 + lossRaw*2 + timeRaw*2;
  scores.MAXI  = (7-philoRaw)*3 + convRaw*3 + (7-riskRaw)*3 + commRaw*2 + indepRaw*2;
  scores.ANON  = (7-shareRaw)*3 + (7-commRaw)*3 + indepRaw*3 + deciRaw*2 + (7-riskRaw)*2;
  scores.BEAR  = (7-bullRaw)*3 + fomoRaw*3 + (7-riskRaw)*3 + convRaw*2 + indepRaw*2;
  scores.AIRD  = execRaw*3 + (7-shareRaw)*3 + (7-riskRaw)*3 + deciRaw*2 + greedRaw*2;
  scores.WAGMI = bullRaw*3 + shareRaw*3 + commRaw*3 + convRaw*2 + (7-fomoRaw)*2;

  // ── Diamond Degen (high risk + high conviction) ──
  scores.MOON  = bullRaw*3 + (7-greedRaw)*3 + riskRaw*3 + convRaw*2 + shareRaw*2;
  scores.CHEF  = riskRaw*3 + convRaw*3 + (7-shareRaw)*3 + bullRaw*2 + deciRaw*2;

  // ── Rotating Andy (low risk + low conviction) ──
  scores.COPE  = philoRaw*3 + lossRaw*3 + (7-indepRaw)*3 + (7-riskRaw)*2 + (7-convRaw)*2;
  scores.PAPER = (7-convRaw)*3 + (7-lossRaw)*3 + (7-greedRaw)*3 + (7-riskRaw)*2 + fomoRaw*2;
  scores.FLIP  = narrRaw*3 + (7-timeRaw)*3 + (7-convRaw)*3 + riskRaw*2 + (7-deciRaw)*2;
  scores.GURU  = shareRaw*3 + narrRaw*3 + (7-indepRaw)*3 + commRaw*2 + (7-convRaw)*2;
  scores.DEAD  = (7-commRaw)*3 + (7-shareRaw)*3 + (7-convRaw)*3 + (7-riskRaw)*2 + timeRaw*2;

  // ── Absolute Gambler (high risk + low conviction) ──
  scores.DGEN  = riskRaw*3 + (7-fomoRaw)*3 + (7-deciRaw)*3 + (7-convRaw)*2 + (7-timeRaw)*2;
  scores.NGMI  = (7-indepRaw)*3 + (7-fomoRaw)*3 + riskRaw*3 + (7-convRaw)*2 + (7-lossRaw)*2;
  scores.REKT  = riskRaw*3 + (7-lossRaw)*3 + (7-greedRaw)*3 + (7-convRaw)*2 + (7-deciRaw)*2;
  scores.FOMO  = (7-fomoRaw)*3 + riskRaw*3 + (7-timeRaw)*3 + narrRaw*2 + (7-convRaw)*2;
  scores.SHILL = shareRaw*3 + narrRaw*3 + (7-indepRaw)*3 + commRaw*2 + riskRaw*2;
  scores.NEWB  = (7-deciRaw)*3 + riskRaw*3 + (7-indepRaw)*3 + (7-convRaw)*2 + (7-fomoRaw)*2;

  // Find the highest scoring persona
  var bestCode = null;
  var bestScore = -Infinity;
  for (var code in scores) {
    if (scores[code] > bestScore) {
      bestScore = scores[code];
      bestCode = code;
    }
  }

  state.result = personas[bestCode];

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

  // Determine quadrant from PERSONA's canonical position (not user's scatter)
  // This keeps the stamp consistent with the persona identity
  var pRisk = p.scatter.risk;
  var pConv = p.scatter.conviction;
  var qKey = pRisk < 50 && pConv >= 50 ? 'smart_money'
    : pRisk >= 50 && pConv >= 50 ? 'diamond_degen'
    : pRisk < 50 && pConv < 50 ? 'rotating_andy'
    : 'gambler';
  var qLabel = {
    smart_money:   'Smart Money · 聪明钱',
    diamond_degen: 'Diamond Degen · 钻石赌狗',
    rotating_andy: 'Rotating Andy · 旋转安迪',
    gambler:       'Absolute Gambler · 纯赌怪'
  }[qKey];

  // Apply quadrant class to persona card (for glow + accent)
  var card = document.getElementById('persona-card');
  if (card) {
    card.classList.remove('q-smart_money','q-diamond_degen','q-rotating_andy','q-gambler');
    card.classList.add('q-' + qKey);
  }

  document.getElementById('persona-badge').textContent = 'Your Crypto Persona · 你的加密人格';
  var qEl = document.getElementById('persona-quadrant');
  if (qEl) {
    qEl.className = 'persona-quadrant q-' + qKey;
    qEl.textContent = qLabel;
  }

  const memeImg = document.getElementById('persona-meme');
  memeImg.onerror = null;
  memeImg.style.display = '';
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

  // All bars use white — editorial/monochrome. The persona quadrant color is already
  // established in the stamp + meme card + scatter glow. Keep the dims section as
  // a clean data readout.
  const barColor = '#ffffff';

  for (const [model, dims] of Object.entries(groups)) {
    const group = document.createElement('div');
    group.className = 'dim-group';

    group.innerHTML = `<div class="dim-group-title">${model}</div>`;

    for (const d of dims) {
      const score = state.dimScores[d.dim] || 2;
      const level = state.dimLevels[d.dim] || 'L';
      const pct = ((score - 2) / 4) * 100; // 2-6 → 0-100

      const row = document.createElement('div');
      row.className = 'dim-row';
      row.innerHTML = `
        <span class="dim-label">${d.en}</span>
        <div class="dim-bar-track">
          <div class="dim-bar-fill" style="width: ${pct}%; background: ${barColor}"></div>
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

  // New palette (matches CSS tokens)
  const C = {
    sm:   '#00E676',  // Smart Money
    dd:   '#B24BF3',  // Diamond Degen
    ra:   '#FFB800',  // Rotating Andy
    ag:   '#FF2E4C',  // Absolute Gambler
    grid: 'rgba(255,255,255,0.08)',
    axis: 'rgba(255,255,255,0.35)',
    label: 'rgba(255,255,255,0.45)'
  };

  // Single pad value — leaves room above for top quadrant labels and below for bottom labels + axis.
  const pad = 36;
  const plotSize = size - pad * 2;

  // Subtle quadrant washes — very low alpha on black
  const qWash = [
    { x: 0, y: 0, fill: 'rgba(0,230,118,0.04)'  },   // Smart Money
    { x: 1, y: 0, fill: 'rgba(178,75,243,0.05)' },   // Diamond Degen
    { x: 0, y: 1, fill: 'rgba(255,184,0,0.04)'  },   // Rotating Andy
    { x: 1, y: 1, fill: 'rgba(255,46,76,0.05)'  },   // Gambler
  ];
  qWash.forEach(q => {
    ctx.fillStyle = q.fill;
    ctx.fillRect(pad + q.x * plotSize / 2, pad + q.y * plotSize / 2, plotSize / 2, plotSize / 2);
  });

  // Grid: thin mid-lines
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(pad + plotSize / 2, pad);
  ctx.lineTo(pad + plotSize / 2, pad + plotSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad, pad + plotSize / 2);
  ctx.lineTo(pad + plotSize, pad + plotSize / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer frame
  ctx.strokeStyle = C.grid;
  ctx.strokeRect(pad, pad, plotSize, plotSize);

  // Axis labels — mono, terminal feel. Risk label sits below the quadrant labels.
  ctx.fillStyle = C.label;
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RISK  →  风险偏好', pad + plotSize / 2, pad + plotSize + 34);
  ctx.save();
  ctx.translate(14, pad + plotSize / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('CONVICTION  →  信念强度', 0, 0);
  ctx.restore();

  // Quadrant labels — placed OUTSIDE the plot so they never collide with dots
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = C.sm + 'B0';
  ctx.fillText('SMART MONEY',     pad + plotSize * 0.25, pad - 8);
  ctx.fillStyle = C.dd + 'B0';
  ctx.fillText('DIAMOND DEGEN',   pad + plotSize * 0.75, pad - 8);
  ctx.fillStyle = C.ra + 'B0';
  ctx.fillText('ROTATING ANDY',   pad + plotSize * 0.25, pad + plotSize + 16);
  ctx.fillStyle = C.ag + 'B0';
  ctx.fillText('ABSOLUTE GAMBLER', pad + plotSize * 0.75, pad + plotSize + 16);

  // Plot other personas as dim dots
  ctx.globalAlpha = 0.45;
  for (const [code, p] of Object.entries(personas)) {
    if (code === state.result.code) continue;
    const x = pad + (p.scatter.risk / 100) * plotSize;
    const y = pad + (1 - p.scatter.conviction / 100) * plotSize;
    ctx.fillStyle = getQuadrantColor(p.scatter.risk, p.scatter.conviction);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // User dot is plotted at the PERSONA's canonical position.
  // Rationale: the rule-based scorer and the risk/conviction axis math can disagree
  // (different dimensions feed each), so a user scoring BUIDL could end up visually
  // in the Rotating Andy quadrant, which contradicts the SMART MONEY stamp. Plotting
  // at canonical keeps everything coherent. The user's actual answer breakdown is
  // already shown in the dimension bars below.
  const ux = pad + (state.result.scatter.risk / 100) * plotSize;
  const uy = pad + (1 - state.result.scatter.conviction / 100) * plotSize;
  const userColor = getQuadrantColor(state.result.scatter.risk, state.result.scatter.conviction);

  // Outer glow
  const glow = ctx.createRadialGradient(ux, uy, 0, ux, uy, 28);
  glow.addColorStop(0, userColor + '66');
  glow.addColorStop(1, userColor + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ux, uy, 28, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.strokeStyle = userColor + '55';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ux, uy, 14, 0, Math.PI * 2);
  ctx.stroke();

  // Core dot
  ctx.fillStyle = userColor;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ux, uy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Label with mono font — position below dot if too close to top edge to avoid clashing with quadrant title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  var labelAbove = (uy - pad) > 40;
  var labelY = labelAbove ? (uy - 18) : (uy + 24);
  ctx.fillText(state.result.code, ux, labelY);
}

function getQuadrantColor(risk, conviction) {
  if (risk < 50 && conviction >= 50) return '#00E676'; // Smart Money
  if (risk >= 50 && conviction >= 50) return '#B24BF3'; // Diamond Degen
  if (risk < 50 && conviction < 50) return '#FFB800'; // Rotating Andy
  return '#FF2E4C';                                    // Gambler
}

// ── Share ──

function getShareText() {
  const p = state.result;
  // Use the PERSONA's canonical risk/conviction so the share text matches
  // the stamp and scatter dot (otherwise user-derived numbers can contradict
  // the persona label — e.g. "BUIDL / Smart Money" with "Risk 62%").
  const risk = p.scatter.risk;
  const conv = p.scatter.conviction;
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
// ── Background video control ──
// bg.mp4 is pre-baked as forward+reverse concatenated (see assets/video/),
// so the browser's native `loop` attribute produces seamless ping-pong.
// We only need to play/pause it when switching screens.
const BgVideo = {
  _el: null,
  _get: function () {
    if (!this._el) this._el = document.querySelector('.bg-video');
    return this._el;
  },
  resume: function () {
    var v = this._get();
    if (!v) return;
    try { v.play().catch(function () {}); } catch (e) {}
  },
  pause: function () {
    var v = this._get();
    if (!v) return;
    try { v.pause(); } catch (e) {}
  },
};

document.addEventListener('DOMContentLoaded', () => {
  showScreen('landing');
});
