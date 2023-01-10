import { 
    DISPLAYED_TARGETS, 
    IMG_CHANGE_CONTAINER, 
    ON_CONTAINER,
    PROMISES,
    slideshow 
} from "./imageLoader.js";
import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

const networkMargin = {
    top: 0, right: 0, bottom: 0, left: 0,
};
const networkWidth = 550;
const networkHeight = 550;
const totalNetworkHeight = 800;
const edgeColors = {
    clientTakerSubject: '#52a8ff',
    clientPicturedWith: '#73c2fb',
    totalPW: '#8e7eff',
    totalTS: '#df00fe',
};
const CLICKED_ELEMENT = {
    clientTakerSubject: '',
    clientPicturedWith: '',
    totalTS: '',
    totalPW: '',
};
export const CIRCLES_STROKE_WIDTH = 2;
const NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu'];
// append the svg object to the body of the page
export const clientPicturedWithSVG = d3.select('#clientPicturedWithGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', networkHeight + networkMargin.bottom + networkMargin.top)
    .attr('width', networkWidth + networkMargin.left + networkMargin.right)
    .append('g')
    .attr('transform', `translate(${networkMargin.left},${networkMargin.top})`);
export const clientTakerSubjectSVG = d3.select('#clientTakerSubjectGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', networkHeight + networkMargin.bottom + networkMargin.top)
    .attr('width', networkWidth + networkMargin.left + networkMargin.right)
    .append('g')
    .attr('transform', `translate(${networkMargin.left},${networkMargin.top})`);
export const totalPWSVG = d3.select('#totalPWGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', totalNetworkHeight)
    .attr('width', totalNetworkHeight)
    .append('g')
    .attr('transform', `translate(${totalNetworkHeight / 2},${totalNetworkHeight / 2})`);
export const totalTSSVG = d3.select('#totalTSGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', totalNetworkHeight)
    .attr('width', totalNetworkHeight)
    .append('g')
    .attr('transform', `translate(${totalNetworkHeight / 2},${totalNetworkHeight / 2})`);
export const ICON_DATA = [];
let defsLoaded = false;
const getIDFromName = (name, nodeList) => {
    let id = 'error';
    nodeList.forEach((node) => {
        if (name === node.name) {
            id = node.id;
        }
    });
    return id;
};
const processTarget = (targetName, targetData, clientName, networkData) => {
    if (targetName !== 'client' && targetName !== clientName) {
        networkData.links.push({
            source: getIDFromName(clientName, networkData.nodes),
            sourceName: clientName,
            target: getIDFromName(targetName, networkData.nodes),
            targetName,
            picIDs: targetData,
        });
        // eslint-disable-next-line no-param-reassign
        networkData.nodes[getIDFromName(targetName, networkData.nodes)].picIDs = targetData;
    }
};
const getCombinedPicNum = (d) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const tsLength = (_d = (_c = (_b = (_a = d.takerSubjectPicIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 1;
    const stLength = (_h = (_g = (_f = (_e = d.subjectTakerPicIDs) === null || _e === void 0 ? void 0 : _e.split(',')) === null || _f === void 0 ? void 0 : _f.slice(0, -1)) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 1;
    return tsLength + stLength;
};
// The TS graph is the most complicated one, so we define its own processing function
const processTSData = (takerSubjectData) => new Promise((resolve) => {
    d3.csv('/data/subjectTaker.csv', (subjectTakerData) => {
        const networkData = { nodes: [], links: [] };
        NAMES.forEach((name, nameI) => {
            networkData.nodes.push({
                id: nameI,
                name,
            });
        });
        let rowIndex = 0;
        takerSubjectData.forEach((tsRow) => {
            const clientName = tsRow.client;
            Object.entries(tsRow).forEach(([targetName, targetData]) => {
                if (targetName !== 'client' && targetName !== clientName) {
                    networkData.links.push({
                        source: getIDFromName(clientName, networkData.nodes),
                        sourceName: clientName,
                        target: getIDFromName(targetName, networkData.nodes),
                        targetName,
                        takerSubjectPicIDs: targetData,
                        subjectTakerPicIDs: subjectTakerData[rowIndex][targetName],
                        // pics target has taken of source
                    });
                }
            });
            rowIndex += 1;
        });
        const t = networkData.links.map((link) => getCombinedPicNum(link));
        const mostPicIDs = Math.max(...t);
        resolve({ networkData, mostPicIDs });
    });
});
const processData = (clientName, data) => new Promise((resolve) => {
    const networkData = { nodes: [], links: [] };
    NAMES.forEach((name, nameI) => {
        networkData.nodes.push({
            id: nameI,
            name,
        });
    });
    const mostPicIDs = Math.max(...data.map((pwRow) => {
        if (pwRow.client === clientName || clientName === 'totalPW') {
            return Math.max(...Object.entries(pwRow).map(([targetName, targetData]) => {
                if (targetName !== 'client') {
                    return targetData.split(',').slice(0, -1).length;
                }
                return 0;
            }));
        }
        return 0;
    }));
    data.forEach((pwRow) => {
        if (clientName === pwRow.client || clientName === 'totalPW') {
            Object.entries(pwRow).forEach(([targetName, targetData]) => {
                processTarget(targetName, targetData, pwRow.client, networkData);
            });
        }
    });
    resolve({ networkData, mostPicIDs });
});
const highlightLink = (oldLink, newLink, on, totalGraph, pictureDivName) => {
    const oldSourceName = oldLink.sourceName;
    const oldTargetName = oldLink.targetName;
    const newSourceName = newLink.sourceName;
    const newTargetName = newLink.targetName;
    if (on) {
        if (totalGraph) {
            d3.selectAll(`.link-${pictureDivName}`)
                .transition()
                .duration(400)
                .style('opacity', 0.1);
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => d.sourceName === newSourceName && d.targetName === newTargetName)
                .transition()
                .duration(400)
                .style('opacity', 1);
        }
        else {
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => (oldTargetName === ''
                ? true
                : d.sourceName === oldSourceName && d.targetName === oldTargetName))
                .transition()
                .duration(400)
                .style('filter', 'brightness(60%)');
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => d.sourceName === newSourceName && d.targetName === newTargetName)
                .transition()
                .duration(400)
                .style('filter', 'brightness(100%)');
        }
        d3.selectAll(`.node-${pictureDivName}`)
            .filter((d) => (oldTargetName === ''
            ? true
            : (d.name === oldTargetName)))
            .transition()
            .duration(400)
            .style('filter', 'brightness(60%)');
        d3.selectAll(`.node-${pictureDivName}`)
            .filter((d) => (d.name === newSourceName || d.name === newTargetName))
            .transition()
            .duration(400)
            .style('filter', 'brightness(100%)');
    }
    else {
        if (totalGraph) {
            d3.selectAll(`.link-${pictureDivName}`)
                .transition()
                .duration(400)
                .style('opacity', 1);
        }
        else {
            d3.selectAll(`.link-${pictureDivName}`)
                .transition()
                .duration(400)
                .style('filter', 'brightness(100%)');
        }
        d3.selectAll(`.node-${pictureDivName}`)
            .transition()
            .duration(400)
            .style('filter', 'brightness(100%)');
    }
};
const highlightNode = (oldNodeName, newNodeName, clientName, on, totalGraph, pictureDivName) => {
    if (on) {
        if (totalGraph) {
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => (oldNodeName === ''
                ? true
                : (d.sourceName === oldNodeName || d.targetName === oldNodeName)))
                .transition()
                .duration(400)
                .style('opacity', 0.1);
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => (d.sourceName === newNodeName || d.targetName === newNodeName))
                .transition()
                .duration(400)
                .style('opacity', 1);
        }
        else {
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => (oldNodeName === ''
                ? true
                : (d.sourceName === oldNodeName && d.targetName === clientName)
                    || (d.sourceName === clientName && d.targetName === oldNodeName)))
                .transition()
                .duration(400)
                .style('filter', 'brightness(60%)');
            d3.selectAll(`.link-${pictureDivName}`)
                .filter((d) => d.sourceName === clientName && d.targetName === newNodeName)
                .transition()
                .duration(400)
                .style('filter', 'brightness(100%)');
            d3.selectAll(`.node-${pictureDivName}`)
                .filter((d) => (oldNodeName === ''
                ? true
                : (d.name === oldNodeName)))
                .transition()
                .duration(400)
                .style('filter', 'brightness(60%)');
            d3.selectAll(`.node-${pictureDivName}`)
                .filter((d) => (d.name === newNodeName || d.name === clientName))
                .transition()
                .duration(400)
                .style('filter', 'brightness(100%)');
        }
    }
    else {
        if (totalGraph) {
            d3.selectAll(`.link-${pictureDivName}`)
                .transition()
                .duration(400)
                .style('opacity', 1);
        }
        else {
            d3.selectAll(`.link-${pictureDivName}`)
                .transition()
                .duration(400)
                .style('filter', 'brightness(100%)');
        }
        d3.selectAll(`.node-${pictureDivName}`)
            .transition()
            .duration(400)
            .style('filter', 'brightness(100%)');
    }
};
const displayPWStats = (imgIds) => {
    $('.explanation-totalPW').animate({ opacity: 0 }, 200, () => {
        $('.explanation-totalPW').html(`Pictured together ${imgIds.length} times`).animate({ opacity: 1 }, 200);
    });
};
const displayTSStats = (d) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const sourceOfTargetLength = (_d = (_c = (_b = (_a = d.takerSubjectPicIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 1;
    const targetOfSourceLength = (_h = (_g = (_f = (_e = d.subjectTakerPicIDs) === null || _e === void 0 ? void 0 : _e.split(',')) === null || _f === void 0 ? void 0 : _f.slice(0, -1)) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 1;
    $('.explanation-totalTS').animate({ opacity: 0 }, 200, () => {
        $('.explanation-totalTS').html(`${d.sourceName} has taken ${sourceOfTargetLength} pictures of ${d.targetName}
    <br/> ${d.targetName} has taken ${targetOfSourceLength} pictures of ${d.sourceName}`).animate({ opacity: 1 }, 200);
    });
};
const clearNetworkStats = (clientName) => {
    $(`.explanation-${clientName}`).animate({ opacity: 0 }, 200, () => {
        $(`.explanation-${clientName}`).html('Click on the graph edges to load stats'
            + '<br/> (Clicking the nodes doesn\'t do anything but I think it looks pretty)').animate({ opacity: 1 }, 200);
    });
};
export const drawNetwork = (clientName, dataFileName, svg, pictureDivName, storage) => {
    const reference = storageRef(storage, `data/${dataFileName}.csv`);
    getDownloadURL(reference)
        .then((url) => {
            d3.csv(url, (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const processPromise = clientName === 'totalTS'
                    ? processTSData(data)
                    : processData(clientName, data);
                processPromise.then((dataAndMostPicIds) => {
                    const networkData = dataAndMostPicIds.networkData;
                    const mostPicIDs = dataAndMostPicIds.mostPicIds;
                    const maxLinkWidth = 10;
                    // Initialize the links
                    const networkDataLink = svg
                        .selectAll('line')
                        .data(networkData.links)
                        .enter()
                        .append('line')
                        .classed(`link-${pictureDivName}`, true)
                        .style('stroke', edgeColors[pictureDivName])
                        .style('cursor', 'pointer')
                        .style('stroke-width', (d) => {
                        var _a, _b, _c, _d;
                        const numPicIDs = clientName === 'totalTS'
                            ? getCombinedPicNum(d)
                            : (_d = (_c = (_b = (_a = d.picIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 1;
                        const width = Math.ceil((maxLinkWidth * (numPicIDs + 1)) / mostPicIDs);
                        return width;
                    })
                        .on('click', (d) => {
                        var _a, _b, _c;
                        const imgIDs = (_c = (_b = (_a = d.picIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) !== null && _c !== void 0 ? _c : [];
                        if (clientName !== 'totalPW' && clientName !== 'totalTS') {
                            if (d.targetName === DISPLAYED_TARGETS[pictureDivName]) {
                                IMG_CHANGE_CONTAINER[pictureDivName] = false;
                                ON_CONTAINER[pictureDivName] = false;
                                DISPLAYED_TARGETS[pictureDivName] = '';
                                CLICKED_ELEMENT[pictureDivName] = '';
                                highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, false, false, pictureDivName);
                            }
                            else {
                                if (CLICKED_ELEMENT[pictureDivName] === 'node') {
                                    DISPLAYED_TARGETS[pictureDivName] = '';
                                    highlightNode('', '', clientName, false, false, pictureDivName);
                                }
                                highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, true, false, pictureDivName);
                                IMG_CHANGE_CONTAINER[pictureDivName] = true;
                                CLICKED_ELEMENT[pictureDivName] = 'link';
                                $(`.explanation-${pictureDivName}`).fadeOut('fast');
                                ON_CONTAINER[pictureDivName] = false;
                                DISPLAYED_TARGETS[pictureDivName] = d.targetName;
                                PROMISES[pictureDivName].then(() => {
                                    ON_CONTAINER[pictureDivName] = true;
                                    if (IMG_CHANGE_CONTAINER[pictureDivName]) {
                                        PROMISES[pictureDivName] = slideshow(pictureDivName, imgIDs, ON_CONTAINER, IMG_CHANGE_CONTAINER);
                                    }
                                });
                            }
                        }
                        else if (d.targetName === DISPLAYED_TARGETS[pictureDivName]
                            || d.sourceName === DISPLAYED_TARGETS[pictureDivName]) {
                            highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, false, true, pictureDivName);
                            console.log(CLICKED_ELEMENT[pictureDivName]);
                            if (CLICKED_ELEMENT[pictureDivName] === 'node') {
                                highlightLink({ sourceName: '', targetName: '' }, { sourceName: d.sourceName, targetName: d.targetName }, true, true, pictureDivName);
                                if (clientName === 'totalTS') {
                                    displayTSStats(d);
                                }
                                else {
                                    displayPWStats(imgIDs);
                                }
                                CLICKED_ELEMENT[pictureDivName] = 'link';
                                DISPLAYED_TARGETS[pictureDivName] = d.sourceName;
                            }
                            else {
                                clearNetworkStats(clientName);
                                DISPLAYED_TARGETS[pictureDivName] = '';
                                CLICKED_ELEMENT[pictureDivName] = '';
                            }
                        }
                        else {
                            if (clientName === 'totalTS') {
                                displayTSStats(d);
                            }
                            else {
                                displayPWStats(imgIDs);
                            }
                            DISPLAYED_TARGETS[pictureDivName] = d.targetName;
                            CLICKED_ELEMENT[pictureDivName] = 'link';
                            highlightLink({ sourceName: '', targetName: '' }, { sourceName: d.sourceName, targetName: d.targetName }, true, true, pictureDivName);
                        }
                    });
                    const config = {
                        avatar_size: 130, // define the size of the circle radius
                    };
                    if (!defsLoaded) {
                        const body = d3.select('body');
                        const definitionSVG = body.append('svg');
                        const defs = definitionSVG.append('svg:defs');
                        ICON_DATA.forEach((d) => {
                            defs.append('svg:pattern')
                                .attr('id', `${d.name}_icon`)
                                .attr('patternContentUnits', 'objectBoundingBox')
                                .attr('height', '1')
                                .attr('width', '1')
                                .append('svg:image')
                                .attr('href', d.url)
                                .attr('height', '1')
                                .attr('width', '1');
                        });
                        defsLoaded = true;
                    }
                    // Initialize the nodes
                    const networkDataNode = svg
                        .selectAll('circle')
                        .data(networkData.nodes)
                        .enter()
                        .append('circle')
                        .classed(`node-${pictureDivName}`, true)
                        .attr('r', () => (clientName === 'totalPW' || clientName === 'totalTS'
                        ? (0.75 * config.avatar_size) / 2
                        : (0.9 * config.avatar_size) / 2))
                        .style('fill', (d) => `url(#${d.name}_icon)`)
                        .style('stroke', edgeColors[pictureDivName])
                        .style('stroke-width', CIRCLES_STROKE_WIDTH)
                        .style('cursor', 'pointer')
                        .on('click', (d) => {
                        var _a, _b, _c;
                        console.log(CLICKED_ELEMENT[pictureDivName]);
                        console.log(DISPLAYED_TARGETS[pictureDivName]);
                        const imgIDs = (_c = (_b = (_a = d.picIDs) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.slice(0, -1)) !== null && _c !== void 0 ? _c : [];
                        if (clientName !== 'totalPW' && clientName !== 'totalTS') {
                            if (d.name === DISPLAYED_TARGETS[pictureDivName]) {
                                if (CLICKED_ELEMENT[pictureDivName] === 'link') {
                                    DISPLAYED_TARGETS[pictureDivName] = '';
                                    highlightLink({ sourceName: '', targetName: '' }, { sourceName: '', targetName: '' }, false, false, pictureDivName);
                                }
                                IMG_CHANGE_CONTAINER[pictureDivName] = false;
                                ON_CONTAINER[pictureDivName] = false;
                                DISPLAYED_TARGETS[pictureDivName] = '';
                                CLICKED_ELEMENT[pictureDivName] = '';
                                highlightNode('', d.name, clientName, false, false, pictureDivName);
                            }
                            else {
                                highlightNode(DISPLAYED_TARGETS[pictureDivName], d.name, clientName, true, false, pictureDivName);
                                $(`.explanation-${pictureDivName}`).fadeOut('fast');
                                IMG_CHANGE_CONTAINER[pictureDivName] = true;
                                CLICKED_ELEMENT[pictureDivName] = 'node';
                                ON_CONTAINER[pictureDivName] = false;
                                DISPLAYED_TARGETS[pictureDivName] = d.name;
                                PROMISES[pictureDivName].then(() => {
                                    ON_CONTAINER[pictureDivName] = true;
                                    if (IMG_CHANGE_CONTAINER[pictureDivName]) {
                                        PROMISES[pictureDivName] = slideshow(pictureDivName, imgIDs, ON_CONTAINER, IMG_CHANGE_CONTAINER);
                                    }
                                });
                            }
                        }
                        else if (d.name === DISPLAYED_TARGETS[pictureDivName]) {
                            highlightNode('', '', clientName, false, true, pictureDivName);
                            if (CLICKED_ELEMENT[pictureDivName] === 'link') {
                                highlightNode('', d.name, clientName, true, true, pictureDivName);
                                CLICKED_ELEMENT[pictureDivName] = 'node';
                                DISPLAYED_TARGETS[pictureDivName] = d.name;
                            }
                            else {
                                DISPLAYED_TARGETS[pictureDivName] = '';
                                clearNetworkStats(clientName);
                                CLICKED_ELEMENT[pictureDivName] = '';
                            }
                        }
                        else {
                            highlightNode(DISPLAYED_TARGETS[pictureDivName], d.name, clientName, true, true, clientName);
                            DISPLAYED_TARGETS[pictureDivName] = d.name;
                            clearNetworkStats(clientName);
                            CLICKED_ELEMENT[pictureDivName] = 'node';
                        }
                    });
                    // This function is run at each iteration of the force algorithm, updating the nodes position.
                    const networkTicked = () => {
                        networkDataLink
                            .attr('x1', (d) => d.source.x)
                            .attr('y1', (d) => d.source.y)
                            .attr('x2', (d) => d.target.x)
                            .attr('y2', (d) => d.target.y);
                        networkDataNode
                            .attr('cx', (d) => d.x + 1)
                            .attr('cy', (d) => d.y - 1);
                    };
                    const totalTicked = () => {
                        networkDataLink
                            .attr('x1', (d) => d.source.x)
                            .attr('y1', (d) => d.source.y)
                            .attr('x2', (d) => d.target.x)
                            .attr('y2', (d) => d.target.y);
                        networkDataNode
                            .attr('cx', (d) => d.x)
                            .attr('cy', (d) => d.y);
                    };
                    // Let's list the force we wanna apply on the network
                    if (clientName === 'totalPW' || clientName === 'totalTS') {
                        d3.forceSimulation(networkData.nodes)
                            .force('charge', d3.forceCollide().radius(70))
                            .force('r', d3.forceRadial(() => 250))
                            .force('link', d3.forceLink() // This force provides links between nodes
                            .id((d) => d.id) // This provide  the id of a node
                            .links(networkData.links)
                            .strength(() => 0))
                            .on('tick', totalTicked)
                            .alphaTarget(0.1);
                    }
                    else {
                        d3.forceSimulation(networkData.nodes)
                            .force('link', d3.forceLink() // This force provides links between nodes
                            .id((d) => d.id) // This provide  the id of a node
                            .links(networkData.links))
                            .force('charge', d3.forceManyBody().strength(-4500)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
                            .force('center', d3.forceCenter(networkWidth / 2, networkHeight / 2)) // This force attracts nodes to the center of the svg area
                            .on('tick', networkTicked)
                            .alphaTarget(0.1);
                    }
                });
            });
        })
};
