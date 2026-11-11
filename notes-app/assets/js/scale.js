/* ============================================================
 * scale.js
 * Escala global da UI. Controla a `font-size` base do <html>,
 * fazendo todo o layout (que usa rem) escalar proporcionalmente.
 * Opções: 0.875, 1, 1.125, 1.25 (equivalente a S/M/L/XL).
 * ============================================================ */

window.Scale = (() => {
  const KEY = 'notesapp.scale';
  const BASE_PX = 16; // 1rem = 16px
  const OPTIONS = [
    { value: 0.875, label: 'Pequeno' },
    { value: 1.0,   label: 'Padrão' },
    { value: 1.125, label: 'Grande' },
    { value: 1.25,  label: 'Enorme' },
  ];

  function current() {
    const saved = parseFloat(localStorage.getItem(KEY) || '1');
    return isNaN(saved) ? 1 : saved;
  }

  function apply(factor) {
    document.documentElement.style.fontSize = (BASE_PX * factor) + 'px';
  }

  function set(factor) {
    localStorage.setItem(KEY, String(factor));
    apply(factor);
  }

  function init() { apply(current()); }

  return { init, current, set, OPTIONS };
})();
