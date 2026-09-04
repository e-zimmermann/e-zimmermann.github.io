/**
  * Determines squared Euclidean distance between p and q.
 * @param {*} p Point 1 as array.
 * @param {*} q Point 2 as array.
 * @returns Scalar value.
 */
function distanceSq(p, q) {
    if (p.length != q.length) {
        throw new Error("Length of p and q not equal.");
    }

    let distSq = 0;
    let h;
    for (let i = 0; i < p.length; i++) {
        h = p[i] - q[i];
        distSq += h * h;
    }

    return distSq;
}

/**
 * Determines Euclidean distance between p and q.
 * @param {*} p Point 1 as array.
 * @param {*} q Point 2 as array.
 * @returns Scalar value.
 */
function distance(p, q) {
    return Math.sqrt(distanceSq(p, q));
}

/**
 * Determines elliptical distance, i.e., consider an ellipse with
 * center q and extends a. Determine distance for p.
 * @param {*} p Point 1 as array.
 * @param {*} q Point 2 as array, center of ellipse.
 * @param {*} aSq Extends as array, already squared.
 * @returns Distance to be used whether p is inside or outside of ellipse.
 */
function ellipDistanceSq(p, q, aSq) {
    let distSq = 0;
    let h;
    for (let i = 0; i < p.length; i++) {
        h = p[i] - q[i];
        distSq += h * h / aSq[i];
    }

    return distSq;
}

/**
 * Adds vector w to vector v.
 * @param {*} v Vector as array.
 * @param {*} w Vector as array.
 * @returns New vector as array, i.e., v+w.
 */
function vecAdd(v, w) {
    if (v.length != w.length) {
        throw new Error("Length of v and w not equal.");
    }

    let u = new Array(v.length);
    for (let i = 0; i < v.length; i++) {
        u[i] = v[i] + w[i];
    }
    return u;
};

/**
 * Scales vector v by scalar a and returns a new vector as array.
 * @param {*} a Scalar.
 * @param {*} v Vector as array.
 * @returns New vector as array, i.e., a*v.
 */
function vecScale(a, v) {
    let u = new Array(v.length);
    for (let i = 0; i < v.length; i++) {
        u[i] = a * v[i];
    }
    return u;
};

/**
 * Calculates dot product of vectors v and w.
 * @param {*} v Vector as array.
 * @param {*} w Vector as array.
 * @returns Scalar as result of dot product, i.e., <v,w>.
 */
function vecDot(v, w) {
    if (v.length != w.length) {
        throw new Error("Length of v and w not equal.");
    }

    let s = 0;
    for (let i = 0; i < v.length; i++) {
        s += v[i] * w[i];
    }
    return s;
};

/**
 * Calculates the Euclidean norm of vector v.
 * @param {*} v Vector as array.
 * @returns Scalar containing the Euclidean norm, i.e., ||v||_2.
 */
function vecEuclNorm(v) {
    return Math.sqrt(vecDot(v, v))
};

/**
 * Calculates the distance from v to w (considered as points), i.e.,
 * the Euclidean length of the vector v-w.
 * @param {*} v Vector as array.
 * @param {*} w Vector as array.
 * @returns Scalar representing the length of vector v-w.
 */
function vecDist(v, w) {
    let u = vecAdd(v, vecScale(-1, w));
    return vecEuclNorm(u, u)
};

/**
 * Copies the vector v.
 * @param {*} v Vector as array.
 * @returns New vector as array.
 */
function vecCopy(v) {
    let u = new Array(v.length);
    for (let i = 0; i < v.length; i++) {
        u[i] = v[i];
    }
    return u;
};

/**
 * Normalizes vector v and returns it as new vector (due to vecScale).
 * @param {*} v Vector as array.
 * @returns New vector as array.
 */
function vecNormalize(v) {
    return vecScale(1 / vecEuclNorm(v), v);
}

/**
 * Calculates cross product of vectors v and w. Both need to be of length 3.
 * @param {*} v Vector as array.
 * @param {*} w Vector as array.
 * @returns New vector as array, i.e., v x w.
 */
function vecCross(v, w) {
    if (v.length != 3 || v.length != w.length) {
        throw new Error("Length of v and w not 3 and/or equal.");
    }

    return [v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]];
}

/**
   * Rotate u around v by t with quaternions.
   * @param {*} u Vec3 as array.
   * @param {*} v Vec3 as array.
   * @param {*} t Scalar.
   * @returns Vec3 as array.
   */
function rotate(u, v, t) {
    v = vecNormalize(v);
    let cosVal = Math.cos(t / 2);
    let sinVal = Math.sin(t / 2);
    let q = [cosVal, sinVal * v[0], sinVal * v[1], sinVal * v[2]];
    let q_ = [q[0], -q[1], -q[2], -q[3]];
    let p = [0, u[0], u[1], u[2]];
    let product = multQuaternion(q_, multQuaternion(p, q));
    return [product[1], product[2], product[3]];
}

/**
 * Performs quaternion multiplication.
 * @param {*} p Quaternion 1, i.e., vec4 as array.
 * @param {*} q Quaternion 2, i.e., vec4 as array.
 * @returns Quaternionic product of p and q.
 */
function multQuaternion(p, q) {
    return [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3],
    p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2],
    p[0] * q[2] + p[2] * q[0] - p[1] * q[3] + p[3] * q[1],
    p[0] * q[3] + p[3] * q[0] + p[1] * q[2] - p[2] * q[1]];
}