var comVisSVG;

/**
 * Generate a parallel coordinates plot for each subset and stack them side-by-side.
 * Note that each PC plot has the following orientation: The axis are sorted
 * bottom-up and the values are marked from left-to-right. Each point set is separated
 * by a highlight color from the next.
 */
function drawComVisPC() {
    // If no points we return here
    areTherePoints();

    let margin = 2 * visMargin;
    d3.select("#comVisSVG").remove();
    comVisSVG = d3.select("#comVisDiv").append("svg").attr("id", "comVisSVG")
        .attr("width", visSVGWidth + margin).attr("height", visSVGHeight + margin)

    let dX = 1 / data.length;
    let dY = 1 / (pointDim - 1);
    // Draw axes
    for (let i = 0; i < pointDim; i++) {
        comVisSVG.append("line")
            .attr("x1", mapX(0)).attr("y1", mapY(dY * i))
            .attr("x2", mapX(1)).attr("y2", mapY(dY * i))
            .attr("stroke", "black")
    }


    // Draw individual pc plots
    for (let psi = 0; psi < data.length; psi++) {
        let psiDX = psi * dX;
        // Pass all corodinates connecting current with successor (therefore we walk one short)
        for (let dim = 0; dim < pointDim - 1; dim++) {
            let y1 = mapY(dim * dY);
            let y2 = mapY((dim + 1) * dY);
            comVisSVG.selectAll("comVisPCLines").data(data[psi].points).enter().append("line")
                .attr("class", "comVisPCLines")
                .attr("x1", (d, i) => mapX(psiDX + data[psi].points[i][dim] / data.length)).attr("y1", y1)
                .attr("x2", (d, i) => mapX(psiDX + data[psi].points[i][dim + 1] / data.length)).attr("y2", y2)
                .attr("stroke", inactiveColor)
        }
    }

    // Draw separators
    for (let i = 0; i <= data.length; i++) {
        comVisSVG.append("line")
            .attr("x1", mapX(dX * i)).attr("y1", mapY(0))
            .attr("x2", mapX(dX * i)).attr("y2", mapY(1))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
    }
}

/**
 *
 */
function drawComVisTV() {
    // If no points we return here
    areTherePoints();

    // Set up svg element
    let margin = 2 * visMargin;
    d3.select("#comVisSVG").remove();
    comVisSVG = d3.select("#comVisDiv").append("svg").attr("id", "comVisSVG")
        .attr("width", visSVGWidth + margin).attr("height", visSVGHeight + margin)

    let dX = 1 / data.length;
    let dXLocal = dX / (pointDim);

    let rectWidth = visSVGWidth*dXLocal;

    // Draw individual pc plots
    for (let psi = 0; psi < data.length; psi++) {
        let dY = 1 / data[psi].numOfPoints;
        let rectHeight = visSVGHeight * dY;
        // Local split of column (point set) into dimensions
        let psiDX = psi * dX;

        for (let pi = 0; pi < data[psi].numOfPoints; pi++) {
            // Needs to get reshifted as rects are built from top-left to bottom-right
            let y = mapY((pi + 1) * dY);
            comVisSVG.selectAll("comVisTVRects").data(data[psi].points[pi]).enter().append("rect")
                .attr("x", (d, i) => mapX(psiDX + i * dXLocal)).attr("y", y)
                .attr("width", rectWidth).attr("height", rectHeight)
                .attr("fill", (d) => generateRGB(evaluate_cmap(d, colormap1, false)))
        }
    }

    // Draw separators
    for (let i = 0; i <= data.length; i++) {
        comVisSVG.append("line")
            .attr("x1", mapX(dX * i)).attr("y1", mapY(0))
            .attr("x2", mapX(dX * i)).attr("y2", mapY(1))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
    }
}



/**
 * Clears the content of the comVis svg element.
 */
function clearComVisSVG() {
    d3.select("#comVisSVG").remove();
}