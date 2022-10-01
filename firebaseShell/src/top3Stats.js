import { CIRCLES_STROKE_WIDTH } from "./networkGraphs.js";
const processTop3 = (data, clientName) => {
    const clientData = [];
    data.forEach((row) => {
        if (clientName === row.client) {
            Object.entries(row).forEach(([targetName, targetData]) => {
                var _a, _b, _c;
                clientData.push({ target: targetName, value: (_c = (_b = (_a = targetData.split(',')) === null || _a === void 0 ? void 0 : _a.slice(0, -1)) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0 });
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
export const drawTop3Stats = (clientName, dataFileName, rankingName, colors) => {
    console.log(clientName);
    d3.csv(`/scripts/data/${dataFileName}.csv`, (data) => {
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
};
