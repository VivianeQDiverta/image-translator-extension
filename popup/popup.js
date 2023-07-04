function setTargetLang() {
  const targetLang = document.getElementById('target-lang').value;
  chrome.storage.sync.set({ targetLang: targetLang });
}

function getTargetLang() {
  chrome.storage.sync.get('targetLang', function (data) {
    document.getElementById('target-lang').value = data.targetLang;
  });
}

window.onload = getTargetLang;

document
  .getElementById('target-lang')
  .addEventListener('change', setTargetLang);
