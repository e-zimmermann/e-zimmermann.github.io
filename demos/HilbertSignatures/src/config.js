// VisSVG variables
var visSVG;
const visSVGWidth = 1024;
const visSVGHeight = 1024;
const visMargin = 10;

// Parallel coordinates plot
const linkedVisSVGWidth = visSVGWidth;
const linkedVisSVGHeight = linkedVisSVGWidth;
const linkedVisMargin = 20;

// Colors https://github.com/timothygebhard/js-colormaps?tab=readme-ov-file
const colormap1 = "Reds"; //"OrRd";
const colormap2 = "Blues" //"PuBu";


// Data variables
var data; // Holds loaded data including dimension, points, etc.
var pointset; // Reference to point set (either data itself or an entry in the data array)
var totalNumOfPoints; // Reference to the total number of points in all point sets
var points; // Reference to data.points
var pointDim; // Reference to point dimension
var samples; // Reference to samples in nD
var sampleDim; // Reference to sample dimension
var samples2D; // Reference to HC points in 2D
const samples2DLocation = "./data/hc/";
var classes; // Reference to classes
var numOfClasses; // Number of classes


// Linked Vis
var activePC = false;
var activePts2D = false;
const highlightColor = "hsl(37, 100%, 46%)";
const highlightColors = [highlightColor, highlightColor, "hsl(212, 74%, 50%)", "hsl(299, 91%, 33%)"];
var highlightIndex = 0;
var highlightCounter = undefined;
const inactiveColor = "#949494"
const inactiveOpacity = 0.3;
const pcStrokeWidth = "3";
const highlightCircleRadius = 10;


// Com Vis
var activeComVisPC = false;
var activeComVisTV = false;

// GUI variables
var guiVisible = true;
var automatizeGeneration = false;
var radius = .5;
var globalNormalization = false;
var currentPointSetIndex = 0;
var vis = ["vis1D", "vis2D"];
var currentVisID = 0;

// Pre-processing
var useLocalRadii = false;
var localRadii = undefined;
const numOfIterLocalRadii = 20;
const bisectionMethodTolerance = 0.0001;

// Misc
var diffTime;
const keyToggleGui = "y";
const keyToggleCoverage = "x";