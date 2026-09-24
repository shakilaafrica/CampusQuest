import { MISSIONS, session, toNetworkError, type Mission } from '../network';
import { $, EXPLORER_SPRITES, app, asset, esc, leaveScreen, onLeave, render } from './dom';
import { showMainMenu } from './mainMenu';

/**
 * The campus map overworld and the mission frames.
 * Progress comes from the player's save in the database; nothing is written
 * until a mission is completed, which is the game's only save point.
 */

const START_POS = { x: 50, y: 92 };
let pos = { ...START_POS };

/** Which mission the player is on, derived from the save (4 = all complete). */
function currentMissionIndex(): number {
  return Math.min(session.getState().save?.completed_missions.length ?? 0, MISSIONS.length);
}

function player() {
  const s = session.getState();
  const st = s.save?.state ?? {};
  return {
    name: st.nickname ?? s.profile?.username ?? 'Explorer',
    num: st.studentNumber ?? '',
    explorer: EXPLORER_SPRITES[st.explorer ?? 6] ? (st.explorer ?? 6) : 6,
    username: s.profile?.username ?? '',
  };
}

/** Entry point after New Game or Load Game. */
export function startCampus(opts: { welcome?: string } = {}): void {
  if (session.getState().status !== 'signedIn') return showMainMenu();
  pos = { ...START_POS };
  showMap(opts.welcome);
}

function showMap(toast?: string): void {
  if (session.getState().status !== 'signedIn') return showMainMenu();
  session.setScreen('map');

  const index = currentMissionIndex();
  const finished = index >= MISSIONS.length;
  const m = MISSIONS[Math.min(index, MISSIONS.length - 1)];
  const p = player();

  render(`
    <div class="screen map">
      <img class="map-bg" src="${asset('assets/campus-map.png')}" alt="">
      <div class="shade"></div>
      <div class="hud">
        <h2>🧭 ${esc(p.name)}'s Campus Quest</h2>
        <small>${p.num ? `${esc(p.num)} · ` : ''}Explorer ${p.explorer} · @${esc(p.username)}</small>
        <div class="mission-card">
          <b>${finished ? 'ALL MISSIONS COMPLETE' : `MISSION ${index + 1} OF ${MISSIONS.length}`}</b>
          <strong>${finished ? 'Orientation Complete!' : esc(m.title)}</strong>
          <p>${finished ? `You completed all ${MISSIONS.length} orientation missions.` : `MISSION: ${esc(m.desc)}`}</p>
        </div>
        <div class="progress">${MISSIONS.map(
          (_, i) => `<i class="dot ${i < index ? 'done' : i === index ? 'active' : ''}"></i>`,
        ).join('')}</div>
        <div class="hud-actions">
          <span class="save-note">${index === 0 ? 'Progress saves when you finish a mission' : `Saved after mission ${index}`}</span>
          <button class="secondary hud-btn" id="to-menu">MAIN MENU</button>
        </div>
      </div>
      ${MISSIONS.map(
        (q, i) =>
          `<button class="marker ${i < index ? 'done' : i > index ? 'lock' : ''}" style="left:${q.x}%;top:${q.y}%"
             data-i="${i}" aria-label="${esc(q.title)}${i < index ? ' (complete)' : i > index ? ' (locked)' : ''}"
             ${i > index ? 'disabled' : ''}>${i < index ? '✓' : i + 1}</button>`,
      ).join('')}
      <div class="player" style="left:${pos.x}%;top:${pos.y}%"><img src="${EXPLORER_SPRITES[p.explorer]}" alt=""></div>
      <div class="tip">${finished ? 'Orientation complete. You can replay any mission from its marker.' : 'WASD / arrow keys to explore · reach the glowing mission marker'}</div>
      ${toast ? `<div class="toast" role="status">${esc(toast)}</div>` : ''}
    </div>`);

  $('#to-menu').onclick = showMainMenu;

  // Completed missions can be replayed from their marker (replays don't change progress).
  document.querySelectorAll<HTMLButtonElement>('.marker.done').forEach((b) => {
    b.onclick = () => showBriefing(Number(b.dataset.i), true);
  });

  if (toast) {
    const t = app.querySelector<HTMLElement>('.toast');
    const timer = window.setTimeout(() => t?.classList.add('toast--hide'), 4500);
    onLeave(() => window.clearTimeout(timer));
  }

  if (finished) return;

  const playerEl = $('.player');
  const target = MISSIONS[index];
  const move = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest?.('input, textarea')) return;
    const k = e.key.toLowerCase();
    let dx = 0;
    let dy = 0;
    if (k === 'a' || k === 'arrowleft') dx = -2;
    if (k === 'd' || k === 'arrowright') dx = 2;
    if (k === 'w' || k === 'arrowup') dy = -2;
    if (k === 's' || k === 'arrowdown') dy = 2;
    if (!dx && !dy) return;
    e.preventDefault();
    pos.x = Math.max(4, Math.min(96, pos.x + dx));
    pos.y = Math.max(8, Math.min(96, pos.y + dy));
    playerEl.style.left = `${pos.x}%`;
    playerEl.style.top = `${pos.y}%`;
    if (Math.hypot(pos.x - target.x, pos.y - target.y) < 5) showBriefing(index, false);
  };
  window.addEventListener('keydown', move);
  onLeave(() => window.removeEventListener('keydown', move));

  $(`[data-i="${index}"]`).onclick = () => {
    pos = { x: target.x, y: target.y };
    showBriefing(index, false);
  };
}

function showBriefing(i: number, replay: boolean): void {
  const m = MISSIONS[i];
  session.setScreen('briefing');
  // Stop map movement while the briefing is open.
  leaveScreen();
  const extra =
    m.id === 'jammie_rush'
      ? `<div class="route"><span class="stop">UPPER CAMPUS</span><i class="line"></i><span class="stop">JAMMIE STOP</span><i class="line"></i><span class="stop">J2 · HIDDINGH</span></div>`
      : '';
  app.querySelector('.map')!.insertAdjacentHTML(
    'beforeend',
    `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="brief-title">
      <div class="brief">
        <div class="kicker">MISSION ${i + 1}${replay ? ' · REPLAY' : ''}</div>
        <h1 id="brief-title">${esc(m.title)}</h1>
        <p>MISSION: ${esc(m.desc)}</p>
        ${replay ? '<p class="notice">You’ve already completed this mission. Replaying it won’t change your saved progress.</p>' : ''}
        ${extra}
        <div class="actions">
          <button class="primary" id="launch">BEGIN MISSION</button>
          <button class="secondary" id="back">BACK TO MAP</button>
        </div>
      </div>
    </div>`,
  );
  $('#back').onclick = () => showMap();
  $('#launch').onclick = () => launchMission(m);
  $<HTMLButtonElement>('#launch').focus();
}

function launchMission(m: Mission): void {
  session.setScreen(`mission:${m.id}`);
  const startedAt = performance.now();

  render(`
    <div class="mission-frame">
      <iframe src="${asset(m.page)}" title="${esc(m.title)}"></iframe>
      <div class="mission-toolbar">
        <button id="done">✓ ${esc(m.completeLabel)}</button>
        <button id="exit" title="Leave without saving this mission">← Map</button>
      </div>
    </div>`);

  const iframe = $<HTMLIFrameElement>('iframe');
  iframe.addEventListener('load', () => iframe.contentWindow?.focus());

  const finish = () => void completeMission(m, Math.round((performance.now() - startedAt) / 1000));
  $('#done').onclick = finish;
  $('#exit').onclick = () => showMap();

  // Missions can also report completion themselves:
  //   window.parent.postMessage({ type: 'campusquest:mission-complete', missionId: '<id>' }, '*')
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'campusquest:mission-complete' && e.data?.missionId === m.id) finish();
  };
  window.addEventListener('message', onMessage);
  onLeave(() => window.removeEventListener('message', onMessage));
}

/** The single save point: runs when a mission is finished. */
async function completeMission(m: Mission, durationSeconds: number): Promise<void> {
  const frame = app.querySelector('.mission-frame');
  if (!frame || frame.querySelector('.modal')) return; // already saving

  const wasDone = session.getState().save?.completed_missions.includes(m.id) ?? false;
  frame.insertAdjacentHTML(
    'beforeend',
    `<div class="modal" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div class="brief">
        <div class="kicker">MISSION COMPLETE</div>
        <h1>${esc(m.title)}</h1>
        <p id="save-msg">Saving your progress…</p>
        <div class="actions" id="save-actions"></div>
      </div>
    </div>`,
  );

  try {
    const save = await session.completeMission(m.id, { durationSeconds: Math.min(durationSeconds, 86400) });
    if (!app.contains(frame)) return;
    pos = { ...START_POS };
    const done = save.completed_missions.length;
    showMap(
      wasDone
        ? `Replay complete. Your saved progress is unchanged.`
        : done >= MISSIONS.length
          ? 'Progress saved. Orientation complete, well done!'
          : `Progress saved. Mission ${done + 1} is unlocked.`,
    );
  } catch (err) {
    if (!app.contains(frame)) return;
    const e = toNetworkError(err);
    $('#save-msg').innerHTML = `<span class="form-error">${esc(e.message)}</span>`;
    const actions = $('#save-actions');
    if (e.code === 'NOT_AUTHENTICATED') {
      actions.innerHTML = `<button class="primary" id="save-login">LOG IN AGAIN</button>`;
      $('#save-login').onclick = showMainMenu;
      return;
    }
    actions.innerHTML = `
      <button class="primary" id="save-retry">TRY AGAIN</button>
      <button class="secondary" id="save-skip">BACK TO MAP (NOT SAVED)</button>`;
    $('#save-retry').onclick = () => {
      frame.querySelector('.modal')?.remove();
      void completeMission(m, durationSeconds);
    };
    $('#save-skip').onclick = () => showMap();
  }
}
