// Apply saved/system theme before first paint (avoids a light flash in dark mode).
// Kept as an external file so the Content Security Policy can forbid inline scripts.
try {
  var t = localStorage.getItem('fb_theme');
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
} catch (e) {}
