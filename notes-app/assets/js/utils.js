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

  /**
   * Sanitiza uma string HTML permitindo apenas um conjunto seguro de
   * tags/atributos. Remove scripts, event handlers e `javascript:` em href.
   */
  function sanitizeHtml(html) {
    const allowed = new Set([
      'B','STRONG','I','EM','U','S','STRIKE','BR','P','DIV',
      'UL','OL','LI','H2','H3','H4','BLOCKQUOTE','A','SPAN',
    ]);
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    const walk = (node) => {
      const children = [...node.childNodes];
      for (const child of children) {
        if (child.nodeType === 1) { // Element
          if (!allowed.has(child.tagName)) {
            // Preserva o texto, descarta a tag
            const frag = document.createDocumentFragment();
            while (child.firstChild) frag.appendChild(child.firstChild);
            child.replaceWith(frag);
            continue;
          }
          // Remove todos os atributos exceto href em <a>
          for (const attr of [...child.attributes]) {
            if (child.tagName === 'A' && attr.name === 'href') {
              const v = String(attr.value || '').trim().toLowerCase();
              if (v.startsWith('javascript:') || v.startsWith('data:')) {
                child.removeAttribute('href');
              }
            } else {
              child.removeAttribute(attr.name);
            }
          }
          if (child.tagName === 'A') {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          }
          walk(child);
        } else if (child.nodeType !== 3) {
          // Remove comentários e demais nós não-texto
          child.remove();
        }
      }
    };
    walk(template.content);
    return template.innerHTML;
  }

  /** Converte HTML em texto plano (útil para previews/snippets). */
  function htmlToText(html) {
    const div = document.createElement('div');
    div.innerHTML = String(html || '');
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return { sha256, formatDate, escapeHtml, toast, randomId, sanitizeHtml, htmlToText };
})();
