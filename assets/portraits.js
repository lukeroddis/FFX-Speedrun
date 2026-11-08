/* Character portraits for the turn-order tiles.
   Drop an image named after the character into assets/portraits/ (tidus.png, yuna.png, valefor.png …)
   and every tile for that character shows it. Characters without an image keep their initials.

   Tiles are marked up as <div class="tile" data-who="tidus"><span>Ti</span></div>.
   Each image is requested once; only the ones that load get a style rule, so nothing re-renders. */
(function () {
  const slug = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
  function loadPortraits(names, base) {
    const sheet = document.head.appendChild(document.createElement("style")).sheet;
    for (const key of new Set(names.map(slug))) {
      const url = `${base}${key}.png`, img = new Image();
      img.onload = () => {
        sheet.insertRule(`.tile[data-who="${key}"] { background-image: url("${url}"); background-size: cover; background-position: center; }`);
        sheet.insertRule(`.tile[data-who="${key}"] > span { display: none; }`);
      };
      img.src = url;
    }
  }
  window.portraitSlug = slug;
  window.loadPortraits = loadPortraits;
})();
