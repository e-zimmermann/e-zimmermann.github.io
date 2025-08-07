export {
    controllerSpeed,
    probeInitialScale,
    probeInitialPosition,
    probeGlobeScaleSpeed,
    probeRadiusMin,
    probeRadiusMax,
    probeTranslateMin,
    probeTranslateMax,
    probeInitialMaterialAlpha,
    probeInitialTranslate,
    iconAngleVisibility,
    iconAngleRotation,
    iconDistance,
    probeColors,
    colorSelected,
    colorDeselected,
    initialLinkRadius,
    linkHighlightRadius,
    nodeInitialScaleValue,
    nodeHighlightScaleValue,
    nodeInitialScale,
    nodeSegmentNumber,
    linkTessellationNumber,
    accuracy
}

/**
 * Describe global variables
 */
const controllerSpeed = 0.1; // Speed at which continuous controller input is processed

// Probe
const probeInitialScale = new BABYLON.Vector3(1, 1, 1); // Controls the initial scale of each probe
const probeInitialPosition = new BABYLON.Vector3(1, 0, 0); // Controls the initial position of each probe
const probeGlobeScaleSpeed = 0.05; // Controls how fast a probe rescales
const probeRadiusMin = 0.1;  // Limits the minimal radius of a probe
const probeRadiusMax = 10;  // Limits the maximal radius of a probe
const probeTranslateMin = 0; // Limits the minimal translation of a probe
const probeTranslateMax = 30; // Limits the maximal translation of a probe
const probeInitialTranslate = 2; // Sets the initial distance of a probe on the ray
const probeInitialMaterialAlpha = 0.3; // Sets the semi-transparent material proberty of the probe

// Cone (visual cue)
//const iconAngleVisibility = .8; // Decides at which angle difference an icon is visible (radians)
const iconAngleVisibility = .01; // Decides at which angle difference an icon is visible (radians)
const iconAngleRotation = 0.6; // Decides where to place the icon on the screen as rotation (radians)
const iconDistance = 2; // Determines the radial distance of the cone from the camera

// Graph
const nodeInitialScaleValue = 0.07; // Scale of the nodes in the graph
const nodeInitialScale = new BABYLON.Vector3(nodeInitialScaleValue, nodeInitialScaleValue, nodeInitialScaleValue);
const nodeHighlightScaleValue = 0.10; // Scale of the nodes in the graph when marked
const initialLinkRadius = 0.02; // Radius of the tubes used for the links
const linkHighlightRadius = 0.04; // Radius of the tubes used for the links when marked
const nodeSegmentNumber = 32; // Segmentation number of the nodes
const linkTessellationNumber = 32; // Segmentation number of the links

// Misc
const accuracy = 1.e-16; // Value for calculations close to 0

// Define some initial probe colors
const probeColors = [];
probeColors.push(new BABYLON.Color4(198/255,172/255,133/255,1));
probeColors.push(new BABYLON.Color4(130/255,178/255,184/255,1));
probeColors.push(new BABYLON.Color4(226/255,229/255,203/255,1));
probeColors.push(new BABYLON.Color4(162/255,196/255,198/255,1));
probeColors.push(new BABYLON.Color4(217/255,194/255,189/255,1));

const colorSelected = new BABYLON.Vector4(0,1,0,1); // Predefined color for a selected object
const colorDeselected = new BABYLON.Vector4(1,1,1,1); // Predefined color for a deselected object

