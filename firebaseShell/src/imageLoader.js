let LOCKED = false;
export const ON_CONTAINER = {
    clientPicturedWith: false,
    clientTakerSubject: false,
    month: false,
    treeMap: false,
};
export const IMG_CHANGE_CONTAINER = {
    clientPicturedWith: true,
    clientTakerSubject: true,
    month: true,
    treeMap: true,
};
export const DISPLAYED_TARGETS = {
    clientPicturedWith: '',
    clientTakerSubject: '',
    month: '',
    treeMap: '',
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
    month: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.month);
    }),
    treeMap: new Promise((resolve) => {
        resolve(IMG_CHANGE_CONTAINER.treeMap);
    }),
};
const loadImage = (photoDivName, imgID) => new Promise((resolve, reject) => {
    gapi.client.photoslibrary.mediaItems.get({
        mediaItemId: imgID,
    }).then((response) => {
        $(`<img class='displayedPhoto' id='${response.result.id}' src='${response.result.baseUrl}'/>`).prependTo(`#${photoDivName}Photos`);
        $(`#${response.result.id}`).on('load', () => {
            $(`#${response.result.id}`).animate({
                opacity: 1,
            }, 400, () => {
                resolve(null);
            });
        });
    }, (err) => {
        console.log(imgID);
        reject(err);
        resolve(null);
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
export const slideshow = (photoDivName, imgIDs, slideshowOnContainer, imgChangeContainer) => new Promise((resolve) => {
    let imgIDsI = 0;
    let timer = 0;
    const imageDisplayLength = 350;
    let displayedImgID = imgIDs[imgIDsI];
    loadImage(photoDivName, displayedImgID);
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
                    loadImage(photoDivName, displayedImgID).then(() => {
                        LOCKED = false;
                    });
                }
            });
        }
        timer += 1;
    }, 10);
});
