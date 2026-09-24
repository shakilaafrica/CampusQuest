import { session, type SessionState } from '../network';
import { $, app, enableArrowNavigation, esc, onLeave, render } from './dom';
import { showNewGame, showLoadGame } from './accountScreens';
import { showDevOptions } from './devOptions';

/** The first screen of the game. */
export function showMainMenu(): void {
  session.setScreen('main_menu');
  render(`
    <div class="screen menu">
      <div class="menu-card">
        <div class="title">CAMPUS <span>QUEST</span></div>
        <p class="sub">Your UCT orientation: four missions across Upper Campus.</p>

        <nav class="menu-list" aria-label="Main menu">
          <button class="menu-item" data-action="new">
            <strong>New Game</strong>
            <small>Create an account, choose your explorer and start mission 1</small>
          </button>
          <button class="menu-item" data-action="load">
            <strong>Load Game</strong>
            <small>Log in and continue from your last completed mission</small>
          </button>
          <button class="menu-item" data-action="dev">
            <strong>Dev Options</strong>
            <small>Management stats for admin accounts</small>
          </button>
          <button class="menu-item menu-item--exit" data-action="exit">
            <strong>Exit Game</strong>
            <small>Sign out and close Campus Quest</small>
          </button>
        </nav>

        <div class="menu-status" id="menu-status" aria-live="polite"></div>
      </div>
    </div>`);

  $('[data-action="new"]').onclick = showNewGame;
  $('[data-action="load"]').onclick = showLoadGame;
  $('[data-action="dev"]').onclick = showDevOptions;
  $('[data-action="exit"]').onclick = confirmExit;

  enableArrowNavigation($('.menu-list'), '.menu-item');
  $<HTMLButtonElement>('.menu-item').focus();

  const status = $('#menu-status');
  const paint = () => paintStatus(status, session.getState());
  paint();
  onLeave(session.subscribe(paint));
}

function paintStatus(el: HTMLElement, s: SessionState): void {
  if (!s.configured) {
    el.innerHTML = `<p class="notice notice--warn">The game server isn’t set up yet. Copy <code>.env.example</code> to <code>.env</code>, add your Supabase URL and anon key, then restart <code>npm run dev</code>.</p>`;
    return;
  }
  if (s.status === 'loading') {
    el.innerHTML = `<p class="notice">Checking for a saved login…</p>`;
    return;
  }
  if (s.status === 'signedIn' && s.profile) {
    const name = s.save?.state.nickname ?? s.profile.username;
    el.innerHTML = `<p class="notice">Signed in as <b>${esc(name)}</b> (@${esc(s.profile.username)}). Choose Load Game to continue. <button class="link-btn" id="menu-signout">Sign out</button></p>`;
    $('#menu-signout', el).onclick = () => void session.logOut();
    return;
  }
  el.innerHTML = s.sessionError ? `<p class="notice notice--warn">${esc(s.sessionError.message)}</p>` : '';
}

// ---------- Exit Game ----------

function confirmExit(): void {
  const signedIn = session.getState().status === 'signedIn';
  app.querySelector('.menu')?.insertAdjacentHTML(
    'beforeend',
    `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="exit-title">
      <div class="brief">
        <div class="kicker">EXIT GAME</div>
        <h1 id="exit-title">Leave Campus Quest?</h1>
        <p>${
          signedIn
            ? 'Your progress is saved up to your last completed mission. You’ll be signed out on this device.'
            : 'You can come back any time and choose Load Game.'
        }</p>
        <div class="actions">
          <button class="primary" id="exit-yes">EXIT GAME</button>
          <button class="secondary" id="exit-no">CANCEL</button>
        </div>
      </div>
    </div>`,
  );
  const modal = app.querySelector<HTMLElement>('.menu .modal')!;
  const cancel = () => {
    modal.remove();
    $<HTMLButtonElement>('[data-action="exit"]').focus();
  };
  $('#exit-no').onclick = cancel;
  modal.addEventListener('keydown', (e) => e.key === 'Escape' && cancel());
  $<HTMLButtonElement>('#exit-yes').onclick = () => void exitGame();
  $<HTMLButtonElement>('#exit-no').focus();
}

async function exitGame(): Promise<void> {
  try {
    if (session.getState().status === 'signedIn') await session.logOut();
  } catch (err) {
    console.warn('[exit] sign-out failed', err);
  }

  // Browsers only let a page close a window that a script opened (e.g. a launcher
  // or desktop wrapper). If the tab stays open, show a closed-game screen instead.
  window.close();
  setTimeout(() => {
    if (window.closed) return;
    render(`
      <div class="screen menu">
        <div class="menu-card menu-card--exit">
          <div class="title">CAMPUS <span>QUEST</span></div>
          <h1 class="exit-heading">Thanks for playing</h1>
          <p class="sub">You’ve been signed out and the game has stopped. You can close this tab now.</p>
          <button class="secondary" id="reopen">BACK TO MAIN MENU</button>
        </div>
      </div>`);
    $('#reopen').onclick = showMainMenu;
    document.title = 'Campus Quest (closed)';
    onLeave(() => (document.title = 'Campus Quest'));
  }, 250);
}
