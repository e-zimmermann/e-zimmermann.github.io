/**
 * Normalize pointsets w.r.t. their axis-aligned bounding box.
 * Assumes loadedData to be an array holding one ore more objects,
 * where each has an array of arrays called points and an int called dimension.
 * Assumes further, that all pointsets have the same dimension.
 * @param {*} loadedData Array holding objects, one per point set (each has at least array of arrays "points" and int "dimension").
 */
function normalizeViaAABB(loadedData) {


    // Determine AABB (combined if multiple point sets are available)
    let aabb = getCombinedAABB(loadedData);
    w(aabb)

    // Transform all data w.r.t. aabb
    // process every point set
    let dim = loadedData[0].dimension;
    for (let psi = 0; psi < loadedData.length; psi++) {
        // In it every point
        for (let pi = 0; pi < loadedData[psi].points.length; pi++) {
            // And here every coordinate
            for (let j = 0; j < dim; j++) {
                loadedData[psi].points[pi][j] = (loadedData[psi].points[pi][j] - aabb[0][j]) / aabb[2][j];
            }
        }

        // Attach bounding box to every point set
        loadedData[psi].aabb = aabb;
    }

    w(loadedData)

    w("Done: Normalization via AABB.");
}

/**
 * Choice for the local radii calculation.
 */
function calculateLocalRadii() {
    calculateLocalRadii_usingTolerance();
}

/**
 * Besection method using iteration number.
 * Implemented first without directly halfing the intervals.
 * However it inherently does so.
 */
function calculateLocalRadii_usingIteration() {
    let nops = data.length;
    localRadii = new Array(nops).fill(0);
    let h = Math.sqrt(pointDim);
    let startRadius = 0.5 * h;
    let prevRadius = h;
    let coverage;

    for (let psi = 0; psi < nops; psi++) {
        r = startRadius;

        for (let iter = 0; iter < numOfIterLocalRadii; iter++) {
            let log = { coverage: 0 };

            numOfNeighborsXORDistanceToNN(data[psi].points, samples, r, log);

            coverage = log.coverage / data[psi].points.length;

            // Store radius if it caused a coverage value larger equal to 1
            if (coverage >= 1) {
                localRadii[psi] = r; // Store this local radius
                prevRadius = r; // Update previous so that we can approach it from below
                r *= 0.5; // Half the current search readius
            }
            // If we are below coverage 1 we approach it from below
            else {
                r = 0.5 * (prevRadius + r);
            }
        }
    }

    w("Covering Radii:")
    w(localRadii);
    w("Covering Maximal Radius");
    w(Math.max(...localRadii));
}

/**
 * Besection method with relative tolerance stopping condition.
 */
function calculateLocalRadii_usingTolerance() {
    let nops = data.length;
    localRadii = new Array(nops).fill(0);
    let h = Math.sqrt(pointDim);
    let a, b; // Bounds of interval
    let lastRad;
    let coverage;
    let log, rad;

    for (let psi = 0; psi < nops; psi++) {
        // Set up initial values for this point set run
        a = 0;
        b = h;
        rad = h;

        do {
            // Determine last radius (from previous) and radius for next run
            lastRad = rad;
            rad = 0.5 * (a + b);

            // Determine neighbors and coverage
            log = { coverage: 0 };
            numOfNeighborsXORDistanceToNN(data[psi].points, samples, rad, log);
            coverage = log.coverage / data[psi].points.length;

            // Store radius if it caused a coverage value larger equal to 1
            if (coverage >= 1) {
                localRadii[psi] = rad; // Store this local radius

                // Adjust interval upper bound
                b = rad;
            }
            // If we are below coverage 1 we approach it from below
            else {
                // Adjust interval lower bound
                a = rad;
            }

            // Check relative tolerance stopping condition
        } while (Math.abs((rad - lastRad) / rad) > bisectionMethodTolerance)
    }

    w("Covering Radii:")
    w(localRadii);
    w("Covering Maximal Radius");
    w(Math.max(...localRadii));
}

