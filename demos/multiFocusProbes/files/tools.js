/**
   * Rotate u around v by t with quaternions.
   * @param {*} u
   * @param {*} v
   * @param {*} t
   * @returns
   */
function rotate(u, v, t) {
    v.normalize();
    let cosVal = Math.cos(t / 2);
    let sinVal = Math.sin(t / 2);
    let q = [cosVal, sinVal * v.x, sinVal * v.y, sinVal * v.z];
    let q_ = [q[0], -q[1], -q[2], -q[3]];
    let p = [0, u.x, u.y, u.z];
    let product = multQuaternion(q_, multQuaternion(p, q));
    return new BABYLON.Vector3(product[1], product[2], product[3]);
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

/**
 * Converts color from HSV to RGB.
 * @param {*} h Hue value given in degree, i.e. 0° to 360°.
 * @param {*} s Saturation between 0 and 1.
 * @param {*} v Value between 0 and 1.
 * @returns RGB values ranging each from 0 to 1.
 */
function HSVtoRGBconversion(h, s, v) {
    // Get pre-values
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;

    // Get color
    let color;
    if (0 <= h && h < 60) {
        color = new BABYLON.Color3(c, x, 0);
    }
    else if (60 <= h && h < 120) {
        color = new BABYLON.Color3(x, c, 0);
    }
    else if (120 <= h && h < 180) {
        color = new BABYLON.Color3(0, c, x);
    }
    else if (180 <= h && h < 240) {
        color = new BABYLON.Color3(0, x, c);
    }
    else if (240 <= h && h < 300) {
        color = new BABYLON.Color3(x, 0, c);
    }
    else if (300 <= h && h <= 360) {
        color = new BABYLON.Color3(c, 0, x);
    }
    color.add(m);

    // Return color
    return color;
}

/**
 * Generates a new random hue value from 0 up tp 360
 * and returns a 4-vector holding the respective RGB values
 * and alpha = 1 in the last slot.
 * @returns A 4-vector with values rgba.
 */
function nextColor4() {
    let color = HSVtoRGBconversion(360*Math.random(), 1, 1);
    return new BABYLON.Color4(color.r, color.g, color.b, 1);
}
/**
 * Generates a 4-vector holding the respective RGB values
 * and alpha = 1 in the last slot for given hue value.
 * @param {*} value Value for Hue between 0 and 1.
 * @returns A 4-vector with values rgba.
 */
function color4(value) {
    let color = HSVtoRGBconversion(360*value, 1, 1);
    return new BABYLON.Color4(color.r, color.g, color.b, 1);
}

/**
 * Short version of console output.
 * @param {*} value String value to be printed to console.
 */
function w(value) {
    console.log(value);
}

export { nextColor4, HSVtoRGBconversion, multQuaternion, rotate, w, color4 }