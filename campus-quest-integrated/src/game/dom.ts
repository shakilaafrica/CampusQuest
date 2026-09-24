/** Small DOM helpers shared by every screen. */

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root element');
export const app: HTMLDivElement = root;

let leaveHandlers: (() => void)[] = [];

/** Runs when the current screen is replaced (remove key listeners, unmount React, etc.). */
export function onLeave(fn: () => void): void {
  leaveHandlers.push(fn);
}

/** Runs and clears the current screen's cleanup handlers without changing the page. */
export function leaveScreen(): void {
  const handlers = leaveHandlers;
  leaveHandlers = [];
  handlers.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });
}

/** Replaces the whole screen, cleaning up the previous one first. */
export function render(html: string): void {
  leaveScreen();
  app.innerHTML = html;
}

export function $<T extends Element = HTMLElement>(selector: string, scope: ParentNode = app): T {
  const el = scope.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

/** Escapes text before it goes into innerHTML. Anything typed by a player MUST go through this. */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

/** Path to a file in public/, correct in dev and in a built site on any sub-path. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export const EXPLORER_SPRITES: Record<number, string> = {
  6: asset('assets/npcs/npc6/down.png'),
  7: asset('assets/npcs/npc7/down.png'),
  8: asset('assets/npcs/npc8/down.png'),
};

/** Shows an error message in a form's alert slot (or hides it when message is null). */
export function showFormError(el: HTMLElement, message: string | null): void {
  el.textContent = message ?? '';
  el.hidden = !message;
}

/** Disables a button and swaps its label while an async action runs. */
export async function withBusy<T>(button: HTMLButtonElement, busyLabel: string, fn: () => Promise<T>): Promise<T> {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = busyLabel;
  try {
    return await fn();
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = label;
    }
  }
}

/** Arrow-key navigation between buttons in a vertical menu. */
export function enableArrowNavigation(container: HTMLElement, itemSelector: string): void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = Array.from(container.querySelectorAll<HTMLButtonElement>(itemSelector)).filter((b) => !b.disabled);
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[i === -1 ? 0 : next].focus();
  };
  window.addEventListener('keydown', handler);
  onLeave(() => window.removeEventListener('keydown', handler));
}
