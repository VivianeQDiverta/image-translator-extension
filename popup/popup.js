const targetLang = document.getElementById('target-lang');
const toggle = document.getElementById('toggle');

function setTargetLang() {
  const targetLangValue = targetLang.value;
  chrome.storage.sync.set({ targetLang: targetLangValue });
}

function setToggle() {
  const enabled = toggle.textContent === 'Enable';
  toggle.textContent = enabled ? 'Disable' : 'Enable';
  chrome.storage.sync.set({ enabled: enabled });
}

async function getStorageValues() {
  // load target lang options
  const res = await fetch('https://viviane-internship-app.s3.kuroco-edge.jp/');
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  targetLang.innerHTML = doc.getElementById('target-lang').innerHTML;

  // set target lang to last selected value
  chrome.storage.sync.get('targetLang', function (data) {
    targetLang.value = data.targetLang;
  });

  chrome.storage.sync.get('enabled', (data) => {
    toggle.textContent = data.enabled ? 'Disable' : 'Enable';
  });
}

window.onload = getStorageValues;
targetLang.addEventListener('change', setTargetLang);
toggle.addEventListener('click', setToggle);
