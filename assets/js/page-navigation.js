(function () {
  'use strict';
  if (!window.fetch || !window.AbortController || !window.history.pushState) return;
  if (!['/', '/publications/'].includes(location.pathname)) return;

  var article = document.querySelector('#main > .page');
  if (!article) return;
  var cache = new Map();
  var currentPath = location.pathname;
  var pending;
  var scrollTimer;
  var navigating = false;
  var metadata = 'link[rel="canonical"], meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]';
  history.scrollRestoration = 'manual';

  function snapshot(doc) {
    var content = doc.querySelector('#main > .page');
    if (!content) throw new Error('Missing page content');
    return {
      article: content.cloneNode(true),
      title: doc.title,
      meta: Array.from(doc.head.querySelectorAll(metadata), function (node) { return node.cloneNode(true); })
    };
  }

  function saveScroll() {
    clearTimeout(scrollTimer);
    if (navigating) return;
    history.replaceState(Object.assign({}, history.state, {
      pageNavigation: true, x: window.scrollX, y: window.scrollY
    }), '', location.href);
  }

  saveScroll();
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(saveScroll, 100);
  }, { passive: true });

  async function navigate(url, restore) {
    if (pending) pending.abort();
    var controller = new AbortController();
    pending = controller;
    cache.set(currentPath, snapshot(document));
    navigating = true;
    article.classList.add('is-navigating');
    article.setAttribute('aria-busy', 'true');
    var progress = document.createElement('div');
    progress.className = 'page-navigation-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    var timeout = setTimeout(function () { controller.abort(); }, 10000);

    try {
      var page = cache.get(url.pathname);
      if (!page) {
        var response = await fetch(url.href, { signal: controller.signal });
        if (!response.ok || new URL(response.url).pathname !== url.pathname) throw new Error('Navigation failed');
        var html = await response.text();
        page = snapshot(new DOMParser().parseFromString(html, 'text/html'));
      }
      if (pending !== controller) return;
      // Never restore a transient loading state from a previous snapshot.
      var next = page.article.cloneNode(true);
      next.classList.remove('is-navigating');
      next.removeAttribute('aria-busy');
      article.replaceWith(next);
      article = next;
      document.title = page.title;
      document.head.querySelectorAll(metadata).forEach(function (node) { node.remove(); });
      page.meta.forEach(function (node) { document.head.appendChild(node.cloneNode(true)); });
      currentPath = url.pathname;
      if (!restore) history.pushState({ pageNavigation: true, x: 0, y: 0 }, '', url.href);

      var heading = article.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      if (restore) {
        window.scrollTo(restore.x || 0, restore.y || 0);
      } else if (url.hash) {
        var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (target) target.scrollIntoView();
        else window.scrollTo(0, 0);
      } else {
        window.scrollTo(0, 0);
      }
      if (article.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        article.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180 });
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', { page_location: location.href, page_title: document.title });
      }
    } catch (error) {
      // A failed fetch or timeout still leaves an ordinary, working page link.
      if (pending === controller) location.assign(url.href);
    } finally {
      clearTimeout(timeout);
      progress.remove();
      if (pending === controller) {
        pending = null;
        article.classList.remove('is-navigating');
        article.removeAttribute('aria-busy');
        navigating = false;
        saveScroll();
      }
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.search || url.pathname === currentPath) return;
    if (!['/', '/publications/'].includes(currentPath) || !['/', '/publications/'].includes(url.pathname)) return;
    event.preventDefault();
    saveScroll();
    navigate(url);
  });

  window.addEventListener('popstate', function (event) {
    if (location.pathname === currentPath && !pending) {
      if (event.state && event.state.pageNavigation) window.scrollTo(event.state.x || 0, event.state.y || 0);
      return;
    }
    if (!['/', '/publications/'].includes(location.pathname)) {
      location.reload();
      return;
    }
    navigate(new URL(location.href), event.state || { x: 0, y: 0 });
  });
}());
