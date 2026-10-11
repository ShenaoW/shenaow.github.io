(function () {
  var link = document.getElementById('publication-toggle');
  var selected = document.getElementById('selected-publications');
  var full = document.getElementById('full-publications');
  var heading = document.getElementById('publication-heading');
  if (!link || !selected || !full || !heading) return;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = link.className;
  button.textContent = link.textContent;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'full-publications');
  link.parentNode.replaceChild(button, link);

  button.addEventListener('click', function () {
    var showFull = full.hidden;
    selected.hidden = showFull;
    full.hidden = !showFull;
    heading.textContent = showFull ? 'All Publications' : 'Selected Publications';
    button.textContent = showFull ? '← Selected Publications' : 'Full List →';
    button.setAttribute('aria-expanded', String(showFull));
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = showFull ? full : selected;
    if (visible.animate && !reducedMotion) {
      visible.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
    heading.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  });
}());
