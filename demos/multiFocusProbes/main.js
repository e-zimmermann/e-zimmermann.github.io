import { Probe } from './files/probe.js';
import { Graph } from './files/graph.js';
import {
    probeTranslateMin,
    probeTranslateMax,
    controllerSpeed,
    probeGlobeScaleSpeed,
    probeRadiusMin,
    probeRadiusMax,
    colorSelected,
    colorDeselected,
    nodeInitialScaleValue,
} from './files/config.js';
import { color4 } from "./files/tools.js";

var canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true); // Generates the BABYLON 3D Engine
const createScene = async function () {
    //
    //
    // Setup environment
    //
    //
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -6), scene);
    scene.clearColor = BABYLON.Color3.White();
    scene.ambientColor = BABYLON.Color3.White();
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, -2), scene);
    light.intensity = 0.7;

    try {
        const xr = await scene.createDefaultXRExperienceAsync({
            optionalFeatures: true,
            teleportationOptions: {
                forceHandedness: 'none' // Disables teleportation at all
            },
        });
        var xrCamera = xr.input.xrCamera;
        xrCamera.onXRCameraInitializedObservable.add(() => {
            xrCamera.position = new BABYLON.Vector3(0, 0, -2);
        })

        //
        //
        // Graph object
        //
        //
        var graph = new Graph("./files/data/soccerData.json");
        var graphLayoutChoice = 1;
        graphLayout();
        function graphLayout() {
            //
            // Choice = 0 places graph on unit circle and scales it
            if (graphLayoutChoice == 0) {
                graph.placeGraphOnUnitCircle();
                graph.scaleGraph(1.5);
                graph.translateGraph(new BABYLON.Vector3(0, 0, 2));
                console.log("Layout: Circle");
            }
            //
            // Choice = 1 places graph force directed but with precalculated poisitions from force layout
            // Uses dataPositions hard coded at end of file
            else if (graphLayoutChoice == 1) {
                let pos;
                for (let i in graph.nodes) {
                    pos = 3 * i;
                    graph.nodes[i].geom.position = new BABYLON.Vector3(dataPositions[pos], dataPositions[pos + 1], dataPositions[pos + 2]);
                }

                for (let i in graph.links) {
                    graph.links[i].updateLink();
                }

                graph.scaleGraphToUnitBox();
                graph.scaleGraph(10);
                graph.translateGraph(new BABYLON.Vector3(-5, -2.5, 5));
                console.log("Layout: Precalculated Forced Layout");
            }
            //
            // Other choice determines force layout and scales it
            // NOTE: Currently not in use for this demo
            else {
                graph.placeGraphByForces(7);
                console.log("Layout: Forced Layout (takes some time to position)");
            }
        }

        /**
         * Resets the colors and sizes w.r.t. currently active probes.
         */
        function resetGraph() {
            graph.scaleNodesUniformly(nodeInitialScaleValue);
            for (let i in graph.nodes) {
                graph.nodes[i].geom.instancedBuffers.color = new BABYLON.Vector4(1, 1, 1, 1);
            }
            for (let i in graph.links) {
                graph.links[i].geom.instancedBuffers.color = new BABYLON.Vector4(1, 1, 1, 1);
                graph.scaleLinkRadius(0.02, i);
            }
            for (let i in probes) {
                generateProbeContent(probes[i]);
            }
        }
        // Following is used to toggle last inserted edge
        var toggleHighlightLastInsertedLink = false;

        //
        //
        // Probe objects
        //
        //
        // Array of probes
        var probes = [];
        /**
         * Generate a new probe
         */
        function generateProbe() {
            let newProbeId = probes.length;
            probes.push(new Probe(newProbeId));
            probes[newProbeId].initIcon(xrCamera);
        }
        /**
         * Remove a probe with prescribed probe index from list
         * @param {*} probeIndex Index of probe to be removed
         */
        function removeProbe(probeIndex) {
            probes[probeIndex].removeProbe();
            probes.splice(probeIndex, 1);

            resetGraph();
        }
        // Generate a first probe and select it
        //generateProbe();
        var probeSelected = -1;
        /**
         * Generate content of a probe
         * @param {*} probe Pass reference to probe for its content generation
         */
        function generateProbeContent(probe) {
            probe.generateContent(graph, xrCamera);
        }
        // Instantiate a list to collect probe with active tunnels (used for deformation)
        var probesWithVisibleProbeTunnels = [];

        //
        //
        // Add functionality in xr mode
        //
        //
        xr.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => { // Gets motion controller
                //
                //
                // Left Hand Controller
                //
                //
                if (motionController.handness === 'left') {
                    const xr_ids = motionController.getComponentIds();

                    //
                    // Build in that currently non-fixed probe gets updated in each frame
                    scene.onBeforeRenderObservable.add(function () {
                        // If probe is currently selected
                        if (probeSelected > -1) {
                            // Update probe on ray
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            let dir = ray.direction.normalize().scale(probes[probeSelected].probeGeom.probeTranslate);
                            probes[probeSelected].probeGeom.position = ray.origin.add(dir);

                            // Check if probe hits something for vibration
                            let probeRadiusSquared = probes[probeSelected].probeGeom.scaling.x * probes[probeSelected].probeGeom.scaling.x;
                            for (let i in graph.nodes) {
                                if (BABYLON.Vector3.DistanceSquared(graph.nodes[i].geom.position, probes[probeSelected].probeGeom.position) <= probeRadiusSquared) {
                                    motionController.pulse(0.5, 100);
                                    break;
                                }
                            }
                        }
                    });

                    //
                    // Squeeze button
                    //
                    // Gather selected meshes: Could be probe, nodes, or links
                    // Then invokes changes on slider change
                    //
                    let squeezeComponent = motionController.getComponent(xr_ids[1]);
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        // Only invoke when we hit value 1
                        if (squeezeComponent.value == 1) {
                            if (sliderVisible) {
                                slider.isVisible = false;
                                sliderVisible = false;
                                selectedMeshes = [];
                            }
                            else {
                                let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                                var hit = scene.pickWithRay(ray);
                                if (hit.pickedMesh) {
                                    //
                                    // Check whether probe is selected
                                    if (probes.includes(hit.pickedMesh.probe)) {
                                        // Currently we do nothing when probe got hit
                                    }
                                    //
                                    // Check whether nodes are selected
                                    else if (graph.nodes.includes(hit.pickedMesh.node) || graph.links.includes(hit.pickedMesh.link)) {
                                        slider.isVisible = true;
                                        sliderVisible = true;
                                        selectedMeshes.push(hit.pickedMesh);
                                    }
                                    //
                                    // or links are selected
                                    else {
                                        let localIndex;
                                        for (let i = 0; i < probes.length; i++) {
                                            if (probes[i].hasContent) {
                                                // Search for node selected
                                                localIndex = probes[i].content.nodes.indexOf(hit.pickedMesh);
                                                if (localIndex > -1) {
                                                    slider.isVisible = true;
                                                    sliderVisible = true;
                                                    selectedMeshes.push(hit.pickedMesh);
                                                    selectedMeshes.push(graph.nodes[probes[i].content.nodesInProbe2NodesRef[localIndex]].geom);
                                                    break;
                                                }

                                                // Search for link selected
                                                localIndex = probes[i].content.links.indexOf(hit.pickedMesh);
                                                if (localIndex > -1) {
                                                    slider.isVisible = true;
                                                    sliderVisible = true;
                                                    selectedMeshes.push(hit.pickedMesh);
                                                    selectedMeshes.push(graph.links[probes[i].content.linksInProbe2LinksRef[localIndex]].geom);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    //
                    // Thumbstick Value Change
                    //
                    // Control forward/backward movement and scaling of probe when there is a probe selected
                    //
                    let thumbstickComponent = motionController.getComponent(xr_ids[2]);
                    thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                        //
                        // Check whether we have a probe selected
                        if (probeSelected > -1) {
                            let currProbeTranslate = probes[probeSelected].probeGeom.probeTranslate;

                            // Move probe in range min to max
                            if ((currProbeTranslate >= probeTranslateMin && currProbeTranslate <= probeTranslateMax)
                                || (currProbeTranslate < probeTranslateMin && Math.sign(axes.y) < 0)
                                || (currProbeTranslate > probeTranslateMax && Math.sign(axes.y) > 0)) {
                                // Assign new probeTranslate value
                                probes[probeSelected].probeGeom.probeTranslate -= axes.y * controllerSpeed;
                            }

                            // Scale probe in range from min to max
                            if (Math.abs(axes.x) > 0.5) {
                                let probeRadius = probes[probeSelected].probeGeom.scaling.x;
                                if ((probeRadius >= probeRadiusMin && probeRadius <= probeRadiusMax) ||
                                    (probeRadius < probeRadiusMin && Math.sign(axes.x) > 0) ||
                                    (probeRadius > probeRadiusMax && Math.sign(axes.x) < 0)) {
                                    let scaleFactor = probes[probeSelected].probeGeom.scaling.x * (1 + probeGlobeScaleSpeed * axes.x);
                                    probes[probeSelected].probeGeom.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
                                }
                            }
                        }
                        //
                        // Allow rotation of probe content if content sphere or probe is hit by ray
                        else {
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            var hit = scene.pickWithRay(ray);
                            if (hit.pickedMesh && probes.includes(hit.pickedMesh.probe)) {
                                let probe = probes[probes.indexOf(hit.pickedMesh.probe)];
                                let angle1 = controllerSpeed * axes.x;
                                let angle2 = controllerSpeed * -axes.y;

                                // Rotate around y- and x-axis
                                probe.content.graph.rotate(new BABYLON.Vector3(0, 1, 0), angle1, BABYLON.Space.WORLD);
                                probe.content.graph.rotate(new BABYLON.Vector3(1, 0, 0), angle2, BABYLON.Space.WORLD);
                            }

                        }
                    });

                    //
                    // Thumbstick Value Change
                    //
                    // Invoke automatized probe.
                    // Here we use an automatized sphere. It looks for the node with the most incident edges
                    //
                    thumbstickComponent.onButtonStateChangedObservable.add(() => {
                        if (thumbstickComponent.pressed) {
                            //
                            // Allow only if no probe is selected
                            if (probeSelected == -1) {
                                //
                                // Get node with maximal amount of edges (if not unique first one found is selected)
                                // Its just an example
                                let maxLinks = Number.NEGATIVE_INFINITY;
                                let maxLinkNodeIndex;
                                for (let i in graph.nodes) {
                                    if (graph.nodes[i].incidentLinks.length > maxLinks) {
                                        maxLinks = graph.nodes[i].incidentLinks.length;
                                        maxLinkNodeIndex = i;
                                    }
                                }

                                // Find maximal distance to adjacent node
                                let probeScale = Number.NEGATIVE_INFINITY;
                                let link;
                                let dist;
                                for (let i in graph.nodes[maxLinkNodeIndex].incidentLinks) {
                                    link = graph.nodes[maxLinkNodeIndex].incidentLinks[i];
                                    dist = BABYLON.Vector3.Distance(link.node0.geom.position, link.node1.geom.position);
                                    if (dist > probeScale) {
                                        probeScale = dist;
                                    }
                                }

                                // Generate probe, rescale and reposition it, and create its content
                                generateProbe();
                                let probeIndex = probes.length - 1;
                                probes[probeIndex].probeGeom.position = graph.nodes[maxLinkNodeIndex].geom.position;
                                probeScale /= 2;
                                probes[probeIndex].probeGeom.scaling = new BABYLON.Vector3(probeScale, probeScale, probeScale);
                                generateProbeContent(probes[probeIndex]);
                            }
                        }
                    });

                    //
                    // x-button
                    //
                    // If no probe selected then invoke new probe
                    // If probe selected than place probe
                    //
                    let xbuttonComponent = motionController.getComponent(xr_ids[3]);
                    xbuttonComponent.onButtonStateChangedObservable.add(() => {
                        if (xbuttonComponent.pressed) {
                            // If probe is currently selected lock it
                            if (probeSelected > -1) {
                                // Generate content
                                generateProbeContent(probes[probeSelected]);

                                // Reset graph (especially colorings etc.)
                                resetGraph();

                                // Deselect probe
                                probeSelected = -1;
                            }
                            // If probe is NOT currently selected
                            else {
                                // Check whether ray sees a probe
                                let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                                let hit = scene.pickWithRay(ray);

                                // We assume we hit no probe
                                probeSelected = -1;

                                // See whether we hit a mesh
                                if (hit.pickedMesh) {
                                    probeSelected = probes.indexOf(hit.pickedMesh.probe);

                                    if (probeSelected > -1) {
                                        // Following ensures that picked probe is displayed on the ray close to the picked point
                                        probes[probeSelected].probeGeom.probeTranslate = BABYLON.Vector3.Distance(controller.pointer.absolutePosition, hit.pickedPoint);
                                    }
                                }

                                // If we did not hit something at all or hit something different than a probe
                                // We take the newly inserted probe as selected and generate one
                                if (probeSelected == -1) {
                                    // First call probe selected as length, as it gets extended afterwards
                                    probeSelected = probes.length;

                                    // Generate new probe
                                    generateProbe();
                                }
                            }
                        }
                    });

                    //
                    // y-button
                    //
                    // Toggles activity of probe and shows its tunnel in consequence
                    //
                    let ybuttonComponent = motionController.getComponent(xr_ids[4]);
                    ybuttonComponent.onButtonStateChangedObservable.add(() => {
                        if (ybuttonComponent.pressed) {
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            var hit = scene.pickWithRay(ray);
                            if (hit.pickedMesh) {
                                let probeIndex = -1;
                                for (let i = 0; i < probes.length; i++) {
                                    if (probes[i].hasContent) {
                                        // Search whether node was selected to determine probe
                                        if (probes[i].content.nodes.includes(hit.pickedMesh)) {
                                            probeIndex = i;
                                            break;
                                        }

                                        // Search whether link was selected to determine probe
                                        if (probes[i].content.links.includes(hit.pickedMesh)) {
                                            probeIndex = i;
                                            break;
                                        }

                                        // If content sphere was selected
                                        if (hit.pickedMesh == probes[i].contentSphere) {
                                            probeIndex = i;
                                            break;
                                        }
                                    }
                                }

                                // Toggle probe tunnel
                                if (probeIndex > -1) {
                                    let state = !probes[probeIndex].probeTunnel.visibility;
                                    probes[probeIndex].toggleProbeTunnel(state);

                                    if (state) {
                                        probesWithVisibleProbeTunnels.push(probes[probeIndex]);
                                    }
                                    else {
                                        probesWithVisibleProbeTunnels.splice(probesWithVisibleProbeTunnels.indexOf(probes[probeIndex]));
                                    }
                                }
                            }
                        }
                    });
                }

                //
                //
                // Right Hand Controller
                //
                //
                if (motionController.handness === 'right') {
                    const xr_ids = motionController.getComponentIds();

                    //
                    // Squeeze button
                    //
                    // Recolor last link
                    //
                    let squeezeComponent = motionController.getComponent(xr_ids[1]);
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        if (squeezeComponent.value == 1) {
                            if (toggleHighlightLastInsertedLink) {
                                resetGraph();
                                toggleHighlightLastInsertedLink = false;
                            }
                            else {
                                // For images: Recolors last inserted link in orange
                                graph.links[graph.links.length - 1].geom.instancedBuffers.color = new BABYLON.Vector4(239 / 255, 127 / 255, 26 / 255, 1);
                                graph.scaleLinkRadius(0.05, graph.links.length - 1);
                                toggleHighlightLastInsertedLink = true;
                            }
                        }
                    });

                    //
                    // Thumbstick pressed
                    //
                    // Toggles layouts: 0 - circle, 1 - forcelayout
                    //
                    let thumbstickComponent = motionController.getComponent(xr_ids[2]);
                    thumbstickComponent.onButtonStateChangedObservable.add(() => {
                        if (thumbstickComponent.pressed) {
                            graphLayoutChoice = (graphLayoutChoice + 1) % 2;
                            graphLayout();
                        }
                    })

                    //
                    // Thumbstick value changed
                    //
                    // Control forward/backward movement when thumbstick changes
                    // in gaze direction (if nothing is hit with ray) or w.r.t. active probe if such was hit with ray
                    //
                    thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                        // If change is large enough
                        if (Math.abs(axes.y) > 0.5) {
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            var hit = scene.pickWithRay(ray);

                            // Get hit content sphere
                            if (hit.pickedMesh) {
                                let probeIndex = -1;
                                for (let i = 0; i < probes.length; i++) {
                                    if (probes[i].hasContent) {
                                        // If content sphere was selected
                                        if (hit.pickedMesh == probes[i].contentSphere) {
                                            probeIndex = i;
                                            break;
                                        }
                                    }
                                }

                                // Allow movement on selected probe tunnel
                                if (probeIndex > -1) {
                                    // Obtain translation vectors
                                    let translateVectors = [];
                                    for (let i in probesWithVisibleProbeTunnels) {
                                        let probe = probesWithVisibleProbeTunnels[i];
                                        translateVectors.push(probe.probeGeom.position.subtract(probe.contentSphere.position).normalize().scale(axes.y * controllerSpeed));
                                    }

                                    // Update graph position
                                    graph.translateGraph_version2(translateVectors, probesWithVisibleProbeTunnels);

                                    // Update probes with visible tunnels
                                    for (let i in probesWithVisibleProbeTunnels) {
                                        // Update the position
                                        probesWithVisibleProbeTunnels[i].probeGeom.position.addInPlace(translateVectors[i]);

                                        // And update its content
                                        // NOTE: Here we could include a function in class: Probe
                                        // called updateProbeContent() which just updates the positions of nodes and links
                                        if (Math.abs(axes.y) < 0.1)// NOTE: Current fix/workaround that it only gets invoked when change is small
                                            generateProbeContent(probesWithVisibleProbeTunnels[i]);
                                    }

                                    // Update remaining probes
                                    for (let i in probes) {
                                        let weightedTranslate = BABYLON.Vector3.Zero();
                                        let weight;
                                        let weightSum = 0;
                                        if (probesWithVisibleProbeTunnels.includes(probes[i])) {
                                            continue;
                                        }

                                        // Get weighted translate for probe in question
                                        for (let j in probesWithVisibleProbeTunnels) {
                                            weight = 1 / BABYLON.Vector3.Distance(probes[i].probeGeom.position, probesWithVisibleProbeTunnels[j].probeGeom.position);
                                            weightSum += weight;
                                            weightedTranslate.addInPlace(translateVectors[j].scale(weight));
                                        }

                                        // Scale translate vector by summed weights
                                        weightedTranslate.scaleInPlace(1 / weightSum);

                                        // Finally update probe position
                                        probes[i].probeGeom.position.addInPlace(weightedTranslate);

                                        // NOTE: Here we could include a function in class: Probe
                                        // called updateProbeContent() which just updates the positions of nodes and links
                                        if (Math.abs(axes.y) < 0.1) // NOTE: Current fix/workaround that it only gets invoked when change is small
                                            generateProbeContent(probes[i]);
                                    }
                                }

                                //
                                // Allows to travel space if we do not hit an active probe (by the ray)
                                else {
                                    // Translation of active camera in space
                                    let cam = scene.activeCamera;
                                    let dir = cam.target.add(cam.position.scale(-1)).normalize();
                                    cam.position = cam.position.add(dir.scale(-axes.y * controllerSpeed));
                                }
                            }

                            //
                            // Move in space in gaze direction
                            else {
                                // Translation of active camera in space
                                let cam = scene.activeCamera;
                                let dir = cam.target.add(cam.position.scale(-1)).normalize();
                                cam.position = cam.position.add(dir.scale(-axes.y * controllerSpeed));
                            }
                        }
                    });

                    //
                    // a-button
                    //
                    // Delete node, link or probe
                    //
                    let abuttonComponent = motionController.getComponent(xr_ids[3]);
                    abuttonComponent.onButtonStateChangedObservable.add(() => {
                        if (abuttonComponent.pressed) {
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            var hit = scene.pickWithRay(ray);
                            if (hit.pickedMesh) {
                                // We picked a probe and it has no visible tunnel currently
                                if (probes.includes(hit.pickedMesh.probe) && !hit.pickedMesh.probe.probeTunnelVisibility) {
                                    removeProbe(probes.indexOf(hit.pickedMesh.probe))
                                }
                                // We picked a node
                                else if (graph.nodes.includes(hit.pickedMesh.node)) {
                                    graph.removeNode(hit.pickedMesh.node);
                                }

                                // We picked a link
                                else if (graph.links.includes(hit.pickedMesh.link)) {
                                    graph.removeLink(hit.pickedMesh.link);
                                }

                                // We picked a node or link in a probe
                                else {
                                    let localIndex;
                                    for (let i = 0; i < probes.length; i++) {
                                        if (probes[i].hasContent) {
                                            // Search for node selected
                                            localIndex = probes[i].content.nodes.indexOf(hit.pickedMesh);
                                            if (localIndex > -1) {
                                                graph.removeNode(graph.nodes[probes[i].content.nodesInProbe2NodesRef[localIndex]]);
                                                generateProbeContent(probes[i]);
                                                break;
                                            }

                                            // Search for link selected
                                            localIndex = probes[i].content.links.indexOf(hit.pickedMesh);
                                            if (localIndex > -1) {
                                                graph.removeLink(graph.links[probes[i].content.linksInProbe2LinksRef[localIndex]]);
                                                generateProbeContent(probes[i]);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    //
                    // b-button
                    //
                    // Insert new link between nodes
                    // To do so use ray to hit a node (either global or in probe) and hit y.
                    // Selecting two nodes this way will generate an edge between these two.
                    //
                    let bbuttonComponent = motionController.getComponent(xr_ids[4]);
                    bbuttonComponent.onButtonStateChangedObservable.add(() => {
                        if (bbuttonComponent.pressed) {
                            let ray = new BABYLON.Ray(controller.pointer.absolutePosition, controller.pointer.forward, Infinity);
                            var hit = scene.pickWithRay(ray);
                            if (hit.pickedMesh) {
                                // Here we are looking for the node which got picked by the controller
                                let globalNodeIndex = graph.nodes.indexOf(hit.pickedMesh.node); // -1 if node was not picked
                                let localNodeIndex = -1;
                                let localProbeIndex = -1;

                                // If no node was picked we traverse the nodes in the probe contents and
                                // save the respective global node as well as the local probe node
                                if (globalNodeIndex == -1) {
                                    let localNodeIndexInQuestion;
                                    for (let i = 0; i < probes.length; i++) {
                                        if (probes[i].hasContent) {
                                            // Look for geometrie in content nodes array (note: these are geometries and not node objects)
                                            localNodeIndexInQuestion = probes[i].content.nodes.indexOf(hit.pickedMesh);
                                            if (localNodeIndexInQuestion > -1) {
                                                localNodeIndex = localNodeIndexInQuestion;
                                                globalNodeIndex = probes[i].content.nodesInProbe2NodesRef[localNodeIndex];
                                                localProbeIndex = i; // Also save the probe in which the mesh was selected
                                            }
                                        }
                                    }
                                }

                                // Now we gather two nodes to add a new edge (here distinct nodes)
                                if (globalNodeIndex > -1 && !selectedGlobalNodes.includes(globalNodeIndex)) {
                                    // Push selected global and local node index, as well as probe index
                                    selectedGlobalNodes.push(globalNodeIndex);
                                    selectedLocalNodes.push(localNodeIndex); // Gets either slot 0 or 2, depending on whether there is already a node selected
                                    selectedLocalNodes.push(localProbeIndex); // Gets either slot 1 or 3, depending on whether there is already a node selected

                                    // If we have already two we add a new link
                                    if (selectedGlobalNodes.length == 2) {
                                        // Reset colors of global nodes
                                        graph.nodes[selectedGlobalNodes[0]].geom.instancedBuffers.color = colorDeselected;
                                        graph.nodes[selectedGlobalNodes[1]].geom.instancedBuffers.color = colorDeselected;

                                        // Add link between global nodes
                                        graph.addLink(graph.nodes[selectedGlobalNodes[0]], graph.nodes[selectedGlobalNodes[1]]);

                                        // Update probe contents
                                        if (selectedLocalNodes[0] > -1) {
                                            generateProbeContent(probes[selectedLocalNodes[1]]);
                                        }
                                        if (selectedLocalNodes[2] > -1) {
                                            generateProbeContent(probes[selectedLocalNodes[3]]);
                                        }

                                        // Reset selectedMeshes
                                        selectedGlobalNodes = [];
                                        selectedLocalNodes = [];
                                    } else {
                                        // Color the respective global node green
                                        graph.nodes[globalNodeIndex].geom.instancedBuffers.color = colorSelected;

                                        // Color the local node green if we selected it directly
                                        if (localNodeIndex > -1) {
                                            probes[localProbeIndex].content.nodes[localNodeIndex].instancedBuffers.color = colorSelected;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            })
        });

        //
        //
        // Experiments: Slider for value assignment.
        // Currently it detects selected meshes (i.e. those inside graph
        // and representatives in contents). Then it assigns color w.r.t. hue value
        // provided by slider.
        //
        //
        var selectedMeshes = [];
        var selectedGlobalNodes = [];
        var selectedLocalNodes = [];
        var gui3DManager = new BABYLON.GUI.GUI3DManager(scene);
        let panel = new BABYLON.GUI.StackPanel3D();
        gui3DManager.addControl(panel);
        panel.position = new BABYLON.Vector3(0, 0, 0.65);
        camera.onViewMatrixChangedObservable.add(function () {
            panel.position = camera.position.add(new BABYLON.Vector3(0, -0.5, 1));
        })
        xrCamera.onViewMatrixChangedObservable.add(function () {
            panel.position = xrCamera.position.add(new BABYLON.Vector3(0, -0.5, 1));
        })
        var slider = new BABYLON.GUI.Slider3D('slider');
        panel.addControl(slider);
        Object.assign(slider, {
            minimum: 0,
            maximum: 1,
            value: 0,
            scaling: new BABYLON.Vector3(1, 0.1, 0.5),
        })
        slider.onValueChangedObservable.add(function (value) {
            for (let i in selectedMeshes) {
                // Assigns color to objects w.r.t. slider value
                selectedMeshes[i].instancedBuffers.color = color4(value);
            }
        })
        slider.isVisible = false;
        var sliderVisible = false;
    } catch {
        console.log("No XR Mode available");
    }

    return scene;
};

createScene().then((sceneToRender) => {
    engine.runRenderLoop(() => sceneToRender.render());
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});


//
// Positional data. It was obtained from the data set soccerData.json after
// applying a force directed layout. Then the positional data is stored to
// use it in subsequent runs.
//
const dataPositions = [
    51.38394455591038,
    3.6576975687341036,
    -56.703344880105135,
    -160.2659944066366,
    -51.809364550733754,
    101.17029658138306,
    -161.03663205850674,
    -11.886667487360471,
    312.0290747983453,
    29.49468723542955,
    60.679601063053035,
    314.83914312374776,
    142.57869506685938,
    -22.36687411489638,
    119.47538459257109,
    -208.14995826822582,
    67.6171246034479,
    -122.65590802488848,
    -430.9582640981038,
    -25.44411941107871,
    -56.53335966994573,
    -389.5718838515409,
    -72.09027275316096,
    197.8865579263236,
    -110.88072399864679,
    116.57323496806217,
    151.20557737838823,
    23.806574114481762,
    -91.12077153836192,
    -252.7913382571286,
    -125.83942921560421,
    19.736457621813628,
    -421.6048548191976,
    -363.6686721282561,
    12.771408947497447,
    -268.9439204067407,
    -312.6019304748408,
    -123.93101752899166,
    -47.90561546612385,
    215.66446095502005,
    114.09057411393218,
    -59.28253469890433,
    276.6793650042888,
    4.265667319024712,
    -327.3085756469489,
    125.69140031440007,
    -50.17572479632671,
    -478.6958287342461,
    -80.26811919735668,
    155.74527640076872,
    -405.4962266801374,
    86.16051741980834,
    -161.8465177645548,
    11.157529725047185,
    370.83903928553445,
    133.69923110137162,
    63.75980679630276,
    478.66699023900884,
    -50.07185167686022,
    -114.95110374255145,
    361.4522196745163,
    -134.90255337268246,
    -273.9450950216532,
    43.32007303052338,
    130.36902525301048,
    -180.4982373200366,
    88.19203982293985,
    -143.06870437773702,
    374.4339079738408,
    334.4971310904723,
    7.728088965788879,
    404.7433249453264,
    488.1727604578494,
    72.2915967908684,
    160.26399794607042,
    294.27684253853806,
    -159.20033200155498,
    -55.23946892036381,
    -280.60407857802136,
    179.81335004955312,
    205.9805643456829,
    -207.3043704029415,
    -26.223720620390047,
    504.1682110004503,
    85.70684929477865,
    -93.32084223330043,
    521.8918532987952,
    232.19343770495223,
    156.54300814614797,
    334.7186090854574,
    -252.2449296560418,
    -212.6521187211166,
    -156.92914555173473,
    -553.9661549686979,
    99.47313316325854,
    49.65295179926788,
    -492.665265791712,
    34.74044283375813,
    301.5602405281736,
    -198.14400585119898,
    -183.86490977564452,
    386.7184352344798,
    -18.587723066565104,
    261.4829270725988,
    -111.6731791816794,
    -242.09606905286677,
    -176.01246877384145,
    -426.6381255164295,
    -535.9409484426491,
    10.330592812572794,
    -314.71794668496955,
    -511.9365100192791,
    202.8119256577119,
    -56.93553596318973,
    -93.92769896236116,
    -218.59397297308564,
    21.18034293059868,
    222.36974582092472,
    206.128480804075,
    -413.17569268244716,
    41.733798406327416,
    -54.06905288122009,
    -637.2556373112855,
    -235.15224890017797,
    -94.77390137962887,
    -568.5160980692632,
    -273.11855594674165,
    258.02626614517817,
    -151.03514154711107,
    420.2147526145655,
    -191.07363448430834,
    48.888390049181886,
    571.5714024518068,
    71.70404080897211,
    -219.51026234265282,
    380.1657795336976,
    101.57229963458121,
    -499.05733334792467,
    36.74137234733945,
    -222.12467382100493,
    -435.8800336461248,
    92.02645461147229,
    262.54063805261484,
    307.64099194089874,
    462.74996094482026,
    -98.13667971578039,
    382.82540177295175,
    582.411990689661,
    -79.14099386878236,
    117.88834706391181,
    452.3777598739791,
    218.60837960403347,
    -154.69767799302286,
    -135.79183567278906,
    -296.6216104061153,
    192.6819443285904,
    -65.65223145615204,
    198.25006270955825,
    534.5367902755922,
    163.71970544930167,
    14.176408655743815,
    609.2259502217942,
    392.0654110128141,
    -226.51275533504412,
    371.95179580484165,
    33.031885139937614,
    281.7115680541883,
    76.37765981357613,
    -523.8904547251306,
    -233.1499981976877,
    121.47032689598959,
    -505.26845096359347,
    55.15356222710414,
    481.99348550498763,
    -208.4930783420371,
    140.40718518165906,
    603.7137590761611,
    121.54042175764837,
    -299.01949798340576,
    307.52988258129506,
    -351.61117041934114,
    234.28373387673017,
    -398.3639036658625,
    -624.8466792141661,
    -116.65281083568719,
    -211.12509541183667,
    -673.7327628900897,
    -125.57311835837457,
    81.96219802147462,
    -323.66113774497114,
    306.22897686583036,
    292.7067366017571,
    165.25202652296468,
    -303.2144495229714,
    -332.76532174263787,
    -64.36664886763194,
    150.01632744494145,
    -660.7754935117014,
    -373.5309232482762,
    83.81848133216282,
    -582.6436650136167,
    -479.0559403339372,
    -270.3136337025173,
    -212.1426885260305,
    310.1685443451232,
    301.10785699338095,
    -9.906415350269846,
    479.59373632443913,
    -215.58025961577562,
    -400.3077072488802,
    339.55581402868086,
    -9.462456794951693,
    -613.1169328793331,
    2.0944900775764057,
    266.20983004387097,
    -575.9556381259464,
    80.7947004123588,
    -355.89649840135803,
    -34.109345832812025,
    477.87711905904706,
    290.6879991285822,
    267.8572042227237,
    719.4208988444699,
    -21.12895445680279,
    -0.405913876777559,
    625.2265415384508,
    -165.0806273106205,
    -267.0953956987066,
    145.04640397781483,
    332.4670557562044,
    -299.49475766936155,
    -23.709415620814973,
    -303.6368386145907,
    537.0448387386435,
    319.4027587420435,
    78.36944072783551,
    644.4135349309429,
    572.8001908005674,
    153.1023823953849,
    394.1199670598396,
    379.88656258574474,
    -358.0235584371027,
    -3.240197593821089,
    -400.444228382193,
    331.83083471559627,
    137.77005756600695,
    -438.17815013522267,
    -134.1141767522117,
    529.5672010941195,
    -121.90707536305763,
    -129.31490906010973,
    675.1510165867118,
    194.021009769084,
    310.9245053960388,
    494.3428001352716,
    -238.67343691502376,
    -363.27933565729694,
    -260.6489622164351,
    -708.5784633558483,
    191.16836617781337,
    -91.768783273469,
    -722.6212040238256,
    15.45764246968214,
    194.7987545026388,
    -417.7410415464758,
    -294.05648570789884,
    419.5440056840067,
    -79.12074401508812,
    387.28531241149034,
    -103.72998669223733,
    -153.41690151400294,
    -291.19209316533374,
    -593.265306585543,
    -545.6101902019168,
    5.611109312684063,
    -549.7716798591453,
    -622.7860981774343,
    272.951785612013,
    -208.6758606495853,
    -294.57445241013875,
    -404.4933555789909,
    75.6198641141946,
    408.2247446424245,
    309.6912089431667,
    -398.670001071686
];