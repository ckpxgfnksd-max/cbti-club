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

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function showScreen(id, anchor) {
  clearAutoAdvance();
  var el = document.getElementById(id);
  if (!el || !el.classList.contains('screen')) { el = document.getElementById('landing'); id = 'landing'; }
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  el.classList.add('active');
  // The body class names the active screen (styling hook). Replace any existing screen-*
  // class while preserving everything else.
  var preserved = (document.body.className || '').split(/\s+/).filter(function (c) {
    return c && c.indexOf('screen-') !== 0;
  });
  preserved.push('screen-' + id);
  document.body.className = preserved.join(' ');

  // Landing anchors (#types, #method, #writing) scroll to their section; every other screen
  // change starts at the top. Run once now and once on the next frame: the second pass wins
  // over the browser's own deep-link scroll on direct loads.
  var target = anchor ? document.getElementById(anchor) : null;
  var place = function () {
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  };
  place();
  requestAnimationFrame(place);
}

// ── Hash router. #landing is the default screen; #quiz and #result are driven by the test
// itself (they have no URL, as before). Landing sections are reachable as #types, #method
// and #writing. The old routes (#read, #chase, #paper, #essay-three-body, #chase-*) moved to
// chasewang.me: the table lives in index.html (window.CBTI_LEGACY) so the redirect can run
// before first paint; hashchange lands here.
var ROUTED_SCREENS = ['landing'];
var LANDING_ANCHORS = ['types', 'method', 'writing', 'site-main'];
function routeFromHash() {
  var hash = '';
  try { hash = decodeURIComponent((location.hash || '').replace('#', '')); } catch (e) { hash = ''; }
  var legacy = window.CBTI_LEGACY || {};
  if (Object.prototype.hasOwnProperty.call(legacy, hash)) {
    location.replace(legacy[hash]);
    return;
  }
  if (ROUTED_SCREENS.indexOf(hash) !== -1) {
    showScreen(hash);
  } else if (!hash || hash === 'node') {
    if (hash === 'node') history.replaceState(null, '', '#landing');
    showScreen('landing');
  } else if (LANDING_ANCHORS.indexOf(hash) !== -1) {
    showScreen('landing', hash);
  }
  // else: leave current screen alone (e.g. during quiz)
}

// A link to the hash already in the address bar fires no hashchange (for example "类型"
// clicked again from the quiz). Route it by hand so the nav always works.
function routeSameHashClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
  if (!link) return;
  var url;
  try { url = new URL(link.getAttribute('href'), location.href); } catch (e) { return; }
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  if (url.hash === location.hash) {
    event.preventDefault();
    routeFromHash();
  }
}

// ── Quiz rendering ──

function startTest() {
  clearAutoAdvance();
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

  const pageQs = getPageQuestions(pageIndex);
  const globalOffset = pageIndex * QUESTIONS_PER_PAGE;
  const total = state.shuffledQs.length;

  pageQs.forEach((q, i) => {
    const card = document.createElement('section');
    card.className = 'cbti-q question-card';
    if (state.answers[q.id] !== undefined) card.classList.add('answered');
    card.id = 'card-' + q.id;
    card.setAttribute('aria-labelledby', 'qt-' + q.id);

    const dim = dimensionMeta[q.dim];
    const globalIdx = globalOffset + i + 1;

    card.innerHTML =
      '<p class="cbti-q-meta">' +
        '<span>' + String(globalIdx).padStart(2, '0') + ' / ' + total + '</span>' +
        '<span lang="en">' + esc(dim ? dim.en : q.dim) + '</span>' +
      '</p>' +
      '<h2 class="cbti-q-text" id="qt-' + q.id + '">' + esc(q.text) + '</h2>' +
      '<p class="cbti-q-en" lang="en">' + esc(q.en) + '</p>' +
      '<div class="cbti-options" role="group" aria-labelledby="qt-' + q.id + '">' +
        q.options.map(function(opt, oi) {
          var selected = state.answers[q.id] === opt.value;
          return '<button type="button" class="cbti-option option-btn' + (selected ? ' selected' : '') + '" aria-pressed="' + selected + '" data-qid="' + q.id + '" data-value="' + opt.value + '">' +
            '<span class="cbti-option-key" aria-hidden="true">' + String.fromCharCode(65 + oi) + '</span>' +
            '<span class="cbti-option-body">' +
              '<span>' + esc(opt.label) + '</span>' +
              '<span class="cbti-option-en" lang="en">' + esc(opt.en) + '</span>' +
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
      card.querySelectorAll('.option-btn').forEach(function(b) {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      card.classList.add('answered');

      updateProgress();
      updateNav();
      checkAutoAdvance();
    });
  });

  updateProgress();
  updateNav();

  // Keyboard and screen-reader users continue from the new page, not from the top of the
  // document. Page 1 starts at the top; later pages scroll to the question column.
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', '第 ' + (pageIndex + 1) + ' / ' + state.totalPages + ' 页');
  try { container.focus({ preventScroll: true }); } catch (e) { container.focus(); }
  var behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  var main = document.querySelector('.cbti-quiz-main');
  if (pageIndex === 0 || !main) window.scrollTo({ top: 0, behavior: behavior });
  else main.scrollIntoView({ behavior: behavior, block: 'start' });
}

// Auto-advance: at most one pending timer, cancelled by any navigation, so Back pressed within the
// 400 ms window wins over a stale advance (review r1). Navigation only; scoring is untouched.
var autoAdvanceTimer = null;
function clearAutoAdvance() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function checkAutoAdvance() {
  if (state.currentPage >= state.totalPages - 1) return; // don't auto on last page
  var pageQs = getPageQuestions(state.currentPage);
  var allAnswered = pageQs.every(function(q) { return state.answers[q.id] !== undefined; });
  if (allAnswered) {
    clearAutoAdvance();
    var fromPage = state.currentPage;
    autoAdvanceTimer = setTimeout(function() {
      autoAdvanceTimer = null;
      if (state.currentPage === fromPage) nextPage();
    }, 400);
  }
}

function nextPage() {
  clearAutoAdvance();
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
  clearAutoAdvance();
  if (state.currentPage <= 0) return;
  renderPage(state.currentPage - 1);
}

function updateProgress() {
  var total = state.shuffledQs.length;
  var answered = Object.keys(state.answers).length;

  var bar = document.querySelector('.cbti-quiz-status progress');
  if (bar) {
    bar.max = total;
    bar.value = answered;
    bar.textContent = answered + ' / ' + total;
  }
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
    nextBtn.textContent = '查看结果 · See results';
  } else {
    nextBtn.textContent = '下一页 · Next';
  }

  if (allAnswered) {
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled', 'false');
  } else {
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled', 'true');
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

// ── Quadrants ──
// Quadrant = persona's canonical coordinates, same thresholds everywhere (stamp, maps, index).
var QUADRANTS = {
  smart_money:   { cls: 'q-smart',    zh: '聪明钱',   en: 'Smart Money',      rule: '风险 < 50 · 信念 ≥ 50' },
  diamond_degen: { cls: 'q-diamond',  zh: '钻石赌狗', en: 'Diamond Degen',    rule: '风险 ≥ 50 · 信念 ≥ 50' },
  rotating_andy: { cls: 'q-rotating', zh: '旋转安迪', en: 'Rotating Andy',    rule: '风险 < 50 · 信念 < 50' },
  gambler:       { cls: 'q-gambler',  zh: '纯赌怪',   en: 'Absolute Gambler', rule: '风险 ≥ 50 · 信念 < 50' }
};
var QUADRANT_ORDER = ['smart_money', 'diamond_degen', 'rotating_andy', 'gambler'];

function quadrantOf(scatter) {
  var risk = scatter.risk, conviction = scatter.conviction;
  return risk < 50 && conviction >= 50 ? 'smart_money'
    : risk >= 50 && conviction >= 50 ? 'diamond_degen'
    : risk < 50 && conviction < 50 ? 'rotating_andy'
    : 'gambler';
}

function quadrantCounts() {
  var counts = {};
  QUADRANT_ORDER.forEach(function (k) { counts[k] = 0; });
  Object.keys(personas).forEach(function (k) { counts[quadrantOf(personas[k].scatter)] += 1; });
  return counts;
}

// ── Result rendering ──

function renderResult() {
  const p = state.result;
  if (!p) return;

  // Determine quadrant from PERSONA's canonical position (not user's scatter)
  // This keeps the stamp consistent with the persona identity
  var qKey = quadrantOf(p.scatter);
  var q = QUADRANTS[qKey];

  var card = document.getElementById('persona-card');
  if (card) {
    card.classList.remove('q-smart', 'q-diamond', 'q-rotating', 'q-gambler');
    card.classList.add(q.cls);
  }
  var qEl = document.getElementById('persona-quadrant');
  if (qEl) {
    qEl.innerHTML = '<span class="q-swatch ' + q.cls + '" aria-hidden="true"></span>' + q.zh + ' <span lang="en">' + q.en + '</span>';
  }

  const memeImg = document.getElementById('persona-meme');
  memeImg.onerror = null;
  memeImg.style.display = '';
  memeImg.alt = p.cn;
  memeImg.onerror = function() { this.style.display = 'none'; };
  memeImg.src = '/assets/personas/' + p.code + '.jpg';

  document.getElementById('persona-code').textContent = p.code;
  document.getElementById('persona-cn').textContent = p.cn;
  document.getElementById('persona-en').textContent = p.en;
  document.getElementById('persona-intro').textContent = p.intro;
  document.getElementById('persona-intro-en').textContent = p.introEn;
  document.getElementById('persona-desc').textContent = p.desc;
  document.getElementById('persona-desc-en').textContent = p.descEn;

  renderDimensions();
  renderScatter();

  // Move focus to the reveal so keyboard and screen-reader users land on the result.
  var heading = document.getElementById('persona-code');
  if (heading) {
    try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
  }
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

  for (const [model, dims] of Object.entries(groups)) {
    const group = document.createElement('div');
    group.className = 'cbti-dim-group';
    const rows = dims.map(function (d) {
      const score = state.dimScores[d.dim] || 2;
      const level = state.dimLevels[d.dim] || 'L';
      const pct = ((score - 2) / 4) * 100; // 2-6 → 0-100
      return '<li class="cbti-dim-row">' +
        '<span class="cbti-dim-code">' + esc(d.dim) + '</span>' +
        '<span class="cbti-dim-name">' + esc(dimensionZh(d)) + ' <span lang="en">' + esc(d.en) + '</span></span>' +
        '<span class="cw-meter" role="img" aria-label="' + score + ' 分（2–6）"><span style="--value:' + (pct / 100) + '"></span></span>' +
        '<span class="cbti-dim-level">' + level + '</span>' +
      '</li>';
    }).join('');
    group.innerHTML = '<h3 class="cbti-dim-group-title">' + modelLabel(model) + '</h3>' +
      '<ul class="cbti-dim-rows">' + rows + '</ul>';
    container.appendChild(group);
  }
}

// dimensionMeta: name 'IM1 风险承受', model '投资心态 Investment Mindset'
function dimensionZh(meta) {
  return String(meta.name || '').replace(/^[A-Z]+\d+\s+/, '');
}
function modelLabel(model) {
  var i = String(model).indexOf(' ');
  if (i < 0) return esc(model);
  return esc(model.slice(0, i)) + ' <span lang="en">' + esc(model.slice(i + 1)) + '</span>';
}

function renderScatter() {
  // The dot sits at the PERSONA's canonical position, not at the user's answer-derived
  // position (state.scatterPos): the rule-based scorer and the axis math read different
  // dimensions, so a canonical dot keeps the stamp, the map and the identity coherent.
  // The user's own answers are shown in the dimension bars.
  if (!state.result) return;
  TypeMap.mount(document.getElementById('result-map'), { highlight: state.result.code });
}

// ── Type map: one SVG renderer for the landing map and the result map ──
var TypeMap = (function () {
  var mounts = [];
  var observer = null;

  function overlap(a, b) {
    var x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
  }

  // Greedy label placement: first candidate position that clears other labels and dots.
  function placeLabels(points, frame) {
    var placed = [];
    var order = points.slice().sort(function (a, b) {
      return (b.you - a.you) || (a.y - b.y) || (a.x - b.x);
    });
    order.forEach(function (p) {
      var w = p.code.length * p.fs * 0.6, h = p.fs, g = p.you ? 6 : 3, r = p.you ? 11 : p.r;
      var cands = [
        [p.x + r + g, p.y - h / 2], [p.x - r - g - w, p.y - h / 2],
        [p.x - w / 2, p.y - r - g - h], [p.x - w / 2, p.y + r + g],
        [p.x + r, p.y - r - h], [p.x + r, p.y + r], [p.x - r - w, p.y - r - h], [p.x - r - w, p.y + r]
      ];
      var best = null, bestScore = Infinity;
      for (var i = 0; i < cands.length; i++) {
        var box = { x: cands[i][0], y: cands[i][1], w: w, h: h };
        if (box.x < frame.x - 2 || box.x + w > frame.x + frame.s + 2 || box.y < frame.y - 2 || box.y + h > frame.y + frame.s + 2) continue;
        var score = 0;
        placed.forEach(function (o) { score += overlap(box, o); });
        points.forEach(function (o) {
          if (o === p) return;
          var cx = Math.max(box.x, Math.min(o.x, box.x + w)), cy = Math.max(box.y, Math.min(o.y, box.y + h));
          if ((cx - o.x) * (cx - o.x) + (cy - o.y) * (cy - o.y) < (o.r + 1) * (o.r + 1)) score += 20;
        });
        if (score < bestScore) { bestScore = score; best = box; }
        if (score === 0) break;
      }
      p.label = best || { x: p.x + r + g, y: p.y - h / 2, w: w, h: h };
      placed.push(p.label);
    });
  }

  function render(el, opts) {
    var width = Math.floor(el.clientWidth);
    if (!width) return false;
    var highlight = opts.highlight || '';
    if (el.getAttribute('data-rendered') === width + '|' + highlight) return true;

    var compact = width < 460;
    var pad = { l: compact ? 26 : 42, r: 6, t: 30, b: compact ? 50 : 58 };
    var s = width - pad.l - pad.r;
    var height = pad.t + s + pad.b;
    var frame = { x: pad.l, y: pad.t, s: s };
    var fs = compact ? 10 : 11;
    var X = function (risk) { return pad.l + risk / 100 * s; };
    var Y = function (conviction) { return pad.t + (1 - conviction / 100) * s; };
    var n = function (v) { return Math.round(v * 10) / 10; };
    var id = el.id || 'type-map';

    var points = Object.keys(personas).map(function (k) {
      var p = personas[k];
      var you = p.code === highlight;
      return {
        code: p.code, cn: p.cn, en: p.en, q: QUADRANTS[quadrantOf(p.scatter)],
        risk: p.scatter.risk, conviction: p.scatter.conviction,
        x: X(p.scatter.risk), y: Y(p.scatter.conviction),
        r: you ? 6 : (compact ? 3.5 : 4), fs: you ? fs + 1 : (highlight ? Math.max(10, fs - 1) : fs), you: you
      };
    });
    placeLabels(points, frame);

    var counts = quadrantCounts();
    var title, desc;
    var mine = points.filter(function (p) { return p.you; })[0];
    if (mine) {
      title = '你的位置：' + mine.code + ' ' + mine.cn + '，' + mine.q.zh + '象限';
      desc = mine.code + ' 的标准坐标是风险 ' + mine.risk + '、信念 ' + mine.conviction + '。图上另外 23 个点是其余人格。';
    } else {
      title = '24 种人格在风险 × 信念平面上的标准坐标';
      desc = QUADRANT_ORDER.map(function (k) { return QUADRANTS[k].zh + ' ' + counts[k] + ' 种'; }).join('，') + '。完整列表在下方「类型」。';
    }

    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" class="tm tm--' + (highlight ? 'result' : 'landing') + '" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" role="img" aria-labelledby="' + id + '-t ' + id + '-d">');
    out.push('<title id="' + id + '-t">' + esc(title) + '</title><desc id="' + id + '-d">' + esc(desc) + '</desc>');

    // Frame and the two 50-lines that split the quadrants.
    out.push('<rect class="tm-frame" x="' + pad.l + '" y="' + pad.t + '" width="' + s + '" height="' + s + '"/>');
    out.push('<line class="tm-mid" x1="' + n(X(50)) + '" y1="' + pad.t + '" x2="' + n(X(50)) + '" y2="' + (pad.t + s) + '"/>');
    out.push('<line class="tm-mid" x1="' + pad.l + '" y1="' + n(Y(50)) + '" x2="' + (pad.l + s) + '" y2="' + n(Y(50)) + '"/>');

    // Quadrant names outside the frame: never under a dot.
    var qname = function (k, x, y) {
      var q = QUADRANTS[k];
      return '<g class="' + q.cls + '"><rect class="tm-qswatch" x="' + n(x) + '" y="' + n(y - 8) + '" width="8" height="8"/>' +
        '<text class="tm-qname" x="' + n(x + 12) + '" y="' + n(y) + '">' + q.zh +
        (compact ? '' : ' <tspan class="tm-qname-en">' + q.en + '</tspan>') +
        ' <tspan class="tm-qcount">' + counts[k] + '</tspan></text></g>';
    };
    out.push(qname('smart_money', pad.l, pad.t - 10));
    out.push(qname('diamond_degen', X(50) + 6, pad.t - 10));
    out.push(qname('rotating_andy', pad.l, pad.t + s + 20));
    out.push(qname('gambler', X(50) + 6, pad.t + s + 20));

    // Axes: titles, plus 0 / 50 / 100 ticks where there is room.
    out.push('<text class="tm-axis" x="' + n(pad.l + s / 2) + '" y="' + (pad.t + s + (compact ? 42 : 48)) + '" text-anchor="middle">风险偏好 <tspan lang="en">Risk</tspan> →</text>');
    out.push('<text class="tm-axis" transform="translate(' + (compact ? 10 : 12) + ' ' + n(pad.t + s / 2) + ') rotate(-90)" text-anchor="middle">信念强度 <tspan lang="en">Conviction</tspan> →</text>');
    if (!compact) {
      [0, 50, 100].forEach(function (v) {
        out.push('<text class="tm-tick" x="' + n(pad.l - 6) + '" y="' + n(Y(v) + 3.5) + '" text-anchor="end">' + v + '</text>');
      });
    }

    // Other personas first, the highlighted one last (on top).
    points.sort(function (a, b) { return a.you - b.you; }).forEach(function (p) {
      var cls = 'tm-pt ' + p.q.cls + (p.you ? ' is-you' : '');
      var g = '<g class="' + cls + '">';
      if (p.you) {
        g += '<rect class="tm-you-bg" x="' + n(p.label.x - 2) + '" y="' + n(p.label.y - 1) + '" width="' + n(p.label.w + 4) + '" height="' + n(p.label.h + 2) + '"/>';
        g += '<circle class="tm-ring" cx="' + n(p.x) + '" cy="' + n(p.y) + '" r="11"/>';
      }
      g += '<circle class="tm-dot" cx="' + n(p.x) + '" cy="' + n(p.y) + '" r="' + p.r + '"/>';
      g += '<text class="tm-code" x="' + n(p.label.x) + '" y="' + n(p.label.y + p.fs * 0.8) + '" font-size="' + p.fs + '">' + p.code + '</text>';
      out.push(g + '</g>');
    });
    out.push('</svg>');

    el.innerHTML = out.join('');
    el.setAttribute('data-rendered', width + '|' + highlight);
    return true;
  }

  function mount(el, opts) {
    if (!el || typeof personas === 'undefined') return;
    var existing = mounts.filter(function (m) { return m.el === el; })[0];
    if (existing) existing.opts = opts || {};
    else {
      existing = { el: el, opts: opts || {} };
      mounts.push(existing);
      if (observer) observer.observe(el);
    }
    render(el, existing.opts);
  }

  function refresh() {
    mounts.forEach(function (m) { render(m.el, m.opts); });
  }

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(function () { refresh(); });
  } else {
    window.addEventListener('resize', refresh);
  }

  return { mount: mount, refresh: refresh };
})();

// ── Share ──

function getShareText() {
  const p = state.result;
  // Twitter caps at 280 chars (CJK chars weight 2). Old share text packed in
  // both intros + dual quadrant labels + scatter percentages + dual CTAs and
  // tipped over 350 weighted chars. Trim to the essentials: persona line,
  // intro hook in both languages, single CTA. Quadrant + scatter are visible
  // on the card screenshot if a user attaches one — they don't need to be
  // in the text. Twitter shortens URLs to a fixed 23-char weight.
  return [
    `${p.code} · ${p.cn} / ${p.en}`,
    ``,
    `"${p.intro}"`,
    `"${p.introEn}"`,
    ``,
    `cbti.club  #CBTI`
  ].join('\n');
}

function shareResult() {
  const text = getShareText();
  const twitterUrl = 'https://x.com/intent/tweet?text=' + encodeURIComponent(text);
  window.open(twitterUrl, '_blank');
}

function announce(message) {
  var status = document.getElementById('result-status');
  if (!status) return;
  status.textContent = '';
  setTimeout(function () { status.textContent = message; }, 30);
}

// Clipboard writes can be unavailable (insecure context, old browser) or refused (permissions):
// both paths end in visible and announced feedback instead of an uncaught error.
function writeClipboard(text) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }
  } catch (e) { /* fall through to the rejection below */ }
  return Promise.reject(new Error('clipboard unavailable'));
}

function copyShareText() {
  const text = getShareText();
  const btn = document.querySelector('.btn-copy');
  const orig = btn.textContent;
  writeClipboard(text).then(() => {
    btn.textContent = 'Copied! 已复制';
    announce('分享文案已复制');
    setTimeout(() => btn.textContent = orig, 2000);
  }, () => {
    btn.textContent = '复制失败 · Copy failed';
    announce('复制失败');
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function retryTest() {
  showScreen('landing');
}

function copyAddress(el) {
  const addr = el.querySelector('code').textContent;
  const copyEl = el.querySelector('.tips-copy');
  writeClipboard(addr).then(() => {
    copyEl.textContent = 'copied!';
    announce('地址已复制');
    setTimeout(() => { copyEl.textContent = 'copy'; }, 2000);
  }, () => {
    copyEl.textContent = 'copy failed';
    announce('复制失败');
    setTimeout(() => { copyEl.textContent = 'copy'; }, 2000);
  });
}

// ── Landing: the 24 types, grouped by quadrant (same data and thresholds as the maps) ──
function renderTypeIndex() {
  var root = document.getElementById('type-index');
  if (!root || typeof personas === 'undefined') return;
  var groups = {};
  QUADRANT_ORDER.forEach(function (k) { groups[k] = []; });
  Object.keys(personas).sort().forEach(function (k) {
    groups[quadrantOf(personas[k].scatter)].push(personas[k]);
  });
  var row = function (p) {
    return '<li class="cbti-type">' +
      '<span class="cbti-type-code">' + esc(p.code) + '</span>' +
      '<div>' +
        '<h4 class="cbti-type-name">' + esc(p.cn) + '<span lang="en">' + esc(p.en) + '</span></h4>' +
        '<p class="cbti-type-intro">' + esc(p.intro) + '</p>' +
        '<p class="cbti-type-intro" lang="en">' + esc(p.introEn) + '</p>' +
      '</div>' +
      '<p class="cbti-type-coords"><span class="cw-visually-hidden">标准坐标：风险 </span>' + p.scatter.risk +
        '<span aria-hidden="true"> · </span><span class="cw-visually-hidden">，信念 </span>' + p.scatter.conviction + '</p>' +
    '</li>';
  };
  // Groups start open; on phones they start closed (the summary still lists every code).
  var open = !(window.matchMedia && window.matchMedia('(max-width: 40rem)').matches);
  var block = function (k) {
    var q = QUADRANTS[k];
    return '<details class="cbti-quad ' + q.cls + '"' + (open ? ' open' : '') + '>' +
      '<summary class="cbti-quad-head"><span class="q-swatch" aria-hidden="true"></span>' + q.zh +
        ' <span lang="en">' + q.en + '</span> <span class="cw-num">' + groups[k].length + '</span>' +
        '<span class="cbti-quad-rule">' + q.rule + '</span>' +
        '<span class="cbti-quad-codes">' + groups[k].map(function (p) { return esc(p.code); }).join(' ') + '</span></summary>' +
      '<ol class="cbti-type-list">' + groups[k].map(row).join('') + '</ol>' +
    '</details>';
  };
  root.innerHTML =
    '<div class="cbti-types-col">' + block('smart_money') + '</div>' +
    '<div class="cbti-types-col">' + block('diamond_degen') + block('rotating_andy') + block('gambler') + '</div>';
}

// ── Landing: the 15 dimensions, from dimensionMeta ──
function renderMethodDims() {
  var root = document.getElementById('method-dims');
  if (!root || typeof dimensionMeta === 'undefined') return;
  var groups = {};
  var order = [];
  Object.keys(dimensionMeta).forEach(function (code) {
    var meta = dimensionMeta[code];
    if (!groups[meta.model]) { groups[meta.model] = []; order.push(meta.model); }
    groups[meta.model].push({ code: code, meta: meta });
  });
  root.innerHTML = '<table class="cbti-dim-table">' +
    '<caption>' + Object.keys(dimensionMeta).length + ' 个维度，分 ' + order.length + ' 组 <span lang="en">' + Object.keys(dimensionMeta).length + ' dimensions, ' + order.length + ' groups</span></caption>' +
    order.map(function (model) {
      return '<tbody><tr><th scope="rowgroup" colspan="3">' + modelLabel(model) + '</th></tr>' +
        groups[model].map(function (d) {
          return '<tr><td>' + esc(d.code) + '</td><td>' + esc(dimensionZh(d.meta)) + '</td><td lang="en">' + esc(d.meta.en) + '</td></tr>';
        }).join('') + '</tbody>';
    }).join('') +
  '</table>';
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderTypeIndex();
  renderMethodDims();
  TypeMap.mount(document.getElementById('landing-map'), {});

  // Start wherever the URL hash points, else landing.
  routeFromHash();
});

window.addEventListener('hashchange', routeFromHash);
document.addEventListener('click', routeSameHashClick);
