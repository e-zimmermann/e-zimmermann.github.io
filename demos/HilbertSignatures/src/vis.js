
// Init svg element
clearVisSVG();

/**
 * Generates the 1D plots per available point sets, i.e., for each point set we determine the radial neighbors
 * XOR distance to nearest neighbor per sample. Then each point set gets one column.
 */
function drawVis1D() {
    // Start time measurement
    let startTime = performance.now();

    // If no points we return here
    areTherePoints();

    // Calculate values
    let values = new Array(data.length);
    let logs = new Array(data.length);
    let minMax = new Array(data.length);
    let globalMinMax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    let coverageString = "Point Coverage: ";

    // If local radii are to be used
    if (useLocalRadii) {
        // If not defined then compute them
        if (localRadii == undefined) {
            calculateLocalRadii();
        }
        // Get local radius
        radius = localRadii[currentPointSetIndex];
    }

    for (let psi = 0; psi < data.length; psi++) {
        logs[psi] = { coverage: 0 };
        // Get local radius
        if (useLocalRadii) {
            radius = localRadii[psi];
        }
        values[psi] = numOfNeighborsXORDistanceToNN(data[psi].points, samples, radius, logs[psi]);

        // Get coverage
        coverageString += (logs[psi].coverage / data[psi].points.length).toFixed(2) + " | ";

        // Determine min and max
        // We do not treat minMax further, because of the following:
        // i) 0 is not an element in values
        // ii) If min > 0, then we do not have any distance to NN (thus we do not have to normalize these values anyway)
        // iii) If min < 0 we just normalize negative values by the minimum, which is negative.
        // iv) Same holds for max. If max < 0 we do no have any amount number values anyway, thus no normalization necessary.
        minMax[psi] = [Math.min(...values[psi]), Math.max(...values[psi])];

        if (globalNormalization) {
            if (minMax[psi][0] < globalMinMax[0]) globalMinMax[0] = minMax[psi][0];
            if (minMax[psi][1] > globalMinMax[1]) globalMinMax[1] = minMax[psi][1];
        }
    }

    // Print coverage in infoDiv
    document.getElementById("pointsCoverageLabel").textContent = coverageString;

    // Clear SVG content
    clearVisSVG();

    // Check normalization
    if (globalNormalization) {
        for (let psi = 0; psi < data.length; psi++) {
            minMax[psi][0] = globalMinMax[0];
            minMax[psi][1] = globalMinMax[1];
        }
    }

    // Set rect angles etc.
    let dX = 1 / data.length;
    let dY = 1 / samples.length;
    let rectWidth = visSVGWidth / data.length;
    let rectHeight = visSVGHeight / samples.length;
    // Draw values
    for (let psi = 0; psi < data.length; psi++) {
        let posX = psi * dX;

        // Draw content w.r.t. values
        visSVG.selectAll("rects").data(values[psi]).enter().append("rect")
            .attr("id", (d, i) => "rect_" + i)
            .attr("x", (d, i) => mapX(posX)).attr("y", (d, i) => mapY((i + 1) * dY))
            .attr("width", rectWidth).attr("height", rectHeight)
            .attr("fill", (d, i) => values[psi][i] > 0 ?
                generateRGB(evaluate_cmap(values[psi][i] / minMax[psi][1], colormap1, false)) :
                generateRGB(evaluate_cmap(values[psi][i] / minMax[psi][0], colormap2, false)))
            .on("mousedown", (d, i) => {
                if (activePC) {
                    // Get current radius
                    if (useLocalRadii) radius = localRadii[currentPointSetIndex];

                    // Get sample index
                    let index = parseInt((d.target.id).split("_")[1]);
                    w("Sample index " + index);
                    // Get neighborhood from points cast from sample
                    let nhd = neighbors(points, samples[index], radius);

                    // Toggle visibility w.r.t. nhd
                    highlightSelection(nhd);
                }
            })
    }

    let endTime = performance.now();
    diffTime = endTime - startTime;
    w("Time: " + (diffTime)+" ms");
}

/**
 * Generates the sample-2-sample mapping, i.e., for the given samples we determine the number of radial neighbors
 * XOR distance to nearest neighbor per sample. And then we map the normalized values along samples2D.
 */
function drawVis2D() {
    // Start time measurement
    let startTime = performance.now();

    // If no points we return here
    areTherePoints();

    // Calculate values and log point coverage
    let log = { coverage: 0 };
    // If local radii are to be used
    if (useLocalRadii) {
        // If not defined then compute them
        if (localRadii == undefined) {
            calculateLocalRadii();
        }
        // Get local radius
        radius = localRadii[currentPointSetIndex];
    }

    let values = numOfNeighborsXORDistanceToNN(points, samples, radius, log);

    // Print coverage in infoDiv
    document.getElementById("pointsCoverageLabel").textContent = "Point Coverage: " + (log.coverage / points.length).toFixed(3)

    // Determine min and max
    // We do not treat minMax further, because of the following:
    // i) 0 is not an element in values
    // ii) If min > 0, then we do not have any distance to NN (thus we do not have to normalize these values anyway)
    // iii) If min < 0 we just normalize negative values by the minimum, which is negative.
    // iv) Same holds for max. If max < 0 we do no have any amount number values anyway, thus no normalization necessary.
    let minMax = [Math.min(...values), Math.max(...values)];

    // Clear SVG content
    clearVisSVG();

    // Set up rectangles, i.e., they scale w.r.t. resolution as power of 2 w.r.t. iteration p of 2D HC.
    let h = Math.sqrt(samples2D.length);
    let rectWidth = visSVGWidth / h;
    let rectHeight = rectWidth;
    let rescale = 1 - 1 / h;

    // Draw content w.r.t. values
    visSVG.selectAll("rects").data(samples2D).enter().append("rect")
        .attr("id", (d, i) => "rect_" + i)
        .attr("x", (d) => mapX(d[0]) * rescale).attr("y", (d) => mapY(d[1]) * rescale)
        .attr("width", rectWidth).attr("height", rectHeight)
        .attr("fill", (d, i) => values[i] > 0 ?
            generateRGB(evaluate_cmap(values[i] / minMax[1], colormap1, false)) :
            generateRGB(evaluate_cmap(values[i] / minMax[0], colormap2, false)))
        .on("mousedown", (d, i) => {
            if (activePC) {
                // Get sample index
                let index = parseInt((d.target.id).split("_")[1]);
                w("Sample index " + index);
                // Get neighborhood from points cast from sample
                let nhd = neighbors(points, samples[index], radius);

                // Toggle visibility w.r.t. nhd
                highlightSelection(nhd);
            }
        })

    let endTime = performance.now();
    diffTime = endTime - startTime;
    //w("Time: " + (diffTime)+" ms");
}

/**
 * For a given set if point indices we toggle the visibility (highlight) in the
 * PC and t-SNE plot for reference.
 * @param {*} nhd Array of point indices.
 */
function highlightSelection(nhd) {
    if (highlightCounter == undefined) {
        highlightCounter = new Array(points.length).fill(-1);
    }

    if (activePC) {
        // Set off colors in linked vis
        // Reset everything if we only consider one highlight
        if (highlightIndex == 0) {
            d3.selectAll(".pcLines").style("stroke", inactiveColor);
            if (nhd.length != 0) {
                d3.selectAll(".pcLines").style("opacity", inactiveOpacity);
            }
            else {
                d3.selectAll(".pcLines").style("opacity", 1);
            }

            // Also reset highlightCounter array
            highlightCounter = new Array(points.length).fill(-1);
        }

        // If there are neighbors update highlight array
        // -1 => not assigned, >= 0 => already assigned
        if (nhd.length != 0) {
            // Set point index to highlight color
            for (let i in nhd) {
                if (highlightCounter[nhd[i]] == -1) {
                    highlightCounter[nhd[i]] = highlightIndex;
                }
            }
        }

        // Color linked vis instances
        let underCovered = [];
        let overCovered = [];
        for (let dim = 0; dim < pointDim - 1; dim++) {
            for (let j in highlightCounter) {
                if (highlightCounter[j] == -1) {
                    document.getElementById("lvl_" + dim + "_" + j).style.stroke = inactiveColor;
                    document.getElementById("lvl_" + dim + "_" + j).style.opacity = inactiveOpacity;
                    if (!underCovered.includes(j)) {
                        underCovered.push(j);
                    }
                }
                else if (highlightCounter[j] != -2) {
                    document.getElementById("lvl_" + dim + "_" + j).style.stroke = highlightColors[highlightCounter[j]];
                    document.getElementById("lvl_" + dim + "_" + j).style.opacity = 1.;
                }
                else {
                    document.getElementById("lvl_" + dim + "_" + j).style.stroke = "red";
                    document.getElementById("lvl_" + dim + "_" + j).style.opacity = 1.;
                    if (!underCovered.includes(j)) {
                        underCovered.push(j);
                    }
                }

            }
        }

        w("Num of Points under covered: " + underCovered.length);
        w("Num of Points over covered: " + overCovered.length);
    }
}

/**
 * For a given set if point indices we toggle the visibility (highlight) in the
 * PC and t-SNE plot for reference.
 * @param {*} nhd Array of point indices.
 */

/**
 * Clears the visSVG and attaches a new svg element with defined width and height.
 */
function clearVisSVG() {
    let margin = 2 * visMargin;
    d3.select("#visSVG").remove();
    visSVG = d3.select("#visDiv").append("svg").attr("id", "visSVG")
        .attr("width", visSVGWidth + margin).attr("height", visSVGHeight + margin)
}

/**
 * Maps from [0,1] -> [0, visSVGWidth]
 * @param {*} x Value in [0,1].
 * @returns Value in [0, visSVGWidth].
 */
function mapX(x) { return visSVGWidth * x + visMargin; }

/**
 * Maps from [0,1] -> [0, visSVGHeight]
 * @param {*} y Value in [0,1].
 * @returns Value in [0, visSVGHeight].
 */
function mapY(y) { return visSVGHeight * (1 - y) + visMargin; }