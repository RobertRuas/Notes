/* ============================================================
 * config.js
 * Configurações globais da aplicação.
 * Em produção (GitHub Pages), o workflow gera `env.js` com a chave
 * de API extraída do secret `API_KEY`. Em desenvolvimento local,
 * `env.js` pode não existir — nesse caso usamos o fallback abaixo.
 * ============================================================ */

(function () {
  // Chave obtida do env.js (gerado pelo CI) ou fallback para dev.
  const apiKey =
    (window.AppEnv && window.AppEnv.API_KEY) ||
    // Fallback APENAS para desenvolvimento local. NÃO commitar chaves reais.
    '';

  window.AppConfig = {
    // URL base da API windlog (banco de dados REST genérico)
    API_BASE: 'https://api.windlog.org',

    // Chave de API. ATENÇÃO: no modelo atual a chave fica no frontend,
    // acessível a qualquer visitante. Para produção séria, use um
    // backend intermediário.
    API_KEY: apiKey,

    // Nomes das coleções usadas no banco de dados
    COLLECTIONS: {
      USERS: 'notes_app_users',
      NOTES: 'notes_app_notes',
    },

    // Chaves usadas no localStorage
    STORAGE: {
      SESSION: 'notesapp.session',
      THEME: 'notesapp.theme',
    },

    // Limites / defaults
    NOTES_PAGE_SIZE: 200,
  };
})();
