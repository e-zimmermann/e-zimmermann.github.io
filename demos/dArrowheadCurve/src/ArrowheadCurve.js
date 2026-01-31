/**
 * Generates dim+1 points for which all pairwise points have distance 2,
 * thus they form a dim-simplex for dim >= 2. The points are generated iteratively
 * where in each iteration two new heights are determined and assigned to old
 * and one new point.
 * @param {*} dim Dimension of the simplex. Dimesion >= 2 required.
 * @returns Array holding coordinates of all points of the simplex.
 */
function generateSimplexPoints(dim) {
    // Generate 1D array holding (dim+1) points with dim coordinates and set all values to 0.
    let points = new Array(dim * (dim + 1));
    for (let i = 0; i < points.length; i++) {
        points[i] = 0;
    }

    // Instantiate initial points, i.e. p0 = (-1), p1 = (1)
    points[0] = -1, points[dim] = 1;

    let hHat, hBar; // Used for heights
    let sum = 0; // Used to iteratively increase distance from previous iteration step
    // Iterate all dimensions
    for (let n = 2; n <= dim; n++) {
        // Here we add the square of the last coordinate from the previous iteration
        // In this way we do not have to calculate the whole distance in each iteration
        sum += points[n - 2] * points[n - 2];

        // Determine height for new point
        hHat = n * Math.sqrt(sum) / Math.sqrt(n * n - 1);

        // Determine height for old points
        hBar = -hHat / n;

        // Append new height to old points
        for (let j = 0; j < n; j++) {
            // Gets each old point in 1D array via j*dim and set the (n-1) coordinate to new height
            points[j * dim + n - 1] = hBar;
        }

        // Set new height for newly added point
        points[n * dim + n - 1] = hHat;
    }

    // Return coordinates
    return points;
}

/**
 * Generates dim+1 points for which all pairwise points have distance 2
 * according to https://en.wikipedia.org/wiki/Simplex#Cartesian_coordinates_for_a_regular_n-dimensional_simplex_in_Rn
 *
 * @param {*} dim Dimension of the simplex.
 * @returns Array holding coordinates of all points of the simplex.
 */
function generateSimplexPoints2(dim) {
    let points = new Array(dim * (dim + 1)).fill(0);

    // Set the first n simplex points to be basis vectors, i.e. set value 1 at
    // relevant positions
    let j = 0;
    for (let i = 0; i < dim; i++) {
        points[i * dim + j++] = 1;
    }

    // Set last entry to last n-simplex point
    let c = (1 + Math.sqrt(1 + dim)) / dim;
    for (let i = points.length - dim; i < points.length; i++) {
        points[i] = c;
    }

    return points;
}

/**
 * Generates simplex points at origin of certain dimension.
 * @param {*} dim Dimension of the simplex.
 * @returns Array holding simplex coordinates.
 */
function generateSimplexPoints2AtOrigin(dim) {
    return moveSimplexToOrigin(generateSimplexPoints2(dim), dim);
}

/**
 * Rotate 3-simplex points at origin s.t. fourth point aligns with up-vector (in Babylonjs the y-direction).
 * The 3-simplex points are the result of generateSimplexPoints2AtOrigin, i.e.
 * the last point has direction (1,1,1) which can be used directly for angle and axis of rotation.
 * @param {*} points 1D array holding point coordinates.
 * @returns Array holding simplex coordinates.
 */
function rotate3SimplexPoints(points) {
    let angle = Math.acos(1 / Math.sqrt(3));
    let h = 1 / Math.sqrt(2);
    let axis = [h, 0, -h]; // Normalized rotation axis

    let ci, p;
    for (let i = 0; i < 4; i++) {
        ci = i * 3;
        p = [points[ci], points[ci + 1], points[ci + 2]];
        p = rotate(p, axis, angle);

        // Rewrite
        points[ci] = p[0];
        points[ci + 1] = p[1];
        points[ci + 2] = p[2];
    }

    return points;
}

/**
 * Translates all coordinates of points (provided as array) by given translation.
 * @param {*} coords Array holding with coordinates of simplex, where each point is of dimension dim.
 * @param {*} translation Translation vector, array of length dim.
 * @param {*} dim Dimension of points.
 */
function translateSimplex(coords, translation, dim) {
    for (let i = 0; i < coords.length; i++) {
        coords[i] += translation[i % dim];
    }
    return coords;
}

/**
 * Calculates the barycenter of coordinates.
 * Note, that length of coords must be multiple of dim.
 * @param {*} coords Array holding point coordinates.
 * @param {*} dim Dimension of each point.
 */
function getBarycenter(coords, dim) {
    let b = new Array(dim).fill(0);

    for (let i = 0; i < coords.length; i++) {
        b[i % dim] += coords[i];
    }

    let div = coords.length / dim;
    for (let i in b) {
        b[i] /= div;
    }

    return b;
}

/**
 * Move simplex coordinates to origin.
 * @param {*} coords Array holding simplex point coordinates.
 * @param {*} dim Dimension of each point.
 * @returns Translated simplex point array.
 */
function moveSimplexToOrigin(coords, dim) {
    let b = getBarycenter(coords, dim);
    for (let i in b) {
        b[i] *= -1;
    }

    translateSimplex(coords, b, dim);

    return coords;
}

/**
 * Scales all coordinates of simplex by reference.
 * @param {*} coords Array with coordinates of simplex.
 * @param {*} scale Scaling parameter
 */
function scaleSimplex(coords, scale) {
    for (let i in coords) {
        coords[i] *= scale;
    }
}

/**
 * Takes a signature, i.e. array of contraction map indices and applies the contractions
 * to the simplex points. Note that the signature is traversed from back to front.
 * @param {*} signature Array of contraction map indices.
 * @param {*} simplexPoints Array of coordinates of dim+1 points making up the dim-simplex.
 * @param {*} dim Dimension of the simplex.
 * @returns Modified coordinates of the simplex obtained via the contractions.
 */
function applyContraction(signature, simplexPoints, dim) {
    let points = simplexPoints.slice();
    let cic; // Contraction index coordinate
    let h;
    for (let i = signature.length - 1; i >= 0; i--) {
        cic = signature[i] * dim;

        // Traverse number of points
        for (let j = 0; j < dim + 1; j++) {
            // Traverse each coordinate for that specific point
            for (let k = 0; k < dim; k++) {
                h = j * dim + k;
                points[h] += simplexPoints[cic + k];
                points[h] *= 0.5;
            }
        }
    }

    return points;
}

/**
 * Gets an array of signatures, i.e. an array of arrays holding the contraction map indices.
 * It uses a rule, i.e. an array of contraction map indices treated as suffixes for
 * the signature reproduction. The depth controls how many steps are used to
 * reproduce the signatures. Note that the number of arrays in signatures needs to
 * match the square root of the length of the rule. Further observe that the length of signature
 * grows exponentially, i.e. if there are d contraction maps, then it ends with d^depth entries.
 * @param {*} signatures Array of arrays holding individual contraction map sequences.
 * @param {*} rule Array of contraction map indices used to append as suffixes.
 * @param {*} depth Number of extension steps.
 * @returns
 */
function extendSignatures(signatures, rule, depth) {
    // Get number of contraction maps
    let d = signatures.length;

    if (signatures.length != Math.sqrt(rule.length)) {
        w("Dimension mismatch, i.e. number of signature entries is not equal to square root of rule-length.");
        return undefined;
    }

    let newSignatures;
    let prefixes = new Array(d); // Gets rewritten in each iteration
    let suffixes = new Array(d); // Gets rewritten in each iteration
    for (let i = 0; i < depth; i++) {
        newSignatures = [];
        for (let i = 0; i < signatures.length; i += d) {
            // Get prefix sequences and suffixes for reproduction
            for (let j = 0; j < d; j++) {
                prefixes[j] = signatures[i + j].slice();
                suffixes[j] = prefixes[j][prefixes[j].length - 1];
            }

            // Copy prefix-sequences d-times
            for (let j = 0; j < d; j++) {
                for (let k = 0; k < d; k++) {
                    newSignatures.push(prefixes[j].slice());
                }
            }

            // Append suffixes w.r.t. rule
            let index = newSignatures.length - rule.length;
            for (let j = 0; j < rule.length; j++) {
                newSignatures[index + j].push(suffixes[rule[j]]);
            }
        }

        // Rewrite signatures
        signatures = newSignatures.slice();
    }

    return signatures;
}

/**
 * Creates based on an array of signatures a sequence of simplex indices.
 * Each element in the array reflects the (sub) simplex indices the arrowhead curve edge is incident to.
 * For instance [0,1] means, that the curve uses vertex index 0 and 1 for the edge of the corresponding
 * most likely contracted simplex.
 * @param {*} signatures Array of signatures holding contraction map indices.
 * @param {*} dim Dimension of the space. We have dim+1 contraction maps.
 * @returns Array holding 2-element arrays holding vertex indices in order of the arrowhead curve.
 */
function getSimplexIndexSequence(signatures, dim) {
    let indexSequence = [];
    let lastEntry;
    let dimPlusOne = dim + 1;
    for (let i = 0; i < signatures.length; i++) {
        lastEntry = signatures[i].length - 1;
        // We are at the start of a row
        if (i % dimPlusOne == 0) {
            indexSequence.push([signatures[i][lastEntry], signatures[i + 1][lastEntry]]);
        }
        // We are at the end of a row
        else if (i % dimPlusOne == dim) {
            indexSequence.push([signatures[i - 1][lastEntry], signatures[i][lastEntry]]);
        }
        // We are between
        else {
            indexSequence.push([signatures[i - 1][lastEntry], signatures[i + 1][lastEntry]]);
        }
    }

    return indexSequence;
}

/**
 * Generates a binary sequence using the simplex index sequence method.
 * Here we have a consecutive list of indices ranging from 0 to dim + 1
 * and this as many as signatures are available. The idea is that
 * those index slots receive 1 if those vertices are incident to an edge of
 * the arrowhead curve.
 * @param {*} signatures Array of signatures holding contraction map indices.
 * @param {*} dim Dimension of the space. We have dim+1 contraction maps.
 * @returns Array of zeros and ones.
 */
function getSimplexIndexBinarySequence(signatures, dim) {
    let sequence = getSimplexIndexSequence(signatures, dim);

    let binarySequence = new Array(sequence.length * dim);
    let dimPlusOne = dim + 1;
    for (let i = 0; i < sequence.length; i++) {
        for (let j = 0; j < dimPlusOne; j++) {
            if (sequence[i].includes(j)) {
                binarySequence[i * dimPlusOne + j] = 1;
            }
            else {
                binarySequence[i * dimPlusOne + j] = 0;
            }
        }
    }

    return binarySequence;
}

/**
 * Calculates the arrowhead curve points w.r.t. to a given array of signatures and
 * the base simplex of a certain dimension for contraction. Then starting from the first starting
 * point a signature encodes how to apply the contractions to the simplex and then chooses the correct
 * point of the contracted simplex as the next point on the arrowhead curve, which is piecewise linear.
 * @param {*} signatures Array of signatures, i.e. array of arrays holding contraction indices.
 * @param {*} simplexPoints Array of dim-dimensional simplex point coordinates. It has dim+1 points.
 * @param {*} dim The dimension of simplex.
 * @returns Array of arrowhead curve point coordinates.
 */
function getArrowheadCurvePoints(signatures, simplexPoints, dim) {
    let dimPlusOne = dim + 1;
    let depth = signatures[0].length;
    let curvePoints = [];

    // Add starting point with all its coordinates
    for (let i = 0; i < dim; i++) {
        curvePoints.push(simplexPoints[i]);
    }

    // Now traverse the remaining signatures
    let pts;
    let index;
    for (let i = 1; i < Math.pow(dimPlusOne, depth); i++) { // Here i = signatureIndex
        pts = applyContraction(signatures[i], simplexPoints, dim);
        index = i % dimPlusOne != 0 ? dim * signatures[i - 1][signatures[i - 1].length - 1] : dim * signatures[i][signatures[i - 1].length - 1];
        for (let j = 0; j < dim; j++) {
            curvePoints.push(pts[index + j]);
        }
    }

    // Add final point with all its coordinates
    for (let i = simplexPoints.length - dim; i < simplexPoints.length; i++) {
        curvePoints.push(simplexPoints[i]);
    }

    return curvePoints;
}

/**
 * There is one rule in 2D.
 * @returns Array of 3 contraction map indices with a total of 9 entries.
 */
function getRule2D() {
    return [0, 2, 1, 0, 1, 2, 1, 0, 2];
}

/**
 * Examples of 3D rules.
 * NOTE: More to add.
 * @returns Array of two arrays holding 16 entries with 4 contraction map indices each.
 */
function getRules3D() {
    return [
        // Rule 1
        [0, 2, 3, 1,
            0, 1, 3, 2,
            1, 0, 2, 3,
            2, 0, 1, 3],
        // Rule 2
        [0, 2, 3, 1,
            0, 1, 3, 2,
            1, 0, 2, 3,
            2, 1, 0, 3],
        // Rule 3
        [0, 2, 3, 1,
            0, 1, 3, 2,
            1, 2, 0, 3,
            2, 0, 1, 3],
        // Rule 4
        [0, 2, 3, 1,
            0, 1, 3, 2,
            1, 2, 0, 3,
            2, 1, 0, 3],
        // Rule 5
        [0, 2, 3, 1,
            0, 3, 1, 2,
            1, 0, 2, 3,
            2, 0, 1, 3],
        // Rule 6
        [0, 2, 3, 1,
            0, 3, 1, 2,
            1, 0, 2, 3,
            2, 1, 0, 3],
        // Rule 7
        [0, 2, 3, 1,
            0, 3, 1, 2,
            1, 2, 0, 3,
            2, 0, 1, 3],
        // Rule 8
        [0, 2, 3, 1,
            0, 3, 1, 2,
            1, 2, 0, 3,
            2, 1, 0, 3],
        // Rule 9
        [0, 3, 2, 1,
            0, 1, 3, 2,
            1, 0, 2, 3,
            2, 0, 1, 3],
        // Rule 10
        [0, 3, 2, 1,
            0, 1, 3, 2,
            1, 0, 2, 3,
            2, 1, 0, 3],
        // Rule 11
        [0, 3, 2, 1,
            0, 1, 3, 2,
            1, 2, 0, 3,
            2, 0, 1, 3],
        // Rule 12
        [0, 3, 2, 1,
            0, 1, 3, 2,
            1, 2, 0, 3,
            2, 1, 0, 3],
        // Rule 13
        [0, 3, 2, 1,
            0, 3, 1, 2,
            1, 0, 2, 3,
            2, 0, 1, 3],
        // Rule 14
        [0, 3, 2, 1,
            0, 3, 1, 2,
            1, 0, 2, 3,
            2, 1, 0, 3],
        // Rule 15
        [0, 3, 2, 1,
            0, 3, 1, 2,
            1, 2, 0, 3,
            2, 0, 1, 3],
        // Rule 16
        [0, 3, 2, 1,
            0, 3, 1, 2,
            1, 2, 0, 3,
            2, 1, 0, 3],
    ]
}

/**
 * Examples of 4D rules.
 * NOTE: More to add.
 * @returns Array of arrays holding 25 entries with 5 contraction map indices each.
 */
function getRules4D() {
    return [
        [0, 4, 2, 3, 1,
            0, 1, 3, 4, 2,
            1, 4, 2, 0, 3,
            2, 0, 1, 3, 4,
            3, 1, 2, 0, 4]
    ]
}

/**
 * Examples of 5D rules.
 * NOTE: More to add.
 * @returns Array of arrays holding 36 entries with 6 contraction map indices each.
 */
function getRules5D() {
    return [
        [0, 4, 2, 5, 3, 1,
            0, 1, 3, 4, 5, 2,
            1, 4, 5, 2, 0, 3,
            2, 0, 1, 5, 3, 4,
            3, 1, 2, 0, 4, 5,
            4, 1, 2, 3, 0, 5]
    ]
}

/**
 * Examples of 6D rules.
 * NOTE: More to add.
 * @returns Array of arrays holding 49 entries with 7 contraction map indices each.
 */
function getRules6D() {
    return [
        [0, 2, 3, 4, 5, 6, 1,
            0, 1, 3, 4, 5, 6, 2,
            1, 0, 2, 4, 5, 6, 3,
            2, 0, 1, 3, 5, 6, 4,
            3, 0, 1, 2, 4, 6, 5,
            4, 0, 1, 2, 3, 5, 6,
            5, 0, 1, 2, 3, 4, 6]
    ]
}

/**
 * Examples of 7D rules.
 * @returns Array of arrays holding 64 entries with 8 contraction map indices each.
 */
function getRules7D() {
    return [
        [0, 2, 3, 4, 5, 6, 7, 1,
            0, 1, 3, 4, 5, 6, 7, 2,
            1, 0, 2, 4, 5, 6, 7, 3,
            2, 0, 1, 3, 5, 6, 7, 4,
            3, 0, 1, 2, 4, 6, 7, 5,
            4, 0, 1, 2, 3, 5, 7, 6,
            5, 0, 1, 2, 3, 4, 6, 7,
            6, 0, 1, 2, 3, 4, 5, 7]
    ]
}

/**
 * Generates a representative rule for a given dimension.
 * @param {*} dim Dimension of interest.
 * @returns A specific rule for the given dimension, i.e. a reproduction rule.
 */
function getRepresentativeRule(dim) {
    switch (dim) {
        case 2:
            return getRule2D();
        case 3:
            return getRules3D()[0];
        case 4:
            return getRules4D()[0];
        case 5:
            return getRules5D()[0];
        case 6:
            return getRules6D()[0];
        case 7:
            return getRules7D()[0];
        default:
            return undefined;
    }
}

/**
 * Checks whether binary sequence1 and binary sequence2 are self-similar, i.e.
 * by finding a graph-isomorphism on the dim-simplex, s.t. after performing
 * the bijection both sequences are equal.
 * As each edge (1-simplex) appears once in every dim-simplex (i.e. among the dim+1 consecutive entries
 * there are two of value 1 (identifying an edge) and 0 otherwise)), we
 * learn for each sub-sequence of length dim+1 from sequence1 to which slots in the corresponding
 * sub-sequence in sequence2 the marked slots (value 1) could map. Going through all sub-sequences
 * we see whether a bijection exists.
 * NOTE: Currently allows to go from generation 0 to 1, i.e. starting with depth 0.
 * Could be extended to work on subsequent dephts (groing from one depth to depth+1).
 * OBSERVATION: Gives the rule back!
 * @param {*} sequence1 Array of entries. Usually from previous generation.
 * @param {*} sequence2 Array of entries. Usually from next generation.
 * @returns True if mapping exists for all subsequences.
 */
function isSelfSimilar(sequence1, sequence2, dim) {
    let lengthOfSubSequence = dim + 1;
    let allBijectionsFound = true;

    // We need to find dim+1 many bijections because
    // sequence1 is regenerated dim+1 times in the next generation.
    let indexCounter;
    for (let regenSequenceCounter = 0; regenSequenceCounter < lengthOfSubSequence; regenSequenceCounter++) {
        // Build index counter to learn what are the possible mappings of an index going from
        // one sub-sequence in sequence1 to the corresponding in sequence2
        indexCounter = new Array(lengthOfSubSequence);
        for (let i = 0; i < lengthOfSubSequence; i++) {
            indexCounter[i] = [];
        }

        // Traverse sub-sequence
        for (let subSequenceCounter = 0; subSequenceCounter < lengthOfSubSequence; subSequenceCounter++) {
            // Traverse entries in sub-sequence of sequence1
            for (let indexInSeq1 = 0; indexInSeq1 < lengthOfSubSequence; indexInSeq1++) {
                // Index needs to determine correct sub-sequence first and then run through it
                let seq1Index = subSequenceCounter * lengthOfSubSequence + indexInSeq1;
                // Only look for those which are incident to an edge
                if (sequence1[seq1Index] == 1) {
                    // Traverse entries in corresponding sub-sequence of sequence2
                    for (let indexInSeq2 = 0; indexInSeq2 < lengthOfSubSequence; indexInSeq2++) {
                        // Index needs to find correct bijection first (i.e. regenerated sequence counter), then
                        // in it the correct sub-sequence and afterwards run through it. Note, that each
                        // bijection addresses an array of length (dim+1)^2.
                        let seq2Index = regenSequenceCounter * lengthOfSubSequence * lengthOfSubSequence + subSequenceCounter * lengthOfSubSequence + indexInSeq2;
                        // Only look for those which are incident to an edge
                        if (sequence2[seq2Index] == 1) {
                            if (indexCounter[indexInSeq1] == undefined)
                                indexCounter[indexInSeq1] = [];
                            // Add possible edge index of sequence2 in indexCounter of sequence1 for this sub-sequence
                            indexCounter[indexInSeq1].push(indexInSeq2);
                        }
                    }
                }
            }
        }

        // Identify bijection, i.e. index maps to index occurring twice
        let bijectionIndexOrder = new Array(lengthOfSubSequence);
        let duplicates;
        let bijectionFound = true;
        for (let i = 0; i < lengthOfSubSequence; i++) {
            duplicates = getMultipleEntry(indexCounter[i]);
            if (duplicates.length == 1) {
                bijectionIndexOrder[i] = duplicates[0];
            }
            else {

                bijectionFound = false;
                allBijectionsFound = false;
                break;
            }
        }

        // Print result of bijection
        if (bijectionFound) {
            w("Bijection found for regenSequenceCounter " + regenSequenceCounter);
            w("Bijection is: " + bijectionIndexOrder);
        }
        else {
            w("No bijection found for regenSequenceCounter " + regenSequenceCounter);
        }

        /**
         * Determine multiple entries in array.
         * @param {*} a Array of entries.
         * @returns Array holding multiples.
         */
        function getMultipleEntry(a) {
            let duplicates = a.filter((value, index) =>
                a.indexOf(value) !== index && a.lastIndexOf(value) === index);
            return duplicates;
        }
    }

    // Report final result whether all bijections got found or not
    return allBijectionsFound;
}

/**
 * Checks for a binary sequence of entries whether it is symmetric, i.e.
 * i-th and (n-i)-th entries are equal with length of sequence n.
 * @param {*} sequence Array of entries.
 * @returns True if symmetric, false otherwise.
 */
function isSymmetric(sequence) {

    let numHalfEntries = Math.floor(sequence.length / 2);
    let lastIndex = sequence.length - 1;
    for (let i = 0; i < numHalfEntries; i++) {
        // If we find one dissimilar pair report false
        if (sequence[i] != sequence[lastIndex - i]) {
            return false;
        }
    }

    // None dissimilar entry found, thus true
    return true;
}

/**
 * Euclidean distance of points p and q.
 * @param {*} p 1D array of coordinates of first point.
 * @param {*} q 1D array of coordinates of second point.
 * @returns Scalar value, i.e. distance of p and q.
 */
function distance(p, q) {
    if (p.length != q.length) return undefined;

    let d = 0;
    let diff;
    for (let i in p) {
        diff = p[i] - q[i]
        d += diff * diff;
    }
    return Math.sqrt(d);
}

/**
   * Converts a given decimal number to a number with given base.
   * @param {*} number Decimal number.
   * @param {*} base Number in given base.
   * @returns Array of coefficients.
   */
function convertDecimalToBase(number, base) {
    let temp = [];
    let number_ = number;
    while (Math.floor(number_ / base) != 0) {
        temp.push(number_ % base);
        number_ = Math.floor(number_ / base);
    }
    temp.push(number_ % base);

    let newNumber = new Array(temp.length);
    for (let i = 0; i < temp.length; i++) {
        newNumber[temp.length - i - 1] = temp[i];
    }

    return newNumber;
}

/**
 * Converts a given number in certain base and returns the decimal.
 * @param {*} number Number as array holding coefficients.
 * @param {*} base Base in which the number is encoded.
 * @returns Decimal value of the number.
 */
function convertBaseToDecimal(number, base) {
    let decimal = 0;
    for (let i = 0; i < number.length; i++) {
        decimal += number[number.length - i - 1] * Math.pow(base, i)
    }

    return decimal;
}

/**
   * Rotate u around v by t with quaternions.
   * @param {*} u
   * @param {*} v
   * @param {*} t
   * @returns
   */
function rotate(u, v, t) {
    v = normalize(v);

    let cosVal = Math.cos(t / 2);
    let sinVal = Math.sin(t / 2);
    let q = [cosVal, sinVal * v[0], sinVal * v[1], sinVal * v[2]];
    let q_ = [q[0], -q[1], -q[2], -q[3]];
    let p = [0, u[0], u[1], u[2]];
    let product = multQuaternion(q_, multQuaternion(p, q));
    return [product[1], product[2], product[3]];
}

/**
 * Normalize vector p.
 * @param {*} p 1D array representing a vector.
 * @returns Normalized vector.
 */
function normalize(p) {
    let h = 0;
    for (let i = 0; i < p.length; i++) {
        h += p[i] * p[i];
    }
    h = Math.sqrt(h);

    let p_ = new Array(p.length);
    for (let i = 0; i < p.length; i++) {
        p_[i] = p[i] / h;
    }

    return p_;
}

/**
 * Performs quaternion multiplication.
 * @param {*} p Quaternion 1.
 * @param {*} q Quaternion 2.
 * @returns Quaternionic product of p and q.
 */
function multQuaternion(p, q) {
    return [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3],
    p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2],
    p[0] * q[2] + p[2] * q[0] - p[1] * q[3] + p[3] * q[1],
    p[0] * q[3] + p[3] * q[0] + p[1] * q[2] - p[2] * q[1]];
}

function w(s) { console.log(s) };