/* ============================================================
 * app.js
 * Ponto de entrada: inicializa tema/escala, vincula eventos globais
 * da sidebar (tema, logout, nova nota) e dispara o roteador.
 * ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Aplica tema/escala salvos antes de qualquer renderização
    window.Theme.init();
    window.Scale.init();

    // Botões de tema (desktop + mobile)
    const bindTheme = (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => window.Theme.toggle());
    };
    bindTheme('btnTheme');
    bindTheme('btnThemeMobile');

    // Botão "Nova nota" da sidebar
    const btnNew = document.getElementById('sidebarNewNote');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        if (window.location.hash !== '#/notes') window.location.hash = '#/notes';
        setTimeout(() => {
          const btn = document.getElementById('btnNewNote');
          if (btn) btn.click();
        }, 50);
      });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        window.Auth.logout();
        window.Utils.toast('Você saiu da sua conta.', 'info');
        window.location.hash = '#/login';
      });
    }

    // Fecha o offcanvas da sidebar ao clicar num link dela (mobile)
    document.querySelectorAll('[data-close-sidebar]').forEach((el) => {
      el.addEventListener('click', () => {
        const side = document.getElementById('sidebar');
        const oc = bootstrap.Offcanvas.getInstance(side);
        if (oc) oc.hide();
      });
    });

    // Aviso se API_KEY não foi injetada
    if (!window.AppConfig.API_KEY) {
      window.Utils.toast(
        'API_KEY não configurada. Veja README para configurar o secret.',
        'warning', 6000,
      );
    }

    // Inicia o roteador
    window.Router.start();
  });
})();
