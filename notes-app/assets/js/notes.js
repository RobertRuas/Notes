/* ============================================================
 * notes.js
 * CRUD de notas por cima da API windlog.
 * Cada nota é um documento na coleção `notes_app_notes` com:
 *   { userId, title, content, pinned, color, createdAt, updatedAt }
 *
 * A API não oferece filtro server-side, então filtramos por `userId`
 * no cliente após listar. Para apps pessoais o volume costuma ser OK.
 * ============================================================ */

window.Notes = (() => {
  const { COLLECTIONS, NOTES_PAGE_SIZE } = window.AppConfig;

  /**
   * Lista todas as notas do usuário atual, mais recentes primeiro,
   * com as fixadas (pinned) sempre no topo.
   */
  async function listMine() {
    const user = window.Auth.currentUser();
    if (!user) return [];

    let offset = 0;
    const all = [];

    while (true) {
      const page = await window.Api.list(COLLECTIONS.NOTES, {
        limit: NOTES_PAGE_SIZE,
        offset,
      });
      const items = (page && page.items) || [];
      all.push(...items);
      if (items.length < NOTES_PAGE_SIZE) break;
      offset += NOTES_PAGE_SIZE;
    }

    // Filtra por dono e ordena: pinned desc, depois updatedAt desc
    return all
      .filter((n) => n.data && n.data.userId === user.userId)
      .sort((a, b) => {
        const pa = a.data.pinned ? 1 : 0;
        const pb = b.data.pinned ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return (
          new Date(b.data.updatedAt || b.updatedAt || 0) -
          new Date(a.data.updatedAt || a.updatedAt || 0)
        );
      });
  }

  /** Cria uma nova nota para o usuário atual. */
  async function create({ title, content, color = 'default', pinned = false }) {
    const user = window.Auth.currentUser();
    if (!user) throw new Error('Sessão expirada.');

    const now = new Date().toISOString();
    return window.Api.create(COLLECTIONS.NOTES, {
      userId: user.userId,
      title: (title || '').trim(),
      content: content || '',
      color,
      pinned: !!pinned,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Atualiza (merge) os campos informados numa nota existente. */
  async function update(id, patch) {
    const data = { ...patch, updatedAt: new Date().toISOString() };
    return window.Api.patch(COLLECTIONS.NOTES, id, data);
  }

  /** Alterna o estado "fixada" de uma nota. */
  async function togglePinned(note) {
    return update(note.id, { pinned: !note.data.pinned });
  }

  /** Remove (soft-delete) uma nota. */
  async function remove(id) {
    return window.Api.remove(COLLECTIONS.NOTES, id);
  }

  return { listMine, create, update, togglePinned, remove };
})();
