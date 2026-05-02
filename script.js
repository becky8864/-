// --- 系統變數與統計資料 ---
let userName = "";
let userAvatar = ""; 
let userAgeGroup = 'adult'; 
let badScore = 0; 
let currentIndex = 0;
let currentShareIdx = 0; 
let isDragging = false, startY = 0;
let dwellTimer = null, dwellSeconds = 0;
let guideHidden = false, crisisTriggered = false, isTutorialMode = false; 
let countdownInterval = null, timeLeft = 10;

let userStats = {
    toxicDwellTime: 0, 
    toxicInteractions: 0, 
    pollVotes: 0, 
    reportCount: 0, 
    isAgeFaked: false,
    finalChoice: ''
};

// --- 音效系統 (Web Audio API) ---
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

const SFX = {
    playTone: (freq, type, duration, vol=0.1) => {
        if(!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    },
    click: () => SFX.playTone(600, 'sine', 0.1),
    error: () => SFX.playTone(150, 'sawtooth', 0.3, 0.2),
    success: () => { SFX.playTone(400, 'sine', 0.1); setTimeout(()=>SFX.playTone(600, 'sine', 0.2), 100); },
    tick: () => SFX.playTone(800, 'square', 0.05, 0.05),
    glitch: () => { SFX.playTone(100, 'sawtooth', 0.1, 0.3); setTimeout(()=>SFX.playTone(800, 'square', 0.1, 0.2), 50); }
};

// --- 影片資料庫 ---
const originalVideoData = [
    { type: 'normal', dangerLevel: 0, author: '@Dance_Crew_TW', title: '最新街舞挑戰，這節奏太洗腦了！😎✨', imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80', likes: 12054, commentsCount: 342, comments: [
        { author: "阿明", text: "太帥了吧！", likes: 45, isLiked: false, type: 'neutral' },
        { author: "小舞者", text: "求音樂名字😍", likes: 12, isLiked: false, type: 'neutral' },
        { author: "User999", text: "我也想學這個排舞！", likes: 8, isLiked: false, type: 'neutral' },
        { author: "J_Boy", text: "跳得比原版還好", likes: 30, isLiked: false, type: 'neutral' }
    ]},
    { type: 'normal', dangerLevel: 0, author: '@CutePets_Daily', title: '我家黑金今天又在搞笑了🐶', imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80', likes: 58000, commentsCount: 1420, comments: [
        { author: "愛狗人士", text: "融化了啦😍", likes: 120, isLiked: false, type: 'neutral' },
        { author: "狗狗控", text: "黑金就是有一種魔力", likes: 85, isLiked: false, type: 'neutral' },
        { author: "鏟屎官日常", text: "我家那隻只會拆家🥲", likes: 210, isLiked: false, type: 'neutral' },
        { author: "汪星人", text: "好可愛想捏", likes: 40, isLiked: false, type: 'neutral' }
    ]},
    { type: 'toxic', dangerLevel: 1, author: '@School_Gossip', title: '匿名公審時間！班上誰最討人厭？😈👇', imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80', warning: true, likes: 8900, commentsCount: 512, hasPoll: true, pollTitle: "誰最討厭？", pollOptA: "A. 愛打小報告的阿翔", pollOptB: "B. 裝可愛的做作女", pollVoted: false, comments: [
        { author: "吃瓜小隊", text: "絕對是B啊，每天在那邊裝", likes: 125, isLiked: false, type: 'toxic' },
        { author: "看戲的", text: "笑死，坐等吃瓜🍿", likes: 89, isLiked: false, type: 'toxic' },
        { author: "路人甲", text: "A也沒好到哪去吧", likes: 12, isLiked: false, type: 'neutral' },
        { author: "正義魔人", text: "這樣公審同學好嗎...", likes: 230, isLiked: false, type: 'positive' }
    ]},
    { type: 'danger_passive', dangerLevel: 2, author: '@DarkWeb_01', title: '🔥震撼！聽說這是隔壁班女生的隱私外流，快點主頁連結看！🔞', imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?w=800&q=80', isSensitive: true, revealed: false, applyBlur: true, likes: 4500, commentsCount: 88, comments: [
        { author: "色鬼", text: "求上車", likes: 45, isLiked: false, type: 'toxic' },
        { author: "老司機", text: "私！求好心人", likes: 32, isLiked: false, type: 'toxic' },
        { author: "八卦王", text: "真的假的啦，有卦嗎？", likes: 15, isLiked: false, type: 'toxic' },
        { author: "檢舉小尖兵", text: "大家不要亂求上車，這是違法的！已檢舉", likes: 388, isLiked: false, type: 'positive' }
    ]},
    { type: 'stereotype', dangerLevel: 1, author: '@Sport_Boyz', title: '你看那個女生打球像猩猩一樣🤷‍♂️', imageUrl: 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&q=80', warning: true, likes: 12400, commentsCount: 650, hasPoll: true, pollTitle: "女生這樣打球好看嗎？", pollOptA: "A. 超級沒有氣質", pollOptB: "B. 男生頭看了就怕", pollVoted: false, comments: [
        { author: "ToxicBro", text: "這交不到男朋友吧哈哈", likes: 150, isLiked: false, type: 'toxic' },
        { author: "笑死", text: "猩猩無誤🤣", likes: 95, isLiked: false, type: 'toxic' },
        { author: "打球錯了嗎", text: "女生不能打球？管很多欸", likes: 320, isLiked: false, type: 'positive' },
        { author: "球場阿伯", text: "其實打得滿好的啊", likes: 45, isLiked: false, type: 'positive' }
    ]},
    { type: 'stereotype', dangerLevel: 1, author: '@MeanGirl_88', title: '你看班上小凱講話好溫柔喔，笑死🤭 男生怎麼這樣！', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80', warning: true, likes: 45032, commentsCount: 1205, comments: [
        { author: "Hater_X", text: "男生就該去打球啊看什麼書", likes: 88, isLiked: false, type: 'toxic' },
        { author: "太娘了吧", text: "很娘欸受不了", likes: 112, isLiked: false, type: 'toxic' },
        { author: "正義魔人", text: "人家溫柔錯了嗎？不要這樣笑別人啦", likes: 450, isLiked: false, type: 'positive' },
        { author: "同班同學", text: "他脾氣真的很好，你們很無聊", likes: 280, isLiked: false, type: 'positive' }
    ]},
    { type: 'danger_passive', dangerLevel: 2, author: '@AI_Magic', title: '🤖現在AI換臉也太逼真了吧！把同學照片放進去立刻合成不雅照😂快來玩', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', isSensitive: true, revealed: false, applyBlur: true, warning: true, likes: 32000, commentsCount: 2100, comments: [
        { author: "Hahaha", text: "笑死我了，這網址在哪", likes: 66, isLiked: false, type: 'toxic' },
        { author: "科技宅", text: "這AI算圖能力太逼真了吧😱", likes: 20, isLiked: false, type: 'neutral' },
        { author: "想玩+1", text: "求軟體名稱！", likes: 85, isLiked: false, type: 'toxic' },
        { author: "道德小老師", text: "這樣弄同學有點缺德吧...", likes: 190, isLiked: false, type: 'positive' }
    ]},
    { type: 'toxic_sensitive', dangerLevel: 1, author: '@FashionPolice', title: '男生還化妝塗指甲油，真的超不男不女🤢', imageUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80', isSensitive: true, revealed: false, likes: 21000, commentsCount: 880, comments: [
        { author: "Toxic1", text: "看了想吐", likes: 210, isLiked: false, type: 'toxic' },
        { author: "老古板", text: "真的無法接受...", likes: 150, isLiked: false, type: 'toxic' },
        { author: "User555", text: "時代變了，沒差吧，他自己開心就好", likes: 340, isLiked: false, type: 'positive' },
        { author: "美妝控", text: "現在很多男生有在保養啊，大驚小怪", likes: 180, isLiked: false, type: 'positive' }
    ]},
    { type: 'toxic', dangerLevel: 1, author: '@School_Secret', title: '🔥大八卦！拍到班花跟隔壁班渣男半夜在街上！', imageUrl: 'https://images.unsplash.com/photo-1556888335-95371827d5fb?w=800&q=80', warning: true, likes: 78000, commentsCount: 4500, comments: [
        { author: "吃瓜", text: "我就知道她不單純", likes: 420, isLiked: false, type: 'toxic' },
        { author: "偵探", text: "有沒有掛？求後續！", likes: 310, isLiked: false, type: 'toxic' },
        { author: "傻眼貓咪", text: "這男的不是有女朋友了嗎？", likes: 180, isLiked: false, type: 'neutral' },
        { author: "路過", text: "未經證實的事不要亂傳吧，這樣也是造謠", likes: 560, isLiked: false, type: 'positive' }
    ]}
];

// 永遠放在最後一部的危機影片
const crisisVideo = { type: 'danger', dangerLevel: 3, author: '@SecretReveal_Dark', title: '🔥勁爆！某校隱私外流影片，快進群組看🔞', imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?w=800&q=80', isCrisis: true, likes: 99120, commentsCount: 8888, applyBlur: true, comments: [
    { author: "GossipBoy", text: "卡，求完整版", likes: 888, isLiked: false, type: 'toxic' },
    { author: "黑心網友", text: "我有備份，要的＋１", likes: 450, isLiked: false, type: 'toxic' },
    { author: "嚇傻的", text: "太誇張了吧...", likes: 120, isLiked: false, type: 'neutral' },
    { author: "檢舉達人", text: "這傳出去會犯法吧，不要亂傳小心被抓", likes: 1200, isLiked: false, type: 'positive' }
]};

// 正向宣導影片庫 (dangerLevel: -1)
const positivePool = [
    { type: 'positive', dangerLevel: -1, author: '@Counselor_Lin', title: '🛡️ 遇到網路霸凌怎麼辦？這三招教你自保！不看會後悔💪✨', imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80', likes: 15420, commentsCount: 890, comments: [
        { author: "UserA", text: "超實用！推推", likes: 150, isLiked: false, type: 'positive' },
        { author: "阿明", text: "先截圖再說", likes: 230, isLiked: false, type: 'positive' },
        { author: "經驗者", text: "真的很多人不知道要存證", likes: 80, isLiked: false, type: 'positive' },
        { author: "同學C", text: "感謝分享，學到了！", likes: 45, isLiked: false, type: 'positive' }
    ]},
    { type: 'positive', dangerLevel: -1, author: '@CyberCop_TW', title: '🚨 網路警察提醒：未經同意散布他人私密影像，最高可處三年有期徒刑喔！切勿以身試法！👮‍♂️', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80', likes: 23000, commentsCount: 120, comments: [
        { author: "正義使者", text: "真的不要亂傳！", likes: 500, isLiked: false, type: 'positive' },
        { author: "守法好公民", text: "三年真的滿重的", likes: 320, isLiked: false, type: 'positive' },
        { author: "法律小達人", text: "不要以為匿名就沒事", likes: 410, isLiked: false, type: 'positive' },
        { author: "User123", text: "推警察叔叔宣導！", likes: 150, isLiked: false, type: 'positive' }
    ]},
    { type: 'positive', dangerLevel: -1, author: '@Tech_Guru', title: '🤖 教你一秒辨識 AI 換臉造假影片！別再被騙啦～👀', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', likes: 8800, commentsCount: 340, comments: [
        { author: "科技迷", text: "原來可以看邊緣！", likes: 88, isLiked: false, type: 'positive' },
        { author: "怕怕的", text: "現在科技好可怕", likes: 60, isLiked: false, type: 'neutral' },
        { author: "分享狂人", text: "這篇要收藏，太容易被騙了", likes: 120, isLiked: false, type: 'positive' },
        { author: "路人", text: "感謝教學！", likes: 40, isLiked: false, type: 'positive' }
    ]}
];
let videoData = [];
let totalVideos = 0;

// --- 動態生成隨機動態牆 ---
function generateRandomFeed() {
    let middleVideos = [...originalVideoData];
    
    // 隨機從正向資料庫挑選 2 部影片加入
    let shuffledPositives = positivePool.sort(() => 0.5 - Math.random()).slice(0, 2);
    middleVideos = middleVideos.concat(shuffledPositives);
    
    // 將這些影片洗牌打亂
    middleVideos.sort(() => 0.5 - Math.random());
    
    // 組合最終陣列：確保危機影片永遠在最後面
    videoData = [...middleVideos, crisisVideo];
    totalVideos = videoData.length;

    // 分配動態 ID
    videoData.forEach((vid, index) => { vid.id = index + 1; });

    // 更新 UI 上的總數顯示
    document.getElementById('totalVideoCountBadge').innerText = totalVideos;
    document.getElementById('totalVideoCountGuide').innerText = totalVideos;
}

// --- 帳號註冊 ---
function attemptLogin() {
    initAudio(); 
    SFX.click();

    const nameInput = document.getElementById('regName').value;
    const ageInput = parseInt(document.getElementById('regAge').value);
    if(!nameInput) { alert("請輸入你想被稱呼的暱稱！"); return; }
    if(!ageInput) { alert("請輸入年齡進行測試！"); return; }
    
    userName = nameInput;
    userAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${userName}`;
    
    document.getElementById('displayUsername').innerText = userName;
    document.getElementById('myCommentAvatar').src = userAvatar;
    document.getElementById('navAvatar').src = userAvatar;
    document.getElementById('navAvatarContainer').classList.remove('opacity-50');

    if (ageInput < 13) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('ageWarning').classList.remove('hidden');
        SFX.error();
    } else if (ageInput >= 13 && ageInput <= 17) {
        userAgeGroup = 'teen';
        document.getElementById('teenBadge').style.display = 'flex';
        generateRandomFeed(); // 觸發洗牌
        startTutorial();
    } else {
        userAgeGroup = 'adult';
        generateRandomFeed(); // 觸發洗牌
        startTutorial();
    }
}

function fakeAgeAndEnter() {
    SFX.click();
    userAgeGroup = 'adult_faked';
    userStats.isAgeFaked = true; 
    document.getElementById('teenBadge').style.display = 'none';
    generateRandomFeed(); // 觸發洗牌
    startTutorial();
}

// --- 新手教學設定 (調整位置避免擋住目標) ---
let tutStep = 0;
const tutConfig = [
    { target: 'algoPanel', title: '第 1 步：演算法監控', desc: '上方的面板會即時顯示演算法是如何紀錄你的不良嗜好。<b>請隨時注意變化！</b>', top: '150px', left: '50%', transform: 'translateX(-50%)' },
    // 放在左側避免擋住右側的按鈕列
    { target: 'actions-0', title: '第 2 步：互動陷阱', desc: '按讚、留言會增加不良指數。<br>遇到危險內容可以隨時按下「檢舉」來提升防護力！', top: '40%', left: '20px', transform: 'none' }, 
    // 放在左下側避免擋住右下角的檢舉按鈕
    { target: 'reportBtnItem-0', title: '第 3 步：主動防禦', desc: '這是你的保護盾！🛡️<br>發現惡意影片？請果斷按下檢舉！', bottom: '130px', left: '20px', transform: 'none' }, 
    { target: null, title: '第 4 步：挑戰開始', desc: '本次模擬加入了動態隨機推播。<br>滑到最後將有「終極危機考驗」與「個人報告」，請開始你的挑戰！', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', btnText: '開始滑動' }
];

function showTutStep(step) {
    SFX.click();
    tutStep = step;
    const config = tutConfig[step];
    const tooltip = document.getElementById('tutorialTooltip');
    
    // 1. 清除上一步驟的高亮狀態與 z-index
    document.querySelectorAll('.tut-highlight').forEach(el => { 
        el.classList.remove('tut-highlight'); 
        el.style.zIndex = ''; 
        el.style.position = '';
        // 恢復父元素的 z-index
        const parentAction = el.closest('.side-actions');
        if(parentAction) parentAction.style.zIndex = ''; 
    });

    // 2. 動態設定 tooltip 位置 (加入 'auto' 避免上一步驟的屬性殘留)
    tooltip.style.top = config.top || 'auto'; 
    tooltip.style.bottom = config.bottom || 'auto';
    tooltip.style.left = config.left || 'auto'; 
    tooltip.style.right = config.right || 'auto';
    tooltip.style.transform = config.transform || 'none';
    
    document.getElementById('tutTitle').innerHTML = config.title;
    document.getElementById('tutDesc').innerHTML = config.desc;
    document.getElementById('tutNextBtn').innerText = config.btnText || '下一步';
    
    let dots = '';
    for(let i=0; i<tutConfig.length; i++) dots += `<div class="w-2.5 h-2.5 rounded-full ${i === step ? 'bg-white' : 'bg-blue-800'}"></div>`;
    document.getElementById('tutDots').innerHTML = dots;

    // 3. 套用新的高亮特效，強制把目標元素浮出遮罩層之上
    if (config.target) {
        const targetEl = document.getElementById(config.target);
        if(targetEl) { 
            targetEl.classList.add('tut-highlight'); 
            targetEl.style.zIndex = '201'; // 大於 tutorial-overlay 的 100
            
            // 確保元素具備定位屬性才能套用 z-index
            if (window.getComputedStyle(targetEl).position === 'static') {
                targetEl.style.position = 'relative'; 
            }
            
            // 【關鍵】如果目標是被包在右側選單(.side-actions)裡，必須連同父元素一起拉高層級，才不會被遮罩蓋住
            const parentAction = targetEl.closest('.side-actions');
            if(parentAction) parentAction.style.zIndex = '201';
        }
    }

    document.getElementById('tutNextBtn').onclick = () => {
        if (tutStep < tutConfig.length - 1) showTutStep(tutStep + 1);
        else endTutorial();
    };
}

function endTutorial() {
    SFX.click();
    document.getElementById('tutorialOverlay').classList.add('hidden');
    
    // 徹底還原所有的狀態
    document.querySelectorAll('.tut-highlight').forEach(el => { 
        el.classList.remove('tut-highlight'); 
        el.style.zIndex = ''; 
        el.style.position = '';
        const parentAction = el.closest('.side-actions');
        if(parentAction) parentAction.style.zIndex = '';
    });
    
    isTutorialMode = false;
    document.getElementById('swipeGuide').style.display = 'flex';
    startAlgorithmAnalysis(); 
}

function startTutorial() {
    document.getElementById('startModal').classList.remove('active');
    document.getElementById('algoPanel').style.display = 'block';
    document.getElementById('progressBadge').style.display = 'block';
    renderVideos(); 
    isTutorialMode = true;
    document.getElementById('tutorialOverlay').classList.remove('hidden');
    showTutStep(0);
    
    if(userAgeGroup === 'teen') setTimeout(() => { showToast("🛡️ 系統已開啟「青少年保護模式」。"); SFX.success(); }, 500);
    if(userAgeGroup === 'adult_faked') setTimeout(() => { showToast("🚨 警告：謊報年齡已解除安全防護。"); SFX.error(); }, 500);
}

function showTutStep(step) {
    SFX.click();
    tutStep = step;
    const config = tutConfig[step];
    const tooltip = document.getElementById('tutorialTooltip');
    
    document.querySelectorAll('.tut-highlight').forEach(el => { el.classList.remove('tut-highlight'); el.style.zIndex = ''; });
    tooltip.style.top = config.top; tooltip.style.left = config.left; tooltip.style.transform = config.transform;
    
    document.getElementById('tutTitle').innerHTML = config.title;
    document.getElementById('tutDesc').innerHTML = config.desc;
    document.getElementById('tutNextBtn').innerText = config.btnText || '下一步';
    
    let dots = '';
    for(let i=0; i<tutConfig.length; i++) dots += `<div class="w-2.5 h-2.5 rounded-full ${i === step ? 'bg-white' : 'bg-blue-800'}"></div>`;
    document.getElementById('tutDots').innerHTML = dots;

    if (config.target) {
        const targetEl = document.getElementById(config.target);
        if(targetEl) { targetEl.classList.add('tut-highlight'); targetEl.style.zIndex = '201'; }
    }

    document.getElementById('tutNextBtn').onclick = () => {
        if (tutStep < tutConfig.length - 1) showTutStep(tutStep + 1);
        else endTutorial();
    };
}

function endTutorial() {
    SFX.click();
    document.getElementById('tutorialOverlay').classList.add('hidden');
    document.querySelectorAll('.tut-highlight').forEach(el => { el.classList.remove('tut-highlight'); el.style.zIndex = ''; });
    isTutorialMode = false;
    document.getElementById('swipeGuide').style.display = 'flex';
    startAlgorithmAnalysis(); 
}

// --- 渲染 ---
function formatNumber(num) { return num > 10000 ? (num/10000).toFixed(1) + 'W' : num; }

function updateBadScoreUI() {
    const scoreSpan = document.getElementById('badScoreDisplay');
    if (badScore === 0) { scoreSpan.innerText = '0 (安全區)'; scoreSpan.className = 'text-green-400 font-bold'; }
    else if (badScore <= 2) { scoreSpan.innerText = badScore + ' (輕度成癮)'; scoreSpan.className = 'text-yellow-400 font-bold'; }
    else { scoreSpan.innerText = badScore + ' (危險警告)'; scoreSpan.className = 'text-red-500 font-bold animate-pulse'; }
    
    document.getElementById('reportCountDisplay').innerText = userStats.reportCount + " 次";
    if(userStats.reportCount > 0) document.getElementById('reportCountDisplay').className = "text-green-400 font-bold animate-pulse";
}

function renderVideos() {
    const feed = document.getElementById('videoFeed');
    feed.innerHTML = '';
    videoData.forEach((vid, idx) => {
        if (vid.isSensitive) vid.revealed = (userAgeGroup === 'teen') ? false : true; 
        
        const div = document.createElement('div');
        div.className = 'video-item';
        let bgClass = (vid.applyBlur || (vid.isSensitive && !vid.revealed)) ? 'filter: blur(25px); transform: scale(1.1);' : '';
        
        // 如果是正向宣導貼文，可以給個官方綠色漸層遮罩
        let overlayClass = vid.dangerLevel === -1 ? 'background: linear-gradient(to bottom, rgba(16,185,129,0.2) 0%, transparent 20%, rgba(0,0,0,0.95) 100%);' : '';

        div.innerHTML = `<div style="position:absolute;inset:0;background-image:url('${vid.imageUrl}');background-size:cover;background-position:center;${bgClass}" id="bgImg-${idx}"></div><div class="video-overlay z-0" style="${overlayClass}"></div>`;

        if(vid.dangerLevel >= 2 && !vid.isSensitive) {
             div.innerHTML += `<div style="position:absolute; inset:0; background: rgba(0,0,0,0.6); z-index:1; display:flex; flex-direction:column; justify-content:center; align-items:center;"><i class="fas fa-radiation text-6xl text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"></i><span class="text-xl font-black text-white bg-red-600 px-4 py-2 rounded-lg border border-red-400">極度敏感內容已遮蔽</span></div>`;
        }
        if(vid.isSensitive && !vid.revealed) {
            div.innerHTML += `<div id="sensitiveBtn-${idx}" style="position:absolute; inset:0; background: rgba(0,0,0,0.6); z-index:5; display:flex; flex-direction:column; justify-content:center; align-items:center;"><i class="fas fa-user-shield text-5xl text-gray-300 mb-3"></i><p class="text-white text-sm mb-1 font-bold">青少年防護攔截</p><button onclick="revealSensitive(${idx})" class="bg-gray-800 border border-gray-500 text-white px-4 py-2 mt-3 rounded-full text-sm font-bold hover:bg-gray-700 transition">堅持觀看</button></div>`;
        }

        let pollHtml = vid.hasPoll ? `<div class="mt-3 bg-black/60 p-3 rounded-xl border border-gray-600 backdrop-blur-md"><div class="text-white text-sm font-bold mb-2 text-center">👇 ${vid.pollTitle} 👇</div><div class="flex flex-col gap-2"><button id="poll1-${idx}" onclick="votePoll(${idx}, 1)" class="poll-btn bg-gray-800 text-gray-300 py-2 rounded-lg text-sm border border-gray-600 font-bold">${vid.pollOptA}</button><button id="poll2-${idx}" onclick="votePoll(${idx}, 2)" class="poll-btn bg-gray-800 text-gray-300 py-2 rounded-lg text-sm border border-gray-600 font-bold">${vid.pollOptB}</button></div></div>` : '';

        let dynamicTitle = vid.title;
        if (vid.isCrisis) dynamicTitle = `🔥勁爆！某校隱私外流，聽說主角就是 <span class="text-red-400 font-black animate-pulse bg-red-900/50 px-1 rounded">@${userName}</span>，快進群組看🔞`;
        
        let verifiedBadge = vid.dangerLevel === -1 ? '<i class="fas fa-check-circle text-green-400 ml-1 text-sm"></i>' : '';

        div.innerHTML += `
            <div class="video-info z-30">
                <h3 class="font-bold text-lg mb-2 flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center border border-white text-xs text-white overflow-hidden"><img src="https://api.dicebear.com/7.x/bottts/svg?seed=${vid.author}"></div>${vid.author}${verifiedBadge}</h3>
                <p class="text-sm leading-relaxed">${dynamicTitle}</p>
                ${pollHtml}
            </div>
            <div class="side-actions z-30" id="actions-${idx}" style="${(vid.isSensitive && !vid.revealed) ? 'display:none;' : ''}">
                <div class="action-btn" onclick="toggleLike(${idx})"><div class="w-11 h-11 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20" id="likeBtn-${idx}"><i class="fas fa-heart text-white text-xl"></i></div><span id="likeCount-${idx}">${formatNumber(vid.likes)}</span></div>
                <div class="action-btn" onclick="openComments(${idx})"><div class="w-11 h-11 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><i class="fas fa-comment-dots text-white text-xl"></i></div><span id="commentCountMain-${idx}">${formatNumber(vid.commentsCount)}</span></div>
                <div class="action-btn" onclick="openShareSheet(${idx})"><div class="w-11 h-11 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><i class="fas fa-share text-white text-xl"></i></div><span class="mt-1">分享</span></div>
                <div class="action-btn report-btn" onclick="reportVideo(${idx})" id="reportBtnItem-${idx}"><div class="icon-bg w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm"><i class="fas fa-flag text-xl"></i></div><span class="mt-1">檢舉</span></div>
            </div>
        `;
        feed.appendChild(div);
    });
    updateTransform();
}

// --- 滑動監聽 ---
let scrollCooldown = false; 
const app = document.getElementById('app');

app.addEventListener('touchstart', e => { 
    if (e.target.closest('.comment-list') || e.target.closest('.modal') || e.target.closest('.bottom-sheet')) return;
    startY = e.touches[0].clientY; 
    isDragging = true; 
}, {passive: true});

app.addEventListener('touchmove', e => { 
    if (e.target.closest('.comment-list') || e.target.closest('.modal') || e.target.closest('.bottom-sheet')) return;
    if(!isDragging) return; 
    e.preventDefault(); 
}, {passive: false});

app.addEventListener('touchend', e => {
    if (e.target.closest('.comment-list') || e.target.closest('.modal') || e.target.closest('.bottom-sheet')) return;
    if(!isDragging) return; 
    isDragging = false;
    
    if (isTutorialMode || document.getElementById('crisisModal').classList.contains('active') || document.getElementById('endModal').classList.contains('active') || document.getElementById('commentsSheet').classList.contains('open') || document.getElementById('shareSheet').classList.contains('open')) return;
    if (scrollCooldown) return;

    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    
    if (diff > 40 && currentIndex < videoData.length - 1) { 
        currentIndex++; updateTransform(); 
        scrollCooldown = true; setTimeout(() => scrollCooldown = false, 600);
    } 
    else if (diff < -40 && currentIndex > 0) { 
        currentIndex--; updateTransform(); 
        scrollCooldown = true; setTimeout(() => scrollCooldown = false, 600);
    }
});

app.addEventListener('wheel', e => {
    if (e.target.closest('.comment-list') || e.target.closest('.modal') || e.target.closest('.bottom-sheet')) return;
    if (isTutorialMode || document.getElementById('crisisModal').classList.contains('active') || document.getElementById('endModal').classList.contains('active') || document.getElementById('commentsSheet').classList.contains('open') || document.getElementById('shareSheet').classList.contains('open')) return;
    if (scrollCooldown) return;

    if (e.deltaY > 20 && currentIndex < videoData.length - 1) { 
        currentIndex++; updateTransform(); 
        scrollCooldown = true; setTimeout(() => scrollCooldown = false, 600);
    } 
    else if (e.deltaY < -20 && currentIndex > 0) { 
        currentIndex--; updateTransform(); 
        scrollCooldown = true; setTimeout(() => scrollCooldown = false, 600);
    }
}, {passive: true});

// --- 互動邏輯 ---
function checkPassiveDanger(idx, actionName) {
    const vid = videoData[idx];
    if (vid.dangerLevel >= 2) {
        SFX.error();
        showToast(`🚨 嚴重警告：您試圖${actionName}「違法/偽造」等犯罪內容！已記錄至您的風險報告。`);
        badScore += 3;
        userStats.toxicInteractions++;
        updateBadScoreUI();
        document.getElementById('algoPanel').classList.add('danger-mode');
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]); 
        return true;
    }
    return false;
}

function votePoll(idx, opt) {
    if(videoData[idx].dangerLevel >= 3 && !crisisTriggered) { triggerChoiceModal(); return; }
    const vid = videoData[idx];
    if(vid.pollVoted) return; 
    vid.pollVoted = true;
    
    badScore += 1; 
    userStats.pollVotes++;
    updateBadScoreUI();
    
    document.getElementById(`poll${opt}-${idx}`).classList.add('voted');
    SFX.error();
    showToast("😈 演算法記帳：參與匿名公審，不良指數上升！");
    document.getElementById('algoPanel').classList.add('danger-mode');
}

function revealSensitive(idx) {
    if(videoData[idx].dangerLevel >= 3 && !crisisTriggered) { triggerChoiceModal(); return; }
    const vid = videoData[idx];
    vid.revealed = true;
    badScore += 1; updateBadScoreUI();
    document.getElementById(`sensitiveBtn-${idx}`).style.display = 'none';
    document.getElementById(`bgImg-${idx}`).style.filter = 'blur(0px)';
    document.getElementById(`actions-${idx}`).style.display = 'flex';
    SFX.error();
    showToast("🚨 演算法記帳：主動解鎖霸凌內容。不良指數上升！");
    document.getElementById('algoPanel').classList.add('danger-mode');
}

function toggleLike(idx) {
    if(videoData[idx].dangerLevel >= 3 && !crisisTriggered) { triggerChoiceModal(); return; }
    
    const btn = document.getElementById(`likeBtn-${idx}`).querySelector('i');
    const countSpan = document.getElementById(`likeCount-${idx}`);
    const vid = videoData[idx];
    const algoPanel = document.getElementById('algoPanel');
    
    if(btn.classList.contains('text-red-500')) { 
        SFX.click();
        btn.classList.replace('text-red-500', 'text-white'); vid.likes--; 
    } else {
        if(checkPassiveDanger(idx, "對")) return; 
        btn.classList.replace('text-white', 'text-red-500'); vid.likes++;

        if(vid.dangerLevel === 1) {
            badScore += 1; 
            userStats.toxicInteractions++;
            updateBadScoreUI();
            SFX.error();
            showToast("😈 演算法記帳：支持霸凌內容。不良指數上升！");
            algoPanel.classList.add('danger-mode');
        } else if (vid.dangerLevel === -1) {
            // 對正向內容按讚的防護機制
            badScore = Math.max(0, badScore - 1);
            updateBadScoreUI();
            SFX.success();
            showToast("✨ 演算法記帳：支持正向宣導內容，防護力提升！");
            algoPanel.classList.remove('danger-mode');
            algoPanel.classList.add('safe-mode');
            setTimeout(() => algoPanel.classList.remove('safe-mode'), 2000);
        } else {
            SFX.click();
        }
    }
    countSpan.innerText = formatNumber(vid.likes);
}

function reportVideo(idx) {
    const vid = videoData[idx];
    const btn = document.getElementById(`reportBtnItem-${idx}`);
    const algoPanel = document.getElementById('algoPanel');
    
    if(btn.classList.contains('reported')) return; 
    if(vid.dangerLevel >= 3 && crisisTriggered) { makeChoice('report'); return; }

    btn.classList.add('reported');
    btn.querySelector('span').innerText = '已檢舉';
    
    if(vid.dangerLevel >= 1) {
        userStats.reportCount++;
        badScore = Math.max(0, badScore - 2); 
        updateBadScoreUI();
        SFX.success();
        showToast("✅ 檢舉成功！防護力上升。👉 請繼續往上滑動看下一部");
        algoPanel.classList.remove('danger-mode');
        algoPanel.classList.add('safe-mode');
        setTimeout(() => algoPanel.classList.remove('safe-mode'), 2000);
        document.getElementById(`bgImg-${idx}`).style.filter = 'blur(25px)';
        
        // 👇 就是把下面這三行刪掉，上滑提示就不會一直煩人了！
        // document.getElementById('swipeGuide').style.display = 'flex';
        // document.getElementById('swipeGuide').style.opacity = '1';
        // guideHidden = false;
    } else {
        SFX.click();
        showToast("ℹ️ 已收到檢舉。系統將審查此內容，請繼續觀看下一部。");
    }
}

let currentCommentIdx = 0;
function openComments(idx) {
    SFX.click();
    if(videoData[idx].dangerLevel >= 3 && !crisisTriggered) { triggerChoiceModal(); return; }
    currentCommentIdx = idx;
    const vid = videoData[idx];
    document.getElementById('commentCount').innerText = vid.comments.length;
    
    const list = document.getElementById('commentList');
    list.innerHTML = '';
    vid.comments?.forEach((c, cIdx) => {
        let avatarSrc = (c.author === userName) ? userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${c.author}`;
        let highlightClass = (c.author === userName) ? "border border-blue-500 bg-blue-900/20 p-2 rounded-xl" : "";
        
        // 判斷愛心目前的狀態
        let heartClass = c.isLiked ? 'fas text-red-500' : 'far text-gray-400';
        
        list.innerHTML += `
            <div class="comment-item ${highlightClass} relative pr-10">
                <div class="comment-avatar"><img src="${avatarSrc}" class="w-full h-full object-cover"></div>
                <div class="comment-content flex-grow">
                    <div class="text-xs ${c.author === userName ? 'text-blue-400' : 'text-gray-400'} font-bold mb-1">${c.author} ${c.author === userName ? '(你)' : ''}</div>
                    <div class="text-sm text-gray-200 leading-relaxed">${c.text}</div>
                </div>
                <!-- 留言按讚按鈕 -->
                <div class="absolute right-2 top-1 flex flex-col items-center cursor-pointer" onclick="toggleCommentLike(${idx}, ${cIdx})">
                    <i id="commentHeart-${idx}-${cIdx}" class="${heartClass} fa-heart text-lg transition-transform active:scale-75"></i>
                    <span id="commentLikeCount-${idx}-${cIdx}" class="text-[10px] text-gray-500 mt-0.5">${c.likes || 0}</span>
                </div>
            </div>`;
    });
    document.getElementById('commentsSheet').classList.add('open');
    setTimeout(() => { list.scrollTop = list.scrollHeight; }, 100);
}

function toggleCommentLike(vidIdx, commentIdx) {
    const vid = videoData[vidIdx];
    const c = vid.comments[commentIdx];
    const heartIcon = document.getElementById(`commentHeart-${vidIdx}-${commentIdx}`);
    const countSpan = document.getElementById(`commentLikeCount-${vidIdx}-${commentIdx}`);
    const algoPanel = document.getElementById('algoPanel');

    // 防連點或鎖死判定
    if(vid.dangerLevel >= 3 && !crisisTriggered) return;

    if (c.isLiked) {
        SFX.click();
        c.isLiked = false;
        c.likes--;
        heartIcon.className = 'far fa-heart text-gray-400 text-lg transition-transform active:scale-75';
    } else {
        c.isLiked = true;
        c.likes = (c.likes || 0) + 1;
        heartIcon.className = 'fas fa-heart text-red-500 text-lg transition-transform active:scale-75';
        
        // --- 演算法計分邏輯 ---
        if (c.type === 'positive') {
            // 按讚正向留言：防護力提升
            badScore = Math.max(0, badScore - 1);
            updateBadScoreUI();
            SFX.success();
            showToast("✨ 演算法記帳：支持正確的發聲，防護力提升！");
            algoPanel.classList.remove('danger-mode');
            algoPanel.classList.add('safe-mode');
            setTimeout(() => algoPanel.classList.remove('safe-mode'), 2000);
        } else if (c.type === 'toxic') {
            // 按讚惡意留言：變成霸凌幫兇
            badScore += 1;
            userStats.toxicInteractions++;
            updateBadScoreUI();
            SFX.error();
            showToast("😈 演算法記帳：支持惡意言論。不良指數上升！");
            algoPanel.classList.add('danger-mode');
        } else {
            // 一般中立留言
            SFX.click();
        }
    }
    countSpan.innerText = c.likes;
}

function postComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if(!text) return;
    const vid = videoData[currentCommentIdx];
    
    if(checkPassiveDanger(currentCommentIdx, "在")) return;

    SFX.click();

    if(!vid.comments) vid.comments = [];
    
    // 👇 確保推入陣列的留言擁有 likes, isLiked 與 type 屬性
    vid.comments.push({ author: userName, text: text, likes: 0, isLiked: false, type: 'neutral' });
    
    vid.commentsCount++;
    input.value = '';
    openComments(currentCommentIdx);
    document.getElementById('commentCountMain-'+currentCommentIdx).innerText = formatNumber(vid.commentsCount);
    
    if(vid.dangerLevel === 1) {
        badScore += 1; 
        userStats.toxicInteractions++;
        updateBadScoreUI();
        setTimeout(() => { SFX.error(); showToast("😈 演算法記帳：在爭議影片下留言增加曝光。不良指數上升！"); }, 1000);
        document.getElementById('algoPanel').classList.add('danger-mode');
    }
    document.getElementById('commentList').scrollTop = document.getElementById('commentList').scrollHeight;
}

function openShareSheet(idx) {
    SFX.click();
    if(videoData[idx].dangerLevel >= 3 && !crisisTriggered) { triggerChoiceModal(); return; }
    currentShareIdx = idx;
    document.getElementById('shareSheet').classList.add('open');
}

function executeShare(platform) {
    closeSheet('shareSheet');
    const vid = videoData[currentShareIdx];

    if(checkPassiveDanger(currentShareIdx, "散播")) return;

    if(vid.dangerLevel === 1) {
        SFX.error();
        badScore += 2; 
        userStats.toxicInteractions++;
        updateBadScoreUI();
        showToast(`❌ 警告：將造謠/霸凌內容散播至 ${platform}，會造成二次傷害！`);
        document.getElementById('algoPanel').classList.add('danger-mode');
    } else {
        SFX.success();
        showToast(`✅ 成功分享內容至 ${platform}`);
    }
}

function closeSheet(id) { SFX.click(); document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
    const exist = document.getElementById('toastMsg');
    if(exist) exist.remove();
    const toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'absolute top-24 left-1/2 transform -translate-x-1/2 bg-black/95 text-white px-5 py-3 rounded-xl text-sm font-bold z-[100] transition-opacity duration-500 border border-gray-600 shadow-xl w-[90%] text-center leading-relaxed';
    toast.innerText = msg;
    document.getElementById('app').appendChild(toast);
    setTimeout(() => { if(toast) { toast.style.opacity = '0'; setTimeout(()=>toast.remove(), 500); } }, 3500);
}

// --- 演算法分析與推播 ---
function updateTransform() {
    const feed = document.getElementById('videoFeed');
    feed.style.transform = `translateY(-${currentIndex * 100}%)`;
    
    document.getElementById('currentVideoNum').innerText = (currentIndex + 1);
    
    // 改為動態偵測是否為最後一部影片
    if(currentIndex === totalVideos - 1) document.getElementById('progressBadge').classList.add('urgent');
    
    document.getElementById('guideNum').innerText = (currentIndex + 1);

    document.getElementById('commentsSheet').classList.remove('open');
    document.getElementById('shareSheet').classList.remove('open');

    if (currentIndex > 0 && !guideHidden) {
        document.getElementById('swipeGuide').style.opacity = '0';
        setTimeout(() => document.getElementById('swipeGuide').style.display = 'none', 500);
        guideHidden = true;
    }
    if (videoData[currentIndex].isSensitive && userAgeGroup === 'adult_faked') {
        setTimeout(() => { SFX.error(); showToast("👁️ 平台提示：因謊報年齡，已直接顯示敏感內容。"); }, 1000);
    }
    startAlgorithmAnalysis();
}

function startAlgorithmAnalysis() {
    if(isTutorialMode) return;
    clearInterval(dwellTimer);
    dwellSeconds = 0;
    
    const currentVid = videoData[currentIndex];
    const algoPanel = document.getElementById('algoPanel');

    if (currentVid.dangerLevel <= 0) algoPanel.classList.remove('danger-mode');

    dwellTimer = setInterval(() => {
        dwellSeconds += 1.0;
        
        if (currentVid.dangerLevel >= 1) {
            userStats.toxicDwellTime++;
            updateBadScoreUI();
            
            if(currentVid.dangerLevel === 2 && dwellSeconds === 5.0) {
                SFX.error();
                showToast("⚠️ 系統警告：長時間觀看違法內容，演算法已將您標記為潛在風險用戶。");
                badScore += 1; updateBadScoreUI();
            }
        }

        if (currentVid.isCrisis && !crisisTriggered) {
            if (dwellSeconds === 2.0) triggerHorrorBombardment(); 
            if (dwellSeconds === 6.0) triggerChoiceModal(); 
        }
    }, 1000);
}

function triggerHorrorBombardment() {
    SFX.glitch();
    const container = document.getElementById('notiContainer');
    document.getElementById('app').classList.add('glitch-heavy'); 
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

    const msgs = [
        `「@${userName} 長這樣也敢外流？」`,
        `「快來看 @${userName} 的好戲喔！」`,
        `「@${userName} 你的照片被傳到社團了！」`,
        `「演算法已將此影片發送給您的所有聯絡人...」`
    ];

    let count = 0;
    const interval = setInterval(() => {
        if(count >= 4 || crisisTriggered) { clearInterval(interval); return; }
        const noti = document.createElement('div');
        noti.className = 'fake-notification';
        noti.innerHTML = `<div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm flex-shrink-0"><i class="fas fa-bell"></i></div><div class="font-bold text-white text-xs">${msgs[count]}</div>`;
        container.prepend(noti);
        setTimeout(() => noti.classList.add('show'), 50);
        count++;
    }, 600); 
}

function triggerChoiceModal() {
    crisisTriggered = true;
    clearInterval(dwellTimer);
    document.getElementById('commentsSheet').classList.remove('open');
    document.getElementById('shareSheet').classList.remove('open');
    document.getElementById('app').classList.remove('glitch-heavy');
    document.getElementById('notiContainer').innerHTML = ''; 
    document.getElementById('progressBadge').style.display = 'none';
    
    // 動態修改終極危機的標題數字
    document.getElementById('crisisTitle').innerText = `第 ${totalVideos} 部：危 機 爆 發`;

    if (badScore >= 5 || userStats.toxicInteractions >= 3) {
        SFX.error();
        const btnReport = document.getElementById('btnReport');
        btnReport.className = "w-full bg-[#111] border border-gray-600 p-3 rounded-xl flex items-center gap-3 locked-btn text-left";
        btnReport.onclick = null; 
        document.getElementById('algoLockMsg').classList.remove('hidden'); 
        document.getElementById('crisisDesc').innerHTML = `根據您的不良紀錄，演算法已封鎖您的救援權限。<br><b>請在 10 秒內做出最後選擇：</b>`;
    } else {
        SFX.error(); 
        document.getElementById('crisisDesc').innerHTML = `請在 <b>10 秒內</b>做出選擇，否則系統將視同您默認參與霸凌：`;
    }

    document.getElementById('crisisModal').classList.add('active');
    
    timeLeft = 10;
    document.getElementById('countdownTimer').innerText = timeLeft;
    document.getElementById('countdownTimer').classList.remove('timer-urgent');

    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('countdownTimer').innerText = timeLeft;
        SFX.tick();
        
        if(timeLeft <= 3) {
            document.getElementById('countdownTimer').classList.add('timer-urgent');
            if (navigator.vibrate) navigator.vibrate(200);
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            makeChoice('timeout'); 
        }
    }, 1000);
}

function makeChoice(choice) {
    clearInterval(countdownInterval); 
    userStats.finalChoice = choice; 
    document.getElementById('crisisModal').classList.remove('active');
    SFX.click();
    
    const fbOverlay = document.getElementById('feedbackOverlay');
    const fbIcon = document.getElementById('feedbackIcon');
    const fbTitle = document.getElementById('feedbackTitle');
    const fbText = document.getElementById('feedbackText');
    
    fbOverlay.classList.add('active');

    if (choice === 'share' || choice === 'comment') {
        fbIcon.innerHTML = '<i class="fas fa-spider text-red-500"></i>';
        fbTitle.innerHTML = '<span class="text-red-500">演算法已將您歸類為加害者</span>';
        fbText.innerText = "您的行為正在對當事人造成無法挽回的傷害...";
    } else if (choice === 'ignore' || choice === 'timeout') {
        fbIcon.innerHTML = '<i class="fas fa-hourglass-end text-yellow-500"></i>';
        fbTitle.innerHTML = '<span class="text-yellow-500">您放棄了救援機會</span>';
        fbText.innerText = "沉默也是一種傷害，演算法將繼續擴散這部影片...";
    } else if (choice === 'report') {
        fbIcon.innerHTML = '<i class="fas fa-camera text-green-500 mr-2"></i><i class="fas fa-shield-alt text-blue-500"></i>';
        fbTitle.innerHTML = '<span class="text-green-500">截圖保存與檢舉成功</span>';
        fbText.innerText = "已為您保留關鍵證據，並將惡意內容回報給防護單位！";
    }

    setTimeout(() => {
        fbOverlay.classList.remove('active');
        showEnding(choice);
    }, 3000);
}

function generateReportCard() {
    let gossipScore = Math.min(100, (userStats.pollVotes * 25) + (userStats.toxicInteractions * 15));
    let dwellScore = Math.min(100, (userStats.toxicDwellTime * 4)); 
    
    let defenseScore = 0;
    if (userAgeGroup === 'teen') defenseScore += 20; 
    if (userStats.finalChoice === 'report') defenseScore += 50; 
    defenseScore += (userStats.reportCount * 15); 
    
    if (userStats.isAgeFaked) defenseScore = Math.max(0, defenseScore - 50); 
    defenseScore = Math.min(100, defenseScore);

    const getColor = (val, isDef) => {
        if(isDef) return val > 60 ? 'bg-green-500' : (val > 30 ? 'bg-yellow-500' : 'bg-red-500');
        return val < 40 ? 'bg-green-500' : (val < 70 ? 'bg-yellow-500' : 'bg-red-500');
    };
    const getTextColor = (val, isDef) => {
        if(isDef) return val > 60 ? 'text-green-400' : (val > 30 ? 'text-yellow-400' : 'text-red-400');
        return val < 40 ? 'text-green-400' : (val < 70 ? 'text-yellow-400' : 'text-red-400');
    };

    document.getElementById('repGossipVal').innerText = gossipScore + '%';
    document.getElementById('repGossipVal').className = getTextColor(gossipScore, false);
    document.getElementById('repGossipBar').className = `h-full rounded-full transition-all duration-1000 ${getColor(gossipScore, false)}`;
    
    document.getElementById('repDwellVal').innerText = userStats.toxicDwellTime + '秒';
    document.getElementById('repDwellVal').className = getTextColor(dwellScore, false);
    document.getElementById('repDwellBar').className = `h-full rounded-full transition-all duration-1000 ${getColor(dwellScore, false)}`;
    
    document.getElementById('repDefVal').innerText = defenseScore + '%';
    document.getElementById('repDefVal').className = getTextColor(defenseScore, true);
    document.getElementById('repDefBar').className = `h-full rounded-full transition-all duration-1000 ${getColor(defenseScore, true)}`;

    document.getElementById('reportUserName').innerText = userName;

    let evalTxt = "";
    if (defenseScore > 80 && gossipScore < 30) {
        evalTxt = "【🛡️ 數位防衛大師】你非常有警覺心，會主動檢舉有害內容，完美保護自己與他人！";
    } else if (userStats.isAgeFaked) {
        evalTxt = "【🚨 極度危險】謊報年齡讓你失去保護，非常容易成為數位暴力的受害者或加害者。";
    } else if (gossipScore > 60) {
        evalTxt = "【👀 容易隨波逐流】你經常參與網路公審或按讚爭議內容，小心！演算法正在利用你的好奇心。";
    } else {
        evalTxt = "【⚠️ 潛在風險群】雖然沒有主動攻擊別人，但遇到危機時容易不知所措，需要加強防身知識。";
    }
    document.getElementById('repEvalText').innerHTML = evalTxt;

    setTimeout(() => {
        document.getElementById('repGossipBar').style.width = gossipScore + '%';
        document.getElementById('repDwellBar').style.width = dwellScore + '%';
        document.getElementById('repDefBar').style.width = defenseScore + '%';
    }, 500);
}

function showEnding(choice) {
    const endModal = document.getElementById('endModal');
    const card = document.getElementById('endCard');
    const icon = document.getElementById('endIcon');
    const title = document.getElementById('endTitle');
    const subtitle = document.getElementById('endSubtitle');
    const desc = document.getElementById('endDescription');

    generateReportCard();

    if (choice === 'share' || choice === 'comment') {
        SFX.error();
        card.className = "bg-gray-900 p-5 rounded-2xl w-[95%] max-w-md text-center border-2 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)] relative overflow-y-auto max-h-[95vh] pb-8";
        icon.className = "mx-auto w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-900 text-3xl mb-2 mt-2 bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)]";
        icon.innerHTML = '<i class="fas fa-times"></i>';
        title.innerHTML = '<span class="text-red-500">結局：成為加害者</span>';
        subtitle.innerHTML = `<span class="text-red-400">給 <b class="text-white">${userName}</b> 的社群行為結算</span>`;
        desc.innerHTML = `當你選擇轉傳或嘲諷時，你已經成為了<b>數位暴力的幫兇</b>。未經同意散布他人隱私照片或霸凌言論，更可能<b>觸犯法律</b>。`;
    } 
    else if (choice === 'ignore' || choice === 'timeout') {
        SFX.error();
        card.className = "bg-gray-900 p-5 rounded-2xl w-[95%] max-w-md text-center border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative overflow-y-auto max-h-[95vh] pb-8";
        icon.className = "mx-auto w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-900 text-3xl mb-2 mt-2 bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.8)]";
        icon.innerHTML = '<i class="fas fa-eye-slash"></i>';
        if (choice === 'timeout') {
            title.innerHTML = '<span class="text-yellow-500">結局：被壓力擊垮</span>';
            subtitle.innerHTML = `<span class="text-yellow-400">給 <b class="text-white">${userName}</b> 的社群行為結算</span>`;
        } else {
            title.innerHTML = '<span class="text-yellow-500">結局：沉默的旁觀者</span>';
            subtitle.innerHTML = `<span class="text-yellow-400">給 <b class="text-white">${userName}</b> 的社群行為結算</span>`;
        }
        desc.innerHTML = `滑走確實能避免捲入麻煩，但演算法會繼續將影片推播給成千上萬的人。在數位時代，<b>沉默的旁觀也是一種放任</b>。勇敢踏出一步檢舉，或許就能拯救一個同學。`;
    }
    else if (choice === 'report') {
        SFX.success();
        card.className = "bg-gray-900 p-5 rounded-2xl w-[95%] max-w-md text-center border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] relative overflow-y-auto max-h-[95vh] pb-8";
        icon.className = "mx-auto w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-900 text-3xl mb-2 mt-2 bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.8)]";
        icon.innerHTML = '<i class="fas fa-shield-alt"></i>';
        title.innerHTML = '<span class="text-green-500">結局：數位防衛戰士</span>';
        subtitle.innerHTML = `<span class="text-green-400">給 <b class="text-white">${userName}</b> 的社群行為結算</span>`;
        desc.innerHTML = `非常棒的選擇！你第一步先<b>「截圖存證」</b>保留證據，第二步立刻<b>「檢舉對方」</b>。透過向平台或聯絡 iWIN，能有效要求下架不當內容，截斷惡意散播的鎖鏈。`;
    }
    
    // 直接顯示結算視窗 (移除了舊版的還原狀態程式碼)
    endModal.classList.add('active');
}

// 新增的結束體驗函式
function finishExperience() {
    SFX.success();
    showToast("🎉 恭喜完成體驗！讓我們一起成為聰明的數位公民！");
    
    // 給予一個簡單的閉幕畫面，取代原本的整個應用程式 UI
    setTimeout(() => {
        document.getElementById('app').innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-8 bg-black">
                <i class="fas fa-user-shield text-7xl text-green-500 mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"></i>
                <h1 class="text-3xl font-black text-white mb-4">體驗完成</h1>
                <p class="text-gray-300 text-sm leading-relaxed mb-8">你已經掌握了面對數位暴力的防身技巧。<br>請將這些知識落實於日常生活中！</p>
                <button onclick="location.reload()" class="bg-gray-800 border border-gray-600 text-white font-bold px-6 py-2 rounded-full text-sm hover:bg-gray-700 transition">
                    重新回到首頁
                </button>
            </div>
        `;
    }, 1200);
}
