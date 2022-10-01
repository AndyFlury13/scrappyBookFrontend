import { ON_CONTAINER } from "./imageLoader.js";
import { IMG_CHANGE_CONTAINER } from "./imageLoader.js";
import { DISPLAYED_TARGETS } from "./imageLoader.js";
import { slideshow } from "./imageLoader.js";
import { PROMISES } from "./imageLoader.js";
const treeMapWidth = 750;
const treeMapHeight = 580;
const CATEGORIES = [
    { name: 'ANIMALS', color: '#00ff42', sizeModifier: 1 },
    { name: 'FASHION', color: '#00fd64', sizeModifier: 1 },
    { name: 'LANDMARKS', color: '#00fb81', sizeModifier: 1.7 },
    { name: 'ARTS', color: '#00f89c', sizeModifier: 1 },
    { name: 'NATURE', color: '#00f5b4', sizeModifier: 0.9 },
    { name: 'BIRTHDAYS', color: '#00f1ca', sizeModifier: 1 },
    { name: 'FOOD', color: '#00ecde', sizeModifier: 0.9 },
    { name: 'NIGHT', color: '#00e8ef', sizeModifier: 1 },
    { name: 'SELFIES', color: '#00e2fe', sizeModifier: 0.7 },
    { name: 'CITYSCAPES', color: '#00dcff', sizeModifier: 1.1 },
    { name: 'PEOPLE', color: '#00d6ff', sizeModifier: 1 },
    { name: 'SPORT', color: '#00cfff', sizeModifier: 1 },
    { name: 'HOLIDAYS', color: '#00c8ff', sizeModifier: 1.3 },
    { name: 'CRAFTS', color: '#00c0ff', sizeModifier: 1 },
    { name: 'PERFORMANCES', color: '#00b8ff', sizeModifier: 1.3 },
    { name: 'TRAVEL', color: '#00b0ff', sizeModifier: 1.4 },
    { name: 'MISC', color: '#52a8ff', sizeModifier: 1 },
];
// append the svg object to the body of the page
const treeMapMargin = {
    top: 0, right: 0, bottom: 0, left: 0,
};
const treeMapSVG = d3.select('#treeMap')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', treeMapHeight + treeMapMargin.top + treeMapMargin.bottom)
    .attr('width', treeMapWidth + treeMapMargin.left + treeMapMargin.left)
    .append('g')
    .attr('id', 'treeMapG')
    .attr('transform', `translate(${treeMapMargin.left},${treeMapMargin.top})`);
const treeMapTooltip = d3.select('body')
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
export const highlightRectangles = (className, oldCategory, newCategory) => {
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
const createTreemapDefs = () => {
    const imageLength = 15;
    const patternLength = imageLength * 2.5;
    const body = d3.select('body');
    const definitionSVG = body.append('svg');
    const defs = definitionSVG.append('svg:defs');
    CATEGORIES.forEach((entry) => {
        defs.append('svg:pattern')
            .attr('id', `${entry.name}_icon`)
            .attr('height', () => patternLength)
            .attr('width', () => patternLength)
            .attr('x', () => 5) // center patterns
            .attr('y', () => 5)
            .attr('patternUnits', 'userSpaceOnUse')
            .append('svg:image')
            .attr('href', `/treeMapPics/modified/${entry.name}_modified.png`)
            .attr('height', () => imageLength * entry.sizeModifier)
            .attr('width', () => imageLength * entry.sizeModifier);
    });
    return defs;
};
const clearTooltip = (div) => {
    div
        .transition()
        .duration(100)
        .style('opacity', 0);
};
const processCategoryData = (categoryName, categoryData, clientData) => {
    var _a, _b, _c;
    if (categoryName !== 'client') {
        const numIDs = (_c = (_b = (_a = categoryData === null || categoryData === void 0 ? void 0 : categoryData.split(',')) === null || _a === void 0 ? void 0 : _a.slice(0, -1)) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
        if (numIDs !== 0) {
            clientData.children.push({
                name: categoryName,
                value: numIDs,
                group: 'A',
                colname: 'level1',
                picIDs: categoryData,
            });
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
// read json data
export const drawTreeMap = (clientName) => {
    d3.csv('/scripts/data/subjectCategory.csv', (data) => {
        const clientData = {
            children: [],
        };
        data.forEach((row) => {
            if (row.client === clientName) {
                Object.entries(row).forEach(([categoryName, categoryData]) => {
                    processCategoryData(categoryName, categoryData, clientData);
                });
            }
        });
        // Give the data to this cluster layout:
        const root = d3.hierarchy(clientData).sum((d) => d.value);
        // Then d3.treemap computes the position of each element of the hierarchy
        d3.treemap()
            .size([treeMapWidth, treeMapHeight])
            .padding(2)(root);
        createTreemapDefs();
        // use this information to add rectangles:
        const selection = treeMapSVG
            .selectAll('rect')
            .data(root.leaves())
            .enter();
        selection
            .append('rect')
            .classed('treeMapRect', true)
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .style('stroke', '#333333')
            .style('fill', (d) => getColor(d.data.name));
        selection
            .append('rect')
            .classed('treeMapRect', true)
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .style('stroke', '#333333')
            .style('cursor', 'pointer')
            .style('fill', (d) => `url(#${d.data.name}_icon)`)
            .on('mouseenter', (d) => {
            drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
        })
            .on('mousemove', (d) => {
            drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
        })
            .on('mouseleave', () => {
            clearTooltip(treeMapTooltip);
        })
            .on('click', (d) => {
            var _a, _b, _c;
            const imgIDs = (_c = (_b = (_a = d.data.picIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) !== null && _c !== void 0 ? _c : [];
            if (d.data.name === DISPLAYED_TARGETS.treeMap) {
                IMG_CHANGE_CONTAINER.treeMap = false;
                ON_CONTAINER.treeMap = false;
                DISPLAYED_TARGETS.treeMap = '';
                highlightRectangles('treeMapRect', d.data.name, d.data.name);
            }
            else {
                if (DISPLAYED_TARGETS.treeMap === '') {
                    console.log(d.data.name);
                    highlightRectangles('treeMapRect', 'none', d.data.name);
                }
                else if (DISPLAYED_TARGETS.treeMap !== d.data.name) {
                    highlightRectangles('treeMapRect', DISPLAYED_TARGETS.treeMap, d.data.name);
                }
                IMG_CHANGE_CONTAINER.treeMap = true;
                $('.explanation-treeMap').fadeOut('fast');
                ON_CONTAINER.treeMap = false;
                DISPLAYED_TARGETS.treeMap = d.data.name;
                PROMISES.treeMap.then(() => {
                    ON_CONTAINER.treeMap = true;
                    if (IMG_CHANGE_CONTAINER.treeMap) {
                        PROMISES.treeMap = slideshow('treeMap', imgIDs, ON_CONTAINER, IMG_CHANGE_CONTAINER);
                    }
                });
            }
        });
    });
};
