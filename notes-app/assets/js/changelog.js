/* ============================================================
 * changelog.js
 * Carrega o arquivo `assets/data/changelog.json` (gerado pelo CI
 * a partir do git log) e, se há entradas que o usuário ainda não
 * viu, exibe um modal com as novidades.
 * ============================================================ */

window.Changelog = (() => {
  const KEY = 'notesapp.lastSeenSha';
  const URL = 'assets/data/changelog.json';
  const { escapeHtml } = window.Utils;

  async function fetchChangelog() {
    try {
      const resp = await fetch(URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }

  /** Retorna apenas as entradas ainda não vistas pelo usuário. */
  function pickUnseen(entries, lastSeen) {
    if (!lastSeen) return entries;
    const idx = entries.findIndex((e) => e.sha === lastSeen);
    return idx === -1 ? entries : entries.slice(0, idx);
  }

  function entryToHtml(e) {
    const date = e.date ? new Date(e.date).toLocaleDateString('pt-BR') : '';
    const body = (e.body || '').trim();
    return `
      <li class="cl-entry">
        <div class="cl-head">
          <span class="cl-subject">${escapeHtml(e.subject || '')}</span>
          <span class="cl-meta">
            ${date ? `<span class="cl-date">${escapeHtml(date)}</span>` : ''}
            ${e.short_sha ? `<code class="cl-sha">${escapeHtml(e.short_sha)}</code>` : ''}
          </span>
        </div>
        ${body ? `<pre class="cl-body">${escapeHtml(body)}</pre>` : ''}
      </li>`;
  }

  function ensureModal() {
    if (document.getElementById('changelogModal')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="modal fade" id="changelogModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-stars me-1"></i>Novidades
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <ul id="changelogList" class="cl-list"></ul>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="changelogAck">
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  async function check() {
    const data = await fetchChangelog();
    if (!data || !Array.isArray(data.entries) || data.entries.length === 0) return;

    const lastSeen = localStorage.getItem(KEY);
    const unseen = pickUnseen(data.entries, lastSeen);
    if (unseen.length === 0) return;

    ensureModal();
    document.getElementById('changelogList').innerHTML = unseen.map(entryToHtml).join('');
    const modalEl = document.getElementById('changelogModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    const markSeen = () => {
      try { localStorage.setItem(KEY, data.entries[0].sha); } catch {}
    };
    document.getElementById('changelogAck').onclick = () => {
      markSeen();
      modal.hide();
    };
    modalEl.addEventListener('hidden.bs.modal', markSeen, { once: true });

    // Mostra só após a UI inicial renderizar
    setTimeout(() => modal.show(), 600);
  }

  return { check };
})();
