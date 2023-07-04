const imgTags = document.getElementsByTagName('img');

const imgClickHandler = async (img) => {
  const targetLang = await chrome.storage.sync.get('targetLang');
  const imageSrc = await fetch(img.src);
  const imageBlob = await imageSrc.blob();
  const binaryImage = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsBinaryString(imageBlob);
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });

  fetch(`https://viviane-internship-app.s3.kuroco-edge.jp/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html',
    },
    body: JSON.stringify({
      binaryImage: btoa(binaryImage),
      targetLang: targetLang,
    }),
  })
    .then((res) => res.text())
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const result = doc.getElementById('result');
      img.parentNode.replaceChild(result, img);
    });
};

for (let img of imgTags) {
  img.addEventListener('click', () => imgClickHandler(img));
}

console.log('Hello from content.js');
