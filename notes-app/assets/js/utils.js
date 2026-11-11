/* ============================================================
 * utils.js
 * Funções utilitárias compartilhadas (hash, formatação, toasts…)
 * ============================================================ */

window.Utils = (() => {
  /**
   * Gera um hash SHA-256 (hex) de uma string usando a Web Crypto API.
   * Usado para NUNCA armazenar a senha em texto puro no banco.
   * Observação: para produção séria, prefira um hash lento (bcrypt/argon2)
   * executado no servidor; SHA-256 aqui é um mínimo razoável para o escopo.
   */
  async function sha256(text) {
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Formata uma data ISO em "dd/mm/aaaa HH:MM".
   */
  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /**
   * Escapa HTML para evitar injeção de código ao inserir conteúdo
   * fornecido pelo usuário diretamente no DOM via innerHTML.
   */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**
   * Exibe uma notificação (toast) no canto superior direito.
   * variant: 'success' | 'danger' | 'warning' | 'info'
   */
  function toast(message, variant = 'info', delay = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${variant} border-0`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    container.appendChild(el);

    const t = new bootstrap.Toast(el, { delay });
    t.show();
    // Remove do DOM após ser fechado
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  /**
   * Gera um id curto aleatório (fallback caso a API não devolva um).
   */
  function randomId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  return { sha256, formatDate, escapeHtml, toast, randomId };
})();
