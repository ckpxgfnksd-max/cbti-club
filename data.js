// ============================================================
// CBTI — Crypto Behavioral Type Indicator
// Data: dimensions, questions, personas, scatter coordinates
// ============================================================

const dimensionMeta = {
  IM1: { name: 'IM1 风险承受', en: 'Risk Tolerance', model: '投资心态 Investment Mindset' },
  IM2: { name: 'IM2 信念强度', en: 'Conviction', model: '投资心态 Investment Mindset' },
  IM3: { name: 'IM3 自我认知', en: 'Self-Awareness', model: '投资心态 Investment Mindset' },
  EM1: { name: 'EM1 FOMO抗性', en: 'FOMO Resistance', model: '情绪管理 Emotional Control' },
  EM2: { name: 'EM2 亏损承受', en: 'Loss Handling', model: '情绪管理 Emotional Control' },
  EM3: { name: 'EM3 贪婪管理', en: 'Greed Management', model: '情绪管理 Emotional Control' },
  MW1: { name: 'MW1 牛熊观', en: 'Bull/Bear Outlook', model: '市场观 Market Worldview' },
  MW2: { name: 'MW2 叙事信仰', en: 'Narrative vs Fundamentals', model: '市场观 Market Worldview' },
  MW3: { name: 'MW3 加密哲学', en: 'Crypto Philosophy', model: '市场观 Market Worldview' },
  TS1: { name: 'TS1 时间偏好', en: 'Time Horizon', model: '交易风格 Trading Style' },
  TS2: { name: 'TS2 决策方式', en: 'Decision Making', model: '交易风格 Trading Style' },
  TS3: { name: 'TS3 执行模式', en: 'Execution Style', model: '交易风格 Trading Style' },
  SB1: { name: 'SB1 信息分享', en: 'Alpha Sharing', model: '社交行为 Social Behavior' },
  SB2: { name: 'SB2 社区角色', en: 'Community Role', model: '社交行为 Social Behavior' },
  SB3: { name: 'SB3 独立思考', en: 'Independent Thinking', model: '社交行为 Social Behavior' },
};

// 30 questions, 2 per dimension. Options scored 1 (low) / 2 (mid) / 3 (high)
const questions = [
  // ── IM1: Risk Tolerance ──
  {
    id: 'q1', dim: 'IM1',
    text: '凌晨3点，朋友发来一个合约地址，附言："别看了，直接冲，我已经3x了"。你...',
    en: '3am. Friend sends a contract address: "don\'t research, just ape, I\'m already 3x." You...',
    options: [
      { label: '回复"哥们你是不是被盗号了"然后继续睡', en: 'Reply "bro did you get hacked?" and go back to sleep', value: 1 },
      { label: '打开Etherscan看一眼合约，犹豫20分钟，它已经5x了', en: 'Open Etherscan, hesitate 20 mins, it\'s already 5x', value: 2 },
      { label: '眼都没睁开就打开Banana Gun开始冲了', en: 'Haven\'t even opened your eyes but already firing up Banana Gun', value: 3 },
    ]
  },
  {
    id: 'q2', dim: 'IM1',
    text: '你理想的仓位管理是什么样的？',
    en: 'Your ideal position management?',
    options: [
      { label: '跟理财经理学的，单笔不超过5%，写在Excel里', en: 'Learned from a financial advisor, max 5% per trade, in a spreadsheet', value: 1 },
      { label: '大部分稳定币+一小部分拿来浪', en: 'Mostly stablecoins + a little degen budget', value: 2 },
      { label: '仓位管理是什么？全仓是一种信仰。止损是对项目的不尊重', en: 'Position sizing? All-in is faith. Stop-loss disrespects the project', value: 3 },
    ]
  },

  // ── IM2: Conviction ──
  {
    id: 'q3', dim: 'IM2',
    text: '你重仓的币跌了75%，创始人的推特头像变成了灰色。你...',
    en: 'Your heavy bag is down 75%, founder changed pfp to grayscale. You...',
    options: [
      { label: '秒卖。头像变灰=跑路前兆，这波我见过太多了', en: 'Instant sell. Grayscale pfp = rug prelude, seen this movie before', value: 1 },
      { label: '有点慌但先在Discord里问问怎么回事', en: 'Nervous but checking Discord to see what\'s up', value: 2 },
      { label: '加仓。别人恐惧我贪婪。头像变灰说不定是在酝酿大动作', en: 'Adding more. Be greedy when others fearful. Grayscale pfp = big announcement brewing', value: 3 },
    ]
  },
  {
    id: 'q4', dim: 'IM2',
    text: '整个CT都在做你持仓的反指——发丑图、编段子、做meme嘲笑你。你...',
    en: 'All of CT is counter-trading you — posting ugly memes, writing jokes, clowning your bags. You...',
    options: [
      { label: '哭了。打开交易所准备投降', en: 'Crying. Opening the exchange to surrender', value: 1 },
      { label: '不开心但不会因为meme改变决策', en: 'Not happy but memes won\'t change my thesis', value: 2 },
      { label: '截图保存，等涨了一个个@回去。记仇.txt已更新', en: 'Screenshotting everything. Will @ them back one by one. grudge.txt updated', value: 3 },
    ]
  },

  // ── IM3: Self-Awareness ──
  {
    id: 'q5', dim: 'IM3',
    text: '上次赚钱，你觉得主要原因是...',
    en: 'Last time you made money, the main reason was...',
    options: [
      { label: '纯运气，时机好，跟实力没半毛钱关系', en: 'Pure luck, good timing, zero to do with skill', value: 3 },
      { label: '有点研究+有点运气，五五开吧', en: 'Some research + some luck, 50/50', value: 2 },
      { label: '我的判断力和执行力。你以为谁都能赚到这个钱？', en: 'My judgment and execution. You think just anyone can make this money?', value: 1 },
    ]
  },
  {
    id: 'q6', dim: 'IM3',
    text: '你有没有一个系统性的交易复盘习惯？',
    en: 'Do you systematically review your trades?',
    options: [
      { label: '有，每笔交易都有记录和反思，含买卖理由和情绪状态', en: 'Yes, every trade logged with rationale and emotional state', value: 3 },
      { label: '偶尔在脑子里过一下，不写下来', en: 'Sometimes mentally review, never write it down', value: 2 },
      { label: '复盘？我连上周买了什么都不记得。钱包里突然多出来的币我都不认识', en: 'Review? I don\'t remember what I bought last week. I have mystery tokens in my wallet', value: 1 },
    ]
  },

  // ── EM1: FOMO Resistance ──
  {
    id: 'q7', dim: 'EM1',
    text: '一个币从你watchlist上的$0.001涨到了$1。你当时觉得"再等等"。现在...',
    en: 'A token on your watchlist went from $0.001 to $1. You thought "I\'ll wait." Now...',
    options: [
      { label: '在$1冲进去了。晚买一天少赚一个亿', en: 'Aped at $1. Every day I wait is a million dollars lost', value: 1 },
      { label: '胸口一阵剧痛，但不追高，我等回调', en: 'Sharp chest pain, but not chasing. Waiting for a pullback', value: 2 },
      { label: '发了条推"错过不是损失"然后默默关掉页面哭了十分钟', en: 'Tweeted "missing out isn\'t a loss" then quietly closed the tab and cried for 10 minutes', value: 3 },
    ]
  },
  {
    id: 'q8', dim: 'EM1',
    text: '你的Timeline从上到下全是同一个新协议。连平时只发猫猫图的人都在聊。你...',
    en: 'Your entire timeline is about one new protocol. Even the person who only posts cat pics is talking about it. You...',
    options: [
      { label: '直接冲了。我不能是最后一个知道的', en: 'Aped immediately. I can\'t be the last person to know', value: 1 },
      { label: '等等，先看看这是不是coordinated shill', en: 'Hold on, checking if this is a coordinated shill campaign', value: 2 },
      { label: '越多人聊我越不想碰。共识形成的那一刻就是alpha消失的那一刻', en: 'The more people talk, the less I want in. Consensus forming = alpha vanishing', value: 3 },
    ]
  },

  // ── EM2: Loss Handling ──
  {
    id: 'q9', dim: 'EM2',
    text: '你刚all-in的项目，开盘跌了60%。你打开手机，第一个动作是...',
    en: 'The project you just went all-in on drops 60% at open. You unlock your phone and...',
    options: [
      { label: '恐慌抛售 → 打开Boss直聘 → 更新简历', en: 'Panic sell → open job listing app → update resume', value: 1 },
      { label: '关掉所有App，明天再说。今天就当这个世界不存在', en: 'Close all apps. Tomorrow\'s problem. Today this world doesn\'t exist', value: 2 },
      { label: '发推：unrealized loss is not a loss。然后加仓', en: 'Tweet: unrealized loss is not a loss. Then add more', value: 3 },
    ]
  },
  {
    id: 'q10', dim: 'EM2',
    text: '熊市深处，你的portfolio缩水85%。你妈问你"那个比特币还好吗"。你...',
    en: 'Deep bear market, portfolio down 85%. Your mom asks "how\'s that bitcoin thing going?" You...',
    options: [
      { label: '"妈，我已经卖了，现在在学Python"（其实没卖，在硬扛）', en: '"Mom, I sold it, learning Python now" (you didn\'t sell, you\'re just coping)', value: 1 },
      { label: '"还行，这个行业是有周期的"然后转移话题', en: '"It\'s fine, this industry has cycles" then change the subject', value: 2 },
      { label: '"妈你给我转点钱，这是千载难逢的抄底机会"', en: '"Mom send me money, this is a once-in-a-lifetime buying opportunity"', value: 3 },
    ]
  },

  // ── EM3: Greed Management ──
  {
    id: 'q11', dim: 'EM3',
    text: '你的meme coin 10x了。你的群友在刷"diamond hands"。你...',
    en: 'Your meme coin is 10x. Your group chat is spamming "diamond hands." You...',
    options: [
      { label: '全卖了。我见过太多10x变-90%的故事了', en: 'Sold everything. I\'ve seen too many 10x → -90% stories', value: 3 },
      { label: '卖一半保本，剩下的放着看看', en: 'Sell half to break even, let the rest ride', value: 2 },
      { label: '不卖。10x算什么？CZ还没喊单呢。100x起步', en: 'Not selling. 10x is nothing. CZ hasn\'t even shilled it yet. 100x minimum', value: 1 },
    ]
  },
  {
    id: 'q12', dim: 'EM3',
    text: '你设了一个目标价，到了之后你...',
    en: 'You set a target price. When it hits, you...',
    options: [
      { label: '严格执行。纪律比想象力重要', en: 'Execute strictly. Discipline > imagination', value: 3 },
      { label: '犹豫一下...要不再看看？万一还涨呢...', en: 'Hesitate... what if I wait... what if it keeps going...', value: 2 },
      { label: '目标价？我从来不设。到了也不卖。这辈子和这个币共存亡', en: 'Target price? Never set one. Won\'t sell even if it hits. Me and this token, till death do us part', value: 1 },
    ]
  },

  // ── MW1: Bull/Bear Outlook ──
  {
    id: 'q13', dim: 'MW1',
    text: 'BTC新高之后回调了15%。你对朋友说...',
    en: 'BTC pulls back 15% from ATH. You tell your friend...',
    options: [
      { label: '"顶部确认了，2018重演。你的房子还能抵押吗？"', en: '"Top is in, 2018 all over again. Can you still mortgage your house?"', value: 1 },
      { label: '"正常回调，别慌。周线看还是bullish"', en: '"Normal pullback, don\'t panic. Weekly still looks bullish"', value: 2 },
      { label: '"打折了打折了！你怎么还不买？你等什么？等归零吗？"', en: '"It\'s on sale! Why aren\'t you buying? What are you waiting for? Zero?"', value: 3 },
    ]
  },
  {
    id: 'q14', dim: 'MW1',
    text: '你觉得crypto的终局是...',
    en: 'You think crypto\'s endgame is...',
    options: [
      { label: '一场精心设计的财富转移。最后跑得快的人赢', en: 'An elaborate wealth transfer scheme. Whoever exits first wins', value: 1 },
      { label: '有泡沫成分，但底层技术有真实价值。长期看好', en: 'Some bubble, but real underlying tech value. Long-term bullish', value: 2 },
      { label: '全球金融体系的重构。你现在不上车以后连车尾灯都看不到', en: 'Restructuring of global finance. Don\'t get on now, you won\'t even see the taillights', value: 3 },
    ]
  },

  // ── MW2: Narrative vs Fundamentals ──
  {
    id: 'q15', dim: 'MW2',
    text: '选项目的时候，你第一个打开的是...',
    en: 'When evaluating a project, the first thing you open is...',
    options: [
      { label: 'Dune/DefiLlama/Artemis。数据不说谎', en: 'Dune/DefiLlama/Artemis. Data doesn\'t lie', value: 1 },
      { label: '团队推特+融资背景+赛道分析，综合来看', en: 'Team Twitter + funding + sector analysis, holistic view', value: 2 },
      { label: '推特的vibes和评论区。如果评论区全是火焰emoji那就对了', en: 'Twitter vibes and replies. If the comments are all fire emojis, that\'s the signal', value: 3 },
    ]
  },
  {
    id: 'q16', dim: 'MW2',
    text: '一个项目数据很好但零讨论度 vs 一个项目数据平平但KOL们疯狂转发。你选...',
    en: 'Project A: great metrics, zero buzz. Project B: mid metrics, KOLs going crazy. You pick...',
    options: [
      { label: 'A。市场迟早会定价真实价值。让子弹飞一会', en: 'A. Market will price real value eventually. Let the bullet fly', value: 1 },
      { label: '各买一点对冲', en: 'Buy a bit of both to hedge', value: 2 },
      { label: 'B。注意力就是价值。基本面是给写报告的人看的', en: 'B. Attention IS value. Fundamentals are for report writers', value: 3 },
    ]
  },

  // ── MW3: Crypto Philosophy ──
  {
    id: 'q17', dim: 'MW3',
    text: '关于去中心化，你内心最真实的想法是...',
    en: 'Your most honest thought about decentralization...',
    options: [
      { label: '去中心化是crypto存在的唯一理由。妥协一步等于全部投降', en: 'Decentralization is crypto\'s only reason to exist. One compromise = total surrender', value: 1 },
      { label: '理想很好但得务实。用户体验和效率也很重要', en: 'Nice ideal but be pragmatic. UX and efficiency matter too', value: 2 },
      { label: 'ser我只关心能不能赚钱。中心化去中心化跟我有什么关系', en: 'Ser I only care about making money. Centralized, decentralized, what\'s that got to do with me', value: 3 },
    ]
  },
  {
    id: 'q18', dim: 'MW3',
    text: '你的资产分布在...',
    en: 'Your assets are distributed across...',
    options: [
      { label: '全在冷钱包里。交易所是临时停车场，not your keys not your coins', en: 'All in cold wallets. CEX is a temp parking lot, not your keys not your coins', value: 1 },
      { label: '大仓位在CEX方便操作，小仓位在链上玩', en: 'Big bags on CEX for convenience, small bags on-chain for fun', value: 2 },
      { label: '全在Binance。安全方便，出了事找客服', en: 'All on Binance. Safe, convenient, customer service if anything goes wrong', value: 3 },
    ]
  },

  // ── TS1: Time Horizon ──
  {
    id: 'q19', dim: 'TS1',
    text: '你打开交易App后的第一个动作是...',
    en: 'First thing you do when opening your trading app...',
    options: [
      { label: '看1分钟K线和买卖挂单深度', en: 'Check 1-min candles and order book depth', value: 1 },
      { label: '看看日线趋势和持仓盈亏', en: 'Check daily trend and portfolio P&L', value: 2 },
      { label: '看一眼余额确认还在就行了。有时候一个月打开一次', en: 'Quick glance at balance to confirm it\'s still there. Sometimes once a month', value: 3 },
    ]
  },
  {
    id: 'q20', dim: 'TS1',
    text: '你持有一个币最长的时间是...',
    en: 'The longest you\'ve ever held a token...',
    options: [
      { label: '15分钟。一个K线我就知道对不对了', en: '15 minutes. One candle tells me everything I need to know', value: 1 },
      { label: '几个月。跟着叙事走，叙事变了我也变', en: 'A few months. Following the narrative, when it shifts, I shift', value: 2 },
      { label: '三年了还在拿着。密码都快忘了但就是不卖', en: '3 years and still holding. Almost forgot the password but still won\'t sell', value: 3 },
    ]
  },

  // ── TS2: Decision Making ──
  {
    id: 'q21', dim: 'TS2',
    text: '做交易决策前，你的流程是...',
    en: 'Before making a trade, your process is...',
    options: [
      { label: '感觉对了就冲。直觉是最快的alpha', en: 'If it feels right, send it. Gut feeling is the fastest alpha', value: 1 },
      { label: '快速刷一下推特+看看图表，10分钟做决定', en: 'Quick scroll through Twitter + check the chart, 10 min decision', value: 2 },
      { label: '看白皮书、跑Dune数据、对比竞品、建模型。两天后再出手', en: 'Read whitepaper, run Dune queries, benchmark competitors, build model. Two days later, pull trigger', value: 3 },
    ]
  },
  {
    id: 'q22', dim: 'TS2',
    text: '你的Notion/笔记本里有没有投资体系？',
    en: 'Do you have an investment system in your notes?',
    options: [
      { label: '我的脑子就是我的Notion。用的时候现编', en: 'My brain IS my Notion. I improvise on the fly', value: 1 },
      { label: '有个粗略的checklist，偶尔参考', en: 'A rough checklist, occasionally reference it', value: 2 },
      { label: '完整的评估框架+每笔交易记录+月度复盘报告。别问为什么，纪律', en: 'Full evaluation framework + every trade logged + monthly review report. Don\'t ask why. Discipline', value: 3 },
    ]
  },

  // ── TS3: Execution Style ──
  {
    id: 'q23', dim: 'TS3',
    text: '你买入一个币通常怎么操作？',
    en: 'How do you typically buy into a position?',
    options: [
      { label: '看好直接一把梭。分批买入是犹豫不决的表现', en: 'Like it = all-in. Scaling in is just indecisiveness with extra steps', value: 1 },
      { label: '分2-3次进场，逢跌加仓', en: 'Enter in 2-3 tranches, add on dips', value: 2 },
      { label: '设好机器人定投，人为干预太多反而容易错', en: 'Set up DCA bot, too much human intervention causes errors', value: 3 },
    ]
  },
  {
    id: 'q24', dim: 'TS3',
    text: '你和交易机器人的关系是...',
    en: 'Your relationship with trading bots...',
    options: [
      { label: '手动只此一家。我的操作速度就是alpha，机器人学不来这种直觉', en: 'Manual only. My speed IS the alpha, bots can\'t replicate this intuition', value: 1 },
      { label: '用一些提醒和限价单辅助', en: 'Use alerts and limit orders to assist', value: 2 },
      { label: '能自动化的全自动化。人是最大的bug源', en: 'Automate everything possible. Humans are the biggest source of bugs', value: 3 },
    ]
  },

  // ── SB1: Alpha Sharing ──
  {
    id: 'q25', dim: 'SB1',
    text: '你发现了一个还没有人讨论的百倍潜力项目。你...',
    en: 'You find a potential 100x that nobody\'s talking about. You...',
    options: [
      { label: '闷声发大财。alpha说出来就不是alpha了', en: 'Keep quiet and get rich. Spoken alpha is dead alpha', value: 1 },
      { label: '悄悄告诉两三个兄弟', en: 'Quietly tell 2-3 close friends', value: 2 },
      { label: '写个详细的research thread发推。涨粉+alpha分享双赢', en: 'Write a detailed research thread on X. Grow followers + share alpha = win-win', value: 3 },
    ]
  },
  {
    id: 'q26', dim: 'SB1',
    text: '你的crypto社交媒体画像是...',
    en: 'Your crypto social media profile is...',
    options: [
      { label: '潜水员。没有推特，有也不发，只看', en: 'Lurker. No Twitter, or have one but never post, just read', value: 1 },
      { label: '偶尔转发+评论几句', en: 'Occasionally retweet + drop a comment', value: 2 },
      { label: '日更选手。GM thread + alpha分享 + 持仓公开。我的推特就是我的名片', en: 'Daily poster. GM threads + alpha sharing + open portfolio. My Twitter IS my business card', value: 3 },
    ]
  },

  // ── SB2: Community Role ──
  {
    id: 'q27', dim: 'SB2',
    text: '在一个你持仓的项目Discord里，你通常是...',
    en: 'In the Discord of a project you hold, you\'re usually...',
    options: [
      { label: '潜水。不说话。看别人聊天像看动物世界', en: 'Lurking. Silent. Watching others chat like a nature documentary', value: 1 },
      { label: '偶尔冒泡回个消息，问问进度', en: 'Pop up occasionally, reply to a message, ask about progress', value: 2 },
      { label: 'Mod/OG/天天发言那个人。提案我写的，FAQ我更新的，新人我接待的', en: 'Mod/OG/daily contributor. I wrote the proposals, updated the FAQ, onboarded the newbies', value: 3 },
    ]
  },
  {
    id: 'q28', dim: 'SB2',
    text: '一个DAO发起治理投票，你...',
    en: 'A DAO launches a governance vote, you...',
    options: [
      { label: '投什么票？我连提案标题都没看过', en: 'Vote? I haven\'t even read the proposal title', value: 1 },
      { label: '重要的投一下，一般的算了', en: 'Vote on important ones, skip the rest', value: 2 },
      { label: '每次都投+在forum写分析。治理参与度是我的信仰', en: 'Vote every time + write analysis on forum. Governance participation is my religion', value: 3 },
    ]
  },

  // ── SB3: Independent Thinking ──
  {
    id: 'q29', dim: 'SB3',
    text: '你最信任的alpha来源是...',
    en: 'Your most trusted alpha source is...',
    options: [
      { label: '大V说什么我做什么。毕竟人家粉丝比我多100倍', en: 'Whatever KOLs say, I do. They have 100x more followers after all', value: 1 },
      { label: '综合多个信息源，自己做判断', en: 'Aggregate multiple sources, make my own call', value: 2 },
      { label: '链上数据+自己的分析。KOL喊单的时候通常已经晚了三天', en: 'On-chain data + my own analysis. By the time KOLs shill, it\'s usually 3 days late', value: 3 },
    ]
  },
  {
    id: 'q30', dim: 'SB3',
    text: '你关注的一个百万粉大V突然发推说"$XXX is dead, sell now"。你...',
    en: 'A million-follower KOL suddenly tweets "$XXX is dead, sell now." You...',
    options: [
      { label: '立刻卖。大V说dead那就是dead', en: 'Sell immediately. If the KOL says dead, it\'s dead', value: 1 },
      { label: '先看看他为什么这么说，自己验证一下', en: 'Check why they said that, verify it myself', value: 2 },
      { label: '反手做多。大V喊空是最好的做多信号', en: 'Counter-trade them. KOL shorting is the best long signal', value: 3 },
    ]
  },
];

// ── Persona definitions ──
// pattern: 15-char string (H/M/L for each dimension in order IM1-IM2-IM3-EM1-EM2-EM3-MW1-MW2-MW3-TS1-TS2-TS3-SB1-SB2-SB3)
// scatter: { risk: 0-100 (X-axis), conviction: 0-100 (Y-axis) }

const personas = {
  "HODL": {
    code: "HODL",
    cn: "钻石手",
    en: "Diamond Hands",
    intro: "你的手比钻石硬，你的钱包比北极冷。",
    introEn: "Hands harder than diamonds, wallet colder than the Arctic.",
    pattern: "LHH-HHH-MML-HHM-LML",
    scatter: { risk: 20, conviction: 95 },
    desc: "HODL型人格是加密世界的活化石。2019年买的ETH，到现在连钱包密码都快忘了。你的投资策略只有一个字：买。没有第二步。有人问你什么时候卖，你会露出那种看透三世轮回的微笑说'下辈子吧'。你的持仓曲线看起来像心电图上的一条直线——因为你从来不操作。-90%的时候你在睡觉，+500%的时候你也在睡觉。你不是在投资，你是在跟时间谈一场不需要回报的恋爱。你的存在意义是让所有频繁交易的人深夜反思：'也许什么都不做才是最好的策略'。",
    descEn: "HODL types are the living fossils of crypto. ETH bought in 2019, wallet password almost forgotten. Your strategy is one word: buy. There is no step two. When asked when you'll sell, you smile like someone who's seen three past lives and say 'next life.' Your portfolio curve is a flatline on the EKG — because you never trade. Down 90%, you're sleeping. Up 500%, also sleeping. You're not investing — you're in a relationship with time that asks for nothing in return. Your existence makes every active trader question at 3am: 'maybe doing nothing is the best strategy.'"
  },
  "DGEN": {
    code: "DGEN",
    cn: "赌狗",
    en: "Degen Lord",
    intro: "梭哈是一种信仰，归零是一种修行。",
    introEn: "All-in is faith, getting rekt is spiritual practice.",
    pattern: "HLM-LLM-HHL-LLL-MLM",
    scatter: { risk: 92, conviction: 15 },
    desc: "DGEN型人格的持仓寿命和金鱼的记忆差不多——48小时。每天早上醒来第一件事不是看时间，而是看有没有新的meme coin。你的钱包交互记录比你的前任列表还长还精彩。你坚信一个朴素的投资哲学：亏钱不可怕，错过才可怕。你的朋友圈最常见的状态是'又归零了哈哈🐶'，频率大约每周两次。你的Phantom钱包里有47个价值为零的token，你把它们称为'战损勋章'。你不是在投资，你是在用真金白银玩一个大型多人在线赌博游戏——而且你享受每一秒。",
    descEn: "DGEN portfolios have the same lifespan as a goldfish's memory — 48 hours. Every morning the first thing you check isn't the time, but whether there's a new meme coin. Your wallet interaction history is longer and more dramatic than your ex list. Your philosophy: losing money is fine, missing out is not. Your most common social post is 'rekt again lol 🐶', roughly twice a week. Your Phantom wallet holds 47 tokens worth exactly zero — you call them 'battle scars.' You're not investing, you're playing an MMO gambling game with real money — and you're loving every second."
  },
  "NGMI": {
    code: "NGMI",
    cn: "韭菜王",
    en: "Exit Liquidity",
    intro: "每次你买入的那一刻，就是别人的卖出信号。",
    introEn: "The moment you buy is everyone else's sell signal.",
    pattern: "HLM-LLM-HHL-LLL-MLL",
    scatter: { risk: 85, conviction: 10 },
    desc: "NGMI型人格拥有一种违反物理学的超能力：精准地在每个顶部买入，每个底部卖出。如果你的交易记录是一个ETF，做空它的收益率是巴菲特的三倍。你的决策流程是一个完美的死循环：看到KOL喊单→FOMO→买入→暴跌→恐慌→割肉→反弹→再FOMO→repeat。你真诚地相信每一个'下一个百倍'的承诺，就像你真诚地相信前任说的'我变了'。加密市场需要你，因为每个零和游戏都需要一个稳定的exit liquidity供应商。你就是那个供应商。7x24小时营业，全年无休。",
    descEn: "NGMI types possess a physics-defying superpower: precision buying at every top, selling at every bottom. If your trade history was an ETF and you shorted it, the returns would triple Buffett's. Your decision flow is a perfect death loop: see KOL shill → FOMO → buy → dump → panic → sell → bounce → FOMO again → repeat. You sincerely believe every 'next 100x' promise, just like you sincerely believed your ex when they said 'I've changed.' The market needs you — every zero-sum game requires a reliable exit liquidity provider. You are that provider. 24/7, no holidays."
  },
  "WAGMI": {
    code: "WAGMI",
    cn: "喊单王",
    en: "Hopium Dealer",
    intro: "GM! LFG! WAGMI! portfolio跌了90%但推文绝不跌。",
    introEn: "GM! LFG! WAGMI! Portfolio down 90% but tweets never dip.",
    pattern: "MHM-MML-HHH-MLM-HHM",
    scatter: { risk: 48, conviction: 82 },
    desc: "WAGMI型人格是CT的永动机。你的Timeline永远阳光灿烂：GM thread、LFG thread、'why I'm bullish' thread。你的bio每周更新，永远包含至少三个🚀。你的portfolio已经跌到只剩一个BNB的gas费了，但你的推文依然气势如虹——because vibes don't need TVL。你不是在做投资，你是在经营一个大型互相打鸡血的赛博邪教。你的真实超能力不是赚钱，是让每个关注你的人都觉得自己明天就要财富自由了。你是加密推特的精神氮泵，少了你，这个行业的多巴胺供给链就断了。",
    descEn: "WAGMI types are CT's perpetual motion machine. Your timeline is eternal sunshine: GM threads, LFG threads, 'why I'm bullish' threads. Your bio updates weekly, always with at least three 🚀. Your portfolio is down to gas money for one BNB transaction, but your tweets remain unshakeable — because vibes don't need TVL. You're not investing, you're running a massive cyber-cult of mutual motivation. Your real superpower isn't making money — it's making everyone who follows you believe they'll be financially free by tomorrow. You're CT's spiritual pre-workout. Without you, the industry's dopamine supply chain collapses."
  },
  "SNPR": {
    code: "SNPR",
    cn: "狙击手",
    en: "Sniper",
    intro: "一年三枪，枪枪爆头。",
    introEn: "Three shots a year, every one a headshot.",
    pattern: "LHH-HHH-LLH-HHH-LLH",
    scatter: { risk: 15, conviction: 90 },
    desc: "SNPR型人格是加密市场里最安静的赢家。你一年的交易次数一只手数得过来，但每笔都是精确制导的巡航导弹。你的研究深度让对冲基金分析师自愧不如——你不只是读了白皮书，你读完了白皮书里引用的所有论文，跑了三个月的链上数据，还在GitHub上review了代码。然后用仓位的10%小心翼翼地买入。你从不在推特上分享alpha，因为你知道alpha公开的那一刻就死了。你的朋友以为你不玩crypto，直到有一天发现你已经默默买了三套房。你是市场里那个所有人都忽略但最后笑到最后的人。",
    descEn: "SNPR types are the quietest winners in crypto. Annual trade count fits on one hand, but each shot is a precision-guided cruise missile. Your research depth makes hedge fund analysts feel inadequate — you didn't just read the whitepaper, you read every paper it cited, ran three months of on-chain data, and reviewed the GitHub codebase. Then carefully entered with 10% of your portfolio. You never share alpha on Twitter because alpha dies the moment it's spoken. Your friends think you don't do crypto, until one day they discover you've quietly bought three houses. You're the one everyone ignores who ends up laughing last."
  },
  "REKT": {
    code: "REKT",
    cn: "爆仓侠",
    en: "Liquidation Hero",
    intro: "'这次不一样'——旁白：每次都一样。",
    introEn: "'This time is different' — Narrator: it was not different.",
    pattern: "HLM-LLL-HHM-LLM-MHL",
    scatter: { risk: 95, conviction: 30 },
    desc: "REKT型人格和杠杆之间有一种跨越轮回的羁绊。你坚信100x杠杆只是工具，就像你坚信在高速公路上蒙着眼开车只是一种'通勤方式'。你的清算编年史可以出版成系列丛书：第一卷《这次是稳的》（清算）；第二卷《吸取教训了》（清算）；第三卷《真的最后一次》（清算）。交易所的清算引擎可能用你的名字命名了一个内部庆功日。你的真正天赋不是交易，而是在全部归零后48小时内重新充值、调好杠杆、准备再死一次的不屈意志。你是Bybit清算feed里最闪亮的那颗星。",
    descEn: "REKT types have a karmic bond with leverage that transcends reincarnation. You believe 100x leverage is just a tool, like believing driving blindfolded on the highway is just a 'commute method.' Your liquidation chronicle could be published as a book series: Vol. 1: 'This one's safe' (liquidated); Vol. 2: 'Learned my lesson' (liquidated); Vol. 3: 'Truly the last time' (liquidated). The exchange's liquidation engine probably named an internal holiday after you. Your real talent isn't trading — it's the indomitable will to reload, re-lever, and prepare to die again within 48 hours of hitting zero. You're the brightest star in Bybit's liquidation feed."
  },
  "FARM": {
    code: "FARM",
    cn: "矿工",
    en: "Yield Farmer",
    intro: "3%的APY也是APY。我跟你讲，复利是第八大奇迹。",
    introEn: "3% APY is still APY. Let me tell you, compound interest is the 8th wonder.",
    pattern: "LMH-HHH-LLH-HHH-MLM",
    scatter: { risk: 10, conviction: 75 },
    desc: "FARM型人格把DeFi当成了一个大型分布式搬砖模拟器。你在17条链上有资产，每天早上的routine不是刷推特而是收菜——claim奖励、复投、调仓、找新矿。你的Excel表格追踪了每个池子的APY变化曲线，精确到小数点后四位。你知道大部分人觉得为了3%的年化在7个协议之间来回搬砖很蠢，但他们不理解复利的力量。你不是在farming，你是在经营一个跨链金融帝国——只是这个帝国的年GDP大约是$47。但没关系，你享受的是那种一切尽在掌控的感觉。你的spreadsheet比你的portfolio更有价值。",
    descEn: "FARM types treat DeFi as a massive distributed brick-carrying simulator. Assets across 17 chains, morning routine isn't scrolling Twitter but harvesting — claim rewards, re-stake, rebalance, scout new pools. Your spreadsheet tracks APY curves to four decimal places. You know most people think moving funds between 7 protocols for 3% APY is dumb, but they don't understand compound interest. You're not farming — you're running a cross-chain financial empire, except this empire's annual GDP is roughly $47. But that's fine — you enjoy the feeling of everything being under control. Your spreadsheet is worth more than your portfolio."
  },
  "COPE": {
    code: "COPE",
    cn: "精神胜利法",
    en: "Cope Master",
    intro: "我没亏钱，我只是暂时借给了市场。",
    introEn: "I didn't lose money, I just temporarily lent it to the market.",
    pattern: "MMM-MLM-MHM-MML-MLM",
    scatter: { risk: 40, conviction: 38 },
    desc: "COPE型人格拥有一套比任何DeFi协议都精密的心理防御系统：任何亏损都能被转化为正能量叙事。跌了50%？'机构在洗盘'。跌了80%？'我是长期价值投资者'。项目方跑路了？'这是行业替我交的学费'。创始人进监狱了？'利空出尽是利好'。你的推文充满东方哲学智慧：'未实现亏损不是亏损'、'做时间的朋友'、'春天总会来的'。你在-95%的仓位面前能保持佛陀般的淡定。实际上你没有在cope，你已经超越了cope，达到了一种禅宗的境界——心中无亏损，亏损自然无。",
    descEn: "COPE types have a psychological defense system more sophisticated than any DeFi protocol: every loss converts into a positive narrative. Down 50%? 'Institutions shaking out weak hands.' Down 80%? 'I'm a long-term value investor.' Project rugged? 'Tuition the industry charged me.' Founder in prison? 'Bad news priced in = bullish.' Your tweets are full of Eastern philosophy: 'Unrealized loss isn't a loss,' 'Be friends with time,' 'Spring always comes.' You maintain Buddha-level calm staring at a -95% position. Actually, you're not coping anymore — you've transcended coping and reached a Zen state: no loss in the heart, no loss in reality."
  },
  "FOMO": {
    code: "FOMO",
    cn: "追高战士",
    en: "FOMO Knight",
    intro: "永远在追，永远慢一步，永远买在最高点。",
    introEn: "Always chasing, always one step behind, always buying the top.",
    pattern: "HLM-LLM-HHM-LLM-MLM",
    scatter: { risk: 80, conviction: 20 },
    desc: "FOMO型人格是市场最可靠的反向指标。你买入的那一秒就是确认顶部的信号——不是诅咒，是因为你永远在别人已经赚完钱、准备下车的时候才气喘吁吁地追上来。你的投资日志（如果你有的话）每一页都写着同一个故事：'看到在涨→犹豫→涨更多→受不了了→买入→一秒后暴跌'。你是加密生态中不可或缺的一环——没有你在顶部接盘，早期投资者卖给谁呢？你的存在本身就是对市场流动性的慈善捐赠。你不是韭菜，你是生态贡献者。请保持。",
    descEn: "FOMO types are the market's most reliable reverse indicator. The second you buy is the official top confirmation signal — not a curse, just because you always arrive panting after everyone else has already taken profits and is heading for the exit. Every page of your trading journal (if you had one) tells the same story: 'Saw it pumping → hesitated → pumped more → couldn't take it → bought → instant dump.' You're essential to the crypto ecosystem — without you buying the top, who would early investors sell to? Your existence is a charitable donation to market liquidity. You're not a retail victim. You're an ecosystem contributor. Keep it up."
  },
  "BUIDL": {
    code: "BUIDL",
    cn: "建设者",
    en: "Builder",
    intro: "所有人在交易的时候，你在写代码。所有人在赚钱的时候，你在写代码。",
    introEn: "Everyone's trading, you're coding. Everyone's making money, you're still coding.",
    pattern: "LHH-MHM-LLM-HHH-LHH",
    scatter: { risk: 12, conviction: 85 },
    desc: "BUIDL型人格是这个行业里真正在干活的那1%。你的净资产大部分锁在4年vesting里，到手的token还没解锁就先跌了80%。你比任何人都希望行业成功——因为你的四年青春都抵押在上面了。你的日常不是看K线而是review PR、修bug、在Discord里回答用户'为什么我的交易失败了'（答案永远是gas不够）。你看不起纯炒币的人，但你心里清楚一个残酷的事实：你锁定的token的当前市值，可能还不如一个幸运的degen上周用0.1 SOL翻出来的零头。你是这个行业的脊梁，也是这个行业最惨的存在。向你致敬。",
    descEn: "BUIDL types are the 1% in this industry actually doing real work. Most of your net worth is locked in a 4-year vest, and the tokens already dropped 80% before they unlocked. You want the industry to succeed more than anyone — because four years of your youth are mortgaged to it. Your daily routine isn't checking candles but reviewing PRs, fixing bugs, and answering Discord users asking 'why did my transaction fail' (answer: always gas). You look down on pure traders, but you know a cruel truth: your locked tokens' current market value might be less than what a lucky degen flipped from 0.1 SOL last week. You're the backbone of this industry and also its most tragic figure. Respect."
  },
  "ALPHA": {
    code: "ALPHA",
    cn: "信息差猎人",
    en: "Alpha Hunter",
    intro: "你在群里看到一个币的时候，我已经卖了。",
    introEn: "By the time you see it in the group chat, I've already sold.",
    pattern: "MHH-HHM-MLH-MHH-LLH",
    scatter: { risk: 35, conviction: 88 },
    desc: "ALPHA型人格是加密市场的独行侠。你的信息源不是推特、不是群聊，是链上数据、合约源码和telegram里只有17个人的私密频道。你在所有人讨论一个项目的三周前就已经建好仓了。你从不发推分享alpha，因为你比任何人都清楚：alpha = 信息差 × 时间差，任何一个归零，alpha就死了。你的社交圈精简到令人恐惧——只和同level的3-5个人交流。散户不知道你存在。鲸鱼知道你在哪个池子里。你的Nansen标签可能是'Smart Money'，但你永远不会确认。",
    descEn: "ALPHA types are crypto's lone wolves. Your info sources aren't Twitter or group chats — they're on-chain data, contract source code, and private Telegram channels with 17 people. You've already built your position three weeks before anyone starts discussing the project. You never share alpha publicly because you know better than anyone: alpha = information asymmetry × time advantage, and if either hits zero, alpha is dead. Your social circle is terrifyingly small — just 3-5 people at the same level. Retail doesn't know you exist. Whales know exactly which pool you're swimming in. Your Nansen tag might say 'Smart Money,' but you'll never confirm."
  },
  "SHILL": {
    code: "SHILL",
    cn: "喊单机器",
    en: "Shill Bot",
    intro: "这个项目改变世界！（第847次说这句话）",
    introEn: "This project changes the world! (said for the 847th time)",
    pattern: "MLM-MLM-MHH-MLM-HHL",
    scatter: { risk: 55, conviction: 35 },
    desc: "SHILL型人格把crypto推特变成了一个24/7永不关门的电视购物频道。你每天至少发5条推，每条的开头都是'Thread: Why $XXX is the most undervalued gem in crypto'。你的DM里有37个项目方的BD负责人，你的钱包里有20多种token——不是因为你研究透了每一个，而是因为你和每一个都有'合作关系'。你的推特bio写着'researcher/investor'，但你真正的职业应该叫'crypto直播带货主播'。你的实际收入来源不是token升值，而是推广费、KOL package和付费群订阅。你不需要行情好，你只需要有新项目上线。",
    descEn: "SHILL types turned crypto Twitter into a 24/7 home shopping channel that never closes. At least 5 tweets daily, each starting with 'Thread: Why $XXX is the most undervalued gem in crypto.' Your DMs contain 37 project BD contacts, your wallet holds 20+ tokens — not from research, but from 'partnerships.' Your bio says 'researcher/investor' but your real job title should be 'crypto livestream sales host.' Your actual income isn't from token appreciation — it's promo fees, KOL packages, and paid group subscriptions. You don't need a bull market. You just need new projects to launch."
  },
  "WHALE": {
    code: "WHALE",
    cn: "巨鲸",
    en: "Silent Whale",
    intro: "不说话，不发推，只留下链上足迹。整个市场在追踪你。",
    introEn: "No words, no tweets, just on-chain footprints. The entire market is tracking you.",
    pattern: "MHH-HHM-MMM-HHH-LLH",
    scatter: { risk: 30, conviction: 92 },
    desc: "WHALE型人格是加密市场的暗物质——你看不见它，但你能感受到它的引力。你的每一笔链上转账都会被Lookonchain截图发推，底下几百条评论分析你是要砸盘还是建仓。你从不说话，但整个市场都在解读你。你的一个approve交互就能让一个token涨10%——不是因为你买了，是因为大家觉得你要买了。你拥有一种可怕的能力：通过沉默来操控市场情绪。你不需要喊单，你的钱包地址就是最大的KOL。你的存在让每个链上分析师都有了工作，让每个alpha群都有了聊天话题。你是生态系统最安静的参与者，也是最有影响力的那一个。",
    descEn: "WHALE types are the dark matter of crypto — invisible, but you can feel the gravitational pull. Every one of your on-chain transfers gets screenshotted by Lookonchain, with hundreds of comments analyzing whether you're dumping or accumulating. You never speak, but the entire market interprets you. One approve transaction from you can pump a token 10% — not because you bought, but because people think you're about to. You possess a terrifying power: manipulating market sentiment through silence. You don't need to shill — your wallet address IS the biggest KOL. Your existence gives every on-chain analyst a job and every alpha group a conversation topic. The quietest participant in the ecosystem, yet the most influential."
  },
  "PAPER": {
    code: "PAPER",
    cn: "纸手之王",
    en: "Paper Hands",
    intro: "如果'拿住=赚钱'，你现在已经是福布斯常客了。",
    introEn: "If 'just hold = profit,' you'd be a Forbes regular by now.",
    pattern: "MLM-LLH-MMM-LLM-MML",
    scatter: { risk: 40, conviction: 12 },
    desc: "PAPER型人格拥有一种反向钻石手超能力——不管持有什么币，你都会在它起飞前的最后一刻抛掉。你卖过$100的ETH、$0.05的SOL、$10的BNB、$0.20的DOGE。每一笔都是精准的反向操作，精准到你开始怀疑自己是不是被做空你的基金安排了内应。你的浏览器收藏夹里有一个文件夹叫'如果我没卖的话'，记录的错失金额总计等于曼哈顿一套公寓。你不缺眼光——你找到过无数百倍币。你只是没有手。你的手软得像水母的触须，K线往下抖一下就自动触发你的卖出按钮。你是持有能力的反面教材，是每个交易心理学教科书的第一章。",
    descEn: "PAPER types have an anti-diamond-hands superpower — whatever you hold, you'll dump it right before liftoff. You've sold ETH at $100, SOL at $0.05, BNB at $10, DOGE at $0.20. Each a precision reverse trade, so precise you wonder if a short fund planted you as a mole. Your browser has a bookmarked folder called 'If I Hadn't Sold' with total missed gains equaling a Manhattan apartment. You don't lack vision — you've found countless 100x coins. You just don't have hands. Your hands are soft as jellyfish tentacles — one red candle and your sell button auto-triggers. You're the textbook counter-example for holding, and chapter one of every trading psychology book."
  },
  "MAXI": {
    code: "MAXI",
    cn: "信仰战士",
    en: "Chain Maxi",
    intro: "只有一条链是真正的区块链。其他都是带API的数据库。",
    introEn: "Only one chain is real blockchain. Everything else is a database with an API.",
    pattern: "LHM-HMM-LLL-HMM-MHM",
    scatter: { risk: 25, conviction: 85 },
    desc: "MAXI型人格已经超越投资，进入了宗教领域。你选了一条链，然后像中世纪十字军一样为它征战。你的推特bio是链的名字，头像是链logo的艺术变体，每条推文不是在传教就是在攻击异端。你看其他L1的态度跟中世纪教会看日心说一样——异端邪说，必须火刑。有人提到你不喜欢的链？你会写一个3000字的thread解释为什么它是中心化的垃圾。你在技术论坛里的战斗力等于十个人。你的区块链信仰之坚定，让宗教狂热分子都要自愧不如。你没有在投资，你在布道。",
    descEn: "MAXI types have transcended investing into full religion territory. You picked one chain and fight for it like a medieval crusader. Your Twitter bio is the chain's name, pfp an artistic variant of its logo, every tweet either preaching or attacking heretics. Your attitude toward other L1s mirrors the medieval church's view of heliocentrism — heresy, must be burned at the stake. Someone mentions a chain you don't like? 3000-word thread explaining why it's centralized garbage. Your combat power in technical forums equals ten people. Your blockchain conviction makes religious zealots look casual. You're not investing. You're evangelizing."
  },
  "ANON": {
    code: "ANON",
    cn: "匿名之神",
    en: "Anon",
    intro: "你不知道我是谁。这就对了。",
    introEn: "You don't know who I am. That's by design.",
    pattern: "MMH-HMM-LMM-MHH-LLH",
    scatter: { risk: 30, conviction: 65 },
    desc: "ANON型人格把OPSEC升华为行为艺术。7个钱包、3个VPN、2个Tor浏览器，每笔交易先过一遍mixer。推特头像是AI生成的，名字是随机哈希的前6位，所有社交账号之间零关联。你甚至研究过用现金买USDT来避免银行流水。你不是做了什么见不得人的事——你只是真诚地相信隐私是基本人权。在这个一切链上透明的世界里，匿名是最后的避难所。你的安全措施之严密，有时候连自己都登不上自己的账号。你丢过的seed phrase比你赚过的钱还多。你为了保护$500的资产，花了$2000在安全基础设施上。但你觉得值。",
    descEn: "ANON types have elevated OPSEC to performance art. 7 wallets, 3 VPNs, 2 Tor browsers, every transaction through a mixer first. Twitter pfp is AI-generated, name is the first 6 chars of a random hash, zero links between social accounts. You've even researched buying USDT with cash to avoid bank records. You haven't done anything shady — you genuinely believe privacy is a fundamental right. In a world where everything is transparent on-chain, anonymity is the last refuge. Your security is so tight that sometimes even you can't log into your own accounts. You've lost more seed phrases than money you've ever made. You spent $2000 on security infra to protect $500 in assets. But you think it's worth it."
  },
  "MOON": {
    code: "MOON",
    cn: "梭哈教主",
    en: "Moonboy",
    intro: "数学是可选的，信仰是必须的。每个币都在去$1M的路上。",
    introEn: "Math is optional, faith is mandatory. Every coin is on its way to $1M.",
    pattern: "HMM-LLM-HHH-LMM-MHM",
    scatter: { risk: 78, conviction: 55 },
    desc: "MOON型人格活在一个永恒牛市的平行宇宙里。在你的世界观中，每个币都有潜力达到$1T市值——不，是$10T——不，是取代美元。你计算收益的方式永远是从结论倒推：'如果这个meme coin达到DOGE的市值，我的仓位值3个亿'。概率？什么概率？概率是给没有信仰的人算的。你的价格预测从不用'可能'、'也许'这些词，永远是'必然'、'注定'、'只是时间问题'。你是永恒乐观主义的化身。熊市在你这里只是牛市的中场休息。有人说你不现实，但你觉得不现实的是他们——他们连做梦都不敢做大。",
    descEn: "MOON types inhabit a parallel universe of eternal bull markets. In your worldview, every coin has potential to hit $1T market cap — no, $10T — no, replace the dollar. Your return calculations always work backwards from the conclusion: 'If this meme coin reaches DOGE's market cap, my position is worth $300M.' Probability? What probability? Probability is for people without conviction. Your price predictions never use 'maybe' or 'possibly' — always 'inevitably,' 'destined,' 'just a matter of time.' You're the embodiment of eternal optimism. Bear markets? Just halftime during the bull run. People say you're unrealistic, but you think they're the unrealistic ones — they can't even dream big."
  },
  "FLIP": {
    code: "FLIP",
    cn: "叙事旋转门",
    en: "Rotation Andy",
    intro: "你在讨论AI的时候我已经在RWA了。你在讨论RWA的时候我已经在DePIN了。",
    introEn: "You're discussing AI, I'm already in RWA. You're on RWA, I'm already in DePIN.",
    pattern: "HMM-LMM-HHM-LLM-HML",
    scatter: { risk: 42, conviction: 28 },
    desc: "FLIP型人格是叙事轮动的人形加速器。你的持仓周期和Twitter trending topic的寿命完美同步——AI火了冲AI，RWA火了换RWA，meme coin火了梭meme，DePIN火了又跑去DePIN。你的钱包交易记录读起来就是一部2024-2025加密叙事编年史。你对每个赛道的理解深度刚好够写一条20条推文的thread，但不够回答任何一条评论区的追问。你不是没有投资策略——你的策略就是永远站在风口上。唯一的问题是：当你赶到风口的时候，风通常已经停了。然后你就飞速奔向下一个风口。永远在路上，从不到达。",
    descEn: "FLIP types are narrative rotation in human form. Your holding period syncs perfectly with Twitter trending topic lifespans — AI pumps, ape AI; RWA pumps, rotate to RWA; meme coins pump, send memes; DePIN pumps, run to DePIN. Your wallet history reads like a 2024-2025 crypto narrative almanac. Your understanding of each sector is exactly deep enough to write a 20-tweet thread, but not enough to answer a single follow-up question. You do have a strategy — always stand where the wind blows. The only problem: by the time you arrive at the wind, it's usually stopped. So you sprint to the next one. Always en route, never arriving."
  },
  "BEAR": {
    code: "BEAR",
    cn: "永恒空军",
    en: "Permabear",
    intro: "'我早就说了'——是的你说了，说了47次了。",
    introEn: "'I told you so' — Yes you did, for the 47th time.",
    pattern: "LMH-HMH-LLM-HHM-MLH",
    scatter: { risk: 20, conviction: 70 },
    desc: "BEAR型人格是加密市场的永恒对手盘。无论BTC是$20K还是$200K，你的观点永远只有一个：'泡沫要破了'。你从2017年就开始说crypto要崩，然后它确实崩了，然后又涨了10倍，然后你又说要崩了，然后确实又崩了，然后又涨了20倍。如此循环。你的预测准确率其实挺高——如果不算时间的话。你是市场里最重要的存在之一，因为如果没有你持续做空，牛市就没有燃料。你的每一声'我早就说了'都是用前面47次'这次一定崩'换来的。你的推特是加密市场最好的反指——当你开始转多的那天，就是这轮牛市真正见顶的那天。",
    descEn: "BEAR types are the eternal counter-party of crypto. Whether BTC is $20K or $200K, your take is always the same: 'bubble's about to pop.' You've been calling crypto's collapse since 2017 — and it did crash, then 10x'd, then you called crash again, it did crash, then 20x'd. Rinse and repeat. Your accuracy is actually pretty high — if you ignore timing. You're one of the most essential market participants — without your persistent shorting, bull markets would have no fuel. Every 'I told you so' was earned through 47 prior 'it's definitely crashing this time's. Your Twitter is the best counter-indicator in crypto — the day you turn bullish is the day this bull run actually tops."
  },
  "GURU": {
    code: "GURU",
    cn: "大师",
    en: "Crypto Guru",
    intro: "20万粉丝，收费Alpha Group，alpha延迟三天。",
    introEn: "200K followers, paid Alpha Group, alpha delayed 3 days.",
    pattern: "MMM-MMM-MHM-MMM-HHM",
    scatter: { risk: 48, conviction: 42 },
    desc: "GURU型人格是加密知识经济的最大赢家。你的主要收入不是交易利润，而是Substack订阅、付费群、咨询费和偶尔的'战略顾问'retainer。你的推文永远是事后诸葛亮级别的精准——因为你只会在K线走出来之后才发分析。'我在$X就说过了'是你最常用的开场白，但没人能找到你当时说的那条推。你的免费内容刚好够钩住新韭菜，真正的'alpha'需要每月99U。你的粉丝不知道的是：你自己的portfolio表现其实和扔硬币差不多。你卖的不是alpha，是一种'有人在帮我看着'的安全感。这种安全感的定价是每月$99。",
    descEn: "GURU types are the biggest winners of crypto's knowledge economy. Your main income isn't trading profits — it's Substack subs, paid groups, consulting fees, and occasional 'strategic advisor' retainers. Your tweets are always hindsight-perfect — because you only post analysis after the move has happened. 'I said this at $X' is your favorite opener, but nobody can find the original tweet. Your free content hooks new retail just enough; the real 'alpha' costs $99/month. What your followers don't know: your own portfolio performs roughly like a coin flip. You're not selling alpha — you're selling a feeling of 'someone's watching out for me.' That feeling is priced at $99/month."
  },
  "NEWB": {
    code: "NEWB",
    cn: "嫩韭菜",
    en: "Fresh Meat",
    intro: "什么是seed phrase？等等，为什么我的币不见了？？？？",
    introEn: "What's a seed phrase? Wait, why are my tokens gone????",
    pattern: "HLL-LLM-HMM-LLL-MLL",
    scatter: { risk: 75, conviction: 8 },
    desc: "NEWB型人格是加密市场里最勇敢也最危险的物种。入圈三个月，已经开了5x合约、参与了三个IDO、被钓鱼网站骗了一次、在Discord领了一个假airdrop、approve了一个恶意合约。你不知道什么是无常损失，但你已经在提供流动性了。你的学习曲线不是曲线，是悬崖——你选择了从悬崖上跳下去学飞。你最常说的两句话是'这个怎么搞？'和'我的币怎么不见了？'。你是每个协议TVL增长的重要贡献者，也是每个scammer的最爱。不过好消息是：如果你能活过前六个月，你大概率会变成上面某种人格。坏消息是：活过前六个月的概率大约5%。",
    descEn: "NEWB types are the bravest and most endangered species in crypto. Three months in: opened a 5x leverage position, joined three IDOs, got phished once, claimed a fake Discord airdrop, approved a malicious contract. You don't know what impermanent loss is, but you're already providing liquidity. Your learning curve isn't a curve — it's a cliff, and you chose to learn flying by jumping off. Your two most common phrases: 'How do I do this?' and 'Where did my tokens go?' You're a key contributor to every protocol's TVL growth, and every scammer's favorite target. Good news: if you survive the first six months, you'll probably evolve into one of the types above. Bad news: survival rate for the first six months is roughly 5%."
  },
  "DEAD": {
    code: "DEAD",
    cn: "装死党",
    en: "Ghost",
    intro: "App已删。密码已忘。2022年至今。",
    introEn: "App deleted. Password forgotten. Since 2022.",
    pattern: "LMM-MHM-MMM-HMM-LLL",
    scatter: { risk: 15, conviction: 40 },
    desc: "DEAD型人格达到了一种超越交易的禅定境界。你在2021年牛市最高点all-in，2022年开始装死，至今App未更新，钱包密码大概率已经忘了。你没有止损，不是因为你有diamond hands，而是因为你已经放弃抵抗了。你的持仓像一个时间胶囊——完美封存了2021年牛市的美梦与泡沫。讽刺的是，你的'装死策略'可能比80%的频繁交易者表现都好，因为至少你没有在底部割肉。你不是钻石手，你是摆烂手——but sometimes摆烂is the best strategy。你妈有时候还会问'那个币怎么样了'，你回答'挺好的'然后转移话题。",
    descEn: "DEAD types have achieved a Zen state beyond trading. You went all-in at the 2021 bull market peak, started playing dead in 2022, app hasn't been updated since, wallet password probably forgotten. You haven't set a stop-loss — not because of diamond hands, but because you've given up resistance. Your portfolio is a time capsule — perfectly preserving the dreams and bubbles of the 2021 bull market. Ironically, your 'play dead strategy' probably outperforms 80% of active traders, because at least you didn't sell the bottom. You're not diamond handing — you're lying flat. But sometimes lying flat IS the best strategy. Your mom occasionally asks 'how's that coin thing?' You say 'it's fine' and change the subject."
  },
  "CHEF": {
    code: "CHEF",
    cn: "庄家",
    en: "Market Maker",
    intro: "你以为你在交易？你在我的厨房里做客。",
    introEn: "You think you're trading? You're a guest in my kitchen.",
    pattern: "HHH-HHM-HHH-HHH-LMM",
    scatter: { risk: 65, conviction: 88 },
    desc: "CHEF型人格是加密食物链的顶层捕食者——或者至少你是这么定位自己的。你不跟着叙事走，你制造叙事。你的交易不是买和卖，是'布局'。你知道什么时候该让散户FOMO进来，什么时候该shake out弱手。你的链上行为被分析师逐笔追踪，而你享受这种猫鼠游戏——有时候你故意做一些misleading的链上操作就为了看分析师的反应。你的推特从来不直说'买'或'卖'，只是抛出一些意味深长的'hmm interesting'和'this chart looks familiar'。你的portfolio确实不错。但你最大的快感不是赚钱，是那种运筹帷幄、棋行天下的掌控感。你是棋手，其他人是棋子。",
    descEn: "CHEF types are the apex predators of the crypto food chain — or at least that's how you see yourself. You don't follow narratives, you manufacture them. Your trades aren't buying and selling, they're 'positioning.' You know when to let retail FOMO in and when to shake out weak hands. Analysts track your on-chain behavior transaction by transaction, and you enjoy the cat-and-mouse game — sometimes you deliberately make misleading on-chain moves just to watch analysts react. Your Twitter never says 'buy' or 'sell' directly, just cryptic 'hmm interesting' and 'this chart looks familiar.' Your portfolio actually does well. But your biggest thrill isn't money — it's the feeling of being the chess player while everyone else is a piece."
  },
  "AIRD": {
    code: "AIRD",
    cn: "撸毛大军",
    en: "Airdrop Farmer",
    intro: "47个钱包，12条链，收获：一个NFT和三封感谢邮件。",
    introEn: "47 wallets, 12 chains, harvest: one NFT and three thank-you emails.",
    pattern: "LMH-MHM-MLM-MHH-LMM",
    scatter: { risk: 18, conviction: 60 },
    desc: "AIRD型人格把空投挖掘变成了一门精密的工业化科学。你的Master Excel追踪了每个钱包在每条链的交互状态、gas消耗、预期空投价值和ROI预估。你的日程表：早6点claim奖励，7点跨链转账，8点在新协议上刷交互，9点更新表格，10点注册新钱包。你的时薪如果按已到手空投价值算大约是$3.7/hour——还没算gas成本。但这不影响你的热情，因为你坚信下一个big drop就在眼前。你的钱包管理能力超过了大部分公司的IT部门。你的Sybil检测规避技术比大部分项目方的反女巫系统还先进。你不是在farming，你是在经营一个比大部分Web3 startup都精细的运营体系。",
    descEn: "AIRD types have industrialized airdrop farming into a precision science. Your Master Excel tracks every wallet's interaction status, gas spent, expected airdrop value, and ROI estimate across every chain. Your schedule: 6am claim rewards, 7am cross-chain transfers, 8am interact with new protocols, 9am update spreadsheet, 10am register new wallets. Your hourly rate based on actual airdrops received is roughly $3.7/hour — not counting gas costs. But that doesn't dampen your enthusiasm, because you believe the next big drop is right around the corner. Your wallet management skills surpass most corporate IT departments. Your Sybil detection evasion techniques are more advanced than most projects' anti-witch systems. You're not farming — you're running an operation more sophisticated than most Web3 startups."
  },
};

// Mapping: how dimension scores contribute to scatter plot axes
const scatterWeights = {
  risk: { IM1: 3, EM1: -2, EM3: -2, MW1: 1, TS1: -1, TS3: -1 },
  conviction: { IM2: 3, EM2: 2, MW3: -1, TS2: 1, SB3: 1 },
};

// Quadrant definitions for the scatter plot
const quadrants = {
  smart_money: { label: '聪明钱 Smart Money', labelEn: 'Smart Money', range: { risk: [0, 50], conviction: [50, 100] } },
  diamond_degen: { label: '钻石赌狗 Diamond Degen', labelEn: 'Diamond Degen', range: { risk: [50, 100], conviction: [50, 100] } },
  rotating_andy: { label: '旋转安迪 Rotating Andy', labelEn: 'Rotating Andy', range: { risk: [0, 50], conviction: [0, 50] } },
  gambler: { label: '纯赌怪 Absolute Gambler', labelEn: 'Absolute Gambler', range: { risk: [50, 100], conviction: [0, 50] } },
};
