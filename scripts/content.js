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

  const res = await fetch(`https://viviane-internship-app.s3.kuroco-edge.jp/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html',
    },
    body: JSON.stringify({
      binaryImage: btoa(binaryImage),
      targetLang: targetLang,
    }),
  })
  // parse response
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  // display annotations on top of image
  const annotationsContainer = doc.getElementById('annotationsContainer');
  const div = document.createElement('div');
  div.style.position = 'relative';
  div.style.width = 'fit-content';
  div.style.height = 'fit-content';
  div.appendChild(img.cloneNode());
  div.appendChild(annotationsContainer);
  img.replaceWith(div);
};

for (let img of imgTags) {
  img.addEventListener('click', () => imgClickHandler(img));
}

console.log('Hello from content.js');
