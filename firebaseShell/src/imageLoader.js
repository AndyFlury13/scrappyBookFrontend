import { getDownloadURL, ref } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

export let SECTION_IN_VIEWPORT = "other";

export const updateMidpoints = (sectionYMidpoints) => {
    SECTION_Y_MIDPOINTS = sectionYMidpoints;
}
let SECTION_Y_MIDPOINTS = {
        clientPicturedWith: {top:0, bottom:0},
        clientTakerSubject: {top:0, bottom:0},
        time: {top:0, bottom:0},
        donut: {top:0, bottom:0}
};
const viewPortMidpoint = () => {
    return (-1 * $('.overallStatsSection').offset().top) + 1
};

const setSectionMaps = () => {
    SECTION_IN_VIEWPORT = "";
    const midpoint = viewPortMidpoint();
    console.log(midpoint);
    console.log(SECTION_Y_MIDPOINTS);
    if (midpoint < SECTION_Y_MIDPOINTS['clientPicturedWith'].bottom 
            && midpoint > SECTION_Y_MIDPOINTS['clientPicturedWith'].top) {
        SECTION_IN_VIEWPORT = 'clientPicturedWith';
    } else if (midpoint < SECTION_Y_MIDPOINTS['clientTakerSubject'].bottom 
                && midpoint > SECTION_Y_MIDPOINTS['clientTakerSubject'].top) {
        SECTION_IN_VIEWPORT = 'clientTakerSubject';
    } else if (midpoint < SECTION_Y_MIDPOINTS['time'].bottom 
                && midpoint > SECTION_Y_MIDPOINTS['time'].top) {
        SECTION_IN_VIEWPORT = 'time';
    } else if (midpoint < SECTION_Y_MIDPOINTS['donut'].bottom 
                && midpoint > SECTION_Y_MIDPOINTS['donut'].top) {
        SECTION_IN_VIEWPORT = 'donut';
    } else  {
        SECTION_IN_VIEWPORT = 'other';
    }
};

$(document).ready(() => {
    $(".scroller").on("scroll", () => {
        setSectionMaps()
    });
});

// Flip on click
export const SECTION_TO_SLIDESHOW_IS_ACTIVE = {
    clientPicturedWith: false,
    clientTakerSubject: false,
    time: false,
    donut: false,
};

// Set on click
export const SECTION_TO_SLIDESHOW_LENGTH = {
    clientPicturedWith: 0,
    clientTakerSubject: 0,
    time: 0,
    donut: 0,
};

// Set to 0 or randomize on diff section click
export const SECTION_TO_SLIDESHOW_INDEX = {
    clientPicturedWith: 0,
    clientTakerSubject: 0,
    time: 0,
    donut: 0,
};

// set on click
export const SECTION_TO_IMG_IDS = {
    clientPicturedWith: [],
    clientTakerSubject: [],
    time: [],
    donut: [],
};

export const DISPLAYED_TARGETS = {
    clientPicturedWith: '',
    clientTakerSubject: '',
    time: '',
    donut: '',
    totalPW: '',
    totalTS: '',
};

let PROJECT_PATH;
let STORAGE;

export const loadImage = (photoDivName, imgID, projectPath, storage) => {
    console.log(photoDivName);
    PROJECT_PATH = projectPath;
    STORAGE = storage;
    const imageRef = ref(storage, `photos/${projectPath}/${imgID}.jpg`);
    getDownloadURL(imageRef).then((url) => {
        $(`#${photoDivName}DisplayedPhoto`).attr('src', url);
        console.log($(`#${photoDivName}DisplayedPhoto`)[0]);
        $(`#${photoDivName}DisplayedPhoto`).on('load', () => {
            console.log('test');
            $(`#${photoDivName}DisplayedPhoto`).animate({
                opacity: 1,
            }, 300);
        });
    });
};

export const removeImage = (pictureToRemoveId, timeToDisappear) => new Promise((resolve) => {
    const pictureToRemove = $(`#${pictureToRemoveId}`);
    if (pictureToRemove.length === 0) {
        resolve(null);
    }
    $(`#${pictureToRemoveId}`).animate({
        opacity: 0,
    }, timeToDisappear, () => {
        $(`#${pictureToRemoveId}`).attr('src', '');
        resolve(null);
    });
});

const mod = (n, m)  => {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};

const imageChanger = (e) => {
    if (e.key === "ArrowRight" || e.key == "ArrowLeft") {
        const sectionIsActive = SECTION_TO_SLIDESHOW_IS_ACTIVE[SECTION_IN_VIEWPORT];
        if (sectionIsActive) {
            const slideshowIndex = SECTION_TO_SLIDESHOW_INDEX[SECTION_IN_VIEWPORT];
            const slideshowLength = SECTION_TO_SLIDESHOW_LENGTH[SECTION_IN_VIEWPORT];
            const imgIds = SECTION_TO_IMG_IDS[SECTION_IN_VIEWPORT];
            const increment = e.key === "ArrowRight" 
                                ? 1
                                : -1;
            const nextSlideShowIndex = mod(slideshowIndex + increment, slideshowLength);
            SECTION_TO_SLIDESHOW_INDEX[SECTION_IN_VIEWPORT] = nextSlideShowIndex;
            const imgToDisplayID = imgIds[nextSlideShowIndex];
            logIfNullImageId(imgToDisplayID, nextSlideShowIndex, imgIds);
            removeImage(`${SECTION_IN_VIEWPORT}DisplayedPhoto`, 200).then(() => {
                loadImage(SECTION_IN_VIEWPORT, imgToDisplayID, PROJECT_PATH, STORAGE);
                $(`.${SECTION_IN_VIEWPORT}SlideshowCounter`).html(`${nextSlideShowIndex+1} / ${imgIds.length}`);
            });
            console.log(SECTION_IN_VIEWPORT);
            $(`.${SECTION_IN_VIEWPORT}SlideshowCounter`).html(`${nextSlideShowIndex+1} / ${imgIds.length}`);
            $(`.${SECTION_IN_VIEWPORT}SlideshowCounter`).fadeIn();
        }
    }
}

document.onkeydown = imageChanger;

export const logIfNullImageId = (imgId, imgIdIndex, imgIds) => {
    if (typeof imgId === 'undefined') {
        console.log('Null img id');
        console.log(`Img index: ${imgIdIndex}`);
        console.log(`Img ids:`);
        console.log(imgIds);
    }
}