/**
 * Determines for a given set of samples the number of points within radial distance.
 * @param {*} points Array of arrays holding points from which we want to detect the neighborhoods.
 * @param {*} samples Array of arrays holding the samples from which we draw the radial neighborhoods.
 * @param {*} r Scalar value reflecting the radius.
 * @returns Array holding for each sample the number of points in radial distance.
 */
function numOfNeighbors(points, samples, r) {
    let nos = samples.length;
    let nop = points.length;
    let numOfNeighbors = new Array(nos).fill(0);
    let rSq = r * r;

    // Process each sample
    for (let i = 0; i < nos; i++) {
        // Process each point
        for (let j = 0; j < nop; j++) {
            if (distanceSq(samples[i], points[j]) <= rSq) {
                numOfNeighbors[i]++;
            }
        }
    }

    return numOfNeighbors;
}

/**
 * Determines the radial neighbors of point x among the points.
 * @param {*} points Array of arrays holding points from which we want to detect the neighborhoods.
 * @param {*} x Array holding coordinates of one point.
 * @param {*} r Scalar value reflecting the radius.
 * @returns  Array holding indices of points which are within range.
 */
function neighbors(points, x, r) {
    let nop = points.length;
    let neighbors = new Array();
    let rSq = r * r;

    // Process each point
    for (let j = 0; j < nop; j++) {
        if (distanceSq(x, points[j]) <= rSq) {
            neighbors.push(j);
        }
    }

    return neighbors;
}

/**
 * Determines for a given set of samples the number of points within radial distance.
 * If the amount is 0 it determines the minimal distance to the nearest point and stores it as a negative value.
 * In this way we can make use of either distance to closest or we capute the amount of neighbors.
 * NOTE: 0 cannot be included as either we have a positive amount of points or the distance to the closest point.
 * If it would be 0 then this point would be a neighbor and the amount would be 1.
 * @param {*} points Array of arrays holding points from which we want to detect the neighborhoods.
 * @param {*} samples Array of arrays holding the samples from which we draw the radial neighborhoods.
 * @param {*} r Scalar value reflecting the radius.
 * @returns Array holding for each sample the number of points in radial distance or the minimal distance to the nearest as negative value.
 */
function numOfNeighborsXORDistanceToNN(points, samples, r, log) {
    let nos = samples.length;
    let nop = points.length;
    let numOfNeighbors = new Array(nos).fill(0);
    let rSq = r * r;
    let distToNNSq;
    let distSq;
    let pointsCovered = new Array(nop).fill(0);
    log.coverage = 0;

    // Process each sample
    for (let i = 0; i < nos; i++) {
        distToNNSq = Number.POSITIVE_INFINITY;
        // Process each point
        for (let j = 0; j < nop; j++) {
            distSq = distanceSq(samples[i], points[j]);
            if (distSq <= rSq) {
                numOfNeighbors[i]++;

                // Check for coverage
                if (pointsCovered[j] == 0) {
                    pointsCovered[j] = 1;
                    log.coverage++;
                }
            }
            // Search for minimal distance
            if (distSq < distToNNSq) {
                distToNNSq = distSq;
            }
        }

        // If no neighbor got reported add minimal distance to neighbor as negative value
        if (numOfNeighbors[i] == 0) {
            numOfNeighbors[i] = -Math.sqrt(distToNNSq);
        }
    }

    return numOfNeighbors;
}

/**
 * Determine axis-aligned bounding box and return array holding three arrays: min, max, max-min.
 * @param {*} points Array of arrays holding point coordinates.
 * @param {*} dim Dimension of the individual data points.
 * @returns Returns array of arrays holding min, max, and max-min (as distance).
 */
function getAABB(points, dim) {
    let nop = points.length;
    let bb = [new Array(dim), new Array(dim), new Array(dim)];
    for (let j = 0; j < dim; j++) {
        bb[0][j] = points[0][j];
        bb[1][j] = points[0][j];
    }

    // Process point
    for (let pi = 1; pi < points.length; pi++) {
        // Process dimension
        for (let d = 0; d < dim; d++) {
            if (points[pi][d] < bb[0][d]) {
                bb[0][d] = points[pi][d];
            }
            if (points[pi][d] > bb[1][d]) {
                bb[1][d] = points[pi][d];
            }
        }
    }

    // Calculate distances
    for (let d = 0; d < dim; d++) {
        bb[2][d] = bb[1][d] - bb[0][d];

        // Correct if distance between max and min is 0
        /* if (bb[2][d] == 0) {
            bb[2][d] = 1;
            bb[0][d] = 0;
            bb[1][d] = 1;
        } */
        // NOTE: If we only have one value in this dimension we say
        // min = max = dist for normalization
        if (bb[2][d] == 0) {
            bb[2][d] = bb[0][d];
        }
    }

    return bb;
}

/**
 * Takes array of data objects, where each individual object carries a points array
 * (holding individual arrays for each point). Then we either report one bounding box
 * if only one set is present, or a comined bounding box of multiple sets, which is
 * the bounding box of individual bounding boxes.
 * @param {*} loadedData Array holding point set objects. Each object with a "points" variable.
 */
function getCombinedAABB(loadedData) {
    let dim = loadedData[0].dimension;

    // Determine AABB (combined if multiple point sets are available)
    let aabb;
    // Multiple point sets are available
    if (loadedData.length > 1) {
        // Get individual bounding box per point set
        let bb = [];
        let h;
        for (let psi = 0; psi < loadedData.length; psi++) {
            h = getAABB(loadedData[psi].points, dim);
            bb.push(h[0], h[1]);
        }

        // Get bounding box of the bounding boxes
        aabb = getAABB(bb, bb[0].length);
    }
    // Only one point set is available
    else if (loadedData.length == 1) {
        aabb = getAABB(loadedData[0].points, dim);
    }

    return aabb;
}

/**
 * Rotation examples.
 */
function performRotation() {
    //let pointsets = uploadFileData;

    // Write rotations array
    var rotations = new Array();
    let piHalf = 0.5 * Math.PI;

    // NOTE: RotA
    //rotations.push([[0,1,piHalf],[1,2,piHalf]])
    // NOTE: RotB
    rotations.push([[2, 4, 3 * piHalf], [0, 3, -piHalf]])

    rotateData(data, pointDim, rotations);
}

/**
 * Performs consecutive rotations on data.
 * @param {*} initData Array of arrays holding points.
 * @param {*} dim Dimension of the points.
 * @param {*} rotations Array of arrays holding rotations in the format [ [[i1,j1,angle1],[i2,j2,angle2], ...], [[i3,j3,angle3],[i4,j4,angle4], ...], ...]
 * @returns Array holding point sets with initData as first and then one set per sub-rotation array, i.e., rotations.length.
 */
function rotateData(initData, dim, rotations) {
    let numOfPts = initData.length;

    // Get bounding box of data for translation
    let bb;

    // Rotate each point set
    for (let di = 0; di < initData.length; di++) {
        // Get current bound box for transformation
        bb = getAABBForRotation(initData[di].points, dim);

        // Copy current points
        let transformedData = copyPoints(initData[di].points);
        // Transform currentData such that its bounding box aligns with the origin
        for (let i = 0; i < transformedData.length; i++) {
            for (let j = 0; j < dim; j++) {
                transformedData[i][j] -= bb[2][j];
            }
        }

        // Now start rotation loop
        let rotatedData
        for (let ri = 0; ri < rotations.length; ri++) {
            // Generate new rotated data array as copy
            rotatedData = copyPoints(transformedData);

            // Apply rotations w.r.t. sub array of rotations, i.e., consecutive rotations
            // Get inidividual rotation in this sub array of rotations
            // Feed rotatedData as argument as it updates itself throughout successive rotations
            for (let sri = 0; sri < rotations[ri].length; sri++) {
                // Apply rotation to all points (gets consecutively applied for more than one successive rotation)
                for (let j = 0; j < numOfPts; j++) {
                    rotatedData[j] = rotate(rotatedData[j], rotations[ri][sri]);
                }
            }

            // Rewrite transformedData for next loop
            transformedData = copyPoints(rotatedData);

            // Transform rotatedData to prepare to be stored, i.e., translate towards old location
            for (let i = 0; i < rotatedData.length; i++) {
                for (let j = 0; j < dim; j++) {
                    rotatedData[i][j] += bb[2][j];
                }
            }
        }

        // Write rotated data back to original data
        initData[di].points = copyPoints(rotatedData);
    }

    w(initData);
    //return data;
}


// r contains rotations values 2 dimension entries and one final for angle, v 1D array
/**
 * Performs rotation of point pt w.r.t. plane given by axis with indices i and j about angle.
 * @param {*} pt Array holding coordinates of point.
 * @param {*} rot Rotation entries in array holding [i, j, angle].
 * @returns Rotated point as array.
 */
function rotate(pt, rot) {
    let rotPt = pt.slice();
    let c = Math.cos(rot[2]);
    let s = Math.sin(rot[2]);
    rotPt[rot[0]] = c * pt[rot[0]] - s * pt[rot[1]];
    rotPt[rot[1]] = s * pt[rot[0]] + c * pt[rot[1]];
    return rotPt;
}

/**
 * Determines axis-aligned bounding box. Holds in the last entry
 * the center of the bounding box, which can be used to translate
 * towards the origin.
 * @param {*} data Array of arrays holding points.
 * @param {*} dim Dimension of each point.
 * @returns Array [bbMin, bbMax, bbMin+0.5(bbMax-bbMin)]
 */
function getAABBForRotation(data, dim) {
    let nop = data.length;
    let bb = [new Array(dim), new Array(dim), new Array(dim)];
    for (let i = 0; i < dim; i++) {
        bb[0][i] = Number.POSITIVE_INFINITY;
        bb[1][i] = Number.NEGATIVE_INFINITY;
    }
    for (let i = 0; i < nop; i++) {
        for (let j = 0; j < dim; j++) {
            if (data[i][j] < bb[0][j])
                bb[0][j] = data[i][j];
            if (data[i][j] > bb[1][j])
                bb[1][j] = data[i][j];
        }
    }

    // Store centroid of bounding box + bbMin to use to shift bounding box to origin and back
    for (let j = 0; j < dim; j++) {
        //bb[2][j] = bb[0][j] + 0.5 * (bb[1][j] - bb[0][j]);
        bb[2][j] = 0.5 * (bb[0][j] + bb[1][j]);
    }

    return bb;
}

/**
 * Copies a point array.
 * @param {*} pts Array of arrays holding point coordinates.
 * @returns Copy of pts.
 */
function copyPoints(pts) {
    let newPts = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
        newPts[i] = pts[i].slice();
    }
    return newPts;
}