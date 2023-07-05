const targetLang = document.getElementById('target-lang');

function setTargetLang() {
  const targetLangValue = targetLang.value;
  chrome.storage.sync.set({ targetLang: targetLangValue });
}

async function getTargetLang() {
  // load target lang options
  const res = await fetch(
    'https://viviane-internship-app.s3.kuroco-edge.jp/'
  )
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  targetLang.innerHTML = doc.getElementById('target-lang').innerHTML;
  
  // set target lang to last selected value
  chrome.storage.sync.get('targetLang', function (data) {
    targetLang.value = data.targetLang;
  });
}

window.onload = getTargetLang;

document
  .getElementById('target-lang')
  .addEventListener('change', setTargetLang);
