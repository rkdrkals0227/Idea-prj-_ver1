import {MissionReminders,missionHint} from "./hints.js";
import {validateTactile} from "./tactile.js";
import { storyIllustration } from "./storybook.js";
import { ActivityClock, formatDuration, dayPhase } from "./experience.js";
import { validateClassRules, completeSchoolTyping } from "./classroom.js";
import assetManifest from "./data/asset-manifest.json";
import {
  levels,
  journeyLevel,
  canEnterLevel,
  normalizeJourney,
  validateJourney,
  objective,
  activityTarget,
  registerExhibit,
  reconcileExhibits,
  validExhibit,
} from "./journey.js";
import { showSchool } from "./school.js";
import { residentIntroductions } from "./data/residents.js";
import { guardianStamps } from "./data/guardian.js";
import {
  normalizeGuardian,
  hasReadLegend,
  canHearLegend,
  readLegendPage,
  answerLegend,
  earnedGuardianStamps,
  isGuardian,
  validateGuardian,
  validateGuardianLesson,
} from "./guardian.js";
import "./style.css";
import { World } from "./world.js";
import { defaults, habitats } from "./data/content.js";
import {
  quizPool,
  quizContextLabels,
  upgradeQuizContent,
  residentThemes,
} from "./data/learning.js";
import {
  initialState,
  startQuest,
  collect,
  sortWaste,
  pathValid,
  reconcile,
  approved,
  escapeHTML as h,
  award,
} from "./logic.js";
import {
  setStorageReporter,
  loadState,
  saveState,
  loadContent,
  saveContent,
  artStore,
  download,
  exportWorks,
  decodeBundle,
} from "./storage.js";
import { imageEditor } from "./editor.js";
const $ = (s) => document.querySelector(s);
let state,
  content,
  works = [],
  world,
  modal = null,
  lastFocus = null,
  toastTimer;
let tracked = null;
let criticalUntil = 0;
const app = $("#app");
app.innerHTML = `<main class="game"><div id="world" class="world"></div><div class="hud"><header class="topbar"><div class="brand"><div class="brand-mark">♧</div><div><h1>금산마을 탐험대</h1><p>GEUMSAN · LITTLE EXPLORERS</p></div></div><div class="location"><span class="sun"></span><strong id="place">학교 앞 산책길</strong><span class="day" id="day-time">한국 시간 · 개인 체험</span></div><div class="activity-chip" id="activity-time" title="이 창을 보고 있는 동안의 활동 시간 · 이 브라우저에 저장">이번 활동 00:00</div><button id="tools-toggle" class="tools-toggle" aria-expanded="false" aria-controls="explore-tools">탐험 도구 ☰</button></header><section class="quest-card" aria-label="활동 진행"><span class="eyebrow">OUR VILLAGE JOURNEY</span><h2 id="level-title">레벨 1 · 학교</h2><p id="level-goal" class="small"></p><div id="quests"></div><div class="counter" hidden><span>우리 동네 수호대 스탬프</span><b id="badge-count">0 / 3</b></div><div class="progress" hidden><i id="progress"></i></div><div id="guardian-stamps" class="stamp-strip" hidden></div><button id="guardian-open" class="guardian-open">스탬프 3개 모으기 · 미션 안내</button></section><nav id="explore-tools" class="sidebar" aria-label="탐험 도구" hidden><button class="nav-btn" data-page="map" aria-label="우리 반 생태 지도"><span>⌘</span>생태 지도</button><button class="nav-btn" id="camera"><span>▣</span>그림 등록</button><button class="nav-btn" data-page="bag"><span>♧</span>내 가방</button><button class="nav-btn" data-page="catalog"><span>▤</span>생태 도감</button><button class="nav-btn" data-page="settings"><span>⚙</span>설정</button></nav><button id="interact" class="interaction" hidden></button><div class="bottom"><div class="controls-hint"><kbd>W A S D</kbd><span>또는 방향키로 걷기</span><kbd>E</kbd><span>가까이에서 이야기하기</span></div><button class="mini-map" data-page="map" aria-label="우리 반 생태 지도 열기"><p>나의 작은 마을 <span>↗</span></p><canvas id="mini" width="210" height="150"></canvas></button></div><aside id="mission-reminder" class="mission-reminder" role="status" aria-live="polite" hidden><div><b>지금 할 일</b><p id="mission-reminder-text"></p></div><button id="reminder-dismiss" aria-label="미션 안내 닫기">×</button></aside><div class="touch-controls" aria-label="방향 버튼"><button data-key="w" aria-label="앞으로">↑</button><button data-key="a" aria-label="왼쪽으로">←</button><button data-key="s" aria-label="뒤로">↓</button><button data-key="d" aria-label="오른쪽으로">→</button></div></div><div class="loading" id="loading"><span class="welcome-icon">🌱</span><h2>작은 마을을 준비하고 있어요</h2><p>산책길에 햇살을 채우는 중…</p></div></main><input id="image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden><div id="toast" class="toast" role="status" hidden></div><div class="printed"></div>`;
function toast(message, critical = false) {
  if (!critical && Date.now() < criticalUntil) return;
  if (critical) criticalUntil = Date.now() + 8000;
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 6500);
}
function close() {
  if (!modal) return;
  modal.remove();
  modal = null;
  world?.setPaused(false);
  lastFocus?.focus();
}
function open(title, html, width = "") {
  if (!modal) lastFocus = document.activeElement;
  modal?.remove();
  modal = document.createElement("div");
  modal.className = "overlay";
  modal.innerHTML = `<section class="modal ${width}" role="dialog" aria-modal="true" aria-label="${h(title)}"><header class="modal-header"><h2>${h(title)}</h2><button class="close" aria-label="창 닫기">×</button></header><div class="modal-body">${html}</div></section>`;
  document.body.append(modal);
  world?.setPaused(true);
  hideMissionReminder();
  setTools(false);
  modal.querySelector(".close").onclick = close;
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const els = [
          ...modal.querySelectorAll("button,input,select,textarea,a[href]"),
        ].filter((el) => !el.disabled && !el.hidden),
        first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  modal.querySelector(".close").focus();
  return modal.querySelector(".modal-body");
}
const ui = { open, close, toast };
setStorageReporter((message) => toast(message, true));
state = loadState();
content = upgradeQuizContent(loadContent(defaults));
try {
  validateState(state);
  validateContent(content);
} catch {
  state = initialState();
  content = structuredClone(defaults);
  toast(
    "저장 자료 형식을 읽지 못했어요. 원본은 자동으로 지우지 않았어요. 백업 파일을 확인하거나 다른 브라우저에서 열어 주세요.",
    true,
  );
}
function setTools(visible){const nav=$("#explore-tools");if(!nav)return;nav.hidden=!visible;$("#tools-toggle").setAttribute("aria-expanded",String(visible));}
$("#tools-toggle").onclick=()=>setTools($("#explore-tools").hidden);
$("#world").addEventListener("pointerdown",()=>setTools(false));
const reminders=new MissionReminders();
let reminderTimeout;
function hideMissionReminder(){clearTimeout(reminderTimeout);$("#mission-reminder").hidden=true;}
$("#reminder-dismiss").onclick=hideMissionReminder;
function updateMissionReminder(){
 const level=journeyLevel(state),hint=missionHint(state,content,world?.indoor);
 const eligible=!!world&&state.welcomed&&!modal&&!document.hidden&&document.hasFocus()&&Date.now()>=criticalUntil;
 if(!eligible||!hint||(!$("#mission-reminder").hidden&&$("#mission-reminder-text").textContent!==hint))hideMissionReminder();
 if(reminders.level!==level)hideMissionReminder();
 if(reminders.poll(activityClock.sessionMs,level,eligible)&&hint){
  $("#mission-reminder-text").textContent=hint;$("#mission-reminder").hidden=false;clearTimeout(reminderTimeout);reminderTimeout=setTimeout(hideMissionReminder,18000);
 }
}
let activityClock=new ActivityClock(state.activity);
let lastActivitySave=performance.now();
function updateActivity(){
  const now=performance.now();activityClock.tick(now,state.welcomed&&!document.hidden&&document.hasFocus());
  $("#activity-time").textContent=`이번 활동 ${formatDuration(activityClock.sessionMs)} · 누적 ${formatDuration(activityClock.totalMs)}`;
  const d=dayPhase();$("#day-time").textContent=`${d.time} · ${d.label}`;
  document.documentElement.dataset.dayPhase=d.phase;
  if(now-lastActivitySave>=15000){saveState(state);lastActivitySave=now}
  updateMissionReminder();
}
setInterval(updateActivity,1000);
for(const name of ['visibilitychange','focus','blur'])window.addEventListener(name,updateActivity);
window.addEventListener('pagehide',()=>{activityClock.tick(performance.now(),false);saveState(state)});
updateActivity();
function persist() {
  completeSchoolTyping(state,content);
  reconcile(state, content);
  saveState(state);
  world?.sync(state);
  renderHud();
}
function renderHud() {
  const current = journeyLevel(state);
  $("#level-title").textContent =
    current > 4
      ? "우리 동네 수호대 · 성공!"
      : `레벨 ${current} · ${levels[current - 1].title.split(" · ")[0]}`;
  $("#level-goal").textContent =
    current > 4
      ? "전시한 약속을 생활에서도 이어가요."
      : levels[current - 1].description;
  $("#quests").innerHTML = levels.filter(l=>l.id===current)
    .map(
      (l) =>
        `<button class="level-row ${l.id === current ? "current" : ""} ${l.id < current ? "done" : ""}" data-level="${l.id}" aria-label="레벨 ${l.id} ${h(l.title)} ${l.id < current ? "완료" : l.id === current ? "진행 중" : "잠김"}"><span>${l.id < current ? "✓" : l.id > current ? "♙" : l.id}</span><div>${h(l.title)}<small>${l.id < current ? "완료" : l.id === current ? "지금 할 일" : "앞 레벨을 마치면 열려요"}</small></div></button>`,
    )
    .join("");
  document
    .querySelectorAll("[data-level]")
    .forEach((b) => (b.onclick = () => levelAction(+b.dataset.level)));
  const earned = earnedGuardianStamps(state),
    idsEarned = earned.map((s) => s.id);
  $("#badge-count").textContent = `${earned.length} / 3`;
  $("#progress").style.width = `${(earned.length / 3) * 100}%`;
  $("#guardian-stamps").innerHTML = guardianStamps
    .map(
      (s) =>
        `<span class="stamp-mini ${idsEarned.includes(s.id) ? "earned" : ""}" title="${h(s.name)} · ${idsEarned.includes(s.id) ? "획득" : "도전 중"}">${s.icon}<small>${idsEarned.includes(s.id) ? "✓" : "○"}</small></span>`,
    )
    .join("");
  $("#guardian-open").textContent = isGuardian(state)
    ? "수호대 성공! 인증서 보기"
    : "스탬프 3개 모으기 · 미션 안내";
  $("#guardian-open").onclick = guardianOverview;
  world?.setObjective?.(objective(state, content, world.indoor));
  const activeGoal = objective(state, content, world?.indoor);
  document
    .querySelector('[data-page="bag"]')
    .classList.toggle("current-goal", activeGoal?.id === "bag");
  document
    .querySelector('[data-page="map"]')
    .classList.toggle("current-goal", activeGoal?.id === "eco-map");
  $("#tools-toggle").classList.toggle("current-goal",!!activeGoal?.ui);
  updateMissionReminder();
}
function levelGate(n) {
  if (canEnterLevel(state, n)) return true;
  const active = journeyLevel(state),
    root = open(
      `레벨 ${n}은 아직 잠겨 있어요`,
      `<p>먼저 <b>레벨 ${active} · ${h(levels[active - 1].title)}</b>을 마치고 와 줘!</p><p>${h(levels[active - 1].description)}</p><button id="current-level" class="primary">지금 할 일 확인</button>`,
    );
  root.querySelector("#current-level").onclick = guardianOverview;
  return false;
}
function levelAction(n) {
  if (!levelGate(n)) return;
  if (n === 1) {
    if (world?.indoor === "school" || state.journey.schoolReady) return board();
    close();
    toast("학교 입구의 빛을 따라가서 회의 게시판을 살펴보세요.");
  } else if (n === 2) {
    const r = open(
      "레벨 2 · 통학로 문제 해결",
      '<p>안내 길과 주택가를 모두 돌보면 레벨 3이 열려요.</p><div class="stack"><button id="road-path">안내 길 수리</button><button id="road-trash">주택가 쓰레기 분류</button></div>',
    );
    r.querySelector("#road-path").onclick = () => questInfo("path");
    r.querySelector("#road-trash").onclick = () => questInfo("trash");
  } else if (n === 3) {
    close();
    toast("금호지의 빛을 따라 동물 친구에게 말을 걸어 보세요.");
  } else showExhibition();
}

function start(id) {
  if (!levelGate(id === "lake" ? 3 : 2)) return;
  startQuest(state, id);
  persist();
  toast("활동을 시작했어요. 지도에서 위치를 찾아보세요.");
}
const targetIds = ["path", "trash", "lake"];
function questInfo(id) {
  if (!levelGate(id === "lake" ? 3 : 2)) return;
  const q = content.quests[id];
  const root = open(
    q.title,
    `<span class="badge">${state.completed.includes(id) ? "완료" : state.started.includes(id) ? "진행 중" : "시작 가능"}</span><p>${h(q.description)}</p><p class="small">관련 회의 안건: ${h(content.agendas.find((a) => a.id === q.agenda)?.title || "자유 활동")}<br>목표 수량: ${h(q.target)} · 보상: ${h(q.reward)}</p><div class="actions"><button id="track">지도에서 위치 보기</button><button id="begin" class="primary">${state.started.includes(id) ? "계속 활동하기" : "이 활동 해 보기"}</button></div>`,
  );
  root.querySelector("#track").onclick = () => {
    tracked = id;
    showMap();
  };
  root.querySelector("#begin").onclick = () => {
    start(id);
    close();
  };
}
function board() {
  showSchool({
    state,
    content,
    ui,
    persist,
    onNext: () => {
      close();
      if (world.indoor) world.exit();
      persist();
    },
    reflection,
    teacher,
  });
}
function reflection() {
  const root = open(
    "오늘의 탐험을 돌아봐요",
    `<p>읽은 자료 ${state.read.length}개 · 활동 배지 ${state.badges.length}개</p><form id="reflection"><label>어떤 문제가 있었나요?<textarea name="problem" required maxlength="500"></textarea></label><label>어떻게 해결했나요?<textarea name="solution" required maxlength="500"></textarea></label><label>생활에서 할 수 있는 일은 무엇인가요?<textarea name="practice" required maxlength="500"></textarea></label><button class="primary">배움 기록 남기기</button></form><div class="stack" id="records">${state.reflections.map((r) => `<article class="card"><h3>${h(r.date)}</h3><p>${h(r.problem)}<br>${h(r.solution)}<br>${h(r.practice)}</p></article>`).join("")}</div>`,
  );
  root.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    state.reflections.push({
      ...Object.fromEntries(new FormData(e.target)),
      date: new Date().toLocaleDateString("ko-KR"),
    });
    persist();
    toast("배움 기록을 남겼어요.");
    reflection();
  };
}
function introduce(key, next) {
  if (state.journey.met.includes(key)) {
    next();
    return;
  }
  const who = residentIntroductions[key],
    d = content.dialogues[key];
  const r = open(
    "동물 친구와 첫 만남",
    `<p>안녕, 나는 <b>${h(who.name)}</b>이야.</p><p>${h(d?.intro || who.text)}</p><p class="small">가상의 주민을 소개하는 게임 설정이에요. 실제 서식 정보와는 구분해요.</p><button id="intro-next" class="primary">반가워! 이야기 나누기</button>`,
  );
  r.querySelector("#intro-next").onclick = () => {
    if (!state.journey.met.includes(key)) state.journey.met.push(key);
    persist();
    close();
    next();
  };
}
function talk(id, introduced = false) {
  if (!["otter", "turtle", "crane"].includes(id) || !levelGate(3)) return;
  const introKey = id === "resident" ? "house" : id;
  if (!introduced) return introduce(introKey, () => talk(id, true));
  const key = id === "resident" ? "house" : id,
    d = content.dialogues[key],
    qid = { otter: "path", turtle: "lake", house: "trash" }[key],
    stage = qid
      ? state.completed.includes(qid)
        ? "after"
        : state.started.includes(qid)
          ? "during"
          : "before"
      : key === "postman"
        ? state.letters.length
          ? "after"
          : Object.keys(state.letterDraft).length
            ? "during"
            : "before"
        : state.read.length ||
            state.quiz.some((id) =>
              quizPool(content, "crane").some((q) => q.id === id),
            )
          ? "after"
          : "before";
  const root = open(
    d.name,
    `<p class="eyebrow">VILLAGE FRIENDS · 가상의 동물 주민</p><div class="card"><p>${h(d[stage])}</p></div><div class="stack actions">${key === "turtle" ? '<button id="legend" class="primary">금호지의 두 용 이야기 · 수호대 스탬프</button><button id="lake-care">금호지 돌봄 활동</button>' : ""}<button id="story">${h(residentThemes[key].title)}</button><button id="quiz">퀴즈 풀기</button><button id="help">${qid ? "도와줄 일이 있나요?" : key === "postman" ? "편지 쓰기" : "도서관 책장 보기"}</button><button id="bye">다음에 이야기해요</button></div>`,
  );
  if (key === "turtle")
    root.querySelector("#legend").onclick = () => legendDialogue();
  root
    .querySelector("#lake-care")
    ?.addEventListener("click", () => lakeAction("manager"));
  root.querySelector("#story").onclick = () => {
    const r = open(
      residentThemes[key].title,
      `<p>${h(d.story)}</p>${["otter", "turtle", "crane"].includes(key) ? '<p class="notice">가상의 주민과 나누는 이야기예요. 실제 지역의 역사·서식 기록은 출처를 확인한 자료로 살펴봐요.</p>' : ""}<div class="actions"><button id="topic-quiz" class="primary">이 이야기의 퀴즈</button><button id="topic-action">${key === "postman" ? "내 편지 쓰기" : qid ? "관련 활동 살펴보기" : "도서관 자료 보기"}</button></div>`,
    );
    r.querySelector("#topic-quiz").onclick = () => quiz(key);
    r.querySelector("#topic-action").onclick = () =>
      key === "postman" ? letter() : qid ? questInfo(qid) : books();
  };
  root.querySelector("#quiz").onclick = () => quiz(key);
  root.querySelector("#help").onclick = () =>
    qid ? questInfo(qid) : key === "postman" ? letter() : books();
  root.querySelector("#bye").onclick = close;
}
function quiz(context, requestedId = null) {
  if (!levelGate(["path", "apartment"].includes(context) ? 2 : 3)) return;
  const list = quizPool(content, context);
  const topic =
    quizContextLabels[context] ||
    content.sources.find((s) => context === "source:" + s.id)?.sourceTitle ||
    "관련 자료";
  if (!list.length) {
    open(
      topic + " · 퀴즈 준비 중",
      "<p>이 주제에서 교사가 검토한 퀴즈가 아직 없어요. 다른 주제의 문제로 바꾸지 않고, 수업 자료가 준비될 때까지 기다려요.</p>",
    );
    return;
  }
  const q = requestedId
    ? list.find((q) => q.id === requestedId)
    : list.find((q) => !state.quiz.includes(q.id));
  if (!q) {
    const root = open(
      topic + " · 주제 마무리",
      `<p>이 주제의 퀴즈 ${list.length}개를 모두 풀었어요! 다른 주민과 장소도 찾아가 보세요.</p><h3>다시 생각해 보고 싶은 문제</h3><div class="stack">${list.map((q, i) => `<button data-review="${h(q.id)}">${i + 1}. ${h(q.question)}</button>`).join("")}</div>`,
    );
    root
      .querySelectorAll("[data-review]")
      .forEach((b) => (b.onclick = () => quiz(context, b.dataset.review)));
    return;
  }
  const root = open(
    topic + " · 퀴즈",
    `<p class="eyebrow">이 주제의 문제 ${list.indexOf(q) + 1} / ${list.length}</p><span class="badge">${h(q.kind || "사실 퀴즈")} · ${h(q.difficulty)}</span><h3>${h(q.question)}</h3><div class="stack">${q.options.map((o, i) => `<button data-answer="${i}">${i + 1}. ${h(o)}</button>`).join("")}</div><div id="answer" aria-live="polite"></div><p class="small">관련 장소: ${h(q.place)}<br>출처: ${h(q.sourceTitle)} · ${h(q.sourceYear || "연도 미상")}<br>확인일: ${h(q.checkedAt || "미상")}</p>${q.sourceUrl ? `<a href="${h(safeUrl(q.sourceUrl))}" target="_blank" rel="noopener noreferrer">출처 확인 ↗</a>` : ""}`,
  );
  root.querySelectorAll("[data-answer]").forEach(
    (b) =>
      (b.onclick = () => {
        const correct = +b.dataset.answer === q.answer,
          a = root.querySelector("#answer");
        a.className = "feedback";
        a.textContent = correct
          ? `✓ 맞았어요! ${q.explanation}`
          : `다시 생각해 볼까요? ${q.explanation}`;
        if (!correct) return;
        if (!state.quiz.includes(q.id)) state.quiz.push(q.id);
        if (!state.badges.includes("생각 새싹")) state.badges.push("생각 새싹");
        persist();
        root
          .querySelectorAll("[data-answer]")
          .forEach((b) => (b.disabled = true));
        const next = document.createElement("button");
        next.textContent = list.some((q) => !state.quiz.includes(q.id))
          ? "이 주제의 다음 문제"
          : "이 주제 마무리";
        next.onclick = () => quiz(context);
        a.append(document.createElement("br"), next);
      }),
  );
}
function placeStory(id) {
  if (!levelGate(id === "apartment" ? 2 : 3)) return;
  const text =
    id === "forest"
      ? "이 숲길에서는 작은 싹과 새소리를 찾아보자. 정해진 길에서 조용히 관찰하고, 본 것과 추측한 것을 나누어 기록해 봐."
      : "여러 가족이 함께 쓰는 복도와 화단이 있는 곳이야. 이웃의 어려움을 듣고, 함께 지킬 수 있는 약속을 생각해 보자.";
  const root = open(
    quizContextLabels[id],
    `<p>${h(text)}</p><button class="primary" id="quiz">이곳의 퀴즈 풀기</button>`,
  );
  root.querySelector("#quiz").onclick = () => quiz(id);
  if (id === "apartment") {
    const button = document.createElement("button");
    button.textContent = "아파트 생활 문제 살펴보기";
    button.onclick = () => facility("house");
    root.append(button);
  }
}
function facility(context) {
  if (!levelGate(context === "house" ? 2 : 3)) return;
  const title =
    context === "house" ? "아파트 생활 안내" : "마을 우체통 · 마음을 전해요";
  const d = content.dialogues[context];
  const r = open(
    title,
    `<p class="small">마을 활동 안내</p><p>${h(d.story)}</p><div class="stack"><button id="story">${h(residentThemes[context].title)}</button><button id="quiz">이 주제의 퀴즈</button>${context === "house" ? '<button id="help">주택가 정리 활동</button>' : '<button id="write-letter" class="primary">편지 쓰기 · 이어 쓰기</button>'}</div>`,
  );
  r.querySelector("#story").onclick = () => {
    const card = open(
      title,
      `<p>${h(d.story)}</p><button id="topic-quiz">이 이야기의 퀴즈</button>`,
    );
    card.querySelector("#topic-quiz").onclick = () => quiz(context);
  };
  r.querySelector("#quiz").onclick = () => quiz(context);
  if (context === "house")
    r.querySelector("#help").onclick = () => questInfo("trash");
  else r.querySelector("#write-letter").onclick = letter;
}
function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}
function books() {
  if (!levelGate(3)) return;
  const cards = approved(content.sources);
  const root = open(
    "도서관 · 책장",
    `<p class="eyebrow">한 장씩 읽고, 우리 마을을 알아가요</p><div class="cards">${[
      { title: "진주 이야기", id: "festival" },
      { title: "금산면 이야기", id: "geumsan" },
      { title: "금호지 생태", id: "survey" },
      { title: "월아산과 전설", id: "mountain" },
      { title: "금호지 이야기", id: "lake" },
    ]
      .map(
        (b) =>
          `<article class="card"><h3>▤ ${b.title}</h3><p>${cards.some((c) => c.id === b.id) ? "확인된 자료를 읽어 봐요." : "교사가 출처를 확인하고 준비하는 책이에요."}</p><button data-book="${b.id}" ${cards.some((c) => c.id === b.id) ? "" : "disabled"}>책 펼치기</button></article>`,
      )
      .join(
        "",
      )}<article class="card"><h3>♧ 우리 반 생태 도감</h3><p>학생이 직접 관찰하고 만든 작품을 만나요.</p><button id="catalog">도감 펼치기</button></article><article class="card"><h3>금호지의 두 용 이야기</h3><p>선생님이 전해준 전설을 대화로 읽고 수호대 스탬프에 도전해요.</p><button id="legend-book">이야기 읽기</button></article><article class="card"><h3>자료를 읽는 탐험가</h3><p>출처·조사연도·관찰 기록을 살펴봐요.</p><button id="quiz">자료 읽기 퀴즈</button></article></div><p class="small">지역 원문에 접근할 수 없어 초기 지역 자료는 검토 초안이에요. 확인되지 않은 내용은 학생용 사실 카드로 표시하지 않아요.</p>`,
    "wide",
  );
  root.querySelectorAll("[data-book]").forEach(
    (b) =>
      (b.onclick = () => {
        const c = cards.find((c) => c.id === b.dataset.book);
        const r = open(
          c.sourceTitle,
          `<span class="badge">${h(c.kind)} · ${h(c.reviewStatus)}</span><p>${h(c.text)}</p><p class="small">자료 연도: ${h(c.sourceYear || "미상")} · 확인일: ${h(c.checkedAt)}</p><a href="${h(safeUrl(c.sourceUrl))}" target="_blank" rel="noopener noreferrer">출처 확인 ↗</a><div class="actions"><button id="read">읽었어요</button><button id="quiz">관련 퀴즈</button></div>`,
        );
        r.querySelector("#read").onclick = () => {
          if (!state.read.includes(c.id)) state.read.push(c.id);
          persist();
          toast("읽은 자료로 기록했어요. 학교에서 돌아볼 수 있어요.");
        };
        r.querySelector("#quiz").onclick = () => quiz("source:" + c.id);
      }),
  );
  root.querySelector("#catalog").onclick = catalog;
  root.querySelector("#legend-book").onclick = () => legendDialogue();
  root.querySelector("#quiz").onclick = () => quiz("library");
}
function pathPuzzle() {
  if (!levelGate(2)) return;
  if (state.path) {
    toast("안내 길을 완성했어요! 길을 막지 않는 약속을 기억해요.");
    return;
  }
  if (!state.started.includes("path")) start("path");
  let blocked = true,
    tiles = content.tactile.solution.map((t, i) => ({
      type: i === 1 ? "empty" : t.type,
      rotation: i === 2 ? t.rotation+90 : t.rotation,
    }));
  const root = open(
    "모두를 위한 안내 길",
    `<p>${h(content.tactile.text)}</p><p class="notice">게임 속 주민과 함께하는 체험이에요. 실제 길은 어른과 담당 기관에 알려요.</p><button id="obstacle">상자 옮겨 통행로 비우기</button><p class="small">각 칸의 모양과 방향을 골라요. 모퉁이를 돌아 출발에서 도착까지 모두 이어 주세요. 가로 길은 가로 선형, 세로 길은 세로 선형이에요.<br>점형: ● · 선형: ━ · 세로 방향: ┃</p><div class="route-scroll"><div id="tiles" class="tiles ${content.tactile.layoutVersion===2?"route-grid":""}" style="--route-cols:${Number.isInteger(content.tactile.cols)?content.tactile.cols:5}"></div></div><button id="check" class="primary">경로가 이어졌는지 확인</button><div id="path-feedback" aria-live="polite"></div>`,
  );
  function draw() {
    root.querySelector("#tiles").innerHTML = tiles
      .map(
        (t, i) =>
          `<div class="tile" style="${Number.isInteger(content.tactile.solution[i].col)&&Number.isInteger(content.tactile.solution[i].row)?`grid-column:${content.tactile.solution[i].col+1};grid-row:${content.tactile.solution[i].row+1}`:""}"><span class="route-step">${i===0?"출발":i===tiles.length-1?"도착":`${i+1}번`}</span><span class="glyph">${t.type === "empty" ? "?" : t.type === "dot" ? "⠿" : t.rotation % 180 === 0 ? "☰" : "Ⅲ"}</span><label class="small">${i + 1}번 칸<select data-type="${i}"><option value="empty" ${t.type === "empty" ? "selected" : ""}>빈칸</option><option value="dot" ${t.type === "dot" ? "selected" : ""}>점형</option><option value="line" ${t.type === "line" ? "selected" : ""}>선형</option></select></label><button data-rotate="${i}" data-direction="${t.rotation%180}" style="font-size:.65rem;padding:5px">${t.rotation % 180 === 0 ? "가로 ↻" : "세로 ↻"}</button></div>`,
      )
      .join("");
    root.querySelectorAll("[data-type]").forEach(
      (s) =>
        (s.onchange = () => {
          tiles[+s.dataset.type].type = s.value;
          draw();
        }),
    );
    root.querySelectorAll("[data-rotate]").forEach(
      (b) =>
        (b.onclick = () => {
          tiles[+b.dataset.rotate].rotation += 90;
          draw();
        }),
    );
  }
  draw();
  root.querySelector("#obstacle").onclick = (e) => {
    blocked = false;
    e.target.textContent = "✓ 통행로를 비웠어요";
    e.target.disabled = true;
  };
  root.querySelector("#check").onclick = () => {
    if (pathValid(tiles, content.tactile.solution, blocked)) {
      state.path = true;
      persist();
      toast("안내 길이 이어졌어요! 물결의 감사 인사를 들어 보세요.");
      close();
    } else {
      root.querySelector("#path-feedback").className = "feedback";
      root.querySelector("#path-feedback").textContent = blocked
        ? "먼저 길 위의 상자를 옮겨 주세요."
        : "아직 끊긴 부분이나 다른 방향이 있어요. 칸의 모양과 방향을 다시 확인해 주세요.";
    }
  };
}
function pickup(id) {
  const item = content.waste.find((w) => w.id === id);
  if (!item) return;
  if (!levelGate(item.zone === "lake" ? 3 : 2)) return;
  if (collect(state, id)) {
    startQuest(state, item.zone === "lake" ? "lake" : "trash");
    persist();
    toast(`${item.name}을 가방에 담았어요. 가방에서 알맞게 분류해 주세요.`);
  } else toast("이미 가방에 담거나 분류한 물건이에요.");
}
function bag() {
  const items = state.collected
    .map((id) => content.waste.find((w) => w.id === id))
    .filter(Boolean);
  const root = open(
    "내 가방",
    `<button id="guardian-bag">우리 동네 수호대 스탬프 ${earnedGuardianStamps(state).length} / 3</button><h3 style="margin-top:20px">주운 쓰레기 ${items.length}개</h3>${items.length ? "<p>가방에서 재질에 맞게 분류해요.</p>" : "<p>지금은 가방이 비어 있어요. 길가의 쓰레기를 찾아볼까요?</p>"}<div class="cards">${items.map((i) => `<article class="card">${h(i.name)}</article>`).join("")}</div><button id="sort-from-bag" class="primary">가방 속 쓰레기 분류하기</button><h3 style="margin-top:24px">마음을 담은 활동 배지</h3>${state.badges.map((b) => `<span class="badge">✧ ${h(b)}</span>`).join("") || '<p class="small">함께 활동하면 배지가 생겨요.</p>'}<p class="small">이미 분류한 물건: ${state.sorted.length}개 · 접수한 편지: ${state.letters.length}개</p><button id="letters">편지 이어 쓰기</button>`,
  );
  root.querySelector("#sort-from-bag").onclick = bins;
  root.querySelector("#letters").onclick = letter;
  root.querySelector("#guardian-bag").onclick = guardianOverview;
}
function bins() {
  if (!levelGate(2)) return;
  const items = state.collected
      .map((id) => content.waste.find((w) => w.id === id))
      .filter(Boolean),
    categories = [...new Set(content.waste.map((w) => w.category))];
  const root = open(
    "가방 속 쓰레기를 분류해요",
    `<p class="small">수업용 예시 기준이에요. 실제 배출 방법은 우리 지역 안내를 확인해요.</p>${items.length ? `<div class="cards">${items.map((i) => `<article class="card"><h3>${h(i.name)}</h3><div class="stack">${categories.map((c) => `<button data-sort="${h(i.id)}" data-category="${h(c)}">${h(c)}로 분류</button>`).join("")}</div><div class="result" aria-live="polite"></div></article>`).join("")}</div>` : "<p>가방이 비어 있어요. 먼저 쓰레기 가까이에서 E키로 주워 주세요.</p>"}`,
  );
  root.querySelectorAll("[data-sort]").forEach(
    (b) =>
      (b.onclick = () => {
        const item = content.waste.find((w) => w.id === b.dataset.sort);
        if (sortWaste(state, item, b.dataset.category)) {
          persist();
          toast(`${item.name}을 알맞게 분류했어요!`);
          bins();
        } else {
          b.closest(".card").querySelector(".result").textContent =
            `다시 살펴볼까요? ${item.name}의 재질은 ${item.category}이에요.`;
        }
      }),
  );
}
function lakeAction(id) {
  if (!levelGate(3)) return;
  startQuest(state, "lake");
  if (id === "rest") {
    if (!state.lake.rest) {
      state.lake.rest = true;
      persist();
      toast("금호지의 작은 종이 조각을 정리했어요. 생물은 그대로 관찰해요.");
    } else toast("금호지가 깨끗해요. 거리를 두고 관찰해요.");
    return;
  }
  if (id === "specimen") {
    if (!state.lake.identify) {
      toast("먼저 남생이 친구와 금호지 돌봄 활동을 살펴보세요.");
      return;
    }
    if (state.lake.picked) {
      toast("이미 인계했거나 가방에 담은 연습 표본이에요.");
      return;
    }
    state.lake.picked = true;
    persist();
    toast(
      "연습 표본을 안전 상자에 담았어요. 남생이와 전문가 인계 체험을 마쳐 주세요.",
    );
    return;
  }
  const root = open(
    "전문가와 함께하는 생태 돌봄",
    `<p>모든 외래생물이 제거 대상은 아니에요. 관리 대상과 방법은 전문가가 관찰 근거를 확인하고 정해요.</p><p class="notice">이 체험에서는 실제 종을 수거하지 않아요. 보라색 모형은 전문가가 지정한 <b>연습 표본</b>이에요. 실제 남생이를 잡거나 옮기는 데 보상을 주지 않아요.</p><button id="clean-rest">${state.lake.rest?"✓ 금호지 쉼터가 깨끗해요":"금호지 쉼터의 종이 조각 정리하기"}</button><h3>우리가 할 수 있는 좋은 행동은?</h3><div class="stack"><button id="protect">거리를 두고 관찰·기록하고 어른에게 알리기</button><button id="wrong">보이는 생물을 모두 잡아서 옮기기</button><button id="handover" ${state.lake.picked && !state.lake.handed ? "" : "disabled"}>담아 온 연습 표본 인계하기</button></div><div id="lake-result" aria-live="polite"></div><p class="small">완료 조건: 호숫가 쓰레기 2개 분류 · 쉼터 정리 · 행동 구별 · 연습 표본 인계</p>`,
  );
  root.querySelector("#clean-rest").onclick=()=>{lakeAction("rest");root.querySelector("#clean-rest").textContent="✓ 금호지 쉼터가 깨끗해요"};
  root.querySelector("#wrong").onclick = () => {
    root.querySelector("#lake-result").textContent =
      "생물을 함부로 잡거나 옮기면 서식지를 해칠 수 있어요. 다시 골라 봐요.";
  };
  root.querySelector("#protect").onclick = () => {
    state.lake.identify = true;
    persist();
    root.querySelector("#lake-result").textContent =
      "✓ 맞아요! 실제 생물은 관찰해요. 이제 전문가가 지정한 보라색 연습 표본만 담아 와 주세요.";
  };
  root.querySelector("#handover").onclick = () => {
    state.lake.handed = true;
    persist();
    root.querySelector("#lake-result").innerHTML =
      '<p class="feedback">▣ → ♧ 느루와 함께 안전 상자의 전문가 인계 체험을 마쳤어요!</p>';
    root.querySelector("#handover").disabled = true;
    world.handover();
  };
}
function letterText(d) {
  return `${d.recipient || "주민"}에게\n\n[${d.type || "문제 해결 제안"}]\n발견한 문제와 장소: ${d.problem || ""}\n주민이 겪는 어려움: ${d.difficulty || ""}\n내가 제안하는 해결 방법: ${d.proposal || ""}\n함께 실천할 약속: ${d.promise || ""}\n\n${d.free || ""}\n\n보내는 사람: ${d.alias || "탐험가"}\n\n※ 게임 속 편지입니다. 실제 기관 발송 전 교사 확인이 필요한 초안입니다.`;
}
function letter() {
  if (!levelGate(3)) return;
  const d = state.letterDraft;
  const root = open(
    "마을 우체통 · 마음을 전해요",
    `<p class="notice">게임 속 접수만 해요. 실제 이메일이나 민원은 보내지 않아요. 초안은 선생님과 함께 확인해 주세요.</p><form id="letter"><label>편지 유형<select name="type">${["문제 해결 제안", "주민에게 감사", "우리 동네 소개"].map((t) => `<option ${d.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>${[
      ["recipient", "받는 대상", "예: 마을 주민 여러분"],
      [
        "problem",
        "발견한 문제와 장소",
        "예: 학교 앞 점자블록 위에 상자가 있어요",
      ],
      ["difficulty", "주민이 겪는 어려움", "예: 길을 찾는 데 방해가 돼요"],
      [
        "proposal",
        "내가 제안하는 해결 방법",
        "예: 통행로를 비우고 담당 기관에 알려요",
      ],
      ["promise", "함께 실천할 약속", "예: 점자블록 위에 물건을 놓지 않아요"],
      ["alias", "보내는 사람의 별명", "전체 실명은 필요하지 않아요"],
    ]
      .map(
        ([name, label, placeholder]) =>
          `<label>${label}<input name="${name}" value="${h(d[name] || "")}" placeholder="${placeholder}" maxlength="300"></label>`,
      )
      .join(
        "",
      )}<label>자유롭게 덧붙이기<textarea name="free" maxlength="3000">${h(d.free || "")}</textarea></label><div class="actions"><button type="button" id="draft">초안 저장</button><button class="primary">미리보기</button></div></form><h3 style="margin-top:25px">접수한 편지 ${state.letters.length}통</h3><div class="stack">${state.letters.map((l, i) => `<button data-letter="${i}">${h(l.type)} · ${h(l.alias || "탐험가")} · ${h(l.date)}</button>`).join("")}</div>`,
  );
  const form = root.querySelector("form");
  function saveDraft() {
    state.letterDraft = Object.fromEntries(new FormData(form));
    return saveState(state);
  }
  form.oninput = saveDraft;
  root.querySelector("#draft").onclick = () => {
    if (saveDraft()) toast("편지 초안을 이 브라우저에 저장했어요.");
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    saveDraft();
    if (
      !state.letterDraft.recipient?.trim() ||
      !state.letterDraft.alias?.trim() ||
      !(state.letterDraft.problem?.trim() || state.letterDraft.free?.trim())
    ) {
      toast("받는 대상, 별명, 편지 내용을 적어 주세요.");
      return;
    }
    previewLetter(state.letterDraft);
  };
  root
    .querySelectorAll("[data-letter]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          previewLetter(state.letters[+b.dataset.letter], true)),
    );
}
function previewLetter(d, received = false) {
  const text = letterText(d),
    r = open(
      "편지 미리보기",
      `<div class="paper-letter">${h(text)}</div><div class="actions">${!received ? '<button id="edit">고쳐 쓰기</button><button id="submit" class="primary">게임 속 우체통 접수</button>' : ""}<button id="download">텍스트로 저장</button><button id="print">인쇄</button></div>`,
    );
  r.querySelector("#download").onclick = () =>
    download("선생님-확인용-편지-초안.txt", text, "text/plain;charset=utf-8");
  r.querySelector("#print").onclick = () => {
    $(".printed").textContent = text;
    window.print();
  };
  if (!received) {
    r.querySelector("#edit").onclick = letter;
    r.querySelector("#submit").onclick = (e) => {
      e.target.disabled = true;
      state.letters.push({
        ...d,
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString("ko-KR"),
      });
      state.letterDraft = {};
      persist();
      world.deliverLetter();
      close();
      toast("게임 속 편지가 접수되었어요. 편지 봉투가 마을로 배달돼요.");
    };
  }
}
const places = [
  { id: "school", name: content.schoolName, x: -10, z: -5 },
  { id: "library", name: "도서관", x: 1, z: -10 },
  {
    id: "apartment",
    name: "햇살 아파트",
    x: assetManifest.apartment.position[0],
    z: assetManifest.apartment.position[2],
  },
  { id: "lake", name: "금호지", x: 24, z: -18 },
  { id: "forest", name: "월아산", x: -19, z: -11 },
  { id: "mailbox", name: "우체통", x: 4, z: 8 },
];
function drawMap(canvas, large = false) {
  const ctx = canvas.getContext("2d"),
    w = canvas.width,
    hh = canvas.height;
  ctx.clearRect(0, 0, w, hh);
  ctx.fillStyle = "#dce8c2";
  ctx.fillRect(0, 0, w, hh);
  const x = (v) => ((v + 33) / 66) * w,
    z = (v) => ((v + 28) / 56) * hh;
  ctx.fillStyle = "#c7d6b0";
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(
      x(Math.sin(i * 13) * 30),
      z(Math.cos(i * 17) * 25),
      large ? 10 : 5,
      0,
      7,
    );
    ctx.fill();
  }
  ctx.strokeStyle = "#f7ecd2";
  ctx.lineWidth = large ? 22 : 9;
  ctx.beginPath();
  ctx.moveTo(x(-26), z(3));
  ctx.lineTo(x(28), z(3));
  ctx.moveTo(x(1), z(-20));
  ctx.lineTo(x(1), z(17));
  ctx.stroke();
  ctx.fillStyle = "#8bbfc1";
  ctx.beginPath();
  ctx.ellipse(x(24), z(-18), w * 0.12, hh * 0.11, 0, 0, 7);
  ctx.fill();
  for (const p of places) {
    ctx.fillStyle = "#92a681";
    ctx.fillRect(x(p.x) - 5, z(p.z) - 5, 10, 9);
    if (large) {
      ctx.fillStyle = "#48604a";
      ctx.font = "15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.name, x(p.x), z(p.z) + 22);
    }
  }
  for (const e of world?.entities.filter((e) => e.kind === "npc") || []) {
    ctx.fillStyle = "#738fb2";
    ctx.beginPath();
    ctx.arc(x(e.x), z(e.z), large ? 6 : 3, 0, 7);
    ctx.fill();
    if (large) {
      ctx.font = "13px sans-serif";
      ctx.fillText(
        { otter: "수달 친구", turtle: "남생이 친구", crane: "학 친구" }[e.id],
        x(e.x),
        z(e.z) - 10,
      );
    }
  }
  for (const a of works) {
    const p = habitats[a.habitat];
    ctx.fillStyle = "#b77d5b";
    ctx.beginPath();
    ctx.arc(
      x(p.x) + ((hash(a.id) % 13) - 6),
      z(p.z) + ((hash(a.id + "a") % 13) - 6),
      large ? 6 : 3,
      0,
      7,
    );
    ctx.fill();
  }
  for (const id of targetIds) {
    if (
      canEnterLevel(state, id === "lake" ? 3 : 2) &&
      ((state.started.includes(id) && !state.completed.includes(id)) ||
        tracked === id)
    ) {
      const target = activityTarget(state, content, id);
      if (!target || target.ui) continue;
      const actor = world?.entities.find((e) => e.id === target.id);
      const px = actor?.x ?? target.x,
        pz = actor?.z ?? target.z;
      ctx.strokeStyle = "#b17a42";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x(px), z(pz), large ? 16 : 7, 0, 7);
      ctx.stroke();
      if (large) {
        ctx.fillStyle = "#96653d";
        ctx.font = "12px sans-serif";
        ctx.fillText("활동 중", x(px), z(pz) - 20);
      }
    }
  }
  const active =
    world?.activeObjective || objective(state, content, world?.indoor);
  if (active && !active.ui) {
    ctx.strokeStyle = "#d69b35";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x(active.x), z(active.z), large ? 18 : 8, 0, 7);
    ctx.stroke();
  }
  const p = world?.player.position || { x: -10, z: 1 };
  ctx.fillStyle = "#355e4e";
  ctx.beginPath();
  ctx.arc(x(p.x), z(p.z), large ? 8 : 5, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#fff9df";
  ctx.lineWidth = 3;
  ctx.stroke();
  if (large) {
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(world?.indoor ? "나 (실내)" : "나", x(p.x), z(p.z) - 14);
  }
}
function hash(str) {
  let n = 0;
  for (const c of str) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}
function showMap(focusId) {
  const root = open(
    "우리 반 생태 지도",
    `<p class="small">금산면을 모티브로 수업 동선에 맞게 줄인 축약 지도예요. 지도 아래 그림을 눌러 작품과 보호 약속을 살펴보세요.</p><canvas id="large-map" class="map-large" width="820" height="550" aria-label="마을과 작품의 위치"></canvas><div class="legend"><span>● 초록: 나</span><span>● 갈색: 학생 작품</span><span>● 파랑: 동물 친구</span></div><div class="actions"><button id="map-upload" class="primary" ${canEnterLevel(state, 4) ? "" : "disabled"}>내 그림·이름·보호 약속 등록</button>${objective(state, content, world?.indoor)?.id === "bag" || (tracked && activityTarget(state, content, tracked)?.id === "bag") ? '<button id="map-sort">가방에서 쓰레기 분류하기</button>' : ""}</div>${canEnterLevel(state, 4) ? "" : '<p class="small">그림 등록은 레벨 4에서 열려요.</p>'}<h3>등록한 그림과 보호 약속</h3><div class="stack">${works.map((a) => `<button class="map-art-card" data-art="${h(a.id)}"><img data-map-image="${h(a.id)}" alt="${h(a.name)}"><span>♧ ${h(a.name)} · ${h((habitats[a.habitat] || habitats.grass).name)}${a.id === focusId ? " ← 선택한 작품" : ""}<small class="map-pledge">${h(a.protection || "보호 약속을 추가해 주세요.")}</small></span></button>`).join("") || '<p class="small">등록한 그림이 이 지도에 모여요.</p>'}</div>`,
    "wide",
  );
  drawMap(root.querySelector("canvas"), true);
  root.querySelector("#map-upload").onclick = chooseImage;
  root.querySelector("#map-sort")?.addEventListener("click", bag);
  for (const img of root.querySelectorAll("[data-map-image]")) {
    const work = works.find((w) => w.id === img.dataset.mapImage);
    const url = URL.createObjectURL(work.blob);
    img.onload = img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }
  root
    .querySelectorAll("[data-art]")
    .forEach((b) => (b.onclick = () => artDetail(b.dataset.art)));
  root.querySelector(`[data-art="${CSS.escape(focusId || "")}"]`)?.focus();
}
async function saveExhibitWork(work) {
  if (!canEnterLevel(state, 4) || !validExhibit(work))
    throw new Error("이름과 보호 약속을 확인해 주세요.");
  await artStore.put(work);
  registerExhibit(state, work);
  await refreshWorks();
}
async function refreshWorks() {
  works = await artStore.all();
  reconcileExhibits(state, works);
  persist();
  await world?.setArt(works, state.settings);
}
async function catalog() {
  const root = open(
    "우리 반 생태 도감",
    `<p class="eyebrow">작은 관찰이 모여, 커다란 우리 마을</p><p class="small">학생의 관찰·표현 작품 ${works.length}개 · 확인된 지역 서식 자료와 구분해요.<br>3D 마을에는 최대 ${Math.min(30, state.settings.artLimit)}개가 움직이고, 지도·도감에는 모든 작품이 보여요.</p><div class="cards" id="art-list"></div><div class="actions"><button id="new" class="primary">내 그림 등록하기</button><button id="export">학급 작품 묶음 내보내기</button><button id="import">작품 묶음 가져오기</button></div>`,
    "wide",
  );
  const list = root.querySelector("#art-list");
  for (const a of works) {
    const card = document.createElement("article");
    card.className = "card";
    const u = URL.createObjectURL(a.blob);
    card.innerHTML = `<img class="art-thumb" alt="${h(a.name)}"><h3>${h(a.name)}</h3><p class="small">${h(a.alias || "탐험가")} · ${habitats[a.habitat].name}</p><p>${h(a.protection || "보호 약속을 추가해 주세요.")}</p><button>작품 살펴보기</button>`;
    const img = card.querySelector("img");
    img.onload = () => URL.revokeObjectURL(u);
    img.onerror = () => URL.revokeObjectURL(u);
    img.src = u;
    card.querySelector("button").onclick = () => artDetail(a.id);
    list.append(card);
  }
  if (!works.length)
    list.innerHTML =
      '<div class="card"><h3>첫 번째 생태 친구를 기다려요</h3><p>종이에 그린 그림을 사진으로 찍거나, 저장한 그림을 골라 보세요.</p></div>';
  root.querySelector("#new").onclick = chooseImage;
  root.querySelector("#export").onclick = async () => {
    try {
      download(
        "금산마을-학급작품.json",
        JSON.stringify(await exportWorks(works)),
      );
    } catch {
      toast("작품 내보내기를 완료하지 못했어요. 다시 시도해 주세요.");
    }
  };
  root.querySelector("#import").onclick = () => {
    if (!levelGate(4)) return;
    chooseJSON(async (data) => {
      const incoming = await decodeBundle(data);
      await artStore.putMany(incoming);
      await refreshWorks();
      catalog();
      toast(
        "같은 작품 ID는 새 자료로 갱신했어요. 개인 편지와 소감은 공유하지 않아요.",
      );
    });
  };
}
function artDetail(id) {
  const a = works.find((a) => a.id === id);
  if (!a) return;
  const root = open(
    a.name,
    `<span class="badge">학생 관찰·표현 작품</span><img id="detail-image" class="art-thumb" style="height:220px" alt="${h(a.name)}"><p>만든 이: ${h(a.alias || "탐험가")}<br>관찰 장소: ${h(a.observed || "미입력")}<br>서식 구역: ${habitats[a.habitat].name}</p><p>${h(a.description || "아직 설명이 없어요.")}</p><div class="notice"><b>나의 보호 약속</b><p>${h(a.protection || "아직 적지 않았어요. 레벨 4에서 보호 약속을 붙여 전시할 수 있어요.")}</p></div><div class="actions"><button id="map">지도 위치</button><button id="edit">이름·설명·위치 수정</button><button id="delete">작품 삭제</button></div>`,
  );
  const u = URL.createObjectURL(a.blob),
    img = root.querySelector("#detail-image");
  img.onload = () => URL.revokeObjectURL(u);
  img.onerror = () => URL.revokeObjectURL(u);
  img.src = u;
  root.querySelector("#map").onclick = () => showMap(id);
  root.querySelector("#edit").onclick = () => editArt(a);
  root.querySelector("#delete").onclick = () => {
    const r = open(
      "이 작품을 삭제할까요?",
      `<p>${h(a.name)}이 마을·지도·도감에서 함께 사라져요. 먼저 작품 묶음을 내보내면 보관할 수 있어요.</p><button id="delete" class="primary">삭제하기</button>`,
    );
    r.querySelector("#delete").onclick = async () => {
      try {
        await artStore.remove(id);
        await refreshWorks();
        catalog();
        toast("작품을 삭제했어요.");
      } catch {
        toast("삭제를 저장하지 못했어요. 저장소 권한을 확인해 주세요.");
      }
    };
  };
}
function editArt(a) {
  if (!levelGate(4)) return;
  const root = open(
    "작품 기록 고치기",
    `<form>${[
      ["name", "생물 이름"],
      ["alias", "별명 또는 작품 이름"],
      ["description", "생태 설명"],
      ["observed", "관찰 장소"],
      ["protection", "내가 이 친구를 지키기 위해 할 수 있는 일"],
    ]
      .map(
        ([k, t]) =>
          `<label>${t}<input name="${k}" value="${h(a[k])}" maxlength="${["description", "protection"].includes(k) ? 500 : 100}" ${["name", "protection"].includes(k) ? "required" : ""}></label>`,
      )
      .join("")}<label>서식 구역<select name="habitat">${Object.entries(
      habitats,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${a.habitat === k ? "selected" : ""}>${v.name}</option>`,
      )
      .join(
        "",
      )}</select></label><label>움직임<select name="kind"><option value="animal" ${a.kind === "animal" ? "selected" : ""}>동물 · 천천히 걷기</option><option value="plant" ${a.kind === "plant" ? "selected" : ""}>식물 · 살짝 흔들기</option></select></label><button class="primary">변경 저장</button></form>`,
  );
  root.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const values = Object.fromEntries(new FormData(e.target));
      if (!values.name.trim() || !values.protection.trim()) {
        toast("이름과 보호 약속을 적어 주세요.");
        return;
      }
      await saveExhibitWork({
        ...a,
        ...values,
        exhibition: "namgang",
        updatedAt: Date.now(),
      });
      artDetail(a.id);
      toast("마을·지도·도감에 함께 반영했어요.");
    } catch {
      toast("수정을 저장하지 못했어요. 저장 공간을 확인해 주세요.");
    }
  };
}
function chooseJSON(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    try {
      const f = input.files[0];
      if (!f) return;
      if (f.size > 100 * 1024 * 1024)
        throw new Error("묶음 파일은 100MB 이하여야 해요.");
      await callback(JSON.parse(await f.text()));
    } catch (e) {
      toast(
        `자료를 읽지 못했어요. ${e.message || "파일 형식을 확인해 주세요."}`,
      );
    }
  };
  input.click();
}
function validateContent(c) {
  validateClassRules(c.classRules);
  validateGuardianLesson(c?.guardianLegend);
  if (
    !c ||
    typeof c.schoolName !== "string" ||
    !c.schoolName.trim() ||
    typeof c.className !== "string" ||
    typeof c.meetingDate !== "string" ||
    typeof c.topic !== "string" ||
    !c.meeting ||
    !["roles", "promise", "period"].every(
      (k) => typeof c.meeting[k] === "string",
    )
  )
    throw new Error("학교·학급·회의 정보를 확인해 주세요.");
  for (const key of ["agendas", "quizzes", "sources", "waste"]) {
    if (!Array.isArray(c[key]) || c[key].length > 200)
      throw new Error(`${key} 목록을 확인해 주세요.`);
    const ids = c[key].map((x) => x.id);
    if (
      ids.some((x) => typeof x !== "string" || !x) ||
      new Set(ids).size !== ids.length
    )
      throw new Error(`${key} ID는 고유해야 해요.`);
  }
  if (
    !c.quests ||
    !["path", "trash", "lake"].every(
      (id) =>
        c.quests[id]?.id === id &&
        typeof c.quests[id].title === "string" &&
        typeof c.quests[id].description === "string" &&
        typeof c.quests[id].reward === "string" &&
        c.quests[id].target > 0,
    )
  )
    throw new Error("path·trash·lake 미션 ID는 유지해 주세요.");
  for (const a of c.agendas)
    if (
      !c.quests[a.quest] ||
      !["title", "problem", "action"].every((k) => typeof a[k] === "string")
    )
      throw new Error("안건의 미션 연결을 확인해 주세요.");
  for (const q of c.quizzes) {
    if (
      q.contexts !== undefined &&
      (!Array.isArray(q.contexts) ||
        !q.contexts.every((k) => Object.hasOwn(quizContextLabels, k)))
    )
      throw new Error(
        "퀴즈 contexts는 otter, turtle, crane, house, postman, library, forest, apartment, path 목록으로 입력해 주세요.",
      );
    if (
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.length > 3 ||
      !q.options.every((o) => typeof o === "string") ||
      !Number.isInteger(q.answer) ||
      q.answer < 0 ||
      q.answer >= q.options.length ||
      !["question", "explanation", "reviewStatus", "sourceTitle"].every(
        (k) => typeof q[k] === "string",
      )
    )
      throw new Error("퀴즈 문장·선택지·정답 번호를 확인해 주세요.");
    if (q.reviewStatus === "검토 완료" && (!q.checkedAt || !q.sourceTitle))
      throw new Error("검토한 퀴즈는 출처와 확인일을 적어 주세요.");
  }
  for (const s of c.sources)
    if (
      !["sourceTitle", "sourceUrl", "reviewStatus", "text"].every(
        (k) => typeof s[k] === "string",
      ) ||
      (s.reviewStatus === "검토 완료" &&
        (!s.checkedAt || !s.sourceUrl.startsWith("https://")))
    )
      throw new Error("자료의 문장·출처·검토일을 확인해 주세요.");
  for (const key of ["otter", "turtle", "crane", "house", "postman"])
    if (
      !c.dialogues?.[key] ||
      !["name", "story", "before", "during", "after"].every(
        (k) => typeof c.dialogues[key][k] === "string",
      )
    )
      throw new Error("주민 대사 형식을 확인해 주세요.");
  validateTactile(c.tactile);
  for (const w of c.waste)
    if (
      !["id", "name", "category"].every((k) => typeof w[k] === "string") ||
      !["village", "lake"].includes(w.zone) ||
      ![w.x, w.z].every(Number.isFinite) ||
      Math.abs(w.x) > 29 ||
      Math.abs(w.z) > 24
    )
      throw new Error("쓰레기 ID·이름·분류·위치를 확인해 주세요.");
  const n = c.waste.filter((w) => w.zone === "village").length,
    m = c.waste.filter((w) => w.zone === "lake").length;
  if (
    c.quests.trash.target !== n ||
    c.quests.lake.target !== m + 3 ||
    c.quests.path.target !== 1
  )
    throw new Error(
      `목표 수량은 길 1, 주택가 ${n}, 호수 ${m + 3}(분류+쉼터+구별+인계)로 맞춰 주세요.`,
    );
  return c;
}
function teacher() {
  const root = open(
    "교사용 수업 자료 편집",
    `<span class="badge">로컬 편집 메뉴 · 계정 권한 보호 기능 아님</span><p class="small">예시 회의·안건 연결·주민의 상태별 대사·퀴즈·출처·분류 기준·미션 목표를 JSON으로 수정해요. 학생 화면에는 <b>검토 완료</b> 자료만 보여요. 원문을 확인한 뒤 문장을 작성하고 checkedAt에 확인일을 적어 주세요. ID는 진행 기록과 연결되므로 유지해 주세요. 퀴즈 contexts에서 대상을 지정해요: otter(수달), turtle(남생이), crane(학), house(생활 게시판), postman(우체통), library(도서관), forest(숲길), apartment(아파트), path(안내 길). 빈 목록이면 주민 퀴즈에 표시하지 않아요.</p><label>편집할 자료<select id="section">${[
      ["meeting", "학급 회의 결과"],
      ["dialogues", "주민 대사"],
      ["quizzes", "퀴즈"],
      ["sources", "출처·지역 학습 카드"],
      ["missions", "미션·분류·안내 블록"],
      ["legend", "금호지 전설·수호대 퀴즈"],
      ["all", "전체 수업 자료"],
    ]
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join(
        "",
      )}</select></label><textarea id="json-editor" class="code" spellcheck="false" aria-label="수업 자료 JSON"></textarea><div class="actions"><button id="save" class="primary">자료 저장</button><button id="export">수업 자료 JSON 내보내기</button><button id="import">수업 자료 JSON 가져오기</button><button id="reset">예시 자료로 되돌리기</button><button id="works">학생 작품 관리</button></div><div id="teacher-result" aria-live="polite"></div><p class="notice">시설 배치·쓰레기 위치를 바꾸면 새로고침 뒤 마을에 반영돼요. 현재 활동 기록은 유지됩니다. 학급 공유 서버와 교사 계정 인증은 아직 연결하지 않았어요.</p>`,
    "wide",
  );
  const fields = {
    meeting: [
      "classRules",
      "schoolName",
      "className",
      "meetingDate",
      "topic",
      "meeting",
      "agendas",
    ],
    dialogues: ["dialogues"],
    quizzes: ["quizzes"],
    sources: ["sources"],
    missions: ["quests", "waste", "tactile"],
    legend: ["guardianLegend"],
    all: Object.keys(content),
  };
  const editor = root.querySelector("#json-editor"),
    section = root.querySelector("#section");
  function fill() {
    editor.value = JSON.stringify(
      Object.fromEntries(fields[section.value].map((k) => [k, content[k]])),
      null,
      2,
    );
  }
  fill();
  let dirty = false;
  editor.oninput = () => (dirty = true);
  section.onchange = () => {
    if (dirty) {
      toast("편집 내용은 먼저 저장해 주세요.");
      section.value = section.dataset.previous || "meeting";
      return;
    }
    fill();
    section.dataset.previous = section.value;
  };
  function apply(c) {
    c = upgradeQuizContent(c);
    validateContent(c);
    if (!saveContent(c)) return;
    content = c;
    persist();
    dirty = false;
    fill();
    root.querySelector("#teacher-result").textContent =
      "✓ 자료를 저장했어요. 새로고침하면 마을 배치와 간판에도 반영돼요.";
  }
  root.querySelector("#save").onclick = () => {
    try {
      const patch = JSON.parse(editor.value),
        next = structuredClone(content);
      for (const k of fields[section.value]) if (k in patch) next[k] = patch[k];
      apply(next);
    } catch (e) {
      root.querySelector("#teacher-result").textContent =
        `저장하지 않았어요. ${e.message}`;
    }
  };
  root.querySelector("#export").onclick = () =>
    download("금산마을-수업자료.json", JSON.stringify(content, null, 2));
  root.querySelector("#import").onclick = () =>
    chooseJSON((data) => apply(data));
  root.querySelector("#reset").onclick = () => {
    const r = open(
      "예시 수업 자료로 돌아갈까요?",
      `<p>편집한 수업 자료를 예시로 바꿔요. 작품과 활동 기록은 유지돼요.</p><button id="yes" class="primary">예시 자료로 바꾸기</button>`,
    );
    r.querySelector("#yes").onclick = () => {
      if (saveContent(defaults)) {
        content = structuredClone(defaults);
        persist();
        teacher();
      }
    };
  };
  root.querySelector("#works").onclick = catalog;
}
function settings() {
  const s = state.settings;
  const root = open(
    "나에게 맞는 탐험",
    `<form id="settings"><label>화질<select name="quality"><option value="normal" ${s.quality === "normal" ? "selected" : ""}>보통</option><option value="low" ${s.quality === "low" ? "selected" : ""}>낮음 · 그림자 줄이기</option></select></label><label>글자 크기<select name="font"><option value="1" ${+s.font === 1 ? "selected" : ""}>기본</option><option value="1.15" ${+s.font === 1.15 ? "selected" : ""}>크게</option><option value="1.3" ${+s.font === 1.3 ? "selected" : ""}>더 크게</option></select></label><label>마을에서 움직이는 작품 수<select name="artLimit">${[5, 15, 30].map((n) => `<option value="${n}" ${+s.artLimit === n ? "selected" : ""}>${n}개</option>`).join("")}</select></label><label>작품 이름표<select name="displayName"><option value="creature" ${s.displayName === "creature" ? "selected" : ""}>생물 이름</option><option value="alias" ${s.displayName === "alias" ? "selected" : ""}>별명 또는 작품 이름</option></select></label><label class="check"><input name="motion" type="checkbox" ${s.motion ? "checked" : ""}>작품 움직임·흔들림 줄이기</label><label class="check"><input name="sound" type="checkbox" ${s.sound ? "checked" : ""}>직접 만든 짧은 배경 선율 켜기</label><button class="primary">설정 적용</button></form><hr><p class="small">개인 체험판 · 이 브라우저에만 저장돼요. 다른 기기에는 자동 공유되지 않아요. 공개 기기에서 사용을 마치면 자료를 보관한 뒤 브라우저 사이트 데이터를 지워 주세요.</p><div class="actions"><button id="backup">개인 기록 백업</button><button id="restore">개인 기록 복원</button><button id="teacher">교사용 수업 편집</button><button id="welcome">시작 안내 다시 보기</button></div>`,
  );
  root.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    state.settings = {
      ...state.settings,
      ...Object.fromEntries(d),
      font: +d.get("font"),
      artLimit: +d.get("artLimit"),
      motion: d.has("motion"),
      sound: d.has("sound"),
    };
    applySettings();
    persist();
    await world.setArt(works, state.settings);
    toast("탐험 설정을 적용했어요.");
  };
  root.querySelector("#teacher").onclick = teacher;
  root.querySelector("#welcome").onclick = welcome;
  root.querySelector("#backup").onclick = async () => {
    try {
      download(
        "금산마을-개인기록-비공개.json",
        JSON.stringify({
          schema: "geumsan-private",
          version: 1,
          state,
          content,
          art: await exportWorks(works),
        }),
      );
    } catch {
      toast("백업을 만들지 못했어요. 저장 공간과 파일 권한을 확인해 주세요.");
    }
  };
  root.querySelector("#restore").onclick = () =>
    chooseJSON(async (b) => {
      if (
        b.schema !== "geumsan-private" ||
        b.version !== 1 ||
        !b.state ||
        !b.art
      )
        throw new Error("개인 기록 백업 파일을 선택해 주세요.");
      validateState(b.state);
      b.content = upgradeQuizContent(b.content);
      validateContent(b.content);
      const incoming = await decodeBundle(b.art);
      const r = open(
        "개인 기록을 복원할까요?",
        `<p>활동·편지·소감·교사 자료를 백업 내용으로 바꿔요. 작품은 ID로 합칩니다.</p><button id="yes" class="primary">백업 복원</button>`,
      );
      r.querySelector("#yes").onclick = async () => {
        try {
          await artStore.putMany(incoming);
          content = b.content;
          state = {
            ...initialState(),
            ...b.state,
            activity:{totalMs:Number.isFinite(b.state.activity?.totalMs)?Math.max(0,b.state.activity.totalMs):0},
            guardian: normalizeGuardian(b.state.guardian),
            journey: normalizeJourney(b.state.journey),
            settings: { ...initialState().settings, ...b.state.settings },
          };
          activityClock=new ActivityClock(state.activity);
          updateActivity();
          saveContent(content);
          persist();
          applySettings();
          await refreshWorks();
          close();
          toast("기록을 복원했어요. 배치 변경은 새로고침 뒤 반영돼요.");
        } catch {
          toast("복원을 완료하지 못했어요. 저장 공간을 확인해 주세요.");
        }
      };
    });
}
function validateState(s) {
  if (s.journey !== undefined) validateJourney(s.journey);
  if (s.guardian !== undefined) validateGuardian(s.guardian);
  for (const k of [
    "started",
    "completed",
    "collected",
    "sorted",
    "badges",
    "quiz",
    "read",
  ])
    if (!Array.isArray(s[k]) || !s[k].every((x) => typeof x === "string"))
      throw new Error("활동 기록 형식을 확인해 주세요.");
  if (
    !Array.isArray(s.letters) ||
    !s.letters.every((l) => typeof l.id === "string") ||
    !Array.isArray(s.reflections) ||
    !s.lake ||
    typeof s.lake !== "object" ||
    !s.settings ||
    ![5, 15, 30].includes(+s.settings.artLimit) ||
    ![1, 1.15, 1.3].includes(+s.settings.font)
  )
    throw new Error("편지·소감·설정 형식을 확인해 주세요.");
}
let audio = null,
  audioTimer = null,
  note = 0;
function applySettings() {
  document.documentElement.classList.toggle(
    "reduce-motion",
    !!state.settings.motion,
  );
  document.documentElement.style.fontSize = `${16 * state.settings.font}px`;
  world?.configure(state.settings);
  clearInterval(audioTimer);
  audioTimer = null;
  if (!state.settings.sound) {
    audio?.suspend();
    return;
  }
  try {
    audio ??= new AudioContext();
    audio.resume();
    audioTimer = setInterval(() => {
      if (document.hidden || !state.settings.sound) return;
      const osc = audio.createOscillator(),
        gain = audio.createGain(),
        now = audio.currentTime;
      osc.type = "sine";
      osc.frequency.value = [
        261.63, 329.63, 392, 440, 392, 329.63, 293.66, 329.63,
      ][note++ % 8];
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.028, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    }, 900);
  } catch {
    toast("이 기기에서는 소리를 재생하지 못했어요. 무음으로 탐험할 수 있어요.");
  }
}
function guardianOverview() {
  const current = journeyLevel(state),
    earned = earnedGuardianStamps(state).map((s) => s.id),
    r = open(
      current === 5
        ? "우리 동네 수호대 · 미션 성공!"
        : "레벨 1부터 차례로 · 우리 동네 수호대",
      `<div class="guardian-summary ${current === 5 ? "complete" : ""}"><h3>${current === 5 ? "축하해요! 네 레벨을 마치고 우리 동네 수호대가 되었어요." : `지금은 레벨 ${current}이에요. 빛나는 곳부터 시작해요.`}</h3><p>마을 · 이야기 · 생태 스탬프 ${earned.length} / 3</p></div><div class="cards">${levels.map((l) => `<article class="card"><span class="badge">레벨 ${l.id} · ${l.id < current ? "✓ 완료" : l.id === current ? "지금 도전" : "잠김"}</span><h3>${h(l.title)}</h3><p>${h(l.description)}</p><button data-stage="${l.id}">${l.id > current ? "앞 레벨부터 완료해 주세요" : "활동 확인하기"}</button></article>`).join("")}</div><div class="stamp-strip">${guardianStamps.map((s) => `<span class="badge">${earned.includes(s.id) ? "✓" : "○"} ${h(s.name)}</span>`).join("")}</div>${state.journey.schoolReady ? '<button id="rules-again">학급 규칙 다시 보기</button>' : ""}`,
      "wide",
    );
  r.querySelectorAll("[data-stage]").forEach(
    (b) => (b.onclick = () => levelAction(+b.dataset.stage)),
  );
  r.querySelector("#rules-again")?.addEventListener("click", board);
}
function chooseImage() {
  if (levelGate(4)) $("#image-input").click();
}
function showExhibition() {
  if (levelGate(4)) showMap();
}
function openLakeBook(){
  if(!levelGate(3))return;
  state.journey.openedLakeBook=true;persist();legendDialogue();
}
function legendDialogue(index = null) {
  if (!levelGate(3)) return;
  if (!canHearLegend(state)) {
    const r = open(
      "금호지의 동물 친구를 먼저 만나요",
      '<p>금호지에서 동물 친구와 먼저 인사한 뒤 전설을 들어 보세요. 빛나는 곳을 따라가면 친구를 만날 수 있어요.</p><button id="meet-first" class="primary">금호지 친구 찾아가기</button>',
    );
    r.querySelector("#meet-first").onclick = () => {
      close();
      toast("금호지의 빛나는 곳에서 동물 친구에게 E키로 인사해 보세요.");
    };
    return;
  }
  const lesson = content.guardianLegend;
  let current =
    index ??
    lesson.pages.findIndex((p) => !state.guardian.legendSeen.includes(p.id));
  if (current < 0) current = 0;
  const page = lesson.pages[current],
    read = hasReadLegend(state, lesson);
  const root = open(
    lesson.title,
    `<span class="badge">전해지는 설화 · ${h(lesson.reviewStatus)}</span><p class="small">${h(lesson.notice)}</p>
    <div class="storybook"><div class="story-art">${storyIllustration(current)}</div><div class="story-page"><p class="eyebrow">${current + 1} / ${lesson.pages.length} 장 · 금호지 이야기책</p><h3>${["금호지에 전해지는 이야기","두 용의 다툼","꼬리로 친 땅에 물이 고였어요","장군이 나섰어요","금호지를 지키는 청룡","우리도 마을을 아껴요"][current]||h(page.speaker)}</h3><p id="legend-text">${h(page.text)}</p></div></div>
    <p class="small">읽은 대화 ${lesson.pages.filter((p) => state.guardian.legendSeen.includes(p.id)).length} / ${lesson.pages.length}장 · 출처: ${h(lesson.sourceTitle)}</p>
    <div class="actions"><button id="legend-prev" ${current === 0 ? "disabled" : ""}>이전 이야기</button><button id="legend-next" class="primary">${current === lesson.pages.length - 1 ? "이야기 다 읽었어요 → 퀴즈 풀기" : "다음 이야기 →"}</button><button id="legend-quiz" ${read ? "" : "disabled"}>${read ? "전설 퀴즈 풀기" : "끝까지 읽으면 퀴즈가 열려요"}</button></div>`,
  );
  root.querySelector("#legend-prev").onclick = () =>
    legendDialogue(current - 1);
  root.querySelector("#legend-next").onclick = () => {
    if (!readLegendPage(state, lesson, page.id)) {
      toast("앞의 이야기부터 차례로 읽어 주세요.");
      return;
    }
    persist();
    if (current === lesson.pages.length - 1) legendQuiz();
    else legendDialogue(current + 1);
  };
  root.querySelector("#legend-quiz").onclick = legendQuiz;
}
function legendQuiz() {
  if (!levelGate(3)) return;
  if (!canHearLegend(state)) {
    legendDialogue();
    return;
  }
  const lesson = content.guardianLegend;
  if (!hasReadLegend(state, lesson)) {
    toast("금호지 이야기를 끝까지 읽은 뒤 퀴즈에 도전해 주세요.");
    legendDialogue();
    return;
  }
  if (state.guardian.legendQuizPassed) {
    legendReward(false);
    return;
  }
  const q = lesson.quiz,
    root = open(
      "금호지 전설 · 수호대 퀴즈",
      `<span class="badge">전설 내용 떠올리기</span><h3>${h(q.question)}</h3><div class="stack">${q.options.map((o, i) => `<button data-legend-answer="${i}">${i + 1}. ${h(o)}</button>`).join("")}</div><div id="legend-feedback" aria-live="polite"></div>`,
    );
  root.querySelectorAll("[data-legend-answer]").forEach(
    (b) =>
      (b.onclick = () => {
        const result = answerLegend(state, lesson, +b.dataset.legendAnswer);
        if (result === "wrong") {
          const el = root.querySelector("#legend-feedback");
          el.className = "feedback";
          el.textContent =
            "다시 생각해 볼까요? 마을을 걱정하며 “싸움을 멈추어라!” 하고 말한 사람을 떠올려 보세요.";
          return;
        }
        if (result === "locked") {
          legendDialogue();
          return;
        }
        persist();
        legendReward(result === "earned");
      }),
  );
}
function legendReward(fresh) {
  const root = open(
    fresh
      ? "이야기 수호대 스탬프를 받았어요!"
      : "이미 받은 이야기 수호대 스탬프",
    `<div class="guardian-summary"><span class="stamp-seal earned">☾</span><h3>이야기 수호대</h3><p>${h(content.guardianLegend.quiz.explanation)}</p><p>우리 동네 수호대 스탬프 <b>${earnedGuardianStamps(state).length} / 3</b></p><p>${isGuardian(state) ? "미션 성공! 우리 동네 수호대가 되었어요." : "나머지 스탬프도 모아 우리 동네 수호대가 되어 보세요."}</p></div><button id="passport" class="primary">스탬프 모음 ${isGuardian(state) ? "· 수호대 인증서" : "· 남은 미션"} 보기</button>`,
  );
  root.querySelector("#passport").onclick = guardianOverview;
}
function welcome() {
  const root = open(
    "금산마을에 오신 걸 환영해요",
    `<div class="welcome-banner"><span class="eyebrow">4-4반 마을 탐험 안내</span><h2 class="welcome-title">우리 동네 수호대가 되자!</h2><p>먼저 <b>세 가지 미션</b>을 차례로 해 봐요. 처음에는 학교에서 시작해요.</p><div class="mission-briefings">
    <article class="mission-briefing"><span>미션 1 · 레벨 1</span><h3>우리 반 약속 익히기</h3><p>학교 칠판에서 9월 학급 회의 규칙 네 줄을 읽고 타자로 따라 써요. 네 줄을 모두 맞히면 바로 미션 클리어!</p></article>
    <article class="mission-briefing"><span>미션 2 · 레벨 2</span><h3>학교에서 아파트까지 안전하게!</h3><p>끊어진 점자블록을 잇고 길을 막은 물건을 치워요. 주운 쓰레기는 가방에서 알맞게 분류해요.</p></article>
    <article class="mission-briefing"><span>미션 3 · 레벨 3</span><h3>금호지의 두 용 이야기</h3><p>금호지 동화책을 끝까지 읽고 퀴즈에 도전해요. 동물 친구들의 이야기도 들어 봐요.</p></article></div>
    <p class="briefing-finale"><b>마무리 · 레벨 4, 우리 반 생태 지도</b><br>세 미션 뒤에는 내 그림·생물 이름·보호 약속을 생태 지도에 등록해요. <b>마을·이야기·생태 스탬프 3개</b>를 모두 모으면 우리 동네 수호대 성공!</p></div>
    <p class="small">진주시 금산면을 모티브로 한 수업용 축약 마을이에요. 동물 주민은 가상의 친구예요.<br>학급 규칙: ${h(content.classRules.source)}.</p><p class="notice">학교 문에서 <b>E키</b>로 들어가요. 이동은 WASD/방향키, 지도·가방은 ‘탐험 도구’에서 열어요. 기록은 이 브라우저에 저장돼요.</p><button id="start" class="primary" style="width:100%">탐험을 시작할까요? →</button>`, "wide",
  );
  root.querySelector("#start").onclick = () => {
    state.welcomed = true;
    state.guardian.introSeen = true;
    state.journey.introSeen = true;
    state.journey.introRevision = 3;
    persist();
    close();
    updateActivity();
  };
}
function interact(id) {
  if (id.startsWith("art:")) return artDetail(id.slice(4));
  if (id.startsWith("waste:")) return pickup(id.slice(6));
  switch (id) {
    case "school":
    case "library":
      world.enter(id);
      world.setObjective?.(objective(state, content, world.indoor));
      $("#place").textContent =
        id === "school" ? "학교 · 우리 반 교실" : "도서관 · 이야기 책장";
      return;
    case "exit":
      world.exit();
      world.setObjective?.(objective(state, content, world.indoor));
      $("#place").textContent = "학교 앞 산책길";
      return;
    case "board":
      return board();
    case "books":
      return books();
    case "otter":
    case "turtle":
    case "crane":
      return talk(id);
    case "postman":
      return facility("postman");
    case "resident":
    case "neighborhood":
      return facility("house");
    case "house":
      return facility("house");
    case "apartment":
      return placeStory("apartment");
    case "path":
      return pathPuzzle();
    case "bins":
      return bins();
    case "mailbox":
      return facility("postman");
    case "eco-map":
      return showMap();
    case "forest":
      return placeStory("forest");
    case "exhibition":
      return showExhibition();
    case "rest":
      return openLakeBook();
    case "lake-story":
      return openLakeBook();
    case "manager":
    case "eco-station":
      return lakeAction("manager");
    case "specimen":
      return lakeAction(id);
  }
}
const pages = { map: showMap, bag, catalog, settings };
document
  .querySelectorAll("[data-page]")
  .forEach((b) => (b.onclick = () => pages[b.dataset.page]()));
$("#camera").onclick = chooseImage;
$("#image-input").onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (file && levelGate(4))
    await imageEditor(file, ui, async (a) => {
      await saveExhibitWork(a);
    });
};
document.querySelectorAll("[data-key]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    if (world?.moveEnabled) world.keys.add(b.dataset.key);
  };
  b.onpointerup =
    b.onpointercancel =
    b.onlostpointercapture =
      () => world?.keys.delete(b.dataset.key);
});
try {
  world = new World($("#world"), {
    interact,
    near: (e) => {
      const b = $("#interact");
      b.hidden = !e;
      if (e) {
        b.textContent = `E · ${e.title}`;
        b.onclick = () => world?.interactNearby();
      }
    },
    warning: toast,
    state,
    content,
  });
  const modelStatus = document.createElement("div");
  modelStatus.className = "model-loading";
  modelStatus.setAttribute("role", "status");
  $("#world").after(modelStatus);
  const updateModelStatus = () => {
    const values = [...world.modelStatus.values()];
    modelStatus.textContent = `주민과 마을 소품을 불러오고 있어요 · ${values.filter((v) => v !== "loading").length}/${values.length}`;
  };
  updateModelStatus();
  const modelProgress = setInterval(updateModelStatus, 300);
  world.modelsReady.then(() => {
    clearInterval(modelProgress);
    const failed = [...world.modelStatus.values()].filter(
      (v) => v === "fallback",
    ).length;
    modelStatus.textContent = failed
      ? "일부 소품은 기본 모습으로 보여요. 새로고침하면 다시 불러와요."
      : "주민과 마을 소품 준비 완료!";
    setTimeout(() => modelStatus.remove(), failed ? 9000 : 2500);
  });
  world.canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    world.setPaused(true);
    open(
      "화면 연결이 잠시 끊겼어요",
      '<p>진행 기록은 저장되어 있어요. 다른 그래픽 프로그램을 닫고 이 페이지를 새로고침해 주세요.</p><button onclick="location.reload()">새로고침</button>',
    );
  });
  applySettings();
  renderHud();
  try {
    await refreshWorks();
  } catch {
    toast(
      "그림 저장소를 열지 못했어요. 비공개 모드·저장 권한을 확인해 주세요. 다른 학습 활동은 계속할 수 있어요.",
    );
  }
  $("#loading").remove();
  if (!state.welcomed || !state.journey.introSeen || state.journey.introRevision !== 3) welcome();
  setInterval(() => {
    drawMap($("#mini"));
    if (!world.indoor) {
      const p = world.player.position;
      $("#place").textContent =
        p.x > 15 && p.z < -7
          ? "금호지"
          : p.x < -14 && p.z < 0
            ? "월아산"
            : p.x > 8
              ? "햇살 아파트 앞"
              : p.z > 5
                ? "마을 광장"
                : "학교 앞 산책길";
    }
  }, 250);
} catch (e) {
  $("#loading")?.remove();
  const r = open(
    "3D 화면을 열지 못했어요",
    `<p>WebGL을 사용할 수 없거나 그래픽 초기화에 실패했어요. 최신 Chrome·Edge·Safari에서 하드웨어 가속을 켜고 다시 열어 주세요.</p><p class="small">브라우저 설정 → 시스템 → 그래픽 가속을 확인해요. 다른 기기에서 접속하는 것도 방법이에요.</p><button id="retry">다시 시도</button>`,
  );
  r.querySelector("#retry").onclick = () => location.reload();
  console.error(e);
}
export { world, state, content, works, validateContent };
