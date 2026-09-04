// Variables
var pcSVG;
var tsneSVG;
var pts2DSVG;

/**
 * Generates the Parallel Coordinates plot of the currently selected point set.
 * We assume point data to sit in unit hypercube.
 */
function generatePCPlot() {
    // Clear svg content
    let margin = 2 * linkedVisMargin;
    d3.select("#pcVisSVG").remove();
    pcSVG = d3.select("#pcDiv").append("svg").attr("id", "pcVisSVG")
        .attr("width", linkedVisSVGWidth + margin).attr("height", linkedVisSVGHeight + margin)

    // Increment in x direction for pointDim many coordinates
    let dX = 1 / (pointDim - 1);
    let classColors = getClassColors(numOfClasses);
    // Draw axes
    let dDim = 1 / (pointDim - 1);
    for (let dim = 0; dim < pointDim; dim++) {
        let xDim = dim * dDim;
        pcSVG.append("line")
            .attr("x1", mapX_lv(xDim)).attr("y1", (d, i) => mapY_lv(0))
            .attr("x2", mapX_lv(xDim)).attr("y2", (d, i) => mapY_lv(1))
            .attr("stroke", "black")
    }

    // Pass all corodinates connecting current with successor (therefore we walk one short)
    for (let dim = 0; dim < pointDim - 1; dim++) {
        let x1 = mapX_lv(dim * dX);
        let x2 = mapX_lv((dim + 1) * dX);
        pcSVG.selectAll("pcLines").data(points).enter().append("line")
            .attr("class", "pcLines").attr("id", (d, i) => "lvl_" + dim + "_" + i)
            .attr("x1", x1).attr("y1", (d, i) => mapY_lv(points[i][dim]))
            .attr("x2", x2).attr("y2", (d, i) => mapY_lv(points[i][dim + 1]))
            //.attr("stroke", (d, i) => classColors[classes[i]])
            .attr("stroke", inactiveColor)
            .attr("stroke-width", pcStrokeWidth)
    }
}

/**
 * Removes the PC Plot svg content
 */
function removeLinkedPlot(svgClass) {
    // Clear svg content
    d3.select("#" + svgClass).remove();
}

/**
 * Generates the t-SNE plot of a loaded set.
 * We assume point data to sit in unit hypercube.
 */
function generateTSNEPlot() {
    // Clear svg content
    let margin = 2 * linkedVisMargin;
    d3.select("#tnseVisSVG").remove();
    tsneSVG = d3.select("#tsneDiv").append("svg").attr("id", "tnseVisSVG")
        .attr("width", linkedVisSVGWidth + margin).attr("height", linkedVisSVGHeight + margin)

    let classColors = getClassColors(numOfClasses);
    tsneSVG.selectAll("tsneCircles").data(tsneData).enter().append("circle")
        .attr("class", "tsneCircles").attr("id", (d, i) => "tsneCircle_" + i)
        .attr("cx", (d) => mapX_lv(d[0])).attr("cy", (d) => mapY_lv(d[1]))
        //.attr("r", 5).attr("fill", (d, i) => classColors[classes[i]]);
        .attr("r", 5).attr("fill", inactiveColor)
}


/**
 * Generates a plot of the 2D HC for a loaded curve. If none was loaded
 * it generates a default curve. Allows to fill in points to be processed in 2D.
 */
function generatePts2DPlot() {
    // Clear svg content
    let margin = 2 * linkedVisMargin;
    d3.select("#pts2DVisSVG").remove();
    pts2DSVG = d3.select("#tsneDiv").append("svg").attr("id", "pts2DVisSVG")
        .attr("width", linkedVisSVGWidth + margin).attr("height", linkedVisSVGHeight + margin)

    // Map current points of loaded samples
    let edges = [...Array(samples2D.length - 1).keys()];
    // Generate edges
    pts2DSVG.selectAll("pts2Dedges").data(edges).enter().append("line")
        .attr("x1", (d) => mapX_lv(samples2D[d][0])).attr("y1", (d) => mapY_lv(samples2D[d][1]))
        .attr("x2", (d) => mapX_lv(samples2D[d + 1][0])).attr("y2", (d) => mapY_lv(samples2D[d + 1][1]))
        .attr("stroke", "black")
        .attr("stroke-width", 8)
    //.attr("stroke", inactiveColor)
    // Generate points
    pts2DSVG.selectAll("pts2Ddots").data(samples2D).enter().append("circle")
        .attr("cx", (d) => mapX_lv(d[0])).attr("cy", (d) => mapY_lv(d[1]))
        //.attr("r", 8).attr("fill", inactiveColor)
        .attr("r", 8).attr("fill", "black")
        //.attr("r", 16).attr("fill", "orange")

    // Load existing samples
    if (pointDim == 2 && points.length != 0) {
        pts2DSVG.selectAll("pts2DNew").data(points).enter().append("circle")
            .attr("class", "pts2D")
            .attr("cx", (d) => mapX_lv(d[0])).attr("cy", (d) => mapY_lv(d[1]))
            .attr("r", 5).attr("fill", "orange");
    }

    // Add new custom panel points by click
    pts2DSVG.on("click", function (d) {
        let x = normalizeX(d.offsetX);
        let y = normalizeY(d.offsetY);
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
            pts2DSVG.append("circle")
                .attr("class", "pts2D")
                .attr("cx", d.offsetX).attr("cy", d.offsetY)
                .attr("r", 5).attr("fill", "orange");
            // Add 2D coordinates
            points.push([x, y]);
            pointset.numOfPoints += 1;
        }
    });
}

/**
 * Only removes the drawn points from the SVG element and resets the points array.
 */
function removePtsFromPts2DPlot() {
    d3.selectAll(".pts2D").remove();
    data[currentPointSetIndex].numOfPoints = 0;
    data[currentPointSetIndex].points = [];
    pointset = data[currentPointSetIndex];
    points = data[currentPointSetIndex].points;
}

/**
 * Maps from [0,1] -> [0, visSVGWidth]
 * Internally shifts by linkedVisMargin on all four sides.
 * * Linked view version (lv)
 * @param {*} x Value in [0,1].
 * @returns Value in [0, visSVGWidth].
 */
function mapX_lv(x) { return linkedVisSVGWidth * x + linkedVisMargin; }

/**
 * Maps from [0,1] -> [0, visSVGHeight]
 * Internally shifts by linkedVisMargin on all four sides.
 * Linked view version (lv)
 * @param {*} y Value in [0,1].
 * @returns Value in [0, visSVGHeight].
 */
function mapY_lv(y) { return linkedVisSVGHeight * (1 - y) + linkedVisMargin; }

/**
 * Normalizes the screen coordiantes from click event (x coordinate) to be stored as point.
 * @param {*} x Div coordinate taken from mouse event offsetX.
 * @returns Normalized coordinate in [0,1].
 */
function normalizeX(x) { return (x - linkedVisMargin) / linkedVisSVGWidth; }

/**
 * Normalizes the screen coordiantes from click event (y coordinate) to be stored as point.
 * @param {*} y Div coordinate taken from mouse event offsetY.
 * @returns Normalized coordinate in [0,1].
 */
function normalizeY(y) { return 1 - (y - linkedVisMargin) / linkedVisSVGHeight; }