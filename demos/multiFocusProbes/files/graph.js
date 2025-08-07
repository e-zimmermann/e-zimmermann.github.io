//import * as d3force from 'd3-force-3d'; // NOTE: Currently not in use for this demo
import { loadGraphJSON } from "./loaderGraphJSON.js";
import { nodeInitialScale, nodeSegmentNumber, linkTessellationNumber, initialLinkRadius, colorDeselected, accuracy } from "./config.js";

export { Graph }

/**
 * Graph class
 */
class Graph {

    /**
     * Constructs a new graph w.r.t. passed path
     * @param {*} path
     */
    constructor(path) {
        this.initGraph(path);
    }

    /**
     * Initializes all relevant properties of graph object
     *
     * @param {*} path File location, passed by constructor
     */
    initGraph(path) {
        this.loadedItem = loadGraphJSON(path);

        //
        // Build node root instance with color (used to build all nodes as instances of this one)
        this.nodeRootInstance = new BABYLON.CreateSphere("NodeRootInstance", { diameter: 2, segments: nodeSegmentNumber });
        this.nodeRootInstance.isVisible = false;
        this.nodeRootInstance.scaling = nodeInitialScale;
        this.nodeRootInstance.registerInstancedBuffer("color", 4);
        this.nodeRootInstance.instancedBuffers.color = new BABYLON.Vector4(1, 1, 1, 1);

        //
        // Generate nodes as objects
        this.nodes = [];
        for (let i in this.loadedItem.vertices) {
            this.nodes.push(new Node(this));
        }

        //
        // Build link root instance with color (used to build all links as instances of this one)
        this.linkRootInstance = BABYLON.MeshBuilder.CreateTube("LinkRootInstance", {
            path: [new BABYLON.Vector3(-0.5, 0, 0), new BABYLON.Vector3(0.5, 0, 0)],
            radius: 1,
            tessellation: linkTessellationNumber,
            //updatable: true,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });
        this.linkRootInstance.isVisible = false;
        this.linkRootInstance.registerInstancedBuffer("color", 4);
        this.linkRootInstance.instancedBuffers.color = new BABYLON.Vector4(1, 1, 1, 1);

        //
        // Generate links as objects
        this.links = [];
        for (let l in this.loadedItem.edges) {
            this.addLink(this.nodes[this.loadedItem.edges[l][0]], this.nodes[this.loadedItem.edges[l][1]]);
        }
    }

    /**
     * Places the nodes of the graph on a unit circle in equidistant manner
     */
    placeGraphOnUnitCircle() {
        let numOfNodes = this.nodes.length;
        for (let i in this.nodes) {
            let inc = i * 2 * Math.PI / numOfNodes;
            this.nodes[i].geom.position = new BABYLON.Vector3(Math.cos(inc), Math.sin(inc), 0);
        }

        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Places the nodes of graph randomly in unit cube
     */
    placeGraphInUnitCube() {
        for (let i in this.nodes) {
            this.nodes[i].geom.position = new BABYLON.Vector3(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
        }

        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Places the nodes of graph w.r.t. force directed layout and scales it.
     * Scaling is applied here as it is invoked after the simulation terminated.
     * NOTE: Currently not in use for this demo
     *
     * @param {*} scale Scaling for the node positions with default value 1.
     */
    placeGraphByForces(scale = 1) {
        //
        // Assign node-link for upcoming simulation
        // It is necessary to have links with source and target properties
        let nl = { nodes: [], links: [] };
        for (let i in this.loadedItem.vertices) {
            nl.nodes.push({ id: i })
        }
        let e;
        for (let i in this.loadedItem.edges) {
            e = this.loadedItem.edges[i];
            nl.nodes.push({ source: e[0], target: e[1] });
        }

        //
        // Perform simullation, i.e. 3D force directed layout
        let simulation = d3force.forceSimulation(nl.nodes, 3)
            .force('link', d3force.forceLink(nl.links))
            .force('charge', d3force.forceManyBody())
            .force('collide', d3force.forceCollide())
            .force('center', d3force.forceCenter(0, 0, 0))
            .on('end', () => endOfSimulation(this));

        //
        // Perform end of simulation updating all nodes
        function endOfSimulation(graph) {
            // Stop simulation
            simulation.stop()

            // Assign coordinates in nodes to our node geometries
            let n;
            for (let i in graph.nodes) {
                n = nl.nodes[i];
                graph.nodes[i].geom.position = new BABYLON.Vector3(n.x, n.y, n.z);
            }

            // Rescale to unit box
            graph.scaleGraphToUnitBox();

            // Rescale by scale value
            graph.scaleGraph(scale);

            // Translate graph
            graph.translateGraph(new BABYLON.Vector3(-3.5,-1.75,5));
        }
    }

    /**
     * Allows translation of graph, i.e. positions of nodes.
     * @param {*} translateVector Vector for translation
     */
    translateGraph(translateVector) {
        for (let i in this.nodes) {
            this.nodes[i].geom.position.addInPlace(translateVector);
        }

        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Allows scaling of graph, i.e. positions of nodes.
     * @param {*} scalar Value to scale the node positions.
     */
    scaleGraph(scalar) {
        for (let i in this.nodes) {
            this.nodes[i].geom.position.scaleInPlace(scalar);
        }

        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Rescales the graph to fit the unit box, i.e. resets node positions
     */
    scaleGraphToUnitBox() {
        //
        // Get bounding box
        let inf = Number.POSITIVE_INFINITY;
        let bb = [new BABYLON.Vector3(inf, inf, inf), new BABYLON.Vector3(-inf, -inf, -inf)];
        let p;
        for (let i in this.nodes) {
            p = this.nodes[i].geom.position;
            if (p.x < bb[0].x) bb[0].x = p.x;
            else if (p.x > bb[1].x) bb[1].x = p.x;
            if (p.y < bb[0].y) bb[0].y = p.y;
            else if (p.y > bb[1].y) bb[1].y = p.y;
            if (p.z < bb[0].z) bb[0].z = p.z;
            else if (p.z > bb[1].z) bb[1].z = p.z;
        }

        // Translate nodes by lower bounding box point
        this.translateGraph(bb[0].scale(-1));

        //
        // Obtain largest dimension extend (reuse inf) and rescale
        inf = Math.max(bb[1].x - bb[0].x, Math.max(bb[1].y - bb[0].y, bb[1].z - bb[0].z));
        this.scaleGraph(1 / (inf));
    }

    /**
     * Allows the translation of node positions w.r.t. probe activity. It generates for each node a linear
     * combination with inverse distant weights and provided translation vectors. The latter are the scaled
     * vectors from the probe content center to the probe center. All active probes influence the deformation.
     * @param {*} translateVectors Scaled directions from probe content to probe.
     * @param {*} probesWithVisibleProbeTunnels All probes with active tunnels.
     */
    translateGraph_version2(translateVectors, probesWithVisibleProbeTunnels) {
        for (let i in this.nodes) {
            let node = this.nodes[i];

            // Initialize relevant variables
            let weightedTranslate = BABYLON.Vector3.Zero();
            let weight;
            let weightedTranslateForNodesInProbe = BABYLON.Vector3.Zero();
            let weightSum = 0;
            let numOfProbesIncludingNode = 0;

            //
            // Traverse all probes with active tunnels and collect respective translate vectors
            // If node lies in more than one it should be influenced by the respective translate vectors
            for (let j in probesWithVisibleProbeTunnels) {
                // Check whether node is in probe with active tunnel
                //if (probesWithVisibleProbeTunnels[j].content.nodesInProbe2NodesRef.includes(this.nodes.indexOf(node))) {
                if (probesWithVisibleProbeTunnels[j].content.nodesInProbe2NodesRef.includes(i)) {
                    numOfProbesIncludingNode++;
                    weightedTranslateForNodesInProbe.addInPlace(translateVectors[j]);
                }

                // In any case determine weight to this probe (here inversed, i.e. nodes more close
                // receive more weight from this probe and multiplied with manually assigned weight)
                weight = 1 / BABYLON.Vector3.Distance(probesWithVisibleProbeTunnels[j].probeGeom.position, node.geom.position);
                weightSum += weight;
                weightedTranslate.addInPlace(translateVectors[j].scale(weight));
            }

            // If we have at least one probe containing a node we translate the node according to
            // equally weighted sum of the translate vectors corresponding to the probes
            if (numOfProbesIncludingNode > 0) {
                // Scale translation vector equally
                weightedTranslateForNodesInProbe.scaleInPlace(1 / numOfProbesIncludingNode);

                // Update the geometry of this node
                node.geom.position.addInPlace(weightedTranslateForNodesInProbe);
            }
            // Otherwise we update the node w.r.t. weights determined by distances to probes
            else {
                // Scale translation vector w.r.t. weight sum
                weightedTranslate.scaleInPlace(1 / weightSum);

                // Update the geometry of this node
                node.geom.position.addInPlace(weightedTranslate);
            }
        }

        // Update the links respectively
        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Allows to pull/push subgraph nodes when only one probe is active
     * @param {*} translateVector Scaled direction from probe content to probe.
     * @param {*} probeWithVisibleProbeTunnel Reference to the active probe.
     */
    extrudeNodes(translateVector, probeWithVisibleProbeTunnel) {
        for (let i in this.nodes) {
            let node = this.nodes[i];
            // Check whether node is in probe with active tunnel
            if (probeWithVisibleProbeTunnel.content.nodesInProbe2NodesRef.includes(i)) {
                node.geom.position.addInPlace(translateVector);
            }
        }

        // Update the links respectively
        for (let i in this.links) {
            this.links[i].updateLink();
        }
    }

    /**
     * Scaling of node geometries.
     * @param {*} uniformScale Scale value for the scaling of spheres (used as node geometries).
     */
    scaleNodesUniformly(uniformScale) {
        let scale = new BABYLON.Vector3(uniformScale, uniformScale, uniformScale);
        for (let i in this.nodes) {
            this.nodes[i].geom.scaling = scale;
        }
    }

    /**
     * Scaling of node geometry.
     * @param {*} uniformScale Scale value for the scaling of spheres (used as node geometries).
     * @param {*} index Index of node to be scaled.
     */
    scaleNode(uniformScale, index) {
        let scale = new BABYLON.Vector3(uniformScale, uniformScale, uniformScale);
        this.nodes[index].geom.scaling = scale;
    }

    /**
     * Scaling of link geometries.
     * @param {*} linkRadius Scale value applied to tube radius of links.
     */
    scaleLinkRadius(linkRadius) {
        for (let i in this.links) {
            this.links[i].updateLinkRadius(linkRadius);
        }
    }

    /**
     * Scales link geometry.
     * @param {*} linkRadius Scale value applied to tube radius of link.
     * @param {*} index Index of respective link.
     */
    scaleLinkRadius(linkRadius, index) {
        this.links[index].updateLinkRadius(linkRadius);
    }

    /**
     * Allows the removal of a specific node from the graph.
     * @param {*} node Reference to the node to be removed.
     */
    removeNode(node) {
        // Remove all incident links while traversing incident links array backwards, as it shrinks
        for (let i = node.incidentLinks.length - 1; i >= 0; i--) {
            this.removeLink(node.incidentLinks[i]);
        }

        // Dispose node geometry
        node.geom.dispose();

        // Remove from nodes array
        let index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    /**
     * Adds a new link between two nodes.
     * @param {*} node0 Reference to first node.
     * @param {*} node1 Reference to second node.
     */
    addLink(node0, node1) {
        this.links.push(new Link(node0, node1, this));
    }

    /**
     * Allows the removal of a specific node from the graph.
     * @param {*} link Reference to the link to be removed.
     */
    removeLink(link) {
        // Remove references to link from respective nodes only if contained
        let index = link.node0.incidentLinks.indexOf(link);
        if (index > -1) {
            link.node0.incidentLinks.splice(index, 1);
        }
        index = link.node1.incidentLinks.indexOf(link);
        if (index > -1) {
            link.node1.incidentLinks.splice(index, 1);
        }

        // Dispose link geometry
        link.geom.dispose();

        // Remove from links array
        index = this.links.indexOf(link);
        if (index > -1) {
            this.links.splice(this.links.indexOf(link), 1);
        }
    }
}

/**
 * Node class
 */
class Node {
    /**
     * Constructs a new node as object of passed graph
     * @param {*} graph
     */
    constructor(graph) {
        this.parent = graph;
        this.geom = graph.nodeRootInstance.createInstance();
        this.incidentLinks = [];
        this.geom.node = this; // Reference from mesh to node object
    }

    /**
     * Adds reference to incident link of this node.
     * @param {*} link Reference to link.
     */
    addIncidentLink(link) {
        this.incidentLinks.push(link);
    }

    /**
     * Removes reference to incident link of this node.
     * @param {*} link Reference to link.
     */
    removeIncidentLink(link) {
        this.incidentLinks.splice(this.incidentLinks.indexOf(link), 1);
    }

    /**
     * Update node position to given values, also also update incidient links.
     * @param {*} position New position for the node.
     */
    updateNodePosition(position) {
        this.geom.position = position;
        this.updateIncidentLinkPositions();
    }

    /**
     * Invoke link update of incdient links of this node.
     */
    updateIncidentLinkPositions() {
        for (let i in this.incidentLinks) {
            this.incidentLinks[i].updateLink();
        }
    }
}

/**
 * Link class
 */
class Link {

    /**
     * Generates a new link using references to two nodes and graph (to which it then belongs)
     * @param {*} node0 Referende to first node of link
     * @param {*} node1 Reference to second node of link
     * @param {*} graph Graph to which link then belongs
     */
    constructor(node0, node1, graph) {
        this.parent = graph;
        this.node0 = node0;
        this.node1 = node1;
        //
        // Invoke link as instance and reset scaling in y and z (x is length and changed dynamically)
        // Thus when changing the radius we need to adress y and z
        this.geom = graph.linkRootInstance.createInstance();
        this.geom.scaling.y = initialLinkRadius;
        this.geom.scaling.z = initialLinkRadius;
        this.orientationVector = new BABYLON.Vector3(1, 0, 0);
        this.geom.link = this; // Reference from mesh to link object

        // Inform nodes about incident links
        this.node0.addIncidentLink(this);
        this.node1.addIncidentLink(this);

        this.updateLink();
    }

    /**
     * Updates the links (usually invoked when nodes change).
     * Here we perform a rotation, scaling, and translation of the tubes used for the links.
     */
    updateLink() {
        // Set length to distance of respective nodes
        this.geom.scaling.x = BABYLON.Vector3.Distance(this.node0.geom.position, this.node1.geom.position);

        //
        // Return if nodes coincide
        if (this.geom.scaling.x == 0)
            return;

        //
        // Call direction vectors (between respective nodes and old orientation)
        let directionNode2Node = this.node0.geom.position.subtract(this.node1.geom.position).normalize();
        let oldOrientation = this.orientationVector;

        //
        // Perform rotation if orientation changed
        if (BABYLON.Vector3.DistanceSquared(directionNode2Node, oldOrientation) > accuracy) {
            let crossProduct = BABYLON.Vector3.Cross(oldOrientation, directionNode2Node).normalize();
            let angle = BABYLON.Vector3.GetAngleBetweenVectors(oldOrientation, directionNode2Node, crossProduct);
            this.geom.rotate(crossProduct, angle, BABYLON.Space.WORLD);
            this.orientationVector = directionNode2Node;
        }

        //
        // Reposition w.r.t. incident nodes
        this.geom.position = this.node0.geom.position.add(this.node1.geom.position);
        this.geom.position.scaleInPlace(0.5);
    }

    /**
     * Updates the link radius, i.e. the radius of the tube used for the links.
     * Note: Only the y and z coordinates are scaled as x coordinate reflects length of tube.
     * @param {*} linkRadius Passed value for rescaling.
     */
    updateLinkRadius(linkRadius) {
        this.geom.scaling.y = linkRadius;
        this.geom.scaling.z = linkRadius;
    }
}