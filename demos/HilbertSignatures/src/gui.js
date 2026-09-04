// NNOTE: Initialization (primarily due to config variables)
// Set radius
document.getElementById("radiusSlider").value = radius;
//document.getElementById("radiusSliderLabel").textContent = "r = " + radius.toFixed(2);
document.getElementById("radiusSliderInput").value = radius.toFixed(2);

// Set GUI visibility
document.getElementById("guiDiv").style.visibility = guiVisible ? "visible" : "hidden";

// Set automatized generation
document.getElementById("automatizeCheckbox").checked = automatizeGeneration;

// Set global normalization
document.getElementById("globalNormalizationCheckbox").checked = globalNormalization;

// Set local radii
document.getElementById("localRadiiCheckbox").checked = useLocalRadii;

// Set multiple point sets and slider option
document.getElementById("pointSetSliderLabel").textContent = "PS = " + (currentPointSetIndex + 1);

// Set vis ids and labels as well as current vis
//document.getElementById("vis0RadioLabel").textContent = vis[0];
document.getElementById("vis0Radio").id = vis[0];
//document.getElementById("vis1RadioLabel").textContent = vis[1];
document.getElementById("vis1Radio").id = vis[1];
document.getElementById(vis[currentVisID]).checked = true;

// Set linked vis
document.getElementById("pcCheckbox").checked = activePC;
document.getElementById("pts2DCheckbox").checked = activePts2D;

// Set com vis
document.getElementById("comVisPCCheckbox").checked = activeComVisPC;
document.getElementById("comVisTVCheckbox").checked = activeComVisTV;


// NOTE: GUI Events
// Keyboard events on window
window.addEventListener('keydown', event => {
    // Toggle gui
    if (event.key == keyToggleGui) {
        guiVisible = !guiVisible;
        document.getElementById("guiDiv").style.visibility = guiVisible ? "visible" : "hidden";
    }
    if (event.key == keyToggleCoverage) {
        guiVisible = !guiVisible;
        document.getElementById("infoDiv").style.visibility = guiVisible ? "visible" : "hidden";
    }
    if (event.key == "p") {
        //drawVis2DMappingForPrint();
        //drawVis1DMappingForPrint();
        //drawColorForPrint();
        //lineDiagramHelper();

        /* let numOfRuns = 100;
        let times = new Array(numOfRuns);
        let meanTime = 0;
        for (let i = 0; i < numOfRuns; i++) {
            generate();
            times[i] = diffTime;
            meanTime += diffTime;
        }
        w("Mean Time of "+numOfRuns+" runs: "+meanTime/numOfRuns);
        w("Min Time: "+Math.min(...times));
        w("Max Time: "+Math.max(...times)); */
    }
    // Increment highlight color
    if (event.key == "+") {
        if (highlightIndex == 3) {
            w("Highlight index already at max, i.e., 3 colors.")
        }
        else {
            highlightIndex++;
            w("Highlight index is: " + highlightIndex);
        }
    }
    // Decrement highlight color
    if (event.key == "-") {
        if (highlightIndex == 0) {
            w("Highlight index already at min, i.e., value 0.")
        }
        else {
            highlightIndex--;
            w("Highlight index is: " + highlightIndex);
        }
    }
    // Reset highlight counter
    if (event.key == "/") {
        highlightCounter = new Array(points.length).fill(-1);
        w("Reset highlightcounter array.");
        highlightIndex = 0;
        w("Reset highlightIndex to 0.")
    }
});

/**
 * Modification switch for custom 2D points.
 * Choice 0 - Increment point sets by one.
 * Choice 1 - Clear content of currently selected PS.
 * @param {*} choice See description above.
 */
function customPoints2DMods(choice) {
    switch (choice) {
        // Add point set
        case 0:
            addPointSetToPoints2D();
            break;
        // Clear current selected point set
        case 1:
            removePtsFromPts2DPlot();
            break;
    }
}

/**
 * Prints info of various variables to console.
 */
function printInfo() {
    if (data == undefined) {
        w("data is undefined. Please load data.");
        return;
    }
    w("data");
    w(data)
    let pointSum = 0;
    let nop = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        nop[i] = data[i].numOfPoints;
        pointSum += nop[i];
    }
    w("numOfPoints")
    w(nop)
    w("Total number of points = " + pointSum)
    // Analysis on point sets
    w("Point Sets Statistics (min, max, mean, sd")
    w(getPointSetsStats(nop))
    w("currentPointSetIndex " + currentPointSetIndex);
    w("pointset");
    w(pointset)
    w("points")
    w(points)
    w("pointDim " + pointDim)
    w("samples")
    w(samples)
    w("samples2D")
    w(samples2D)
    w("classes")
    w(classes)
    w("numOfClasses " + numOfClasses)
}

/**
 *
 * @param {*} values
 * @returns
 */
function getPointSetsStats(values) {
    let ana = [0, 0, 0, 0];
    // Get min and max
    ana[0] = Math.min(...values);
    ana[1] = Math.max(...values);
    // Get mean
    for (let i = 0; i < values.length; i++) {
        ana[2] += values[i];
    }
    ana[2] /= values.length;
    // Get sd
    let h;
    for (let i = 0; i < values.length; i++) {
        h = values[i] - ana[2];
        ana[3] += h * h
    }
    ana[3] /= values.length;
    ana[3] = Math.sqrt(ana[3]);
    return ana;
}

// NOTE: File handling
// Handle upload event
window.addEventListener('load', function () {
    let pointsFileUpload = document.getElementById('pointsFileInput');
    eventListener(pointsFileUpload, "uploadPointsFile");

    let samplesFileUpload = document.getElementById('samplesFileInput');
    eventListener(samplesFileUpload, "uploadSamplesFile");

    function eventListener(uploadEvent, value) {
        // Make sure the DOM element exists
        if (uploadEvent) {
            uploadEvent.addEventListener('change', function () {
                // Make sure a file was selected
                if (uploadEvent.files.length > 0) {
                    let reader = new FileReader(); // File reader to read the file

                    // NOTE: Loader for points file
                    if (value == "uploadPointsFile") {
                        reader.addEventListener('load', function (file) {
                            data = JSON.parse(reader.result); // Parse the result into an object

                            try {
                                setMultiplePointSets();

                                // Call other relevant data
                                pointset = data[currentPointSetIndex];
                                points = pointset.points;
                                pointDim = pointset.dimension;

                                // Get total number of points
                                totalNumOfPoints = 0;
                                for (let i = 0; i < data.length; i++) {
                                    totalNumOfPoints += data[i].numOfPoints;
                                }

                                // Load classes
                                loadClasses();

                                setMaxRadius(Math.sqrt(pointDim));
                                w("Point sets loaded.");

                                // Add to pts 2D if active
                                if (pointDim == 2 & activePts2D) {
                                    generatePts2DPlot();
                                }

                                // Reset local Radii
                                localRadii = undefined;

                                // Invoke generation
                                autoUpdate();
                            }
                            catch (err) {
                                w("Failed to process point set(s) file.")
                                w(err)
                            }
                        });

                        // Read the uploaded file
                        reader.readAsText(uploadEvent.files[0]);
                    }

                    // NOTE: Loader for samples file
                    else if (value == "uploadSamplesFile") {
                        reader.addEventListener('load', async function (file) {
                            let sampleData = JSON.parse(reader.result); // Parse the result into an object
                            samples = sampleData.samples;
                            sampleDim = sampleData.n;
                            w("Samples loaded with sampleDim " + sampleDim);

                            await loadSamples2D();

                            if (activePts2D && sampleDim == 2) {
                                generatePts2DPlot();
                            }

                            // Reset local Radii
                            localRadii = undefined;

                            // Invoke generation
                            autoUpdate();
                        });

                        // Read the uploaded file
                        reader.readAsText(uploadEvent.files[0]);
                    }
                }
            })
        }
    }
});

/**
 * Load samples 2D from folder.
 */
async function loadSamples2D() {
    // Chose correct samples2D from existing file (or default)
    let nos = (samples == undefined) ? 64 : samples.length;

    // Try to load samples2D
    try {
        let samples2DData = await fetch(samples2DLocation + "n2_entries" + nos + ".json").then(response => response.json());
        samples2D = samples2DData.samples;
        w("Samples 2D loaded with " + nos + " entries.");

    }
    catch (error) {
        w("Not existent. Number of samples is " + samples.length + ".");
        w(error)
    }
}


/**
 * Sets up data file and points for 2D example, which can be filled manually on screen.
 */
async function setupPoints2D() {
    data = [{ "dimension": 2, "numOfPoints": 0, "points": [], "numOfClasses": null, "classes": null }];
    setMultiplePointSets();

    // Call other relevant data
    pointset = data[currentPointSetIndex];
    points = pointset.points;
    pointDim = pointset.dimension;

    // Load the 2D samples if not present
    if (samples2D == undefined) {
        await loadSamples2D();
    }

    if (samples == undefined) {
        // Sets the sample dimension and refer samples to samples2D
        sampleDim = 2;
        samples = samples2D;
    }

    // Load classes
    loadClasses();

    setMaxRadius(Math.sqrt(pointDim));
    w("Point set for 2D points set up.");

    // Reset svg
    generatePts2DPlot();
}

/**
 * Add point set to points 2D
 */
function addPointSetToPoints2D() {
    currentPointSetIndex = data.length;
    data.push({ "dimension": 2, "numOfPoints": 0, "points": [], "numOfClasses": null, "classes": null });

    // Update slider
    setMultiplePointSets();

    // Call other relevant data
    pointset = data[currentPointSetIndex];
    points = pointset.points;

    // Reset svg
    generatePts2DPlot();
}

/**
 * Sets automatized for the generation via checkbox.
 * @param {*} value Current checkbox value, i.e., true or false.
 */
function setAutomatized(value) {
    automatizeGeneration = value;
}

/**
 * Sets multiple point sets via checkbox.
 * @param {*} value Current checkbox value, i.e., true or false.
 */
function setMultiplePointSets() {
    numOfPointsets = data.length;

    // Adjust maximal amount of point sets
    setMaxPointSets(numOfPointsets - 1);

    // Reset current point set index
    if (numOfPointsets == 1) {
        currentPointSetIndex = 0;
    }
}

/**
 * Sest whether to use local radii or not.
 * @param {*} value
 */
function setLocalRadii(value) {
    useLocalRadii = value;
    if (!value) {
        localRadii = undefined;
    }
}

/**
 * Sets wether to use log scale.
 * @param {*} value True or false w.r.t. checkbox in gui.
 */
function setLogScale(value) {
    logScale = value;
}

/**
 * Sets wether to use global normalization.
 * @param {*} value True or false w.r.t. checkbox in gui.
 */
function setGlobalNormalization(value) {
    globalNormalization = value;

    // If automatized apply generation
    autoUpdate();
}

/**
 * Sets the current point set if multiple are present.
 * @param {*} value Index of point set.
 */
function setPointSet(value) {
    currentPointSetIndex = parseInt(value);

    document.getElementById("pointSetSliderLabel").textContent = "PS = " + (currentPointSetIndex + 1);

    // Select from data the point set with this index, reset points and dimension
    pointset = data[currentPointSetIndex];
    points = pointset.points;
    pointDim = pointset.dimension;

    // Load classes
    loadClasses();

    // Add to pts 2D if active
    if (pointDim == 2 & activePts2D) {
        generatePts2DPlot();
    }

    // If automatized apply generation
    autoUpdate();
}

/**
 * Loads the classes available from the pointset. If undefined or null
 * it generates one array of value 0, i.e., one class.
 */
function loadClasses() {
    if (pointset.classes == undefined || pointset.classes == null) {
        classes = new Array(points.length).fill(0);
        numOfClasses = 1;
    }
    else {
        classes = pointset.classes;
        numOfClasses = pointset.numOfClasses;
    }
}

/**
 * Invoke automatized regeneration of content.
 */
function autoUpdate(updateLinked = true) {
    if (automatizeGeneration) {
        generate();
        if (updateLinked)
            updateLinkedVis();
    }
}

/**
 * Sets the maximal point set number whenever data was loaded and multiple point sets are available.
 * @param {*} value Number of point sets as natural number.
 */
function setMaxPointSets(value) {
    document.getElementById("pointSetSlider").max = value;
}

/**
 * Sets radius due to slider.
 * @param {*} value Current slider value.
 */
function setRadius(value) {
    radius = parseFloat(value);
    document.getElementById("radiusSliderInput").value = radius.toFixed(4);

    // Apply generation if automatized
    autoUpdate(false);
}

/**
 * Sets the maximal radius whenever new points where loaded.
 * The new maximal radius is the diameter of the unit hypercube, thus sqrt(dim).
 * @param {*} value Scalar value, i.e., sqrt(dim).
 */
function setMaxRadius(value) {
    document.getElementById("radiusSlider").max = value.toFixed(4);
}

/**
 * Sets current vis.
 * @param {*} value String value (see config or button inclusion for options).
 */
function setVis(value) {
    currentVisID = value;

    // Apply generation if automatized
    if (automatizeGeneration) {
        generate();
    }
}

/**
 * Updates content in the linked vis
 */
function updateLinkedVis() {
    if (activePC) {
        generatePCPlot();
    }
    if (activePts2D) {
        generatePts2DPlot();
    }
}

/**
 * Allows to toggle linked views. These provide other vis techniques which are linked
 * primarily to the vis of our approach (vis1D, vis2D).
 * @param {*} linkedVis Current choice of linked vis technique.
 * @param {*} state Whether true or false, i.e., show or hide.
 */
function toggleLinkedVis(linkedVis, state) {
    switch (linkedVis) {
        case "PC":
            activePC = state;
            activePC ? generatePCPlot() : removeLinkedPlot("pcVisSVG");
            break;
        case "PTS2D":
            activePts2D = state;
            if (activePts2D) {
                setupPoints2D();
            } else {
                removeLinkedPlot("pts2DVisSVG");
            }
            break;
    }
}

/**
 * Competitor visualizations, i.e., uses common vis techniques and a way
 * to stack them and make use of the comparable appraoch. Thus we apply them
 * to multiple point sets to see whether we can identify changes in a compact view.
 * @param {*} comVis Competitor vis.
 * @param {*} state Whether true or false, i.e., show or hide.
 */
function toggleComVis(comVis, state) {
    if (points == undefined) {
        w("Points are undefined. Please load points.");
        return;
    }

    switch (comVis) {
        case "comVisPC":
            activeComVisPC = state;
            activeComVisPC ? drawComVisPC() : clearComVisSVG();
            if (activeComVisTV) {
                activeComVisTV = false;
                document.getElementById("comVisTVCheckbox").checked = false;
            }
            break;
        case "comVisTV":
            activeComVisTV = state;
            activeComVisTV ? drawComVisTV() : clearComVisSVG();
            if (activeComVisPC) {
                activeComVisPC = false;
                document.getElementById("comVisPCCheckbox").checked = false;
            }
            break;
        default:
            break;
    }
}

/**
 * Process the vis generation.
 * For options see config.
 */
function generate() {
    // Sanity check that point and sample dimensions agree
    if (pointDim != sampleDim) {
        throw new Error("Dimensions of points (" + pointDim + ") and samples (" + sampleDim + ") disagree.");
        return;
    }

    if (currentVisID == 0) {
        drawVis1D();
    }
    else if (currentVisID == 1) {
        // Check whether samples and samples2D have equal length
        if (samples.length != samples2D.length) {
            throw new Error("Lenghts of samples (" + samples.length + ") and samples2D (" + samples2D.length + ") disagree.");
            return;
        }
        drawVis2D();
    }
}






