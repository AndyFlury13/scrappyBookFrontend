import { 
    DISPLAYED_TARGETS, 
    SECTION_TO_IMG_IDS,
    SECTION_TO_SLIDESHOW_INDEX,
    SECTION_TO_SLIDESHOW_IS_ACTIVE,
    SECTION_TO_SLIDESHOW_LENGTH,
    loadImage,
    removeImage,
    logIfNullImageId
} from "./imageLoader.js";
import {getNumberOfIds} from "./timeGraph.js";
import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

export const HD_NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu'];
export const MAUI_NAMES = ['Andrew', 'Dalton', 'Sean', 'Cynthia', 'Haider', 'Ishan', 'Nicco', 'Megan'];
                    

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
var defsLoaded = false;
export const CIRCLES_STROKE_WIDTH = 2;
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
    .attr('transform', `translate(${totalNetworkHeight / 2},${(totalNetworkHeight / 2)-20})`);
export const totalTSSVG = d3.select('#totalTSGraph')
    .append('svg')
    .classed('centeredSVG', true)
    .attr('height', totalNetworkHeight)
    .attr('width', totalNetworkHeight)
    .append('g')
    .attr('transform', `translate(${totalNetworkHeight / 2},${(totalNetworkHeight / 2)-20})`);
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
    const tsLength = getNumberOfIds(d.takerSubjectPicIDs);
    const stLength = getNumberOfIds(d.subjectTakerPicIDs);
    return tsLength + stLength;
};

// The TS graph is the most complicated one, so we define its own processing function
const processTSData = (takerSubjectData, storage, projectPath, names) => new Promise((resolve) => {
    const reference = storageRef(storage, `data/${projectPath}/subjectTaker.csv`);
    getDownloadURL(reference)
        .then((url) => {
            d3.csv(url, (err, subjectTakerData) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const networkData = { nodes: [], links: [] };
                names.forEach((name, nameI) => {
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
                                takerSubjectPicIDs: targetData, // pics source has taken of source
                                subjectTakerPicIDs: subjectTakerData[rowIndex][targetName]   // pics target has taken of source
                            });
                        }
                    });
                    rowIndex += 1;
                });
                const t = networkData.links.map((link) => getCombinedPicNum(link));
                const mostPicIds = Math.max(...t);
                resolve({ networkData, mostPicIds });
            });
        });
});

const processData = (clientName, data, names) => new Promise((resolve) => {
    const networkData = { nodes: [], links: [] };
    names.forEach((name, nameI) => {
        networkData.nodes.push({
            id: nameI,
            name,
        });
    });
    const mostPicIds = Math.max(...data.map((pwRow) => {
        if (pwRow.client === clientName || clientName === 'totalPW') {
            return Math.max(...Object.entries(pwRow).map(([targetName, targetData]) => {
                if (targetName !== 'client') {
                    return getNumberOfIds(targetData);
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
    resolve({ networkData, mostPicIds });
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
        } else {
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
    } else {
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
    const sourceOfTargetLength = getNumberOfIds(d.takerSubjectPicIDs);
    const targetOfSourceLength = getNumberOfIds(d.subjectTakerPicIDs);
    $('.explanation-totalTS').animate({ opacity: 0 }, 200, () => {
        $('.explanation-totalTS').html(`${d.sourceName} has taken ${sourceOfTargetLength} pictures of ${d.targetName}
    <br/> ${d.targetName} has taken ${targetOfSourceLength} pictures of ${d.sourceName}`).animate({ opacity: 1 }, 200);
    });
};

const clearNetworkStats = (clientName) => {
    const edgeDescription = clientName == 'totalPW' ? 'pictures they are in together' : 'pictures they\'ve taken of each other';
    $(`.explanation-${clientName}`).animate({ opacity: 0 }, 200, () => {
        $(`.explanation-${clientName}`).html('<p>Click on the graph edges to load stats'
            + '<br/>' + `An edge between two people represents <i>${edgeDescription}</i>.<br/>`
            + '(Clicking the nodes doesn\'t do anything but I think it looks pretty)</p>').animate({ opacity: 1 }, 200);
    });
};

const displayDefaultExplanation = (pictureDivName) => {
    $(`.explanation-${pictureDivName}`).fadeOut(() => {
        const explanationText = 'Click the graph elements to load images.<br/>Every edge from you to someone else represents <i>pictures you' +
        `${pictureDivName === 'clientTakerSubject' 
            ? '\'ve taken of'
            : ' appear in with'
        }` +
        ' them</i>.';
        $(`.explanation-${pictureDivName}`).html(explanationText);
    }).fadeIn();
}

export const drawNetwork = (clientName, dataFileName, svg, pictureDivName, storage, projectPath, iconData, names) => {
    const reference = storageRef(storage, `data/${projectPath}/${dataFileName}.csv`);
    getDownloadURL(reference)
        .then((url) => {
            d3.csv(url, (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const processPromise = clientName === 'totalTS'
                    ? processTSData(data, storage, projectPath, names)
                    : processData(clientName, data, names);
                processPromise.then((dataAndMostPicIds) => {
                    const networkData = dataAndMostPicIds.networkData;
                    const mostPicIds = dataAndMostPicIds.mostPicIds;

                    const maxLinkWidth = 13;
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
                        const numPicIDs = clientName === 'totalTS'
                            ? getCombinedPicNum(d)
                            : getNumberOfIds(d.picIDs);
                        const width = Math.ceil((maxLinkWidth * (numPicIDs)) / mostPicIds);
                        return width;
                    })
                        .on('click', (d) => {
                            const imgIds = d.picIDs?.split(',')?.slice(0, -1) ?? [];;
                            if (clientName !== 'totalPW' && clientName !== 'totalTS') { // individual graphs
                                if (d.targetName === DISPLAYED_TARGETS[pictureDivName]) { // turn off visual
                                    // Network aeshetics
                                    DISPLAYED_TARGETS[pictureDivName] = '';
                                    CLICKED_ELEMENT[pictureDivName] = '';
                                    highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, false, false, pictureDivName);
                                
                                    // Picture stuff
                                    SECTION_TO_SLIDESHOW_IS_ACTIVE[pictureDivName] = false;
                                    removeImage(`${pictureDivName}DisplayedPhoto`, 200).then(() => {
                                        displayDefaultExplanation(pictureDivName);
                                    });
                                } else { 
                                    // Network aeshetics
                                    if (CLICKED_ELEMENT[pictureDivName] === 'node') {
                                        DISPLAYED_TARGETS[pictureDivName] = '';
                                        highlightNode('', '', clientName, false, false, pictureDivName);
                                    }
                                    highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, true, false, pictureDivName);
                                    CLICKED_ELEMENT[pictureDivName] = 'link';
                                    DISPLAYED_TARGETS[pictureDivName] = d.targetName;

                                    // Picture stuff
                                    SECTION_TO_SLIDESHOW_IS_ACTIVE[pictureDivName] = true;
                                    $(`.explanation-${pictureDivName}`).fadeOut('fast');
                                    SECTION_TO_SLIDESHOW_LENGTH[pictureDivName] = imgIds.length;
                                    SECTION_TO_IMG_IDS[pictureDivName] = imgIds;
                                    const imgIdIndex = SECTION_TO_SLIDESHOW_INDEX[pictureDivName];
                                    const imgId = imgIds[imgIdIndex];
                                    logIfNullImageId(imgID, 0, imgIds);
                                    removeImage(`${pictureDivName}DisplayedPhoto`, 200).then(() => {
                                        loadImage(pictureDivName, imgId, projectPath, storage)
                                    });
                                    
                                }
                            } else if (d.targetName === DISPLAYED_TARGETS[pictureDivName]
                                || d.sourceName === DISPLAYED_TARGETS[pictureDivName]) {
                                highlightLink({ sourceName: clientName, targetName: DISPLAYED_TARGETS[pictureDivName] }, { sourceName: clientName, targetName: d.targetName }, false, true, pictureDivName);
                                if (CLICKED_ELEMENT[pictureDivName] === 'node') {
                                    highlightLink({ sourceName: '', targetName: '' }, { sourceName: d.sourceName, targetName: d.targetName }, true, true, pictureDivName);
                                    if (clientName === 'totalTS') {
                                        displayTSStats(d);
                                    }
                                    else {
                                        displayPWStats(imgIds);
                                    }
                                    CLICKED_ELEMENT[pictureDivName] = 'link';
                                    DISPLAYED_TARGETS[pictureDivName] = d.sourceName;
                                }
                                else {
                                    clearNetworkStats(clientName);
                                    DISPLAYED_TARGETS[pictureDivName] = '';
                                    CLICKED_ELEMENT[pictureDivName] = '';
                                }
                            } else {
                                if (clientName === 'totalTS') {
                                    displayTSStats(d);
                                }
                                else {
                                    displayPWStats(imgIds);
                                }
                                DISPLAYED_TARGETS[pictureDivName] = d.targetName;
                                CLICKED_ELEMENT[pictureDivName] = 'link';
                                highlightLink({ sourceName: '', targetName: '' }, { sourceName: d.sourceName, targetName: d.targetName }, true, true, pictureDivName);
                            }
                        });
                        const config = {
                            avatar_size: 150, // define the size of the circle radius
                        };
                        if (!defsLoaded) {
                            const body = d3.select('body');
                            const definitionSVG = body.append('svg');
                            const defs = definitionSVG.append('svg:defs');
                            iconData.forEach((d) => {
                                defs.append('svg:pattern')
                                    .attr('id', `${d.name}_icon`)
                                    .attr('patternContentUnits', 'objectBoundingBox')
                                    .attr('height', '1')
                                    .attr('width', '1')
                                    .append('svg:image')
                                    .attr('href', d.url)
                                    .attr('height', '1')
                                    .attr('width', '1');
                                    // .attr('transform', 'translate(' + translate[0] +','+ y+')');
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
                        .style('cursor', (d) => d.name === clientName ? 'default' : 'pointer')
                        .on('click', (d) => {
                            if (d.name !== clientName) {
                                const imgIds = d.picIDs?.split(',')?.slice(0, -1) ?? [];
                                if (imgIds.length === 0) { // Clicking on a node without an edge
                                    if (d.name === DISPLAYED_TARGETS[pictureDivName]) { // clearing the display
                                        highlightNode('', d.name, clientName, false, false, pictureDivName);
                                        DISPLAYED_TARGETS[pictureDivName] = '';
                                        CLICKED_ELEMENT[pictureDivName] = '';
                                        displayDefaultExplanation(pictureDivName);
                                    } else {
                                        // Network aeshetics
                                        highlightNode(DISPLAYED_TARGETS[pictureDivName], d.name, clientName, true, false, pictureDivName);
                                        DISPLAYED_TARGETS[pictureDivName] = d.name;
                                        CLICKED_ELEMENT[pictureDivName] = 'node';
                                        $(`.explanation-${pictureDivName}`).fadeOut(() => {
                                            console.log('test');
                                            $(`.explanation-${pictureDivName}`).html("OwO<br/>Looks like you don't have any pictures with this person!");
                                        }).fadeIn();
                                    }
                                } else if (clientName !== 'totalPW' && clientName !== 'totalTS') {
                                    if (d.name === DISPLAYED_TARGETS[pictureDivName]) { // clearing the displayed pictures
                                        // Network aeshetics:
                                        if (CLICKED_ELEMENT[pictureDivName] === 'link') {
                                            DISPLAYED_TARGETS[pictureDivName] = '';
                                            highlightLink({ sourceName: '', targetName: '' }, { sourceName: '', targetName: '' }, false, false, pictureDivName);
                                        }
                                        DISPLAYED_TARGETS[pictureDivName] = '';
                                        CLICKED_ELEMENT[pictureDivName] = '';
                                        highlightNode('', d.name, clientName, false, false, pictureDivName);
                                        
                                        //Picture to clear
                                        SECTION_TO_SLIDESHOW_IS_ACTIVE[pictureDivName] = false;
                                        SECTION_TO_SLIDESHOW_INDEX[pictureDivName] = 0;
                                        removeImage(`${pictureDivName}DisplayedPhoto`, 200).then(() => {
                                            displayDefaultExplanation(pictureDivName);
                                        });
                                        $(`.${pictureDivName}SlideshowCounter`).fadeOut();
                                        
                                    } else { // load a picture
                                        // Network aeshetics:
                                        highlightNode(DISPLAYED_TARGETS[pictureDivName], d.name, clientName, true, false, pictureDivName);
                                        CLICKED_ELEMENT[pictureDivName] = 'node';
                                        DISPLAYED_TARGETS[pictureDivName] = d.name;

                                        // Picture to display
                                        $(`.explanation-${pictureDivName}`).fadeOut('fast');
                                        SECTION_TO_SLIDESHOW_IS_ACTIVE[pictureDivName] = true;
                                        SECTION_TO_SLIDESHOW_LENGTH[pictureDivName] = imgIds.length;
                                        SECTION_TO_IMG_IDS[pictureDivName] = imgIds;
                                        const imgId = imgIds[0];
                                        logIfNullImageId(imgId, 0, imgIds);
                                        removeImage(`${pictureDivName}DisplayedPhoto`, 200).then(() => {
                                            loadImage(pictureDivName, imgId, projectPath, storage)
                                        });
                                        SECTION_TO_SLIDESHOW_INDEX[pictureDivName] = 0;
                                        $(`.${pictureDivName}SlideshowCounter`).html(`${1} / ${imgIds.length}`);
                                        $(`.${pictureDivName}SlideshowCounter`).fadeIn();
                                    }
                                } else if (d.name === DISPLAYED_TARGETS[pictureDivName]) {
                                    highlightNode('', '', clientName, false, true, pictureDivName);
                                    if (CLICKED_ELEMENT[pictureDivName] === 'link') {
                                        highlightNode('', d.name, clientName, true, true, pictureDivName);
                                        CLICKED_ELEMENT[pictureDivName] = 'node';
                                        DISPLAYED_TARGETS[pictureDivName] = d.name;
                                    } else {
                                        DISPLAYED_TARGETS[pictureDivName] = '';
                                        clearNetworkStats(clientName);
                                        CLICKED_ELEMENT[pictureDivName] = '';
                                    }
                                } else {
                                    highlightNode(DISPLAYED_TARGETS[pictureDivName], d.name, clientName, true, true, clientName);
                                    DISPLAYED_TARGETS[pictureDivName] = d.name;
                                    clearNetworkStats(clientName);
                                    CLICKED_ELEMENT[pictureDivName] = 'node';
                                }
                            }
                        }
                    );
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
                    } else {
                        d3.forceSimulation(networkData.nodes)
                            .force('link', d3.forceLink() // This force provides links between nodes
                            .id((d) => d.id) // This provides the id of a node
                            .links(networkData.links))
                            .force('charge', d3.forceManyBody().strength(-5000)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
                            .force('center', d3.forceCenter(networkWidth / 2, networkHeight / 2)) // This force attracts nodes to the center of the svg area
                            .on('tick', networkTicked)
                            .alphaTarget(0.1);
                    }
                });
            });
        })
};
