/* ============================================================
 * auth.js
 * Sistema de autenticação construído sobre a API windlog.
 *
 * Como a API windlog é um banco de dados genérico (sem contas de
 * usuário nativas), implementamos a autenticação da seguinte forma:
 *
 *   - Cada conta é um documento na coleção `notes_app_users` com
 *     { email, name, passwordHash } onde passwordHash é SHA-256.
 *   - O "login" compara o hash digitado com o armazenado.
 *   - A "sessão" fica em localStorage (userId + email + name).
 *
 * Limitações conhecidas (documentadas para o usuário):
 *   - Sem recuperação de senha automática.
 *   - A API retorna a lista completa de usuários a quem tiver a key;
 *     portanto este fluxo é adequado a um app de demonstração.
 * ============================================================ */

window.Auth = (() => {
  const { COLLECTIONS, STORAGE, NOTES_PAGE_SIZE } = window.AppConfig;
  const { sha256 } = window.Utils;

  // ---------- Sessão ----------

  /** Retorna a sessão atual ou null. */
  function currentUser() {
    try {
      const raw = localStorage.getItem(STORAGE.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Persiste a sessão (login). */
  function setSession(user) {
    localStorage.setItem(STORAGE.SESSION, JSON.stringify(user));
  }

  /** Remove a sessão (logout). */
  function clearSession() {
    localStorage.removeItem(STORAGE.SESSION);
  }

  /** Verdadeiro se há uma sessão válida. */
  const isLoggedIn = () => !!currentUser();

  // ---------- Operações de conta ----------

  /**
   * Procura um usuário por e-mail percorrendo todos os documentos.
   * (A API não oferece filtro; para volumes grandes isso precisaria
   * de paginação iterativa — já incluída.)
   */
  async function findUserByEmail(email) {
    const target = email.trim().toLowerCase();
    let offset = 0;
    // Enquanto houver páginas, percorre
    while (true) {
      const page = await window.Api.list(COLLECTIONS.USERS, {
        limit: NOTES_PAGE_SIZE,
        offset,
      });
      const items = (page && page.items) || [];
      const match = items.find(
        (u) => u.data && u.data.email === target,
      );
      if (match) return match;
      if (items.length < NOTES_PAGE_SIZE) return null;
      offset += NOTES_PAGE_SIZE;
    }
  }

  /**
   * Cadastra um novo usuário.
   * @throws Error('EMAIL_EXISTS') se o e-mail já estiver em uso.
   */
  async function register({ name, email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) throw new Error('Informe seu nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      throw new Error('E-mail inválido.');
    if (!password || password.length < 6)
      throw new Error('A senha deve ter ao menos 6 caracteres.');

    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      const e = new Error('Já existe uma conta com este e-mail.');
      e.code = 'EMAIL_EXISTS';
      throw e;
    }

    const passwordHash = await sha256(password);
    const createdAt = new Date().toISOString();

    const doc = await window.Api.create(COLLECTIONS.USERS, {
      email: cleanEmail,
      name: cleanName,
      passwordHash,
      createdAt,
    });

    const session = {
      userId: doc.id,
      email: cleanEmail,
      name: cleanName,
    };
    setSession(session);
    return session;
  }

  /**
   * Autentica um usuário existente.
   * @throws Error com mensagens pt-BR em caso de falha.
   */
  async function login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password)
      throw new Error('Informe e-mail e senha.');

    const user = await findUserByEmail(cleanEmail);
    if (!user) throw new Error('E-mail ou senha incorretos.');

    const hash = await sha256(password);
    if (user.data.passwordHash !== hash)
      throw new Error('E-mail ou senha incorretos.');

    const session = {
      userId: user.id,
      email: user.data.email,
      name: user.data.name,
    };
    setSession(session);
    return session;
  }

  /** Encerra a sessão atual. */
  function logout() {
    clearSession();
  }

  /**
   * Atualiza nome do usuário (e opcionalmente o e-mail).
   * Se o e-mail mudar, valida que não está em uso.
   */
  async function updateProfile({ name, email }) {
    const session = currentUser();
    if (!session) throw new Error('Sessão expirada.');

    const patch = {};
    if (name !== undefined) {
      const clean = (name || '').trim();
      if (!clean) throw new Error('Informe seu nome.');
      patch.name = clean;
    }
    if (email !== undefined) {
      const clean = (email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
        throw new Error('E-mail inválido.');
      if (clean !== session.email) {
        const used = await findUserByEmail(clean);
        if (used && used.id !== session.userId) {
          throw new Error('Este e-mail já está em uso.');
        }
        patch.email = clean;
      }
    }

    if (Object.keys(patch).length === 0) return session;

    await window.Api.patch(COLLECTIONS.USERS, session.userId, patch);
    const updated = {
      ...session,
      name: patch.name ?? session.name,
      email: patch.email ?? session.email,
    };
    setSession(updated);
    return updated;
  }

  /**
   * Troca a senha, exigindo a senha atual.
   */
  async function changePassword({ currentPassword, newPassword }) {
    const session = currentUser();
    if (!session) throw new Error('Sessão expirada.');
    if (!newPassword || newPassword.length < 6)
      throw new Error('A nova senha deve ter ao menos 6 caracteres.');

    // Confirma a senha atual lendo o documento do usuário
    const doc = await window.Api.get(COLLECTIONS.USERS, session.userId);
    const currentHash = await sha256(currentPassword || '');
    if (!doc || doc.data.passwordHash !== currentHash)
      throw new Error('Senha atual incorreta.');

    const newHash = await sha256(newPassword);
    await window.Api.patch(COLLECTIONS.USERS, session.userId, {
      passwordHash: newHash,
    });
  }

  /**
   * Exclui a conta e todas as notas do usuário.
   */
  async function deleteAccount(password) {
    const session = currentUser();
    if (!session) throw new Error('Sessão expirada.');

    const doc = await window.Api.get(COLLECTIONS.USERS, session.userId);
    const hash = await sha256(password || '');
    if (!doc || doc.data.passwordHash !== hash)
      throw new Error('Senha incorreta.');

    // Remove todas as notas do usuário
    const notes = await window.Notes.listMine();
    for (const n of notes) {
      try { await window.Notes.remove(n.id); } catch (_) {}
    }
    // Remove o usuário
    await window.Api.remove(COLLECTIONS.USERS, session.userId);
    clearSession();
  }

  return {
    currentUser,
    isLoggedIn,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
  };
})();
