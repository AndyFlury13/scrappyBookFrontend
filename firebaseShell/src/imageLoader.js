import { getDownloadURL, ref } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

let LOCKED = false;
export const ON_CONTAINER = {
    clientPicturedWith: false,
    clientTakerSubject: false,
    time: false,
    donut: false,
};
export const IMG_CHANGE_CONTAINER = {
    clientPicturedWith: true,
    clientTakerSubject: true,
    time: true,
    donut: true,
};
export const DISPLAYED_TARGETS = {
    clientPicturedWith: '',
    clientTakerSubject: '',
    time: '',
    donut: '',
    totalPW: '',
    totalTS: '',
};
export const PROMISES = {
    clientPicturedWith: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.clientPicturedWith);
    }),
    clientTakerSubject: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.clientTakerSubject);
    }),
    time: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.time);
    }),
    donut: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.donut);
    }),
};
const loadImage = (photoDivName, imgID, projectPath, storage) => new Promise((resolve, reject) => {
    const imageRef = ref(storage, `photos/${projectPath}/${imgID}.jpg`)
    getDownloadURL(imageRef).then((url) => {
        $(`<img class='displayedPhoto' id='${imgID}' src='${url}'/>`).prependTo(`#${photoDivName}Photos`);
        $(`#${imgID}`).on('load', () => {
            $(`#${imgID}`).animate({
                opacity: 1,
            }, 400, () => {
                resolve(null);
            });
        });
    });
});
const removeImage = (pictureToRemoveID, timeToDisappear) => new Promise((resolve) => {
    LOCKED = true;
    $(`#${pictureToRemoveID}`).animate({
        opacity: 0,
    }, timeToDisappear, () => {
        $(`#${pictureToRemoveID}`).remove();
        resolve(null);
    });
});
export const slideshow = (photoDivName, imgIDs, slideshowOnContainer, imgChangeContainer, projectPath, storage) => new Promise((resolve) => {
    let imgIDsI = 0;
    let timer = 0;
    const imageDisplayLength = 350;
    let displayedImgID = imgIDs[imgIDsI];
    loadImage(photoDivName, displayedImgID, projectPath, storage);
    const imgCycler = setInterval(() => {
        let slideshowOn = slideshowOnContainer[photoDivName];
        if (!slideshowOn) {
            if (!LOCKED) {
                clearInterval(imgCycler);
                removeImage(displayedImgID, 200).then(() => {
                    LOCKED = false;
                    if (!imgChangeContainer[photoDivName]) {
                        $(`.explanation-${photoDivName}`).fadeIn();
                    }
                    resolve(imgChangeContainer[photoDivName]);
                });
            }
        }
        else if (timer > imageDisplayLength) {
            timer = 0;
            imgIDsI += 1;
            if (imgIDsI === imgIDs.length) {
                imgIDsI = 0;
            }
            removeImage(displayedImgID, 200).then(() => {
                displayedImgID = imgIDs[imgIDsI];
                slideshowOn = slideshowOnContainer[photoDivName];
                if (slideshowOn) {
                    loadImage(photoDivName, displayedImgID, projectPath, storage).then(() => {
                        LOCKED = false;
                    });
                }
            });
        }
        timer += 1;
    }, 10);
});
