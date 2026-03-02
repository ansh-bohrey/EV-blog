/* Collapsible sidebar toggles for MkDocs Material theme
 * Creates fixed toggle buttons at each sidebar's inner edge.
 * State is persisted in localStorage across page loads.
 */
(function () {
  'use strict';

  // Material theme shows both sidebars only above this width
  var DESKTOP_PX = 1220;

  function init() {
    var body  = document.body;
    var navEl = document.querySelector('.md-sidebar--primary');
    var tocEl = document.querySelector('.md-sidebar--secondary');

    // Bail out if sidebars are not present on this page
    if (!navEl || !tocEl) return;

    /* ── Create toggle buttons ──────────────────────────────── */

    var navBtn = makeButton('Toggle navigation sidebar');
    var tocBtn = makeButton('Toggle table of contents');
    body.appendChild(navBtn);
    body.appendChild(tocBtn);

    /* ── Restore persisted state (no transition yet) ────────── */

    var navCollapsed = localStorage.getItem('sb-nav') === '1';
    // TOC defaults to collapsed on first visit; user can open it with the toggle.
    var tocCollapsed = localStorage.getItem('sb-toc') !== '0';

    if (navCollapsed) body.classList.add('nav-collapsed');
    if (tocCollapsed) body.classList.add('toc-collapsed');

    updateIcons();
    positionButtons();

    // Reveal buttons only after they are correctly positioned
    navBtn.style.visibility = '';
    tocBtn.style.visibility = '';

    // Enable CSS transitions after the initial paint so the restore
    // from localStorage doesn't animate on page load.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        body.classList.add('transitions-ready');
      });
    });

    /* ── Click handlers ─────────────────────────────────────── */

    navBtn.addEventListener('click', function () {
      navCollapsed = !navCollapsed;
      body.classList.toggle('nav-collapsed', navCollapsed);
      localStorage.setItem('sb-nav', navCollapsed ? '1' : '0');
      updateIcons();
      // Reposition after the 200 ms CSS width transition completes
      setTimeout(positionButtons, 220);
    });

    tocBtn.addEventListener('click', function () {
      tocCollapsed = !tocCollapsed;
      body.classList.toggle('toc-collapsed', tocCollapsed);
      localStorage.setItem('sb-toc', tocCollapsed ? '1' : '0');
      updateIcons();
      setTimeout(positionButtons, 220);
    });

    /* ── Reposition on window resize ────────────────────────── */

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(positionButtons, 80);
    });

    /* ── Helpers ────────────────────────────────────────────── */

    function positionButtons() {
      if (window.innerWidth < DESKTOP_PX) {
        navBtn.style.display = 'none';
        tocBtn.style.display = 'none';
        return;
      }
      navBtn.style.display = '';
      tocBtn.style.display = '';

      var navRect = navEl.getBoundingClientRect();
      var tocRect = tocEl.getBoundingClientRect();
      var btnW    = navBtn.offsetWidth; // both buttons are the same width

      // Centre each button on the sidebar's inner (content-facing) edge
      navBtn.style.left = (navRect.right - btnW / 2) + 'px';
      tocBtn.style.left = (tocRect.left  - btnW / 2) + 'px';
    }

    function updateIcons() {
      // Arrow direction: points inward when open (click to close),
      // points outward when closed (click to open).
      navBtn.textContent = navCollapsed ? '›' : '‹';
      tocBtn.textContent = tocCollapsed ? '‹' : '›';
    }
  }

  function makeButton(label) {
    var btn = document.createElement('button');
    btn.className = 'sidebar-toggle';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.style.visibility = 'hidden'; // hidden until positioned
    return btn;
  }

  /* ── Boot ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
