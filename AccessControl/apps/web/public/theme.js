// Aplica o tema salvo (ou o do sistema) antes da primeira pintura, sem piscar.
// Arquivo separado (e não <script> inline) para a Content-Security-Policy aceitar só scripts do próprio site.
try {
  var saved = localStorage.getItem('helpus.theme');
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch (e) {}
