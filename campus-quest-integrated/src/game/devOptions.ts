import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminStatsPanel, GameSessionProvider, session, toNetworkError } from '../network';
import '../network/components/network.css';
import { $, esc, onLeave, render, showFormError, withBusy } from './dom';
import { showMainMenu } from './mainMenu';

const NO_ACCESS = 'This account doesn’t have dev access. Ask a team admin to promote it (see README).';

/** Dev Options: privileged sign-in, then the live management stats. */
export function showDevOptions(): void {
  const s = session.getState();
  if (s.status === 'signedIn' && s.profile?.role === 'admin') return showStats();

  session.setScreen('dev_options');
  render(`
    <div class="screen login">
      <div class="login-card login-card--narrow">
        <div class="title">DEV <span>OPTIONS</span></div>
        <p class="sub">Sign in with an admin account to view live player numbers and management stats.</p>
        ${
          s.status === 'signedIn'
            ? `<p class="notice">You’re signed in as @${esc(s.profile?.username)}, which isn’t an admin account. Signing in here switches accounts.</p>`
            : ''
        }
        <form class="fields" id="dev-form" novalidate>
          <label class="field"><span>Admin username</span>
            <input id="dev-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required>
          </label>
          <label class="field"><span>Password</span>
            <input id="dev-pass" type="password" autocomplete="current-password" maxlength="72" required>
          </label>
          <p class="form-error" id="dev-error" role="alert" hidden></p>
          <button class="primary" id="dev-submit" type="submit">SIGN IN</button>
        </form>
        <div class="actions">
          <button class="secondary" id="dev-back">← MAIN MENU</button>
        </div>
      </div>
    </div>`);

  $('#dev-back').onclick = showMainMenu;
  $<HTMLInputElement>('#dev-user').focus();

  const errorEl = $('#dev-error');
  const submit = $<HTMLButtonElement>('#dev-submit');
  $<HTMLFormElement>('#dev-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = $<HTMLInputElement>('#dev-user').value.trim();
    const password = $<HTMLInputElement>('#dev-pass').value;
    if (!username || !password) return showFormError(errorEl, 'Enter the admin username and password.');
    showFormError(errorEl, null);

    try {
      await withBusy(submit, 'SIGNING IN…', () => session.logIn(username, password));
    } catch (err) {
      return showFormError(errorEl, toNetworkError(err).message);
    }

    if (session.getState().profile?.role !== 'admin') {
      // Don't leave a player account signed in from the dev screen.
      await session.logOut().catch(() => undefined);
      return showFormError(errorEl, NO_ACCESS);
    }
    showStats();
  };
}

/** Renders the React stats panel inside the vanilla game shell. */
function showStats(): void {
  session.setScreen('admin');
  render(`
    <div class="screen dev-screen">
      <div class="dev-bar">
        <span>Signed in as <b>@${esc(session.getState().profile?.username)}</b> (admin)</span>
        <button class="secondary" id="dev-signout">SIGN OUT</button>
      </div>
      <div id="dev-stats-root"></div>
    </div>`);

  const reactRoot = createRoot($('#dev-stats-root'));
  reactRoot.render(
    createElement(GameSessionProvider, null, createElement(AdminStatsPanel, { onClose: showMainMenu })),
  );
  onLeave(() => reactRoot.unmount());

  // If the admin signs out (here or elsewhere), leave the stats screen.
  onLeave(
    session.subscribe(() => {
      if (session.getState().status === 'signedOut') showMainMenu();
    }),
  );

  $('#dev-signout').onclick = () => void session.logOut();
}
