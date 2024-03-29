import { CIRCLES_STROKE_WIDTH } from "./networkGraphs.js";
import { getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";


const processTop3 = (data, clientName) => {
    const clientData = [];
    data.forEach((row) => {
        if (clientName === row.client) {
            Object.entries(row).forEach(([targetName, targetData]) => {
                clientData.push({ target: targetName, value: targetData.split(',')?.slice(0, -1)?.length ?? 0 });
            });
        }
    });
    clientData.sort((a, b) => b.value - a.value);
    return clientData.slice(0, 3);
};
const rankingIconHeight = 130;
export const columnOneColors = [
    '#ed0003',
    '#f02800',
    '#f23c00',
];
export const columnTwoColors = [
    '#f54b00',
    '#f75900',
    '#f96500',
];
export const columnThreeColors = [
    '#fb7100',
    '#fd7b00',
    '#ff8600',
];
export const drawTop3Stats = (clientName, dataFileName, rankingName, colors, storage, project) => {
    const reference = storageRef(storage, `data/${project}/${dataFileName}.csv`);
    getDownloadURL(reference)
        .then((url) => {
            d3.csv(url, (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const top3 = processTop3(data, clientName);
                top3.forEach((cellData, colorIndex) => {
                    const rankingSpot = d3.select(`.${rankingName}`)
                        .append('div')
                        .classed('rankingSpot', true)
                        .classed(cellData.target + rankingName, true)
                        .append('svg')
                        .attr('height', rankingIconHeight)
                        .attr('width', rankingIconHeight)
                        .append('g')
                        .attr('transform', `translate(${rankingIconHeight / 2},${rankingIconHeight / 2})`);
                    rankingSpot.append('circle')
                        .attr('class', `${cellData.target}Circle`)
                        .attr('r', (0.9 * 130) / 2)
                        .style('fill', `url(#${cellData.target}_icon)`)
                        .style('stroke', () => colors[colorIndex])
                        .style('stroke-width', CIRCLES_STROKE_WIDTH);
                    d3.select(`.${cellData.target}${rankingName}`)
                        .append('div')
                        .classed('rankingSpotValue', true)
                        .html(`${cellData.value} times`);
                });
            });
        })
};
