import { DISPLAYED_TARGETS, logIfNullImageId } from "./imageLoader.js";
import { 
    removeImage, 
    loadImage, 
    SECTION_TO_SLIDESHOW_IS_ACTIVE,
    SECTION_TO_SLIDESHOW_LENGTH, 
    SECTION_TO_SLIDESHOW_INDEX, 
    SECTION_TO_IMG_IDS 
} from "./imageLoader.js";
import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { Rainbow } from "./gradienter.js";

const MONTHS = [
    { name: '2021_August', color: '' },
    { name: '2021_September', color: '' },
    { name: '2021_October', color: '' },
    { name: '2021_November', color: '' },
    { name: '2021_December', color: '' },
    { name: '2022_January', color: '' },
    { name: '2022_February', color: '' },
    { name: '2022_March', color: '' },
    { name: '2022_April', color: '' },
    { name: '2022_May', color: '' },
    { name: '2022_June', color: '' },
    { name: '2022_July', color: '' },
    { name: '2022_August', color: '' },
    { name: '2022_September', color: '' },
    { name: '2022_October', color: ''},
    { name: '2022_November', color: '' }
];

const DAYS = [
    {name: 'feb10', color:''},
    {name: 'feb11', color:''},
    {name: 'feb12', color:''},
    {name: 'feb13', color:''},
    {name: 'feb14', color:''},
    {name: 'feb15', color:''},
    {name: 'feb16', color:''},
    {name: 'feb17', color:''},
    {name: 'feb18', color:''},
    {name: 'feb19', color:''},
]

var CLICKED_TIME_ELEMENT;


const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const shortenedDays = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19']

let CURRENT_SUBJECT_OR_TAKER = 'photoTaker';
$('.slide-in-out-photoTaker').toggleClass('slide');
const timeGraphWidth = 550;
const timeGraphHeight = 380;
const timeGraphMargin = {
    top: 10, right: 10, bottom: 70, left: 100,
};


// append the svg object to the body of the page
const timeGraphSVG = d3.select('#timeGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', timeGraphHeight + timeGraphMargin.top + timeGraphMargin.bottom)
    .attr('width', timeGraphWidth + timeGraphMargin.left + timeGraphMargin.left)
    .append('g')
    .attr('transform', `translate(${timeGraphMargin.left},${timeGraphMargin.top})`);
const timeGraphX = d3.scaleBand()
    .range([0, timeGraphWidth])
    .padding(0.2);
const timeGraphXAxis = timeGraphSVG.append('g')
    .attr('class', 'timeGraphXAxis')
    .attr('transform', `translate(0,${timeGraphHeight})`);
const timeGraphY = d3.scaleLinear()
    .range([timeGraphHeight, 0]);
const timeGraphYAxis = timeGraphSVG.append('g')
    .attr('class', 'timeGraphYAxis');

const highlightRectangles = (className, oldCategory, newCategory) => {
    if (oldCategory === 'none') {
        d3.selectAll(`.${className}`)
            .filter((d) => {
            if (className === 'treeMapRect') {
                return newCategory !== d.data.name;
            }
            return newCategory !== d.time;
        })
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(100%)');
    }
    else if (oldCategory === newCategory) {
        d3.selectAll(`.${className}`)
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(0%)');
    }
    else {
        d3.selectAll(`.${className}`)
            .filter((d) => {
            if (className === 'treeMapRect') {
                return newCategory === d.data.name;
            }
            return newCategory === d.time;
        })
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(0%)');
        d3.selectAll(`.${className}`)
            .filter((d) => {
            if (className === 'treeMapRect') {
                return newCategory !== d.data.name;
            }
            return newCategory !== d.time;
        })
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(100%)');
    }
};

export const getNumberOfIds = (idString) => {
    let numIds = 0;
    const ids = idString.split(",")
    ids.forEach((id) => {
        if (id !== "") {
            numIds += 1;
        }
    });
    return numIds
}

export const drawBarGraph = (clientName, subjectOrTaker, storage, projectPath) => {
    // Reset the visual
    $('.timeSlideshowCounter').fadeOut();
    SECTION_TO_SLIDESHOW_INDEX['time'] = 0;
    if (SECTION_TO_SLIDESHOW_IS_ACTIVE['time']) {
        resetTimeSection(DISPLAYED_TARGETS.time);
    }

    const shortenedTimes = projectPath === 'maui'
        ? shortenedDays
        : shortenedMonths;
    const TIMES = projectPath === 'maui'
        ? DAYS
        : MONTHS;
    const xAxisLabel = projectPath === 'maui'
        ? "Days in February"
        : "Months";
    timeGraphSVG.append("text")
        .attr("transform", "translate(" + (timeGraphWidth/2) + " ," + 430 + ")")
        .style('fill', 'white')
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .text(xAxisLabel);
    timeGraphSVG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(timeGraphHeight/2))
        .attr("y", -45)
        .style('fill', 'white')
        .style("font-size", "20px")
        .style("text-anchor", "middle")
        .text("Pictures");
    var rainbow = new Rainbow();
    rainbow.setNumberRange(0, TIMES.length);
    rainbow.setSpectrum('#ff8600', '#fffe37');
    for (let timeI = 0; timeI < TIMES.length; timeI++) {
        TIMES[timeI].color = rainbow.colourAt(timeI);
    }
    if (subjectOrTaker !== CURRENT_SUBJECT_OR_TAKER) {
        $('.slide-in-out-photoTaker').toggleClass('slide');
        $('.slide-in-out-subject').toggleClass('slide');
        CURRENT_SUBJECT_OR_TAKER = subjectOrTaker;
    }
    const asPTPath = projectPath == 'maui'
        ? 'maui/pictureBySubjectByDay'
        : 'hilledwight/pictureBySubjectByMonth';
    const asPTReference = storageRef(storage, `data/${asPTPath}.csv`);
    getDownloadURL(asPTReference)
        .then((ptUrl) => {
            d3.csv(ptUrl, (phototakerErr, asPhotoTakerData) => {
                if (phototakerErr) {
                    console.error(phototakerErr);
                    return;
                }
                const asSubjectPath = projectPath == 'maui'
                    ? 'maui/pictureOfSubjectByDay'
                    : 'hilledwight/pictureOfSubjectByMonth';
                const asSubjectReference = storageRef(storage, `data/${asSubjectPath}.csv`);
                getDownloadURL(asSubjectReference)
                    .then((subjectUrl) => {
                        d3.csv(subjectUrl, (asSubjectErr, asSubjectData) => {
                            if (asSubjectErr) {
                                console.error(asSubjectErr);
                                return;
                            }
                            const clientData = [];
                            for (let ptDataI = 0; ptDataI < asPhotoTakerData.length; ptDataI += 1) {
                                const ptD = asPhotoTakerData[ptDataI];
                                if (ptD.client === clientName) {
                                    for (let sDataI = 0; sDataI < asSubjectData.length; sDataI += 1) {
                                        const sD = asSubjectData[sDataI];
                                        if (sD.client === clientName) {
                                            for (let timeI = 0; timeI < TIMES.length; timeI += 1) {
                                                clientData.push({
                                                    time: shortenedTimes[timeI],
                                                    photoTaker: ptD[TIMES[timeI].name] ?? '',
                                                    subject: sD[TIMES[timeI].name] ?? '',
                                                    color: '#'+TIMES[timeI].color,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                           
                            // X axis
                            timeGraphX.domain(clientData.map((d) => d.time));
                            timeGraphXAxis.transition().duration(1000).call(d3.axisBottom(timeGraphX))
                                
                            // Add Y axis
                            timeGraphY.domain([0, d3.max(clientData, (d) => {
                                return +(getNumberOfIds(d[subjectOrTaker]));
                            })]);
                            timeGraphYAxis.transition().duration(1000).call(d3.axisLeft(timeGraphY));
                            // variable u: map data to existing bars
                            const u = timeGraphSVG.selectAll('rect')
                                .data(clientData);
                            // We use a list here only so we can reference an object from deeper scope
                            u
                                .enter()
                                .append('rect')
                                .classed('timeRect', true)
                                .style('cursor', 'pointer')
                                .on('click', (d) => {
                                    if (d.time === DISPLAYED_TARGETS.time) { // turn off the visual
                                        resetTimeSection(d.time);
                                        $('.timeSlideshowCounter').fadeOut();
                                    } else {
                                        if (DISPLAYED_TARGETS.time === '') { // turn on the visual
                                            highlightRectangles('timeRect', 'none', d.time);
                                        }
                                        else if (DISPLAYED_TARGETS.time !== d.time) { // Change the visual
                                            highlightRectangles('timeRect', DISPLAYED_TARGETS.time, d.time);
                                        }
                                        CLICKED_TIME_ELEMENT = d;
                                        const imgIds = d[CURRENT_SUBJECT_OR_TAKER]?.split(',')?.slice(0, -1) ?? [];
                                        SECTION_TO_SLIDESHOW_IS_ACTIVE["time"] = true;
                                        SECTION_TO_SLIDESHOW_LENGTH["time"] = imgIds.length;
                                        SECTION_TO_IMG_IDS["time"] = imgIds;
                                        $('.explanation-time').fadeOut('fast');
                                        DISPLAYED_TARGETS.time = d.time;
                                        const imgId = imgIds[0];
                                        logIfNullImageId(imgId, 0, imgIds);
                                        removeImage(`timeDisplayedPhoto`, 200).then(() => {
                                            loadImage("time", imgId, projectPath, storage);
                                        });
                                        $('.timeSlideshowCounter').html(`${1} / ${imgIds.length}`);
                                        $('.timeSlideshowCounter').fadeIn();
                                    }
                                    SECTION_TO_SLIDESHOW_INDEX['time'] = 0;
                                })
                                .merge(u)
                                .transition()
                                .duration(1000)
                                .attr('x', (d) => timeGraphX(d.time))
                                .attr('y', (d) => timeGraphY(getNumberOfIds(d[subjectOrTaker])))
                                .attr('width', timeGraphX.bandwidth())
                                .attr('height', (d) => timeGraphHeight - timeGraphY(getNumberOfIds(d[subjectOrTaker])))
                                .attr('fill', (d) => d.color);
                        });
                    })
            });
        })
};

const resetTimeSection = (elementTime) => {
    SECTION_TO_SLIDESHOW_IS_ACTIVE["time"] = false;
    DISPLAYED_TARGETS.time = '';
    highlightRectangles('timeRect', elementTime, elementTime);
    removeImage('timeDisplayedPhoto', 200).then(() => {
        $('.explanation-time').fadeIn('fast');
    });
}