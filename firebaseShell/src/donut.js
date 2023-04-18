import { 
    DISPLAYED_TARGETS,
    loadImage,
    removeImage,
    SECTION_TO_SLIDESHOW_INDEX,
    SECTION_IN_VIEWPORT,
    SECTION_TO_SLIDESHOW_IS_ACTIVE,
    SECTION_TO_SLIDESHOW_LENGTH,
    SECTION_TO_IMG_IDS
} from "./imageLoader.js";
import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";


const donutWidth = 750;
const donutHeight = 580;
const donutX = 360
const donutY = 310;
const CATEGORIES = [
    { name: 'ANIMALS', color: '#00ff42'},
    { name: 'FASHION', color: '#00fd64'},
    { name: 'LANDMARKS', color: '#00fb81'},
    { name: 'ARTS', color: '#00f89c'},
    { name: 'NATURE', color: '#00f5b4'},
    { name: 'BIRTHDAYS', color: '#00f1ca'},
    { name: 'FOOD', color: '#00ecde'},
    { name: 'NIGHT', color: '#00e8ef'},
    { name: 'SELFIES', color: '#00e2fe'},
    { name: 'CITYSCAPES', color: '#00dcff'},
    { name: 'PEOPLE', color: '#00d6ff'},
    { name: 'SPORT', color: '#00cfff'},
    { name: 'HOLIDAYS', color: '#00c8ff'},
    { name: 'CRAFTS', color: '#00c0ff'},
    { name: 'PERFORMANCES', color: '#00b8ff'},
    { name: 'TRAVEL', color: '#00b0ff'},
    { name: 'MISC', color: '#52a8ff'},
];
// append the svg object to the body of the page
const donutSVG = d3.select('#donut')
    .append('svg')
    .attr('height', donutHeight)
    .attr('width', donutWidth)
    .append('g')
    .attr('id', 'donutG')
    .attr('transform', `translate(${donutX},${donutY})`);

const donutTooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('text-align', 'center')
    .style('margin', 'auto');
const drawTooltip = (div, text, x, y) => {
    div
        .transition()
        .duration(75)
        .style('opacity', 1);
    div.html(text)
        .style('left', `${x}px`)
        .style('top', `${y}px`);
};
export const highlightDonutSections = (oldCategory, newCategory) => {
    if (oldCategory === 'none') {
        donutSVG.selectAll('path')
            .filter((d) => newCategory !== d.data.key)
            .transition()
            .duration(1000)
            .style('opacity', .3);
    }
    else if (oldCategory === newCategory) {
        donutSVG.selectAll('path')
            .transition()
            .duration(1000)
            .style('opacity', 1);
    }
    else {
        donutSVG.selectAll('path')
            .filter((d) => newCategory === d.data.key)
            .transition()
            .duration(1000)
            .style('opacity', 1);
        donutSVG.selectAll('path')
            .filter((d) => newCategory !== d.data.key)
            .transition()
            .duration(1000)
            .style('opacity', .3);
    }
};

const clearTooltip = (div) => {
    div
        .transition()
        .duration(100)
        .style('opacity', 0);
};
const processCategoryData = (categoryName, categoryData, clientData) => {
    if (categoryName !== 'client') {
        const numIDs = categoryData?.split(',')?.slice(0, -1)?.length ?? 0;
        if (numIDs !== 0) {
            clientData[categoryName] = {
                name: categoryName,
                count: numIDs,
                picIDs: categoryData
            };
        }
    }
};

const getColor = (name) => {
    let color = '';
    CATEGORIES.forEach((entry) => {
        if (entry.name === name) {
            color += entry.color;
        }
    });
    return color;
};

var width = 450
var height = 450
var margin = 40

var radius = Math.min(width, height) / 2 - margin

const transitionLabel = (on, targetText) => {
    const targetOpacity = on ? 1: 0;
    $('#donutLabel').html(targetText);
    $('#donutLabel').animate({
        opacity: targetOpacity
    }, 200);
};

// read json data
export const drawDonut = (clientName, storage, projectPath) => {
    const reference = storageRef(storage, `data/${projectPath}/subjectCategory.csv`);
    getDownloadURL(reference)
        .then((url) => {
            d3.csv(url, (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const clientData = {};
                data.forEach((row) => {
                    if (row.client === clientName) {
                        Object.entries(row).forEach(([categoryName, categoryData]) => {
                            processCategoryData(categoryName, categoryData, clientData);
                        });
                    }
                });

            
                // Compute the position of each group on the pie:
                var pie = d3.pie()
                    .value((d) => d.value.count );
                var dataReady = pie(d3.entries(clientData));

                // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
                donutSVG
                    .selectAll('path')
                    .data(dataReady)
                    .enter()
                    .append('path')
                    .attr('d', d3.arc()
                        .innerRadius(100)         // This is the size of the donut hole
                        .outerRadius(radius)
                    )
                    .attr('fill', (d) => {
                        return getColor(d.data.key);
                    })
                    .attr("stroke", "#333333")
                    .style("stroke-width", "2px")
                    .style("opacity", 1)
                    .style('cursor', 'pointer')
                    .on('mouseenter', (d) => {
                        drawTooltip(donutTooltip, d.data.key, d3.event.x, d3.event.y);
                    })
                    .on('mousemove', (d) => {
                        drawTooltip(donutTooltip, d.data.key, d3.event.x, d3.event.y);
                    })
                    .on('mouseleave', () => {
                        clearTooltip(donutTooltip);
                    })
                    .on('click', (d) => {
                        if (d.data.key === DISPLAYED_TARGETS.donut) { // Clicking the same section, "turn off" visual
                            DISPLAYED_TARGETS.donut = '';
                            highlightDonutSections(d.data.key, d.data.key);
                            SECTION_TO_SLIDESHOW_IS_ACTIVE["donut"] = false;
                            removeImage(`donutDisplayedPhoto`, 200).then(() => {
                                $('.explanation-donut').fadeIn('fast');
                            });
                            transitionLabel(false, d.data.key);
                        } else {
                            if (DISPLAYED_TARGETS.donut === '') { // nothing displayed, so "turn on" visual
                                highlightDonutSections('none', d.data.key);
                                transitionLabel(true, d.data.key);
                            } else if (DISPLAYED_TARGETS.donut !== d.data.key) { // Visual is on. Changing section
                                highlightDonutSections(DISPLAYED_TARGETS.donut, d.data.key);
                                transitionLabel(true, d.data.key);
                            }
                            const imgIDs = d.data.value.picIDs?.split(',')?.slice(0, -1) ?? [];
                            SECTION_TO_SLIDESHOW_IS_ACTIVE["donut"] = true;
                            SECTION_TO_SLIDESHOW_LENGTH["donut"] = imgIDs.length;
                            SECTION_TO_IMG_IDS["donut"] = imgIDs;
                            $('.explanation-donut').fadeOut('fast');
                            DISPLAYED_TARGETS.donut = d.data.key;
                            const imgIdIndex = SECTION_TO_SLIDESHOW_INDEX[SECTION_IN_VIEWPORT];
                            const imgId = imgIDs[imgIdIndex];
                            removeImage(`donutDisplayedPhoto`, 200).then(() => {
                                loadImage(SECTION_IN_VIEWPORT, imgId, projectPath, storage);
                            });
                        }
                    });
        });
    });
};
