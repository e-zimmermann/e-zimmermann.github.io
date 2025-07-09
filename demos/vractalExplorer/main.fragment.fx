precision highp float;

// Uniforms
uniform int maxIterations; // Max amount of iterations allowed in iterative scheme
uniform float eps; // Stepsize for raymarching
uniform float radius; // Radius of sphere for rendering (only raymarch inside sphere)
uniform float radiusSq; // Square of radius of sphere for rendering
uniform vec3 cameraPosition; // Built-in world position of camera
uniform int schemeChoice; // Whether we use new or old scheme
uniform vec3 juliaConstant; // Passed julia constant

// Varying
in vec4 fragPosWorld;

// Define global values
int maxIterationsNormalApprox = 10; // Maximal number of iterations for normal approximation (experimental)
float clarityAlpha = 0.; // Clarity factor
float clarityDelta = 1.; // Clarity exponent

//
// Differential form approach, here we pass a point p
// and write the function values f=f(p) and g=g(p) to pass them back
//
// We need to consider two cases here:
// a) x=y=0: In this case we set phi = 0 (as we expect to rotation in the angular component of phi when multiplying)
// and obtain theta w.r.t. the z coordinate, i.e. either + or - pi/2 which then gets doubled.
// So we end up with cos(2phi) = 1, sin(2phi) = 0, cos(2theta)=-1, sin(2theta) = 0.
// b) x=y=z=0: Uses the same argumentation but now sets also theta to 0.
// So we end up with cos(2phi) = 1, sin(2phi) = 0, cos(2theta)=1, sin(2theta) = 0.
// First ask for undefined cases x=y=0 (including x=y=z=0) and
// set f=(maxEscapeRadius, 0, 0) and g=(0,maxEscapeRadius,0).
// This gives in the cross product z = f x g = (0,0,maxEscapeRadius).
// And even though we add something to this cross product we finally get
// that dot(z,z) >= maxEscapeRadius^2 which is larger than the maximal value for radiusSq.
//
void fctFG(in vec3 p, out vec3 f, out vec3 g) {
// Declare all used variables
float r = length(p);
float cosPhi;
float sinPhi;
float cosTheta1;
float cosTheta2;
float cosTheta;
float sinTheta;

// Undefined case in which x=y=0 (or x=y=z=0)
if (p.x == 0. && p.y == 0.) {
    // Assign evaluated phi values
    cosPhi = 1.;
    sinPhi = 0.;

    // Assign evaluated theta values if z=0
    if (p.z == 0.) {
        cosTheta = 1.;
        sinTheta = 0.;
    }
    // Assign evaluated theta values if z!=0
    else {
        cosTheta = -1.;
        sinTheta = 0.;
    }
}
// Remaining defined cases
else {
    vec3 v = p/r;
    vec3 w = normalize(vec3(p.x, p.y, 0));
    cosPhi = w.x*w.x-w.y*w.y;
    sinPhi = w.y*w.x+w.y*w.x;
    cosTheta1 = v.x*w.x+v.y*w.y;
    cosTheta2 = v.x*w.x+v.y*w.y;
    cosTheta = cosTheta1*cosTheta2-v.z*v.z;
    sinTheta = v.z*cosTheta2 + v.z*cosTheta1;
}
// Receive funtion pair from main java script file
#include<functionPair>
}

//
// Calculate distance on ray
//
float getDistance(float clarityDist) {
return max(clarityAlpha*pow(clarityDist, clarityDelta), eps);
}

//
// Evaluates the distance to the object in question
// If point in question stays inside bound after number of iterations we consider it
// to be inside and return zero
//
bool evaluatePointAndObject(inout vec3 c, vec3 rayDir, inout float dist) {
int iter; // Number of iterations used throughout method
clarityAlpha = eps; // Set initial clarity alpha to chosen eps value
float clarityDist = length(cameraPosition.xyz - c);
dist = eps; // Set initial distance
vec3 f, g;

//
//
// Scheme 0 - f(z) x g(c)
// with start value z = c
//
//
if (schemeChoice == 0) {
while (true) {
    // Start value
    vec3 z = c;

    // Process initial point once
    fctFG(z, f, g);

    // Iterate
    for (iter = 0; iter < maxIterations; iter++) {
        // Apply scheme
        z = cross(f, g);
        f = z;

        // Check divergence condition
        if (dot(z,z) > radiusSq) {
            break;
        }
    }

    // If point is still insider after max iterations we are done
    if (iter == maxIterations) {
        return true;
    }
    // If not find new point w.r.t. clarity used by Hart
    else {
        dist = getDistance(clarityDist);
        c += dist*rayDir;
        clarityDist += dist;

        // Is point still inside render sphere?
        if (dot(c, c) > radiusSq) {
            return false;
        }
    }
}
}
//
//
// Scheme 1 - f(z) x g(z) + c
// with start value z = c
//
//
else if (schemeChoice == 1) {
while (true) {
    // Start value
    vec3 z = c;

    // Iterate
    for (iter = 0; iter < maxIterations; iter++) {
        // Apply scheme
        fctFG(z, f, g);
        z = cross(f, g) + c;

        // Check divergence condition
        if (dot(z,z) > radiusSq) {
            break;
        }
    }

    // If point is still insider after max iterations we are done
    if (iter == maxIterations) {
        return true;
    }
    // If not find new point w.r.t. clarity used by Hart
    else {
        dist = getDistance(clarityDist);
        c += dist*rayDir;
        clarityDist += dist;

        // Is point still inside render sphere?
        if (dot(c, c) > radiusSq) {
            return false;
        }
    }
}
}
//
//
// Scheme 2 - f(c) x g(c) + JuliaConstant
//
//
else {
while (true) {
    // Start value
    vec3 z = c;

    // Iterate
    for (iter = 0; iter < maxIterations; iter++) {
        // Apply scheme
        fctFG(z, f, g);
        z = cross(f, g) + juliaConstant;

        // Check divergence condition
        if (dot(z,z) > radiusSq) {
            break;
        }
    }

    // If point is still insider after max iterations we are done
    if (iter == maxIterations) {
        return true;
    }
    // If not find new point w.r.t. clarity used by Hart
    else {
        dist = getDistance(clarityDist);
        c += dist*rayDir;
        clarityDist += dist;

        // Is point still inside render sphere?
        if (dot(c, c) > radiusSq) {
            return false;
        }
    }
}
}
}

//
// Normal arppoximation
//
vec3 approximateNormal(vec3 c, float dist) {
// Sampled points p[] around point c in distance dist
vec3 p[6];
p[0] = c + vec3(-dist,0,0);
p[1] = c + vec3(dist,0,0);
p[2] = c + vec3(0,-dist,0);
p[3] = c + vec3(0,dist,0);
p[4] = c + vec3(0,0,-dist);
p[5] = c + vec3(0,0,dist);

// Set starting values for iteration to individual p[i]
vec3 z[6];
for (int i = 0; i < 6; i++) {
    z[i] = p[i];
}

// Get normal w.r.t. scheme choice
vec3 f, g;
//
// Scheme 0 - f(z) x g(c)
// with start value z = c
//
if (schemeChoice == 0) {
for (int i = 0; i < 6; i++) {
    fctFG(z[i], f, g);
    for (int iter = 0; iter < maxIterationsNormalApprox; iter++) {
        z[i] = cross(f, g);
        f = z[i];
    }
}
}
//
// Scheme 1 - f(z) x g(z) + c
// with start value z = c
//
else if (schemeChoice == 1) {
for (int iter = 0; iter < maxIterationsNormalApprox; iter++) {
    for (int i = 0; i < 6; i++) {
        fctFG(z[i], f, g);
        z[i] = cross(f, g) + p[i];
    }
}
}
//
// Scheme 2 - f(c) x g(c) + JuliaConstant
//
else {
for (int iter = 0; iter < maxIterationsNormalApprox; iter++) {
    for (int i = 0; i < 6; i++) {
        fctFG(z[i], f, g);
        z[i] = cross(f, g) + juliaConstant;
    }
}
}

// Calculate final normal
return normalize(vec3(length(z[1])-length(z[0]), length(z[3])-length(z[2]), length(z[5])-length(z[4])));
}

//
// Includes Phong model for shading w/ constant k-coefficients for each primary color,
// using the reflection vector as it gets only evaluated once per fragment and all
// other variables set in the method.
//
vec3 shading(in vec3 lightPosition, in vec3 k_d, in vec3 normal, in vec3 pointPosition, in vec3 rayDir) {
// Calculate relevant vectors
vec3 v = -rayDir; // Invert already normlized rayDirection (as viewing vector starting in p towards camera)
vec3 n = normalize(normal); // Normalize given normal and use additional variable name for it
vec3 l = normalize(lightPosition-pointPosition); // Get direction from point to light
float lDOTn = dot(l,n); // Helper variable
vec3 k_s = vec3(1.);
vec3 k_a = vec3(0.1);

// Variables
float shininess = 32.;
vec3 specularColor = vec3(1.);
vec3 ambientColor = vec3(1.);

// Calculate light intensities
vec3 diffuseTerm = max(0., lDOTn)*k_d; // Get diffuse term for all three primaries
vec3 r = normalize(2.*lDOTn*n-l); // Get reflected light direction
vec3 specularTerm = k_s*pow(max(0., dot(r,v)),shininess)*specularColor;// Get specular term for all three primaries
vec3 ambientTerm = k_a*ambientColor;

// Combine and return
return diffuseTerm+specularTerm+ambientTerm;
}

//
// Core method to render scene per fragment
//
void main(void) {
// Generate ray starting at camera position
// Current (traveling) point in question is called pt
vec3 fragPosInSpace = fragPosWorld.xyz;
vec3 camPos = cameraPosition.xyz;
vec3 pt = camPos;
vec3 rayDir = normalize(fragPosInSpace - pt);

// Render inside a bounding sphere
float b = dot(rayDir, pt);
float discriminant = b*b-dot(pt, pt)+radiusSq;

// Only consider case in which bounding sphere got hit twice
// Other case should not occur most likely
if (discriminant > 0.) {
    // Get intersection t-values
    float deltaRoot = sqrt(discriminant);
    float t = min(-b-deltaRoot, -b+deltaRoot);
    if (t < 0.) {
        pt = cameraPosition;
    }
    else {
        pt += t*rayDir;
    }

    // Evaluate point pt and object and retrieve local iteration number and corresponding point
    float dist;
    if (evaluatePointAndObject(pt, rayDir, dist)) {
        vec3 normal = approximateNormal(pt, dist);
        vec3 f, g;
        fctFG(pt,f,g);
        vec3 fAndG = cross(f,g);
        vec3 color = (normalize(fAndG)+1.)/2.;
        gl_FragColor = vec4(shading(camPos, color, normal, pt, rayDir), 1);
    }
}
}