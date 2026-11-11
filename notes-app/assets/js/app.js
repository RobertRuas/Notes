/* ============================================================
 * app.js
 * Ponto de entrada: inicializa o roteador e vincula eventos
 * globais (botão sair da navbar).
 * ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Aplica o tema salvo antes de qualquer renderização
    window.Theme.init();

    // Botão de alternar tema (presente na navbar)
    const btnTheme = document.getElementById('btnTheme');
    if (btnTheme) btnTheme.addEventListener('click', () => window.Theme.toggle());

    // Botão de logout da navbar
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        window.Auth.logout();
        window.Utils.toast('Você saiu da sua conta.', 'info');
        window.location.hash = '#/login';
      });
    }

    // Aviso amigável se a API_KEY não foi injetada em produção
    if (!window.AppConfig.API_KEY) {
      window.Utils.toast(
        'API_KEY não configurada. Veja README para configurar o secret.',
        'warning',
        6000,
      );
    }

    // Inicia o roteador (resolve a rota atual)
    window.Router.start();
  });
})();
