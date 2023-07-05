const imgTags = document.getElementsByTagName('img');

const translatedImgHandler = async (img) => {
  // toggle annotations
  const existingAnnotations = img.parentNode.getElementsByClassName(
    'annotationsContainer'
  )[0];
  if (existingAnnotations) {
    existingAnnotations.style.display =
      existingAnnotations.style.display === 'none' ? 'block' : 'none';
  }
};

const annotationClickHandler = (annotation) => {
  annotation.style.opacity = annotation.style.opacity === '0' ? '1' : '0';
};

const imgClickHandler = async (img) => {
  // prepare body for request
  const targetLang = await chrome.storage.sync.get('targetLang');
  const binaryImage = await new Promise((resolve) => {
    const reader = new FileReader();
    const imgObj = new Image();
    imgObj.src = img.src;
    imgObj.onload = () => {
      // convert images to jpg for performance and to support svg
      const canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      canvas.width = imgObj.width;
      canvas.height = imgObj.height;
      // fill canvas with white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw image on top of background
      ctx.drawImage(imgObj, 0, 0);

      // convert canvas containing converted image to binary string
      canvas.toBlob((blob) => {
        reader.readAsBinaryString(blob);
        reader.onloadend = () => {
          resolve(reader.result);
        };
      }, 'image/jpg');
    };
  });

  // send request
  const res = await fetch(
    `https://viviane-internship-app.s3.kuroco-edge.jp/translate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
      },
      body: JSON.stringify({
        binaryImage: btoa(binaryImage),
        targetLang: targetLang,
      }),
    }
  );

  // parse response
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  // display annotations on top of image
  const annotationsContainer = doc.getElementsByClassName(
    'annotationsContainer'
  )[0];
  const div = document.createElement('div');
  div.style.position = 'relative';
  div.style.width = 'fit-content';
  div.style.height = 'fit-content';
  div.appendChild(img.cloneNode());
  div.appendChild(annotationsContainer);
  img.replaceWith(div);

  // add click handler to translated image to toggle every annotations
  div
    .querySelector('img')
    .addEventListener('click', () => translatedImgHandler(div));
  // add click handler to show/hide each annotation individually
  annotationsContainer.childNodes.forEach((annotation) => {
    annotation.addEventListener('click', () =>
      annotationClickHandler(annotation)
    );
  });
};

for (let img of imgTags) {
  img.addEventListener('click', () => imgClickHandler(img));
}

// remove all annotations when target language is changed
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    if (key === 'targetLang') {
      const annotations = document.querySelectorAll(
       "div:has(> .annotationsContainer)"
      );
      annotations.forEach((annotation) => {
        const img = annotation.querySelector('img');
        annotation.replaceWith(img);
        img.addEventListener('click', () => imgClickHandler(img));
      });
    }
  }
});