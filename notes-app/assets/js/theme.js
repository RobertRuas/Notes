/* ============================================================
 * theme.js
 * Alternância de tema claro/escuro usando o atributo
 * `data-bs-theme` do Bootstrap 5.3. Preferência persistida em
 * localStorage e, por padrão, segue a preferência do sistema.
 * ============================================================ */

window.Theme = (() => {
  const KEY = (window.AppConfig && window.AppConfig.STORAGE.THEME) || 'notesapp.theme';

  /** Retorna 'light' | 'dark' conforme preferência salva ou SO. */
  function current() {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /** Aplica o tema no <html> e atualiza o ícone do botão. */
  function apply(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const btn = document.getElementById('btnTheme');
    if (btn) {
      btn.innerHTML =
        theme === 'dark'
          ? '<i class="bi bi-sun"></i>'
          : '<i class="bi bi-moon-stars"></i>';
    }
  }

  /** Define e persiste o tema. */
  function set(theme) {
    localStorage.setItem(KEY, theme);
    apply(theme);
  }

  /** Alterna entre claro e escuro. */
  function toggle() {
    set(current() === 'dark' ? 'light' : 'dark');
  }

  /** Inicializa: aplica preferência atual e segue mudanças do SO. */
  function init() {
    apply(current());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      // Só segue o SO se o usuário ainda não tiver escolhido manualmente
      if (!localStorage.getItem(KEY)) apply(current());
    });
  }

  return { init, current, set, toggle, apply };
})();
