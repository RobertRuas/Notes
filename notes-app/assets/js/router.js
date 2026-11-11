/* ============================================================
 * router.js
 * Roteador simples baseado em `location.hash`.
 * Rotas suportadas:
 *   #/login     -> tela de login (pública)
 *   #/register  -> tela de cadastro (pública)
 *   #/notes     -> lista de notas (privada)
 * ============================================================ */

window.Router = (() => {
  const routes = {
    '#/login': { render: () => window.UI.renderLogin(), public: true },
    '#/register': { render: () => window.UI.renderRegister(), public: true },
    '#/notes': { render: () => window.UI.renderNotes(), public: false },
    '#/profile': { render: () => window.UI.renderProfile(), public: false },
    '#/settings': { render: () => window.UI.renderSettings(), public: false },
  };

  function resolve() {
    const hash = window.location.hash || '';
    const route = routes[hash];
    const loggedIn = window.Auth.isLoggedIn();

    // Sem rota válida: redireciona para o destino padrão
    if (!route) {
      window.location.hash = loggedIn ? '#/notes' : '#/login';
      return;
    }

    // Rota privada sem sessão
    if (!route.public && !loggedIn) {
      window.location.hash = '#/login';
      return;
    }

    // Rota pública com sessão ativa — manda pra lista.
    // Isso garante que, se o usuário já estiver logado e cair em
    // #/login (recarregou a página), ele volte direto para suas notas.
    if (route.public && loggedIn) {
      window.location.hash = '#/notes';
      return;
    }

    route.render();
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { start, resolve };
})();
