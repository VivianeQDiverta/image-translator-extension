(async () => {
  const handlersSrc = chrome.runtime.getURL('scripts/handlers.js');
  const handlers = await import(handlersSrc);

  const imgTags = document.getElementsByTagName('img');
  for (let img of imgTags) {
    // prevent adding multiple click handlers
    if (!img.hasListener) {
      img.hasListener = true;
      img.addEventListener('click', () => handlers.imgClickHandler(img));
    }
  }
})();
