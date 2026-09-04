/**
 * Prints to console.
 * @param {*} s String to be written.
 */
function w(s) { console.log(s) };

/**
 * Generates the RGB color string for a given array.
 * @param {*} rgbArray
 * @returns
 */
function generateRGB(rgbArray) {
    return "rgb(" + rgbArray[0] + "," + rgbArray[1] + "," + rgbArray[2] + ")";
}

/**
 * Determine array of colors. Number of colors to be generated via hsla.
 * @param {*} numOfClasses Number of colors.
 * @returns Array of colors.
 */
function getClassColors(numOfClasses) {
    let colors = new Array(numOfClasses);
    for (let i = 0; i < numOfClasses; i++) {
        colors[i] = getClassColor(i, numOfClasses);
    }

    return colors;
}

/**
 * Get class color.
 * @param {*} classID Natural number.
 * @returns Color.
 */
function getClassColor(classID, numOfClasses) {
    return interpolateColorHSL(360 * classID / numOfClasses, 100, 50);
}

/**
 * Return HSLA color for given values.
 * @param {*} h Hue value ranging from 0 up to 360.
 * @param {*} s Saturation as percentage from 0 up to 100.
 * @param {*} l Lightness as percentage from 0 up to 100.
 * @returns String encoding the corresponding color.
 */
function interpolateColorHSL(h, s, l) {
    return "hsla(" + h + "," + s + "%," + l + "%,1.00)";
}

/**
 * Checks whether the currently referenced points array containes points.
 * If so return true, otherwise false.
 */
function areTherePoints() {
    if (points.length == 0) {
        w("Warning: No points available. Thus stopped.");
        return;
    }
}


/**
 * Helper function to draw the n-dim to 2-dim mapping in vis2D for print.
 * Only uses n=2, p=2 for the curve with 16 points.
 */
function drawVis2DMappingForPrint() {
    clearVisSVG();

    // Draw axes grid
    let dX = 1 / 4;
    let x;
    for (let i = 0; i <= 4; i++) {
        x = i * dX;
        visSVG.append("line")
            .attr("x1", mapX(x)).attr("y1", mapY(0)).attr("x2", mapX(x)).attr("y2", mapY(1))
            .attr("stroke", "black").attr("stroke-width", 2)
        visSVG.append("line")
            .attr("x1", mapX(0)).attr("y1", mapY(x)).attr("x2", mapX(1)).attr("y2", mapY(x))
            .attr("stroke", "black").attr("stroke-width", 2)
    }

    // Draw connectors
    let pts = [[0, 0], [0.3333333333333333, 0], [0.3333333333333333, 0.3333333333333333], [0, 0.3333333333333333], [0, 0.6666666666666666], [0, 1], [0.3333333333333333, 1], [0.3333333333333333, 0.6666666666666666], [0.6666666666666666, 0.6666666666666666], [0.6666666666666666, 1], [1, 1], [1, 0.6666666666666666], [1, 0.3333333333333333], [0.6666666666666666, 0.3333333333333333], [0.6666666666666666, 0], [1, 0]];
    // Transform points
    let rescale = 3 / 4;
    let translate = 0.125;
    for (let i = 0; i < pts.length; i++) {
        pts[i][0] = pts[i][0] * rescale + translate;
        pts[i][1] = pts[i][1] * rescale + translate;
    }
    let edges = [...Array(pts.length - 1).keys()];
    visSVG.selectAll("printEdges").data(edges).enter().append("line")
        .attr("x1", (d) => mapX(pts[d][0])).attr("y1", (d) => mapY(pts[d][1]))
        .attr("x2", (d) => mapX(pts[d + 1][0])).attr("y2", (d) => mapY(pts[d + 1][1]))
        .attr("stroke", highlightColor)
        .attr("stroke-width", 4)

    // Draw points
    visSVG.selectAll("pts2Ddots").data(pts).enter().append("circle")
        .attr("cx", (d) => mapX(d[0])).attr("cy", (d) => mapY(d[1]))
        .attr("r", 5).attr("fill", highlightColor)
}

/**
 * Helper function to draw the n-dim to 1-dim mapping in vis1D for print.
 * Only uses n=2, p=2 for the curve with 16 points.
 */
function drawVis1DMappingForPrint() {
    clearVisSVG();

    // Draw axes grid
    let x1 = 0;
    let x2 = 1 / 4;
    let dY = 1 / 16;
    let y;
    visSVG.append("line").attr("x1", mapX(x1)).attr("y1", mapY(0)).attr("x2", mapX(x1)).attr("y2", mapY(1)).attr("stroke", "black").attr("stroke-width", 2)
    visSVG.append("line").attr("x1", mapX(x2)).attr("y1", mapY(0)).attr("x2", mapX(x2)).attr("y2", mapY(1)).attr("stroke", "black").attr("stroke-width", 2)
    for (let i = 0; i <= 16; i++) {
        y = i * dY;
        visSVG.append("line")
            .attr("x1", mapX(x1)).attr("y1", mapY(y)).attr("x2", mapX(x2)).attr("y2", mapY(y))
            .attr("stroke", "black").attr("stroke-width", 2)
    }

    let pts = [];
    let translate = 1 / 32;
    let x = 0.5 * (x1 + x2);
    for (let i = 0; i < 16; i++) {
        pts.push([x, i * dY + translate]);
    }
    let edges = [...Array(pts.length - 1).keys()];
    visSVG.selectAll("printEdges").data(edges).enter().append("line")
        .attr("x1", (d) => mapX(pts[d][0])).attr("y1", (d) => mapY(pts[d][1]))
        .attr("x2", (d) => mapX(pts[d + 1][0])).attr("y2", (d) => mapY(pts[d + 1][1]))
        .attr("stroke", highlightColor)
        .attr("stroke-width", 4)

    // Draw points
    visSVG.selectAll("pts2Ddots").data(pts).enter().append("circle")
        .attr("cx", (d) => mapX(d[0])).attr("cy", (d) => mapY(d[1]))
        .attr("r", 5).attr("fill", highlightColor)
}

/**
 * Helper function to draw the used color bar for print.
 */
function drawColorForPrint() {
    clearVisSVG();
    let res = 200;

    // Print lower half
    let dY = 1 / (2 * res);
    let x1 = 0;
    let x2 = 1 / 4;

    y = 0;
    let rW = mapX(x2);
    let rH = mapY(1 - dY);
    let value;
    for (let i = 0; i < res; i++) {
        value = 2 * y;
        if (value > 1) value = 1;
        visSVG.append("rect").attr("x", mapX(x1)).attr("y", mapY(y))
            .attr("width", rW).attr("height", rH)
            .attr("fill", generateRGB(evaluate_cmap(value, colormap2, true)))
        y += dY;
    }
    // Print upper half
    y = 0;
    for (let i = res; i < 2 * res; i++) {
        w(i + " " + 2 * y)
        value = 2 * y;
        if (value > 1) value = 1;
        visSVG.append("rect").attr("x", mapX(x1)).attr("y", mapY((i + 1) * dY))
            .attr("width", rW).attr("height", rH)
            .attr("fill", generateRGB(evaluate_cmap(value, colormap1, false)))
        y += dY;
    }
}

/**
 *
 */
function lineDiagramHelper() {
    // p fixed: p = 3, s = 64, ..., 2048
    /* let dataArr = [
        [1.1770326032368708,1.2413195023077244,1.0432062343007424,1.3545923333526388,0.8150619637082639,1.0837423784750817,0.9715543174855371,1.024422584394605,1.1549946431646247,0.9842289991851193,1.7638361100310382,1.332896932245246,0.8333888683279299,1.398439880853896,0.8024443751694909,1.1752056220909854,1.2735200450039603,1.0861973843898656,1.005182189201996,0.8448645936505246,1.2320704102566782,0.8917380786746548,0.9468900720160799],
        [0.960421151127796,1.2413195023077244,0.9538554376347693,1.3545923333526388,0.8150619637082639,1.0837423784750817,0.9715543174855371,0.9341012039948801,1.1398078623894499,0.9842289991851193,1.7638361100310382,1.0001008978900012,0.8333888683279299,1.398439880853896,0.8024443751694909,1.1600188413158106,1.2735200450039603,1.0861973843898656,0.958023238373821,0.8448645936505246,1.2320704102566782,0.8917380786746548,0.9181151189683799],
        [0.960421151127796,1.1617316361400785,0.9538554376347693,1.25913256848011,0.8150619637082639,1.0640452379960013,0.9715543174855371,0.915603019892787,1.1398078623894499,0.9842289991851193,1.603746887122803,1.0001008978900012,0.8333888683279299,1.315768984002567,0.8024443751694909,1.11474396479433,1.1608181455671356,1.0442910043561122,0.958023238373821,0.8448645936505246,1.1516832398377068,0.8917380786746548,0.9126341755307229],
        [0.8442365688816263,1.1617316361400785,0.8991030964190068,1.1051523137784298,0.695166326009514,1.0640452379960013,0.8129495167583337,0.9152604609279335,0.7676175470760443,0.8671309263660067,1.603746887122803,0.9077812568619639,0.6690176583590246,1.315768984002567,0.7136074169507979,1.11474396479433,1.1608181455671356,1.0442910043561122,0.8301916513226301,0.7669324291463372,1.1516832398377068,0.8634769640742352,0.9126341755307229],
        [0.7061282128848283,1.0130610453936284,0.7156627707399194,0.8958487862528978,0.5508919086453515,0.8570825300636353,0.6665055592834319,0.8756378073265371,0.7676175470760443,0.8280221112118907,1.3400906705071707,0.8227124472566603,0.5329075629905391,1.0531975374423048,0.5858329230604159,0.9119490576010157,1.0213966468717317,0.8445791278464799,0.6760972102993319,0.5808087249092303,0.9720110627720085,0.7089257777644659,0.6875158424611176],
        [0.7061282128848283,1.0130610453936284,0.7156627707399194,0.8958487862528978,0.5508919086453515,0.8202574413418765,0.6665055592834319,0.8756378073265371,0.7676175470760443,0.8280221112118907,1.3400906705071707,0.8227124472566603,0.5329075629905391,1.0531975374423048,0.5858329230604159,0.9119490576010157,0.8017021640789748,0.8445791278464799,0.6760972102993319,0.5808087249092303,0.9575664930873495,0.7089257777644659,0.6875158424611176]
    ]; */
    // s fixed: s = 256, p=1, ..., 6
    let dataArr = [
        [1.0647303559257084,1.3185094557213957,1.0477736871654568,1.3545923333526388,0.8150619637082639,1.0837423784750817,0.9715543174855371,1.040351576260296,1.2780874978686747,1.0161440760773102,1.677282878244703,1.1231366594332424,0.8333888683279299,1.2883642668142816,0.8024443751694909,1.1600188413158106,1.2735200450039603,1.1054948727432836,1.0591352261664335,0.9225112923506675,1.2103750091492853,1.0038119533425818,0.9468900720160799],
        [0.960421151127796,1.1484860228324067,0.9538554376347693,1.2925891607141424,0.8150619637082639,1.0409225078683852,0.9715543174855371,0.915603019892787,1.170638169226271,0.9842289991851193,1.6152797056062065,1.0001008978900012,0.8333888683279299,1.2933884649654672,0.8024443751694909,1.0739223548159462,1.1346694779166462,1.0011285747845622,0.958023238373821,0.8448645936505246,1.109091741874246,0.8917380786746548,0.8907674949409032],
        [0.960421151127796,1.1617316361400785,0.9538554376347693,1.25913256848011,0.8150619637082639,1.0640452379960013,0.9715543174855371,0.915603019892787,1.1398078623894499,0.9842289991851193,1.603746887122803,1.0001008978900012,0.8333888683279299,1.315768984002567,0.8024443751694909,1.11474396479433,1.1608181455671356,1.0442910043561122,0.958023238373821,0.8448645936505246,1.1516832398377068,0.8917380786746548,0.9126341755307229],
        [0.9427793644378372,1.1756623673774569,0.9538554376347693,1.2495409174642103,0.8150619637082639,1.082543422098094,0.9715543174855371,0.9769781677623854,1.1317006335545818,0.9842289991851193,1.602262464941771,1.0001008978900012,0.8333888683279299,1.3106305995297638,0.8024443751694909,1.139636582907023,1.1797730749556994,1.0686697840215247,0.958023238373821,0.8448645936505246,1.176918416915253,0.8917380786746548,0.8977328605595924],
        [0.9338728313516443,1.1835412235690888,0.9538554376347693,1.2460011414940566,0.8150619637082639,1.0750642180321244,0.9715543174855371,0.9840577197026925,1.1289030686749442,0.9842289991851193,1.602148278620153,1.0001008978900012,0.8333888683279299,1.3067482645947566,0.8024443751694909,1.152368357767414,1.189821471258071,1.0638739585135746,0.958023238373821,0.8448645936505246,1.1897072849364532,0.8917380786746548,0.8893972590814889],
        [0.9298763100950193,1.1875377448257138,0.9538554376347693,1.2444025329914066,0.8150619637082639,1.0712960694187355,0.9715543174855371,0.9848570239540175,1.1277041122979568,0.9842289991851193,1.602262464941771,1.0001008978900012,0.8333888683279299,1.3051496560921065,0.8024443751694909,1.1575067422402177,1.1949598557308747,1.060219996221803,0.958023238373821,0.8448645936505246,1.1961017189470533,0.8917380786746548,0.8856862036289085]
    ];


    let nod = dataArr.length; // Num of data arrays
    let noe = dataArr[0].length; // Num of entries in one array
    let mins = new Array(nod);
    let maxs = new Array(nod);
    for (let i = 0; i < nod; i++) {
        mins[i] = Math.min(...dataArr[i]);
        maxs[i] = Math.max(...dataArr[i]);
    }
    let mm = [Math.min(...mins), Math.max(...maxs)];
    w(mm)
    let dMM = mm[1] - mm[0];

    let margin = 2 * visMargin;
    let x = [];
    let dX = 1 / (noe - 1);
    for (let i = 0; i < noe; i++) {
        x.push(i * dX);
    }
    let edges = [...Array(noe - 1).keys()];
    let colors = new Array(nod);
    for (let i = 0; i < nod; i++) {
        colors[i] = generateRGB(evaluate_cmap(i / nod, "copper", true));
    }
    clearVisSVG();
    //Axis
    visSVG.append("line").attr("x1", mapX(0)).attr("y1", mapY(0)).attr("x2", mapX(1)).attr("y2", mapY(0)).attr("stroke-width", 1).attr("stroke", inactiveColor).attr("stroke-width", 3)
    visSVG.append("line").attr("x1", mapX(0)).attr("y1", mapY(1)).attr("x2", mapX(1)).attr("y2", mapY(1)).attr("stroke-width", 1).attr("stroke", inactiveColor).attr("stroke-width", 3)
    //visSVG.append("line").attr("x1", mapX(0)).attr("y1", mapY(0)).attr("x2", mapX(0)).attr("y2", mapY(1)).attr("stroke-width", 2).attr("stroke", "black")

    for (let i = 0; i < nod; i++) {
        // Lines
        visSVG.selectAll("edgs").data(edges).enter().append("line")
            .attr("x1", (d) => mapX(x[d])).attr("y1", (d) => mapY((dataArr[i][d] - mm[0]) / dMM))
            .attr("x2", (d) => mapX(x[d + 1])).attr("y2", (d) => mapY((dataArr[i][d + 1] - mm[0]) / dMM))
            .attr("stroke-width", 3).attr("stroke", colors[i])
        //.style("stroke-dasharray", ("2,2"))

        // Circle
        visSVG.selectAll("circs").data(dataArr[i]).enter().append("circle")
            .attr("cx", (d, j) => mapX(x[j])).attr("cy", d => mapY((d - mm[0]) / dMM))
            .attr("r", 5).attr("fill", colors[i])
    }


    w(dataArr)


}