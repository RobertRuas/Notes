/* ============================================================
 * ui.js
 * Renderização das telas (login, cadastro, notas, perfil, config).
 * Monta o HTML em #app e delega ações para Auth / Notes.
 * ============================================================ */

window.UI = (() => {
  const { escapeHtml, formatDate, toast, sanitizeHtml, htmlToText } = window.Utils;

  const app = () => document.getElementById('app');
  const navbar = () => document.getElementById('navbar');
  const userLabel = () => document.getElementById('userLabel');
  const userAvatar = () => document.getElementById('userAvatar');

  let notesCache = [];
  let currentFilter = '';
  let editingId = null;

  /** Atualiza o rótulo e o avatar do usuário na navbar. */
  function refreshUserBadge() {
    const u = window.Auth.currentUser();
    if (!u) return;
    userLabel().textContent = u.name || u.email;
    const initials = (u.name || u.email || '?')
      .split(/[\s@._-]+/).filter(Boolean)
      .slice(0, 2).map((s) => s[0]).join('')
      .toUpperCase() || '?';
    userAvatar().textContent = initials;
  }

  // ------------------------------------------------------------
  //  Login
  // ------------------------------------------------------------
  function renderLogin() {
    navbar().classList.add('d-none');
    app().innerHTML = `
      <div class="auth-wrapper">
        <div class="card auth-card">
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="auth-logo"><i class="bi bi-journal-text"></i></div>
              <h1>Bem-vindo</h1>
              <p class="text-secondary small mb-0">Entre para acessar suas notas</p>
            </div>

            <form id="loginForm" novalidate>
              <div class="mb-3">
                <label for="loginEmail" class="form-label">E-mail</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                  <input type="email" class="form-control" id="loginEmail"
                         placeholder="voce@exemplo.com" autocomplete="email" required />
                </div>
              </div>

              <div class="mb-4">
                <label for="loginPassword" class="form-label">Senha</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control" id="loginPassword"
                         placeholder="••••••••" autocomplete="current-password" required />
                  <button class="btn btn-outline-secondary" type="button" data-toggle="password">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>

              <button class="btn btn-primary w-100" type="submit" id="loginSubmit">
                Entrar <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </form>

            <hr class="my-4" />
            <p class="text-center small mb-0">
              Não tem conta? <a href="#/register">Cadastre-se</a>
            </p>
          </div>
        </div>
      </div>
    `;

    bindPasswordToggles();
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginSubmit');
      setLoading(btn, true, 'Entrando...');
      try {
        await window.Auth.login({
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value,
        });
        toast('Login efetuado com sucesso.', 'success');
        window.location.hash = '#/notes';
      } catch (err) {
        toast(err.message || 'Falha ao entrar.', 'danger');
      } finally {
        setLoading(btn, false, 'Entrar <i class="bi bi-arrow-right ms-1"></i>');
      }
    });
  }

  // ------------------------------------------------------------
  //  Cadastro
  // ------------------------------------------------------------
  function renderRegister() {
    navbar().classList.add('d-none');
    app().innerHTML = `
      <div class="auth-wrapper">
        <div class="card auth-card">
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="auth-logo"><i class="bi bi-stars"></i></div>
              <h1>Criar conta</h1>
              <p class="text-secondary small mb-0">Comece a organizar suas ideias</p>
            </div>

            <form id="registerForm" novalidate>
              <div class="mb-3">
                <label for="regName" class="form-label">Nome</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control" id="regName"
                         placeholder="Seu nome" autocomplete="name" required />
                </div>
              </div>

              <div class="mb-3">
                <label for="regEmail" class="form-label">E-mail</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                  <input type="email" class="form-control" id="regEmail"
                         placeholder="voce@exemplo.com" autocomplete="email" required />
                </div>
              </div>

              <div class="mb-4">
                <label for="regPassword" class="form-label">Senha</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control" id="regPassword"
                         placeholder="Mínimo de 6 caracteres"
                         autocomplete="new-password" required minlength="6" />
                  <button class="btn btn-outline-secondary" type="button" data-toggle="password">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>

              <button class="btn btn-primary w-100" type="submit" id="regSubmit">
                Criar conta <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </form>

            <hr class="my-4" />
            <p class="text-center small mb-0">
              Já tem conta? <a href="#/login">Entrar</a>
            </p>
          </div>
        </div>
      </div>
    `;

    bindPasswordToggles();
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('regSubmit');
      setLoading(btn, true, 'Criando conta...');
      try {
        await window.Auth.register({
          name: document.getElementById('regName').value,
          email: document.getElementById('regEmail').value,
          password: document.getElementById('regPassword').value,
        });
        toast('Conta criada! Bem-vindo.', 'success');
        window.location.hash = '#/notes';
      } catch (err) {
        toast(err.message || 'Não foi possível criar a conta.', 'danger');
      } finally {
        setLoading(btn, false, 'Criar conta <i class="bi bi-arrow-right ms-1"></i>');
      }
    });
  }

  // ------------------------------------------------------------
  //  Lista de notas
  // ------------------------------------------------------------
  async function renderNotes() {
    const user = window.Auth.currentUser();
    if (!user) { window.location.hash = '#/login'; return; }

    navbar().classList.remove('d-none');
    refreshUserBadge();

    app().innerHTML = `
      <div class="page-enter d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h1 class="page-title">Minhas notas</h1>
          <p class="page-subtitle mb-0">Capture ideias, pensamentos e lembretes.</p>
        </div>
        <div class="toolbar">
          <span class="search-icon"><i class="bi bi-search"></i></span>
          <input type="search" id="searchInput" class="form-control"
                 placeholder="Buscar..." aria-label="Buscar notas" />
          <button id="btnNewNote" class="btn btn-primary text-nowrap">
            <i class="bi bi-plus-lg me-1"></i><span class="d-none d-sm-inline">Nova</span>
          </button>
        </div>
      </div>

      <div id="notesStatus" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>

      <div id="notesGrid" class="row g-3 d-none"></div>
    `;

    document.getElementById('btnNewNote').addEventListener('click', () => openEditor(null));
    document.getElementById('searchInput').addEventListener('input', (e) => {
      currentFilter = e.target.value.trim().toLowerCase();
      renderNotesGrid();
    });

    await reloadNotes();
  }

  async function reloadNotes() {
    const status = document.getElementById('notesStatus');
    const grid = document.getElementById('notesGrid');
    if (!grid) return;

    status.classList.remove('d-none');
    grid.classList.add('d-none');

    try {
      notesCache = await window.Notes.listMine();
      renderNotesGrid();
    } catch (err) {
      status.innerHTML = `
        <div class="alert alert-danger mx-auto" style="max-width: 500px;">
          <i class="bi bi-exclamation-triangle me-1"></i>
          Erro ao carregar notas: ${escapeHtml(err.message)}
        </div>`;
      return;
    }

    status.classList.add('d-none');
    grid.classList.remove('d-none');
  }

  function renderNotesGrid() {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;

    const filtered = notesCache.filter((n) => {
      if (!currentFilter) return true;
      const t = (n.data.title || '').toLowerCase();
      const c = htmlToText(n.data.content || '').toLowerCase();
      return t.includes(currentFilter) || c.includes(currentFilter);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <div class="empty-icon"><i class="bi bi-journal-plus"></i></div>
            <h2>${currentFilter ? 'Nenhuma nota encontrada' : 'Comece a escrever'}</h2>
            <p class="mb-0">${
              currentFilter
                ? 'Tente outro termo de busca.'
                : 'Clique em "Nova" para criar sua primeira nota.'
            }</p>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(renderNoteCard).join('');

    grid.querySelectorAll('[data-action="open"]').forEach((el) => {
      el.addEventListener('click', () => openEditor(el.dataset.id));
    });
    grid.querySelectorAll('[data-action="pin"]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation(); await handleTogglePin(el.dataset.id);
      });
    });
    grid.querySelectorAll('[data-action="delete"]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation(); await handleDelete(el.dataset.id);
      });
    });
  }

  function renderNoteCard(note) {
    const d = note.data || {};
    const title = (d.title || '').trim();
    const previewText = htmlToText(d.content || '') || '(vazio)';
    const updated = formatDate(d.updatedAt || note.updatedAt);

    return `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <div class="note-card" data-action="open" data-id="${note.id}">
          ${d.pinned ? '<span class="pin-indicator" title="Fixada"><i class="bi bi-pin-angle-fill"></i></span>' : ''}
          ${title ? `<h3 class="note-title">${escapeHtml(title)}</h3>` : ''}
          <div class="note-content-preview">${escapeHtml(previewText)}</div>
          <div class="note-meta">
            <span><i class="bi bi-clock me-1"></i>${updated}</span>
            <div class="note-actions">
              <button type="button" class="note-action-btn"
                      data-action="pin" data-id="${note.id}"
                      title="${d.pinned ? 'Desafixar' : 'Fixar'}">
                <i class="bi ${d.pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}"></i>
              </button>
              <button type="button" class="note-action-btn danger"
                      data-action="delete" data-id="${note.id}" title="Excluir">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ------------------------------------------------------------
  //  Editor (modal) com formatação básica
  // ------------------------------------------------------------
  function ensureEditorModal() {
    if (document.getElementById('editorModal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="editorModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <form id="editorForm">
              <div class="modal-header">
                <h5 class="modal-title" id="editorTitle">
                  <i class="bi bi-pencil-square me-1"></i>Nova nota
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label for="editorTitleInput" class="form-label">Título</label>
                  <input type="text" class="form-control" id="editorTitleInput"
                         maxlength="200" placeholder="Dê um título (opcional)" />
                </div>
                <div class="mb-0">
                  <label class="form-label">Conteúdo</label>
                  <div class="editor-toolbar" role="toolbar" aria-label="Formatação">
                    <button type="button" class="ed-btn" data-cmd="bold" title="Negrito (Ctrl+B)">
                      <i class="bi bi-type-bold"></i>
                    </button>
                    <button type="button" class="ed-btn" data-cmd="italic" title="Itálico (Ctrl+I)">
                      <i class="bi bi-type-italic"></i>
                    </button>
                    <button type="button" class="ed-btn" data-cmd="underline" title="Sublinhado (Ctrl+U)">
                      <i class="bi bi-type-underline"></i>
                    </button>
                    <button type="button" class="ed-btn" data-cmd="strikeThrough" title="Tachado">
                      <i class="bi bi-type-strikethrough"></i>
                    </button>
                    <span class="ed-sep"></span>
                    <button type="button" class="ed-btn" data-block="H2" title="Título">
                      <i class="bi bi-type-h2"></i>
                    </button>
                    <button type="button" class="ed-btn" data-block="H3" title="Subtítulo">
                      <i class="bi bi-type-h3"></i>
                    </button>
                    <button type="button" class="ed-btn" data-block="BLOCKQUOTE" title="Citação">
                      <i class="bi bi-quote"></i>
                    </button>
                    <span class="ed-sep"></span>
                    <button type="button" class="ed-btn" data-cmd="insertUnorderedList" title="Lista">
                      <i class="bi bi-list-ul"></i>
                    </button>
                    <button type="button" class="ed-btn" data-cmd="insertOrderedList" title="Lista numerada">
                      <i class="bi bi-list-ol"></i>
                    </button>
                    <span class="ed-sep"></span>
                    <button type="button" class="ed-btn" data-cmd="createLink" title="Link">
                      <i class="bi bi-link-45deg"></i>
                    </button>
                    <button type="button" class="ed-btn" data-cmd="removeFormat" title="Limpar formatação">
                      <i class="bi bi-eraser"></i>
                    </button>
                  </div>
                  <div
                    id="editorContent"
                    class="editor-area form-control"
                    contenteditable="true"
                    role="textbox"
                    aria-multiline="true"
                    data-placeholder="Escreva aqui..."></div>
                </div>
              </div>
              <div class="modal-footer justify-content-between">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="editorPinned" />
                  <label class="form-check-label" for="editorPinned">
                    <i class="bi bi-pin-angle me-1"></i>Fixar no topo
                  </label>
                </div>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary" id="editorSave">
                    <i class="bi bi-check-lg me-1"></i>Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('editorForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSave();
    });

    // Vincula botões da barra de formatação
    const editor = document.getElementById('editorContent');
    document.querySelectorAll('#editorModal .ed-btn').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault()); // não perde foco
      btn.addEventListener('click', () => {
        editor.focus();
        if (btn.dataset.cmd === 'createLink') {
          const url = prompt('URL do link:', 'https://');
          if (url) document.execCommand('createLink', false, url);
        } else if (btn.dataset.block) {
          document.execCommand('formatBlock', false, btn.dataset.block);
        } else if (btn.dataset.cmd) {
          document.execCommand(btn.dataset.cmd, false, null);
        }
      });
    });
  }

  function openEditor(id) {
    ensureEditorModal();
    editingId = id;

    const titleInput = document.getElementById('editorTitleInput');
    const editor = document.getElementById('editorContent');
    const pinnedInput = document.getElementById('editorPinned');
    const modalTitle = document.getElementById('editorTitle');

    if (id) {
      const note = notesCache.find((n) => n.id === id);
      if (!note) { toast('Nota não encontrada.', 'warning'); return; }
      modalTitle.innerHTML = '<i class="bi bi-pencil-square me-1"></i>Editar nota';
      titleInput.value = note.data.title || '';
      editor.innerHTML = sanitizeHtml(note.data.content || '');
      pinnedInput.checked = !!note.data.pinned;
    } else {
      modalTitle.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Nova nota';
      titleInput.value = '';
      editor.innerHTML = '';
      pinnedInput.checked = false;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editorModal'));
    modal.show();
    setTimeout(() => editor.focus(), 300);
  }

  async function handleSave() {
    const title = document.getElementById('editorTitleInput').value;
    const editor = document.getElementById('editorContent');
    const rawHtml = editor.innerHTML;
    const content = sanitizeHtml(rawHtml);
    const pinned = document.getElementById('editorPinned').checked;
    const btn = document.getElementById('editorSave');

    // Rejeita se não houver texto perceptível
    if (!htmlToText(content)) {
      toast('O conteúdo da nota não pode ficar vazio.', 'warning');
      return;
    }

    setLoading(btn, true, 'Salvando...');
    try {
      if (editingId) {
        await window.Notes.update(editingId, { title, content, pinned });
        toast('Nota atualizada.', 'success');
      } else {
        await window.Notes.create({ title, content, pinned });
        toast('Nota criada.', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('editorModal')).hide();
      await reloadNotes();
    } catch (err) {
      toast('Erro ao salvar: ' + err.message, 'danger');
    } finally {
      setLoading(btn, false, '<i class="bi bi-check-lg me-1"></i>Salvar');
    }
  }

  async function handleTogglePin(id) {
    const note = notesCache.find((n) => n.id === id);
    if (!note) return;
    try { await window.Notes.togglePinned(note); await reloadNotes(); }
    catch (err) { toast('Erro ao fixar: ' + err.message, 'danger'); }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja realmente excluir esta nota?')) return;
    try {
      await window.Notes.remove(id);
      toast('Nota excluída.', 'success');
      await reloadNotes();
    } catch (err) { toast('Erro ao excluir: ' + err.message, 'danger'); }
  }

  // ------------------------------------------------------------
  //  Perfil
  // ------------------------------------------------------------
  function renderProfile() {
    const user = window.Auth.currentUser();
    if (!user) { window.location.hash = '#/login'; return; }
    navbar().classList.remove('d-none');
    refreshUserBadge();

    app().innerHTML = `
      <div class="page-enter">
        <div class="mb-4">
          <h1 class="page-title">Perfil</h1>
          <p class="page-subtitle mb-0">Dados pessoais e segurança</p>
        </div>

        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <div class="card">
              <div class="card-body">
                <h2 class="h6 mb-3"><i class="bi bi-person me-1"></i>Dados pessoais</h2>
                <form id="profileForm">
                  <div class="mb-3">
                    <label for="profName" class="form-label">Nome</label>
                    <input type="text" id="profName" class="form-control"
                           value="${escapeHtml(user.name || '')}" required />
                  </div>
                  <div class="mb-3">
                    <label for="profEmail" class="form-label">E-mail</label>
                    <input type="email" id="profEmail" class="form-control"
                           value="${escapeHtml(user.email || '')}" required />
                  </div>
                  <button type="submit" class="btn btn-primary" id="profSave">
                    <i class="bi bi-save me-1"></i>Salvar alterações
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="card">
              <div class="card-body">
                <h2 class="h6 mb-3"><i class="bi bi-shield-lock me-1"></i>Alterar senha</h2>
                <form id="passwordForm">
                  <div class="mb-3">
                    <label for="pwCurrent" class="form-label">Senha atual</label>
                    <input type="password" id="pwCurrent" class="form-control" required autocomplete="current-password" />
                  </div>
                  <div class="mb-3">
                    <label for="pwNew" class="form-label">Nova senha</label>
                    <input type="password" id="pwNew" class="form-control" required minlength="6" autocomplete="new-password" />
                  </div>
                  <div class="mb-3">
                    <label for="pwNew2" class="form-label">Confirmar nova senha</label>
                    <input type="password" id="pwNew2" class="form-control" required minlength="6" autocomplete="new-password" />
                  </div>
                  <button type="submit" class="btn btn-primary" id="pwSave">
                    <i class="bi bi-key me-1"></i>Alterar senha
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="card danger-card">
              <div class="card-body">
                <h2 class="h6 text-danger mb-2">
                  <i class="bi bi-exclamation-triangle me-1"></i>Zona de perigo
                </h2>
                <p class="text-secondary small mb-3">
                  Ao excluir sua conta, todas as suas notas serão removidas permanentemente.
                </p>
                <button class="btn btn-outline-danger" id="btnDeleteAccount">
                  <i class="bi bi-trash me-1"></i>Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('profSave');
      setLoading(btn, true, 'Salvando...');
      try {
        await window.Auth.updateProfile({
          name: document.getElementById('profName').value,
          email: document.getElementById('profEmail').value,
        });
        refreshUserBadge();
        toast('Perfil atualizado.', 'success');
      } catch (err) { toast(err.message, 'danger'); }
      finally { setLoading(btn, false, '<i class="bi bi-save me-1"></i>Salvar alterações'); }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('pwSave');
      const cur = document.getElementById('pwCurrent').value;
      const nw = document.getElementById('pwNew').value;
      const nw2 = document.getElementById('pwNew2').value;
      if (nw !== nw2) { toast('A confirmação não confere.', 'warning'); return; }
      setLoading(btn, true, 'Alterando...');
      try {
        await window.Auth.changePassword({ currentPassword: cur, newPassword: nw });
        toast('Senha alterada com sucesso.', 'success');
        document.getElementById('passwordForm').reset();
      } catch (err) { toast(err.message, 'danger'); }
      finally { setLoading(btn, false, '<i class="bi bi-key me-1"></i>Alterar senha'); }
    });

    document.getElementById('btnDeleteAccount').addEventListener('click', async () => {
      const pw = prompt('Para confirmar a exclusão, digite sua senha:');
      if (pw == null) return;
      if (!confirm('Tem certeza? Esta ação é PERMANENTE.')) return;
      try {
        await window.Auth.deleteAccount(pw);
        toast('Conta excluída.', 'info');
        window.location.hash = '#/login';
      } catch (err) { toast(err.message, 'danger'); }
    });
  }

  // ------------------------------------------------------------
  //  Configurações (tema + escala)
  // ------------------------------------------------------------
  function renderSettings() {
    const user = window.Auth.currentUser();
    if (!user) { window.location.hash = '#/login'; return; }
    navbar().classList.remove('d-none');
    refreshUserBadge();

    const theme = window.Theme.current();
    const scale = window.Scale.current();

    const scaleOptions = window.Scale.OPTIONS.map((o, i) => `
      <input type="radio" class="btn-check" name="scale" id="scale${i}"
             value="${o.value}" ${o.value === scale ? 'checked' : ''} />
      <label class="btn btn-outline-primary" for="scale${i}">${o.label}</label>
    `).join('');

    app().innerHTML = `
      <div class="page-enter">
        <div class="mb-4">
          <h1 class="page-title">Configurações</h1>
          <p class="page-subtitle mb-0">Personalize sua experiência</p>
        </div>

        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <div class="card">
              <div class="card-body">
                <h2 class="h6 mb-3"><i class="bi bi-palette me-1"></i>Aparência</h2>
                <label class="form-label">Tema</label>
                <div class="btn-group w-100 mb-4" role="group" aria-label="Tema">
                  <input type="radio" class="btn-check" name="theme" id="themeLight"
                         value="light" ${theme === 'light' ? 'checked' : ''} />
                  <label class="btn btn-outline-primary" for="themeLight">
                    <i class="bi bi-sun me-1"></i>Claro
                  </label>
                  <input type="radio" class="btn-check" name="theme" id="themeDark"
                         value="dark" ${theme === 'dark' ? 'checked' : ''} />
                  <label class="btn btn-outline-primary" for="themeDark">
                    <i class="bi bi-moon-stars me-1"></i>Escuro
                  </label>
                </div>

                <label class="form-label">Escala do app</label>
                <div class="btn-group w-100 flex-wrap" role="group" aria-label="Escala">
                  ${scaleOptions}
                </div>
                <p class="text-secondary small mt-2 mb-0">
                  Afeta todos os tamanhos (textos, botões, cards).
                </p>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="card">
              <div class="card-body">
                <h2 class="h6 mb-3"><i class="bi bi-info-circle me-1"></i>Sobre</h2>
                <ul class="list-unstyled small mb-0">
                  <li class="mb-1"><strong>App:</strong> Bloco de Notas</li>
                  <li class="mb-1"><strong>Versão:</strong> 1.1.0</li>
                  <li class="mb-1"><strong>Backend:</strong>
                    <a href="https://api.windlog.org/docs" target="_blank" rel="noopener">
                      api.windlog.org
                    </a>
                  </li>
                  <li><strong>Sessão:</strong> permanece ativa até você sair.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('input[name="theme"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        window.Theme.set(e.target.value);
        toast('Tema atualizado.', 'success', 1500);
      });
    });
    document.querySelectorAll('input[name="scale"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        window.Scale.set(parseFloat(e.target.value));
        toast('Escala atualizada.', 'success', 1500);
      });
    });
  }

  // ------------------------------------------------------------
  //  Helpers
  // ------------------------------------------------------------
  function setLoading(btn, loading, labelHtml) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span>' +
        (labelHtml || 'Aguarde...');
    } else {
      btn.innerHTML = labelHtml || btn.dataset.originalHtml || btn.innerHTML;
    }
  }

  function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle="password"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.querySelector('i').className = isPwd ? 'bi bi-eye-slash' : 'bi bi-eye';
      });
    });
  }

  return { renderLogin, renderRegister, renderNotes, renderProfile, renderSettings };
})();
