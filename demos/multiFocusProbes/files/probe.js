import { rotate, nextColor4 } from "./tools.js";
import {
    probeInitialScale,
    probeInitialPosition,
    probeInitialTranslate,
    probeTranslateMax,
    iconAngleRotation,
    iconAngleVisibility,
    iconDistance,
    probeInitialMaterialAlpha,
    probeColors,
    linkHighlightRadius,
    nodeHighlightScaleValue
} from "./config.js";

export { Probe }

/**
 * Class holding probe objects for cutting out nodes and links.
 */
class Probe {
    /**
     * Build a default probe and the respective sphere geometry.
     *
     * @param {*} id Number passed for generation. Usually current slot in array.
     */
    constructor(id) {
        // Set default values
        this.id = id; // Assigns the default id in the probes array
        this.probeTunnelVisibility = false; // Assigns the default visibility of the tunnel
        this.weight = 1; // Assigns a weight for the probe for force-driven position updates
        this.hasContent = false; // Sets initial value whether content exists
        this.contentPosition = new BABYLON.Vector3(0, -0.5, 1.5); // Initial content position outside of generate content
        if (id < probeColors.length) {
            this.color = probeColors[id];
        }
        else {
            this.color = nextColor4();
        }
        this.colorAs4Vector = new BABYLON.Vector4(this.color.r, this.color.g, this.color.b, this.color.a);

        // Generate probe geometry
        this.initProbe();
    }

    /**
     * Genrates a new probe as sphere with relevant properties.
     */
    initProbe() {
        this.probeGeom = BABYLON.MeshBuilder.CreateSphere("Probe-" + this.id, { diameter: 2 });
        this.probeGeom.scaling = probeInitialScale;
        this.probeGeom.position = probeInitialPosition


        this.probeGeom.material = new BABYLON.StandardMaterial();
        this.probeGeom.material.diffuseColor = this.color;

        this.probeGeom.material.alpha = probeInitialMaterialAlpha;
        this.probeGeom.probeTranslate = probeInitialTranslate;
        this.probeGeom.probe = this; // Reference from mesh to probe object

    }

    /**
     * Generates an icon which updates whenever passed camera (for instance standard desktop camera or xr camera)
     * changes view matrix.
     *
     * @param {*} cameras Cameras which shall invoke icon geometry update.
     */
    initIcon(cameras) {
        // Generate icon geometry
        this.iconGeom = BABYLON.MeshBuilder.CreateCylinder("Icon-" + this.id, { diameterTop: 0, diameterBottom: 0.05, height: 0.2 });
        this.iconGeom.material = new BABYLON.StandardMaterial();
        this.iconGeom.material.diffuseColor = this.color;

        // Generate icon vector for orientation (gets updated dynamically w.r.t. camera)
        this.iconOrientationVector = new BABYLON.Vector3(0, 1, 0);

        // Calls the update method for the icon
        this.initIconUpdate(cameras);
    }

    /**
     * Update method for the icon geometry. At first the new position of the icon is calculated
     * and afterwards the icon gets rotated to point towards the probe.
     * The new position is found on the great arc connecting the camera-to-probe-vector with the
     * camera-to-target-vector. Then the last vector is rotated by an given angular parameter
     * towards the first vector along the great arc and pushed out by a certain radius.
     * The icon is only visible w.r.t. a certain angular threshold, i.e. only visible if
     * the probe is not in the camera viewport. The orientation of the icon is
     * only updated if the icon-to-probe-vector has changed.
     *
     * @param {*} camera Cameras which shall invoke icon geometry update.
     */
    initIconUpdate(camera) {
        // Apply on view matrix change
        camera.onViewMatrixChangedObservable.add(() => {
            // Get vector from camera to probe
            let vectorCamToProbe = this.probeGeom.position.subtract(camera.position)
            // Set alpha of icon w.r.t. distance of camera to probe
            this.iconGeom.material.alpha = 1 - vectorCamToProbe.length() / probeTranslateMax + 0.25;

            //
            // Calculate position of icon at circular border of screen
            //
            vectorCamToProbe = vectorCamToProbe.normalize();
            let vectorCamDirection = camera.getTarget().subtract(camera.position).normalize();
            // Get orthogonal vector on both vectors to probe and camera target (i.e. direction)
            // and retrieve the angle between both
            let vectorCross = BABYLON.Vector3.Cross(vectorCamDirection, vectorCamToProbe).normalize();
            let anglePos = BABYLON.Vector3.GetAngleBetweenVectors(vectorCamDirection, vectorCamToProbe, vectorCross);
            // Rotate camera direction via given angle towards the vector pointing towards the probe
            // and move the icon along the rotated direction
            let vRotated = rotate(vectorCamDirection, vectorCross, -iconAngleRotation).normalize();
            this.iconGeom.position = camera.position.add(vRotated.scale(iconDistance));

            //
            // Reorient icon s.t. it points towards the probe
            //
            // Get direction from icon to probe
            let direction = this.probeGeom.position.subtract(this.iconGeom.position).normalize();
            // Call last orientation of icon
            let tempOrientationVector = this.iconOrientationVector;
            // If a change in direction happened we update the orientation
            if (BABYLON.Vector3.DistanceSquared(tempOrientationVector, direction) != 0) {
                vectorCross = BABYLON.Vector3.Cross(tempOrientationVector, direction).normalize();
                let angleDir = BABYLON.Vector3.GetAngleBetweenVectors(tempOrientationVector, direction, vectorCross);
                // Rotate icon around angle of cross product of previous and new orientation about
                // the angle between these two vectors
                this.iconGeom.rotate(vectorCross, angleDir, BABYLON.Space.WORLD);
                // Update orientation of icon
                this.iconOrientationVector = direction;
            }

            // Decide whether to show icon or not w.r.t. angle threshold
            if (anglePos > iconAngleVisibility) {
                this.iconGeom.visibility = true;
            }
            else {
                this.iconGeom.visibility = false;
            }
        })
    }

    /**
     * Genrates the content (subgraph) of that probe w.r.t. to passed graph and camera
     * @param {*} graph Graph object to determine its intersection with the probe to generate the subgraph.
     * @param {*} camera Camera used to update local repositioning of sugbraph.
     */
    generateContent(graph, camera) {
        let nodes = graph.nodes;
        let links = graph.links;

        // If content already exists, delete and dispose
        if (this.content != null) {
            // Dispose all nodes
            for (let i = this.content.nodes.length - 1; i >= 0; i--) {
                this.content.nodes[i].dispose();
            }
            // Dispose all links
            for (let i = this.content.links.length - 1; i >= 0; i--) {
                this.content.links[i].dispose();
            }

            // Dispose abstract parent mesh
            this.content.graph.dispose();

            // Dispose probe tunnel and content sphere
            this.probeTunnel.dispose();
            this.contentSphere.dispose();
        }

        // Generate new content
        let content = new Object();
        let probeRadiusSquared = this.probeGeom.scaling.x * this.probeGeom.scaling.x;

        // Generate parent object, i.e. graph
        content.graph = new BABYLON.TransformNode("ProbeContent-" + this.id);

        //
        // Get all nodes inside probe; Note here these are geometries not nodes itself
        content.nodes = [];
        content.nodesInProbe2NodesRef = [];
        for (let i in nodes) {
            let nodeGeomCopy;
            if (BABYLON.Vector3.DistanceSquared(nodes[i].geom.position, this.probeGeom.position) <= probeRadiusSquared) {
                nodeGeomCopy = graph.nodeRootInstance.createInstance();
                // Set the node color and resize the node for visibility
                graph.scaleNode(nodeHighlightScaleValue, i);
                nodes[i].geom.instancedBuffers.color = this.colorAs4Vector;

                nodeGeomCopy.position = nodes[i].geom.position.clone();
                nodeGeomCopy.scaling = nodes[i].geom.scaling.clone();
                if (nodes[i].geom.rotationQuaternion) {
                    nodeGeomCopy.rotationQuaternion = nodes[i].geom.rotationQuaternion.clone();
                }
                nodeGeomCopy.instancedBuffers.color = this.colorAs4Vector;
                nodeGeomCopy.name = "ProbeContent-" + this.id + "-Node-" + content.nodes.length;
                nodeGeomCopy.position.subtractInPlace(this.probeGeom.position); // Move probe to origin, or here every node in probe
                nodeGeomCopy.parent = content.graph;
                content.nodes.push(nodeGeomCopy);
                content.nodesInProbe2NodesRef.push(i);
            }
        }

        //
        // Get all links inside probe
        content.links = [];
        content.linksInProbe2LinksRef = [];
        for (let i in links) {
            let linkGeomCopy;
            if (BABYLON.Vector3.DistanceSquared(links[i].node0.geom.position, this.probeGeom.position) <= probeRadiusSquared &&
                BABYLON.Vector3.DistanceSquared(links[i].node1.geom.position, this.probeGeom.position) <= probeRadiusSquared) {
                linkGeomCopy = graph.linkRootInstance.createInstance();
                // Set the link color and resize the link for visibility
                graph.scaleLinkRadius(linkHighlightRadius, i);
                links[i].geom.instancedBuffers.color = this.colorAs4Vector;

                linkGeomCopy.position = links[i].geom.position.clone();
                linkGeomCopy.scaling = links[i].geom.scaling.clone();
                if (links[i].geom.rotationQuaternion) {
                    linkGeomCopy.rotationQuaternion = links[i].geom.rotationQuaternion.clone();
                }
                linkGeomCopy.instancedBuffers.color = this.colorAs4Vector;
                linkGeomCopy.name = "ProbeContent-" + this.id + "-Link-" + content.links.length;
                linkGeomCopy.position.subtractInPlace(this.probeGeom.position); // Move probe to origin, or here every node in probe
                linkGeomCopy.parent = content.graph;
                content.links.push(linkGeomCopy);
                content.linksInProbe2LinksRef.push(i);
            }
        }

        //
        // Adjust position and scale w.r.t. parent object
        let graphScale = 0.5;
        content.graph.scaling = new BABYLON.Vector3(graphScale, graphScale, graphScale);

        // Update w.r.t. camera
        content.graph.position = camera.position.add(this.contentPosition);
        camera.onViewMatrixChangedObservable.add(() => {
            content.graph.position = camera.position.add(this.contentPosition);
        });

        // Make content active
        this.content = content;
        this.hasContent = true;

        // Generate probe tunnel
        this.generateProbeTunnel(camera);
        this.toggleProbeTunnel(this.probeTunnelVisibility);
    }

    /**
     * Generates the visual truncated cone
     * @param {*} camera Passed camera for local position updates of truncated cone.
     */
    generateProbeTunnel(camera) {
        // Get radii for tunnel and content sphere
        let radiusProbeGeom = this.probeGeom.scaling.x;
        let radiusContentGeom = this.content.graph.scaling.x * radiusProbeGeom; // Note: contentGraph is rescaling of probeGeom

        // Generate non-pickable probe tunnel
        this.probeTunnel = BABYLON.CreateTube("ProbeTunnel", {
            path: [this.content.graph.position, this.probeGeom.position],
            radiusFunction: (i) => (1 - i) * radiusContentGeom + i * radiusProbeGeom,
            updatable: true,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        });
        this.probeTunnel.material = new BABYLON.StandardMaterial();
        this.probeTunnel.material.diffuseColor = this.color;
        this.probeTunnel.material.alpha = probeInitialMaterialAlpha;
        this.probeTunnel.isPickable = false;

        //
        // Generate content sphere with drag behavior
        this.contentSphere = BABYLON.CreateSphere("ContentSphere", { diameter: 2 * radiusContentGeom });
        // Assign reference back to probe object
        this.contentSphere.probe = this;
        let behavior = new BABYLON.SixDofDragBehavior();
        this.contentSphereIsDragged = false;
        behavior.onDragStartObservable.add(() => {
            this.contentSphereIsDragged = true;
        });
        behavior.onDragEndObservable.add(() => {
            this.contentPosition = this.contentSphere.position.subtract(camera.position);
            this.contentSphereIsDragged = false;
        });
        this.contentSphere.addBehavior(behavior);
        this.contentSphere.position = this.content.graph.position;
        this.contentSphere.material = new BABYLON.StandardMaterial();
        this.contentSphere.material.diffuseColor = this.color;
        this.contentSphere.material.alpha = probeInitialMaterialAlpha;


        // Make contentSphere parent of content so that we can move it around
        this.content.parent = this.contentSphere;

        // Update geometries
        camera.onViewMatrixChangedObservable.add(() => {
            if (this.probeTunnel.visibility) {
                // Get radii for tunnel and content sphere
                let radiusProbeGeom = this.probeGeom.scaling.x;
                let radiusContentGeom = this.content.graph.scaling.x * radiusProbeGeom; // Note: contentGraph is rescaling of probeGeom

                // Update probe tunnel
                this.probeTunnel = BABYLON.CreateTube("ProbeTunnel", {
                    path: [this.contentSphere.position, this.probeGeom.position],
                    radiusFunction: (i) => (1 - i) * radiusContentGeom + i * radiusProbeGeom,
                    instance: this.probeTunnel,
                });

                // Update content sphere position
                if (!this.contentSphereIsDragged) {
                    this.contentSphere.position = this.content.graph.position;
                }
            }
        })
    }

    /**
     * Toogles the probe activity and in consequence its tunnel.
     * @param {*} state Bool for the the current state of the probe activity.
     */
    toggleProbeTunnel(state) {
        this.probeTunnelVisibility = state;
        this.probeTunnel.visibility = state;
        this.contentSphere.visibility = state;
        this.contentSphere.isPickable = state;
    }

    /**
     * Removes this probe, i.e. all its dependent instances like geometries etc.
     */
    removeProbe() {
        this.probeGeom.dispose();
        this.iconGeom.dispose();

        if (this.content != null) {
            // Dispose all nodes
            for (let i = this.content.nodes.length - 1; i >= 0; i--) {
                this.content.nodes[i].dispose();
            }
            // Dispose all links
            for (let i = this.content.links.length - 1; i >= 0; i--) {
                this.content.links[i].dispose();
            }

            // Dispose abstract parent mesh
            this.content.graph.dispose();

            // Dispose probe tunnel and content sphere
            this.toggleProbeTunnel(false);
            this.probeTunnel.dispose();
            this.contentSphere.dispose();
        }
    }
}