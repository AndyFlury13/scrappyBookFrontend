import { slideshow } from "./imageLoader.js";
import { ON_CONTAINER } from "./imageLoader.js";
import { IMG_CHANGE_CONTAINER } from "./imageLoader.js";
import { DISPLAYED_TARGETS } from "./imageLoader.js";
import { PROMISES } from "./imageLoader.js";
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

var rainbow = new Rainbow();
rainbow.setNumberRange(0, MONTHS.length);
rainbow.setSpectrum('#ff8600', '#fffe37');

for (let monthI = 0; monthI < MONTHS.length; monthI++) {
    MONTHS[monthI].color += rainbow.colourAt(monthI);
}


const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
let CURRENT_SUBJECT_OR_TAKER = 'photoTaker';
$('.slide-in-out-photoTaker').toggleClass('slide');
// var monthGraphMargin = {top: 30, right: 30, bottom: 70, left: 60},
//     width = 600 - monthGraphMargin.left - monthGraphMargin.right,
//     height = 400 - monthGraphMargin.top - monthGraphMargin.bottom;
const monthGraphWidth = 550;
const monthGraphHeight = 380;
const monthGraphMargin = {
    top: 10, right: 10, bottom: 40, left: 40,
};


// append the svg object to the body of the page
const monthGraphSVG = d3.select('#monthGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', monthGraphHeight + monthGraphMargin.top + monthGraphMargin.bottom)
    .attr('width', monthGraphWidth + monthGraphMargin.left + monthGraphMargin.left)
    .append('g')
    .attr('transform', `translate(${monthGraphMargin.left},${monthGraphMargin.top})`);
const monthGraphX = d3.scaleBand()
    .range([0, monthGraphWidth])
    .padding(0.2);
const monthGraphXAxis = monthGraphSVG.append('g')
    .attr('class', 'monthGraphXAxis')
    .attr('transform', `translate(0,${monthGraphHeight})`);
const monthGraphY = d3.scaleLinear()
    .range([monthGraphHeight, 0]);
const monthGraphYAxis = monthGraphSVG.append('g')
    .attr('class', 'monthGraphYAxis');
const highlightRectangles = (className, oldCategory, newCategory) => {
    if (oldCategory === 'none') {
        d3.selectAll(`.${className}`)
            .filter((d) => {
            if (className === 'treeMapRect') {
                return newCategory !== d.data.name;
            }
            return newCategory !== d.month;
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
            return newCategory === d.month;
        })
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(0%)');
        d3.selectAll(`.${className}`)
            .filter((d) => {
            if (className === 'treeMapRect') {
                return newCategory !== d.data.name;
            }
            return newCategory !== d.month;
        })
            .transition()
            .duration(1000)
            .style('filter', 'grayscale(100%)');
    }
};

export const drawBarGraph = (clientName, subjectOrTaker, storage) => {
    if (subjectOrTaker !== CURRENT_SUBJECT_OR_TAKER) {
        $('.slide-in-out-photoTaker').toggleClass('slide');
        $('.slide-in-out-subject').toggleClass('slide');
        CURRENT_SUBJECT_OR_TAKER = subjectOrTaker;
    }
    const asPTReference = storageRef(storage, 'data/pictureBySubjectByMonth.csv');
    getDownloadURL(asPTReference)
        .then((ptUrl) => {
            
            d3.csv(ptUrl, (phototakerErr, asPhotoTakerData) => {
                
                if (phototakerErr) {
                    console.error(phototakerErr);
                    return;
                }
                const asSubjectReference = storageRef(storage, 'data/pictureOfSubjectByMonth.csv');
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
                                if (ptD.photoTaker === clientName) {
                                    for (let sDataI = 0; sDataI < asSubjectData.length; sDataI += 1) {
                                        const sD = asSubjectData[sDataI];
                                        if (sD.subject === clientName) {
                                            for (let monthI = 0; monthI < MONTHS.length; monthI += 1) {
                                                clientData.push({
                                                    month: shortenedMonths[monthI],
                                                    photoTaker: ptD[MONTHS[monthI].name] ?? '',
                                                    subject: sD[MONTHS[monthI].name] ?? '',
                                                    color: '#'+MONTHS[monthI].color,
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                           
                            // X axis
                            monthGraphX.domain(clientData.map((d) => d.month));
                            monthGraphXAxis.transition().duration(1000).call(d3.axisBottom(monthGraphX))
                                
                            // Add Y axis
                            monthGraphY.domain([0, d3.max(clientData, (d) => {
                                return +(d[subjectOrTaker].split(',').length - 1);
                            })]);
                            monthGraphYAxis.transition().duration(1000).call(d3.axisLeft(monthGraphY));
                            // variable u: map data to existing bars
                            const u = monthGraphSVG.selectAll('rect')
                                .data(clientData);
                            // We use a list here only so we can reference an object from deeper scope
                            u
                                .enter()
                                .append('rect')
                                .classed('monthRect', true)
                                .style('cursor', 'pointer')
                                .on('click', (d) => {
                                    const imgIDs = d[CURRENT_SUBJECT_OR_TAKER]?.split(',')?.slice(0, -1) ?? [];
                                    if (d.month === DISPLAYED_TARGETS.month) {
                                        IMG_CHANGE_CONTAINER.month = false;
                                        ON_CONTAINER.month = false;
                                        DISPLAYED_TARGETS.month = '';
                                        highlightRectangles('monthRect', d.month, d.month);
                                    } else {
                                        if (DISPLAYED_TARGETS.month === '') {
                                            highlightRectangles('monthRect', 'none', d.month);
                                        }
                                        else if (DISPLAYED_TARGETS.month !== d.month) {
                                            highlightRectangles('monthRect', DISPLAYED_TARGETS.month, d.month);
                                        }
                                        IMG_CHANGE_CONTAINER.month = true;
                                        $('.explanation-month').fadeOut('fast');
                                        ON_CONTAINER.month = false;
                                        DISPLAYED_TARGETS.month = d.month;
                                        PROMISES.month.then(() => {
                                            ON_CONTAINER.month = true;
                                            if (IMG_CHANGE_CONTAINER.month) {
                                                PROMISES.month = slideshow('month', imgIDs, ON_CONTAINER, IMG_CHANGE_CONTAINER);
                                            }
                                        });
                                    }
                                })
                                .merge(u)
                                .transition()
                                .duration(1000)
                                .attr('x', (d) => monthGraphX(d.month))
                                .attr('y', (d) => monthGraphY(d[subjectOrTaker].split(',').length - 1))
                                .attr('width', monthGraphX.bandwidth())
                                .attr('height', (d) => monthGraphHeight - monthGraphY(d[subjectOrTaker].split(',').length - 1))
                                .attr('fill', (d) => d.color);
                        });
                    })
            });
        })
};
