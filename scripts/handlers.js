const toggleAnnotations = (annotationsContainer) => {
  annotationsContainer.style.display =
    annotationsContainer.style.display === 'none' ? 'block' : 'none';
};

const annotationClickHandler = (annotation) => {
  annotation.style.opacity = annotation.style.opacity === '0' ? '1' : '0';
};

const toggleErrorMessage = (errorMessage, img) => {
  errorMessage.style.opacity = errorMessage.style.opacity === '0' ? '1' : '0';
  img.style.filter = img.style.filter === 'none' ? 'blur(3px)' : 'none';
};

const generateLoading = () => {
  // Loading text
  const content = document.createElement('p');
  content.innerText = 'Loading...';
  content.style.display = 'table-cell';
  content.style.verticalAlign = 'middle';
  content.style.textAlign = 'center';
  // Loading background
  const loading = document.createElement('div');
  loading.style.display = 'table';
  loading.style.width = '100%';
  loading.style.height = '100%';
  loading.style.top = '0';
  loading.style.left = '0';
  loading.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
  loading.style.color = 'white';
  loading.style.position = 'absolute';
  loading.appendChild(content);
  loading.className = 'loading';
  return loading;
};

const imgClickHandler = async (originalImg) => {
  // need image ratio to calculate annotations position
  const heightRatio = originalImg.height / originalImg.naturalHeight;
  const widthRatio = originalImg.width / originalImg.naturalWidth;

  // prepare image container
  const imageContainer = document.createElement('div');
  imageContainer.style.position = 'relative';
  imageContainer.style.width = 'fit-content';
  imageContainer.style.height = 'fit-content';
  originalImg.style.filter = 'blur(3px)'; // blur the image during loading
  imageContainer.appendChild(originalImg.cloneNode());

  // add loading text
  const loadingDiv = generateLoading();
  imageContainer.appendChild(loadingDiv);

  // replace image with image container
  originalImg.replaceWith(imageContainer);

  // prepare body for request
  const targetLang = await chrome.storage.sync.get('targetLang');
  const binaryImage = await new Promise((resolve) => {
    const reader = new FileReader();
    const imgObj = new Image();
    imgObj.src = originalImg.src;
    imgObj.onload = () => {
      // convert images to jpg for performance and to support svg
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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

  const annotationsContainer = doc.getElementsByClassName(
    'annotationsContainer'
  )[0];
  const img = imageContainer.querySelector('img');
  if (annotationsContainer) {
    // remove loading text and image blur
    loadingDiv.remove();
    img.style.filter = 'none';

    // display annotations on top of image
    imageContainer.appendChild(annotationsContainer);

    // add click handler to translated image to toggle every annotations
    img.addEventListener('click', () =>
      toggleAnnotations(annotationsContainer)
    );
    // add click handler to show/hide each annotation individually
    annotationsContainer.childNodes.forEach((annotation) => {
      // adjust position of annotations depending on image ratio
      annotation.style.top = `${annotation.offsetTop * heightRatio}px`;
      annotation.style.left = `${annotation.offsetLeft * widthRatio}px`;
      annotation.addEventListener('click', () =>
        annotationClickHandler(annotation)
      );
    });
  } else {
    // display error message
    const message = doc.getElementById('result').innerText;
    loadingDiv.firstChild.innerText = message;
    loadingDiv.addEventListener('click', () =>
      toggleErrorMessage(loadingDiv, img)
    );
  }
};

const resetPage = () => {
  // remove all annotations
  const annotations = document.querySelectorAll(
    'div:has(> .annotationsContainer)'
  );
  annotations.forEach((annotation) => {
    const img = annotation.querySelector('img');
    annotation.replaceWith(img);
  });

  // remove all loading divs
  document.querySelectorAll('.loading').forEach((div) => {
    div.remove();
  });

  // remove all event listeners by cloning and replacing all images
  const imgTags = document.getElementsByTagName('img');
  for (let img of imgTags) {
    img.replaceWith(img.cloneNode());
  }
};

const registerClickHandlers = () => {
  console.log('registering click handlers');
  const imgTags = document.getElementsByTagName('img');
  for (let img of imgTags) {
    img.addEventListener('click', () => imgClickHandler(img));
  }
};

// remove all annotations when target language is changed
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    if (key === 'targetLang') {
      resetPage();
      registerClickHandlers();
    } else if (key === 'enabled') {
      console.log(changes[key].newValue);
      if (changes[key].newValue) {
        registerClickHandlers();
      } else {
        resetPage();
      }
    }
  }
});

export { imgClickHandler, registerClickHandlers };
