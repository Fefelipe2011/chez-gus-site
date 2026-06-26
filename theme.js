// Bascule mode clair / sombre. Le thème appliqué est mémorisé dans le navigateur.
(function () {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  function syncPressed() {
    btn.setAttribute('aria-pressed', document.documentElement.classList.contains('dark') ? 'true' : 'false');
  }
  syncPressed();

  btn.addEventListener('click', function () {
    var dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    syncPressed();
  });
})();
