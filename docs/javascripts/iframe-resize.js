/* Auto-resize iframes to fit their content height.
 * Eliminates vertical scrollbars inside iframe containers.
 * Horizontal overflow is left to the browser (scrolls only if content is wider than viewport).
 */
(function () {
  'use strict';

  function resizeIframe(iframe) {
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      var body = doc.body;
      var html = doc.documentElement;
      var height = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.scrollHeight, html.offsetHeight
      );
      if (height > 0) {
        iframe.style.height = height + 'px';
      }
    } catch (e) {
      // Cross-origin iframe — nothing we can do from here.
    }
  }

  function attachToIframe(iframe) {
    // Remove fixed height attribute so our JS value takes over.
    iframe.removeAttribute('height');
    iframe.style.width = '100%';

    iframe.addEventListener('load', function () {
      // First pass — catches static content immediately.
      resizeIframe(iframe);
      // Second pass — catches content rendered by JS (Chart.js, Plotly, etc.)
      // after scripts in the iframe have had time to run.
      setTimeout(function () { resizeIframe(iframe); }, 600);
    });
  }

  function init() {
    document.querySelectorAll('iframe').forEach(attachToIframe);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
