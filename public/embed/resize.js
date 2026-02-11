/**
 * Prismo Embed Auto-Resize Script
 *
 * Include this script on any page that embeds a Prismo event iframe
 * to automatically resize the iframe to fit its content.
 *
 * Usage:
 *   <script src="https://prismo.live/embed/resize.js"></script>
 */
(function () {
 "use strict";

 window.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "prismo-embed-resize") return;

  var iframes = document.querySelectorAll("iframe");
  for (var i = 0; i < iframes.length; i++) {
   if (iframes[i].contentWindow === e.source) {
    iframes[i].style.height = e.data.height + "px";
    break;
   }
  }
 });
})();
