import {
  EXPLORERS,
  MISSIONS,
  NICKNAME_MAX,
  checkPassword,
  session,
  toNetworkError,
  validateNickname,
  validateStudentNumber,
  validateUsername,
  type ExplorerId,
} from '../network';
import { $, EXPLORER_SPRITES, app, esc, render, showFormError, withBusy } from './dom';
import { showMainMenu } from './mainMenu';
import { startCampus } from './campus';

// ---------- New Game ----------

/** New Game: creates a new account in the database, with the chosen explorer, then starts mission 1. */
export function showNewGame(): void {
  session.setScreen('new_game');
  let explorer: ExplorerId = 6;
  const signedIn = session.getState();

  render(`
    <div class="screen login">
      <form class="login-card" id="new-form" novalidate>
        <div class="title">NEW <span>GAME</span></div>
        <p class="sub">Create your account and choose your campus explorer. Your progress saves each time you complete a mission.</p>
        ${
          signedIn.status === 'signedIn'
            ? `<p class="notice">You’re signed in as @${esc(signedIn.profile?.username)}. Creating a new account signs you out of that one.</p>`
            : ''
        }
        <div class="login-grid">
          <div>
            <b id="explorer-label">Choose your explorer</b>
            <div class="avatars" role="radiogroup" aria-labelledby="explorer-label">
              ${EXPLORERS.map(
                (n) => `<button type="button" class="avatar ${n === explorer ? 'sel' : ''}" role="radio"
                          aria-checked="${n === explorer}" data-explorer="${n}">
                          <img src="${EXPLORER_SPRITES[n]}" alt=""><b>Explorer ${n}</b>
                        </button>`,
              ).join('')}
            </div>
          </div>

          <div class="fields">
            <label class="field"><span>Username</span>
              <input id="ng-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required>
              <small>3 to 20 letters, numbers or underscores. You’ll use this to load your game.</small>
            </label>
            <label class="field"><span>Password</span>
              <input id="ng-pass" type="password" autocomplete="new-password" maxlength="72" required aria-describedby="ng-rules">
            </label>
            <ul class="rules" id="ng-rules" aria-label="Password requirements"></ul>
            <label class="field"><span>Confirm password</span>
              <input id="ng-confirm" type="password" autocomplete="new-password" maxlength="72" required>
            </label>
            <div class="field-row">
              <label class="field"><span>Nickname</span>
                <input id="ng-nick" maxlength="${NICKNAME_MAX}" required>
              </label>
              <label class="field"><span>Student number</span>
                <input id="ng-num" maxlength="12" autocapitalize="characters" spellcheck="false" required>
              </label>
            </div>
            <p class="form-error" id="ng-error" role="alert" hidden></p>
            <button class="primary" id="ng-submit" type="submit">CREATE ACCOUNT &amp; START</button>
            <div class="actions">
              <button class="secondary" type="button" id="ng-back">← MAIN MENU</button>
              <button class="link-btn" type="button" id="ng-have">I already have an account</button>
            </div>
          </div>
        </div>
      </form>
    </div>`);

  // Explorer choice updates in place so typed fields aren't lost.
  document.querySelectorAll<HTMLButtonElement>('[data-explorer]').forEach((btn) => {
    btn.onclick = () => {
      explorer = Number(btn.dataset.explorer) as ExplorerId;
      document.querySelectorAll<HTMLButtonElement>('[data-explorer]').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('sel', on);
        b.setAttribute('aria-checked', String(on));
      });
    };
  });

  const pass = $<HTMLInputElement>('#ng-pass');
  const rules = $('#ng-rules');
  const paintRules = () => {
    rules.innerHTML = checkPassword(pass.value)
      .results.map(
        (r) =>
          `<li class="${r.passed ? 'met' : ''}"><span aria-hidden="true">${r.passed ? '✓' : '○'}</span> ${r.label}<span class="sr-only">${r.passed ? ' (met)' : ' (not met)'}</span></li>`,
      )
      .join('');
  };
  pass.addEventListener('input', paintRules);
  paintRules();

  $('#ng-back').onclick = showMainMenu;
  $('#ng-have').onclick = showLoadGame;

  const errorEl = $('#ng-error');
  const submit = $<HTMLButtonElement>('#ng-submit');
  $<HTMLFormElement>('#new-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = $<HTMLInputElement>('#ng-user').value.trim();
    const password = pass.value;
    const confirm = $<HTMLInputElement>('#ng-confirm').value;
    const nickname = $<HTMLInputElement>('#ng-nick').value.trim();
    const studentNumber = $<HTMLInputElement>('#ng-num').value.trim();

    const problem =
      validateUsername(username) ??
      (checkPassword(password).valid ? null : 'Your password doesn’t meet every requirement yet.') ??
      (password === confirm ? null : 'The two passwords don’t match.') ??
      validateNickname(nickname) ??
      validateStudentNumber(studentNumber);
    showFormError(errorEl, problem);
    if (problem) return;

    try {
      await withBusy(submit, 'CREATING ACCOUNT…', () =>
        session.signUp(username, password, { nickname, studentNumber, explorer }),
      );
      startCampus({ welcome: `Welcome, ${nickname}! Your account is ready. Head to mission 1.` });
    } catch (err) {
      showFormError(errorEl, toNetworkError(err).message);
    }
  };

  $<HTMLInputElement>('#ng-user').focus();
}

// ---------- Load Game ----------

/** Load Game: signs in an existing account and resumes from its last saved state. */
export function showLoadGame(): void {
  session.setScreen('load_game');
  const s = session.getState();
  const current = s.status === 'signedIn' && s.profile ? s : null;

  render(`
    <div class="screen login">
      <div class="login-card login-card--narrow">
        <div class="title">LOAD <span>GAME</span></div>
        <p class="sub">Log in to continue from your last completed mission.</p>

        ${
          current
            ? `<div class="resume-card">
                <img src="${EXPLORER_SPRITES[current.save?.state.explorer ?? 6] ?? EXPLORER_SPRITES[6]}" alt="">
                <div>
                  <b>${esc(current.save?.state.nickname ?? current.profile!.username)}</b>
                  <small>@${esc(current.profile!.username)} · ${progressLabel(current.save?.completed_missions.length ?? 0)}</small>
                </div>
              </div>
              <div class="actions">
                <button class="primary" id="lg-continue">CONTINUE</button>
                <button class="secondary" id="lg-switch">LOG IN AS SOMEONE ELSE</button>
              </div>`
            : ''
        }

        <form class="fields" id="lg-form" novalidate ${current ? 'hidden' : ''}>
          <label class="field"><span>Username</span>
            <input id="lg-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required>
          </label>
          <label class="field"><span>Password</span>
            <input id="lg-pass" type="password" autocomplete="current-password" maxlength="72" required>
          </label>
          <p class="form-error" id="lg-error" role="alert" hidden></p>
          <button class="primary" id="lg-submit" type="submit">LOAD GAME</button>
        </form>

        <div class="actions">
          <button class="secondary" id="lg-back">← MAIN MENU</button>
          <button class="link-btn" id="lg-new">Start a new game instead</button>
        </div>
      </div>
    </div>`);

  $('#lg-back').onclick = showMainMenu;
  $('#lg-new').onclick = showNewGame;

  const form = $<HTMLFormElement>('#lg-form');
  if (current) {
    $('#lg-continue').onclick = () => startCampus({ welcome: resumeMessage() });
    // Show the login form straight away; signing out happens in the background.
    $('#lg-switch').onclick = () => {
      app.querySelector('.resume-card')?.remove();
      $('#lg-continue').closest('.actions')?.remove();
      form.hidden = false;
      $<HTMLInputElement>('#lg-user').focus();
      void session.logOut().catch(() => undefined);
    };
    $<HTMLButtonElement>('#lg-continue').focus();
  } else {
    $<HTMLInputElement>('#lg-user').focus();
  }

  const errorEl = $('#lg-error');
  const submit = $<HTMLButtonElement>('#lg-submit');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const username = $<HTMLInputElement>('#lg-user').value.trim();
    const password = $<HTMLInputElement>('#lg-pass').value;
    if (!username || !password) return showFormError(errorEl, 'Enter your username and password.');
    showFormError(errorEl, null);

    try {
      await withBusy(submit, 'LOADING…', () => session.logIn(username, password));
      startCampus({ welcome: resumeMessage() });
    } catch (err) {
      showFormError(errorEl, toNetworkError(err).message);
    }
  };
}

function progressLabel(done: number): string {
  return done >= MISSIONS.length ? 'Orientation complete' : `Mission ${done + 1} of ${MISSIONS.length} next`;
}

function resumeMessage(): string {
  const s = session.getState();
  const done = s.save?.completed_missions.length ?? 0;
  const name = s.save?.state.nickname ?? s.profile?.username ?? 'explorer';
  if (done >= MISSIONS.length) return `Welcome back, ${name}. You’ve completed every orientation mission.`;
  if (done === 0) return `Welcome back, ${name}. You’re ready to start mission 1.`;
  return `Save loaded. Welcome back, ${name}: ${done} of ${MISSIONS.length} missions complete.`;
}
