var canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true); // Generates the BABYLON 3D Engine
const createScene = async function () {
    //
    // Generate scene, camera and light
    //
    const scene = new BABYLON.Scene(engine);
    // Following changes background color
    scene.clearColor = BABYLON.Color3.White();
    scene.ambientColor = BABYLON.Color3.White();
    const camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 2, 4, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setTarget = new BABYLON.Vector3(0, 0, 0);
    camera.attachControl(canvas, false);
    camera.onViewMatrixChangedObservable = new BABYLON.Observable();
    camera.wheelPrecision = 500;
    camera.minZ = 0;
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Following defines snippets for fragment shader injections. The last
    // one can be modified by the used via the GUI.
    const functionPairs = [
        //
        // 1. f_A, g_A - aka spherical representation 3D
        //
        // Alternative version: "f = r*r*vec3(-sinPhi*cosTheta, cosPhi*cosTheta, 0); g = vec3(-sinTheta/(cosPhi*cosTheta),0,1);",
        //
        // Following includes case handling as denominator carries cosPhi (i.e. cos(2phi) from article).
        // If it is 0 we return f=(r^2,0,0), g=(0,r^2,0) which gives f x g = (0,0,r^4) and thus directly fails the follow-up divergence condition.
        "if (cosPhi == 0.) {f = vec3(radiusSq+1.,0,0); g = vec3(0, radiusSq+1., 0);} else {f = r*r*vec3(-sinPhi, cosPhi, 0); g = vec3(-sinTheta/cosPhi,0,cosTheta);}",
        //
        // 2. f_A, g_A - aka sphercical representation 3D (inverted 3rd coordinate in g_A)
        //
        // Alternative version: "f = r*r*vec3(-sinPhi*cosTheta, cosPhi*cosTheta, 0); g = vec3(sinTheta/(cosPhi*cosTheta),0,1);",
        //
        // Following includes case handling as denominator carries cosPhi (i.e. cos(2phi) from article).
        // If it is 0 we return f=(r^2,0,0), g=(0,r^2,0) which gives f x g = (0,0,r^4) and thus directly fails the follow-up divergence condition.
        "if (cosPhi == 0.) {f = vec3(radiusSq+1.,0,0); g = vec3(0, radiusSq+1., 0);} else {f = r*r*vec3(-sinPhi, cosPhi, 0); g = vec3(sinTheta/cosPhi,0,cosTheta);}",
        //
        // 3. f_B, g_B - aka space filling tunnels
        "f = vec3(1,1,1); g = vec3(cos(p.x), cos(p.y), cos(p.z));",
        //
        // 4. f_C, g_C - aka swirl
        "f = vec3(p.x*p.x, p.y*p.y, p.z*p.z); g = vec3(cos(p.x), cos(p.y), cos(p.z));",
        //
        // 5. f_D, g_D - aka force Mandelbrot
        "f = r*r*vec3(-sinPhi, cosPhi, 0); g = vec3(0,0,1);",
        //
        // 6. f_E, g_E - aka other forms
        "f = vec3(p.x*p.x*p.y, p.y*p.y, p.z*p.z); g = vec3(1, cos(p.z), 1);",
        //
        // 7. User defined (here without exception handling as this becomes changed by the user)
        //
        // Does not include exception handling as this is starting point for user input and
        // we do not incorporate exception handling for user input yet.
        "f = r*r*vec3(-sinPhi, cosPhi, 0); g = vec3(-sinTheta/cosPhi,0,cosTheta);",
    ]

    //
    // Parameters
    //
    var controllerSpeed = 0.1;
    var guiTextColor = "#158e96";

    //
    // Generate viewing plane and shader material (see shader code on bottom)
    // Attach shader material on viewing plane
    //
    // Generate display for raycasting, billboard, and change w.r.t. camera change
    var viewPlane = BABYLON.MeshBuilder.CreatePlane("plane", { width: 4, height: 4, updatable: true }, scene);
    viewPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL; // Display faces us
    viewPlane.position = camera.getFrontPosition(2);
    camera.onViewMatrixChangedObservable.add(function () {
        viewPlane.position = camera.getFrontPosition(2); // Places display in front of camera in absolute distance
    })
    // Note, shader material values are initially set in buildGUI method
    BABYLON.Effect.IncludesShadersStore['functionPair'] = functionPairs[0];
    var shaderMaterial;
    newShader(true);

    //
    // Build GUI elements (for desktop and XR)
    //
    var showControl = true;
    let gui = buildGUI(showControl, shaderMaterial, guiTextColor);
    var controlMesh = gui[0];
    var controlPanelLeft = gui[1];
    var controlPanelRight = gui[2];
    //toggleControl();
    controlMesh.position = camera.getFrontPosition(1);
    camera.onViewMatrixChangedObservable.add(function () {
        controlMesh.position = camera.getFrontPosition(1);
    });
    // Toggle control
    function toggleControl() {
        showControl = !showControl;
        controlMesh.visibility = showControl;
        controlPanelLeft.isEnabled = showControl;
        controlPanelRight.isEnabled = showControl;
    }

    // Keyboard changes
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN && kbInfo.event.key == "y") {
            toggleControl();
        }
    });

    /**
     * Initializes a new shader.
     * @param {*} init Boolean whether it is the first shader.
     */
    function newShader(init) {
        // Release effect, i.e. remove shader from cache
        if (!init) {
            engine._releaseEffect(shaderMaterial.getEffect());
        }

        // Generate new shader
        shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, "./main",
            {
                attributes: ["position"],
                uniforms: ["world", "worldViewProjection", "cameraPosition", "maxIterations", "eps", "schemeChoice", "radius", "radiusSq", "juliaConstant"],
                needAlphaBlending: true,
            },
        );
        // FIXME: The following line just checks whether material is ready to render mesh
        // However this line currently causes the shader to be compiled almost instantly...
        // Another way could be to use callback/promise in connection with shaderMaterial.onCompiled
        shaderMaterial.isReady();

        viewPlane.material = shaderMaterial;

        // Reassign values and update observables
        if (!init) {
            // Set all initial values according to value in GUI
            shaderMaterial.setInt("schemeChoice", controlPanelLeft.getChildByName("schemeChoiceSlider").value);
            let r = controlPanelRight.getChildByName("radiusSlider").value;
            shaderMaterial.setFloat("radius", r);
            shaderMaterial.setFloat("radiusSq", r * r);
            let entries = controlPanelRight.getChildByName("juliaConstantText").text.split(" ");
            let newConstant = new BABYLON.Vector3(parseFloat(entries[0]), parseFloat(entries[1]), parseFloat(entries[2]));
            shaderMaterial.setVector3("juliaConstant", newConstant);
            shaderMaterial.setInt("maxIterations", controlPanelRight.getChildByName("iterationSlider").value);
            shaderMaterial.setFloat("eps", controlPanelRight.getChildByName("epsSlider").value);

            // Update observables
            controlPanelLeft.getChildByName("schemeChoiceSlider").onValueChangedObservable.add(function (value) {
                shaderMaterial.setInt("schemeChoice", value);
            });
            controlPanelRight.getChildByName("iterationSlider").onValueChangedObservable.add(function (value) {
                shaderMaterial.setInt("maxIterations", value);
            });
            controlPanelRight.getChildByName("epsSlider").onValueChangedObservable.add(function (value) {
                shaderMaterial.setFloat("eps", value);
            });
            controlPanelRight.getChildByName("radiusSlider").onValueChangedObservable.add(function (value) {
                shaderMaterial.setFloat("radius", value);
                shaderMaterial.setFloat("radiusSq", value * value);
            });
            controlPanelRight.getChildByName("juliaConstantText").onTextChangedObservable.add(function (value) {
                let entries = value.text.split(" ");
                let newConstant = new BABYLON.Vector3(parseFloat(entries[0]), parseFloat(entries[1]), parseFloat(entries[2]));
                shaderMaterial.setVector3("juliaConstant", newConstant);
            })

            // Toggle GUI controls for f, g description in user defined case selection
            if (controlPanelLeft.getChildByName("choiceSlider").value == 6) {
                controlPanelLeft.getChildByName("functionPairInputF").isVisible = true;
                controlPanelLeft.getChildByName("functionPairInputG").isVisible = true;
                controlPanelLeft.getChildByName("applyFunctionPair").isVisible = true;
            }
            else {
                controlPanelLeft.getChildByName("functionPairInputF").isVisible = false;
                controlPanelLeft.getChildByName("functionPairInputG").isVisible = false;
                controlPanelLeft.getChildByName("applyFunctionPair").isVisible = false;
            }
        }
    }

    /**
 * Generates the GUI for all the controls and returns the mesh (controls) and the panels.
 * @param {*} showControl
 * @param {*} shaderMaterial
 * @param {*} guiTextColor
 * @returns
 */
    function buildGUI(showControl, shaderMaterial, guiTextColor) {
        let fontsize = 25;
        let sliderHeight = "50px";

        let controlMesh = BABYLON.MeshBuilder.CreatePlane();
        controlMesh.visibility = showControl;
        controlMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;

        let controlMeshTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(controlMesh);
        let controlPanelLeft = new BABYLON.GUI.StackPanel();
        controlPanelLeft.width = "500px";
        controlPanelLeft.height = "800px";
        controlPanelLeft.paddingTop = "100px";
        controlPanelLeft.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        controlPanelLeft.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        controlMeshTexture.addControl(controlPanelLeft);

        //
        // Add scheme choice slider
        let schemeChoiceSlider = new BABYLON.GUI.Slider("schemeChoiceSlider");
        let schemeChoices = ["f x g", "f x g + c", "f x g + const"];
        Object.assign(schemeChoiceSlider, {
            minimum: 0,
            maximum: schemeChoices.length - 1,
            value: 1,
            step: 1,
            width: "300px",
            height: "200px",
            paddingTop: "150px",
            color: "white",
            thumbColor: guiTextColor
        })
        shaderMaterial.setInt("schemeChoice", schemeChoiceSlider.value);
        schemeChoiceSlider.onValueChangedObservable.add(function (value) {
            schemeSliderText.text = "mult: " + schemeChoices[value];
            shaderMaterial.setInt("schemeChoice", value);
        })
        controlPanelLeft.addControl(schemeChoiceSlider);
        // Add scheme choice slider text
        let schemeSliderText = new BABYLON.GUI.TextBlock("schemeSliderText");
        Object.assign(schemeSliderText, {
            text: "mult: " + schemeChoices[schemeChoiceSlider.value],
            height: "75px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelLeft.addControl(schemeSliderText);

        //
        // Add choice slider
        let choiceSlider = new BABYLON.GUI.Slider("choiceSlider");
        let choices = ["1. f_A, g_A", "2. f_A, g_A ver2", "3. f_B, g_B", "4. f_C, g_C", "5. f_D, g_D", "6. f_E, g_E", "user defined"]
        Object.assign(choiceSlider, {
            minimum: 0,
            maximum: choices.length - 1,
            value: 0,
            step: 1,
            width: "300px",
            height: sliderHeight,
            paddingTop: "0px",
            color: "white",
            thumbColor: guiTextColor
        })
        shaderMaterial.setInt("choice", choiceSlider.value);
        choiceSlider.onValueChangedObservable.add(function (value) {
            choiceText.text = "f, g: " + choices[value];
            BABYLON.Effect.IncludesShadersStore['functionPair'] = functionPairs[value];
            newShader(false);
        });
        controlPanelLeft.addControl(choiceSlider);
        // Add choice slider text
        let choiceText = new BABYLON.GUI.TextBlock("choiceText");
        Object.assign(choiceText, {
            text: "f, g: " + choices[choiceSlider.value],
            height: "75px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelLeft.addControl(choiceText);

        // Add function pair descriptions
        let functionPairInputF = new BABYLON.GUI.InputText("functionPairInputF");
        Object.assign(functionPairInputF, {
            text: "f = r*r*vec3(-sinPhi*cosTheta, cosPhi*cosTheta, 0);",
            width: "300px",
            height: "50px",
            color: guiTextColor,
            paddingTop: "0px",
            background: "black",
            fontSize: fontsize
        })
        functionPairInputF.isVisible = false;
        controlPanelLeft.addControl(functionPairInputF);
        let functionPairInputG = new BABYLON.GUI.InputText("functionPairInputG");
        Object.assign(functionPairInputG, {
            text: "g = vec3(sinTheta/(cosPhi*cosTheta),0,1);",
            width: "300px",
            height: "75px",
            color: guiTextColor,
            paddingTop: "25px",
            background: "black",
            fontSize: fontsize
        });
        functionPairInputG.isVisible = false;
        controlPanelLeft.addControl(functionPairInputG);
        let applyFunctionPair = BABYLON.GUI.Button.CreateSimpleButton("applyFunctionPair", "Apply");
        Object.assign(applyFunctionPair, {
            width: "150px",
            height: "75px",
            color: guiTextColor,
            paddingTop: "25px",
            background: "white",
            fontSize: fontsize
        });
        applyFunctionPair.onPointerClickObservable.add(function (value) {
            let f = functionPairInputF.text;
            let g = functionPairInputG.text;
            functionPairs[6] = f + g;
            BABYLON.Effect.IncludesShadersStore['functionPair'] = functionPairs[6];
            newShader(false);
        });
        applyFunctionPair.isVisible = false;
        controlPanelLeft.addControl(applyFunctionPair);

        // Generate keyboard
        let kb = BABYLON.GUI.VirtualKeyboard.CreateDefaultLayout();
        kb.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        controlMeshTexture.addControl(kb);
        kb.connect(controlPanelLeft.getChildByName("functionPairInputF"));
        kb.connect(controlPanelLeft.getChildByName("functionPairInputG"));


        //
        //
        // To right panel
        //
        //
        let controlPanelRight = new BABYLON.GUI.StackPanel();
        controlPanelRight.width = "500px";
        controlPanelRight.height = "800px";
        controlPanelRight.paddingTop = "100px";
        controlPanelRight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        controlPanelRight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        controlMeshTexture.addControl(controlPanelRight);

        //
        // Add iteration slider
        let iterationSlider = new BABYLON.GUI.Slider("iterationSlider");
        Object.assign(iterationSlider, {
            minimum: 0,
            maximum: 100,
            value: 10,
            step: 1,
            width: "300px",
            height: "200px",
            color: "white",
            paddingTop: "150px",
            thumbColor: guiTextColor
        })
        shaderMaterial.setInt("maxIterations", iterationSlider.value);
        iterationSlider.onValueChangedObservable.add(function (value) {
            iterationText.text = "#iterations = " + value;
            shaderMaterial.setInt("maxIterations", value);
        })
        controlPanelRight.addControl(iterationSlider);
        // Add iteration slider text
        let iterationText = new BABYLON.GUI.TextBlock("iterationText");
        Object.assign(iterationText, {
            text: "#iterations = " + iterationSlider.value,
            height: "75px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelRight.addControl(iterationText);

        //
        // Add eps slider
        let epsExp = 1.e5;
        var epsSlider = new BABYLON.GUI.Slider("epsSlider");

        Object.assign(epsSlider, {
            minimum: 1 / epsExp,
            maximum: 0.01,
            value: 0.01,
            step: 10 / epsExp,
            width: "300px",
            height: sliderHeight,
            paddingTop: "0px",
            color: "white",
            thumbColor: guiTextColor
        })
        shaderMaterial.setFloat("eps", epsSlider.value);
        epsSlider.onValueChangedObservable.add(function (value) {
            epsText.text = "eps = " + Math.round(value * epsExp) / epsExp;
            shaderMaterial.setFloat("eps", value);
        })
        controlPanelRight.addControl(epsSlider);

        // Add eps slider text
        let epsText = new BABYLON.GUI.TextBlock("epsText");
        Object.assign(epsText, {
            text: "eps = " + Math.round(epsSlider.value * epsExp) / epsExp,
            height: "75px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelRight.addControl(epsText);

        //
        // Add radius slider
        let radiusSlider = new BABYLON.GUI.Slider("radiusSlider");
        Object.assign(radiusSlider, {
            minimum: 0,
            maximum: 10,
            value: 2,
            step: 0.1,
            width: "300px",
            height: sliderHeight,
            paddingTop: "0px",
            color: "white",
            thumbColor: guiTextColor
        })
        shaderMaterial.setFloat("radius", radiusSlider.value);
        shaderMaterial.setFloat("radiusSq", radiusSlider.value * radiusSlider.value);
        radiusSlider.onValueChangedObservable.add(function (value) {
            radiusText.text = "radius = " + Math.round(value * 100) / 100;
            shaderMaterial.setFloat("radius", value);
            shaderMaterial.setFloat("radiusSq", value * value);
        })
        controlPanelRight.addControl(radiusSlider);
        // Add radius slider text
        let radiusText = new BABYLON.GUI.TextBlock("radiusText");
        Object.assign(radiusText, {
            text: "radius = " + Math.round(radiusSlider.value * 100) / 100,
            height: "100px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelRight.addControl(radiusText);

        // Add Julia constant value input field
        let juliaConstantInput = new BABYLON.GUI.InputText("juliaConstantText");
        Object.assign(juliaConstantInput, {
            text: "-1. 0. 0.",
            width: "150px",
            height: "50px",
            color: guiTextColor,
            paddingTop: "0px",
            background: "black",
            fontSize: fontsize
        })
        let entries = juliaConstantInput.text.split(" ");
        shaderMaterial.setVector3("juliaConstant", new BABYLON.Vector3(parseFloat(entries[0]), parseFloat(entries[1]), parseFloat(entries[2])));
        controlPanelRight.addControl(juliaConstantInput);
        juliaConstantInput.onTextChangedObservable.add(function (value) {
            let entries = value.text.split(" ");
            let newConstant = new BABYLON.Vector3(parseFloat(entries[0]), parseFloat(entries[1]), parseFloat(entries[2]));
            shaderMaterial.setVector3("juliaConstant", newConstant);
        })
        let juliaConstantInputText = new BABYLON.GUI.TextBlock("juliaConstantInputText");
        Object.assign(juliaConstantInputText, {
            text: "Julia constant",
            height: "100px",
            color: guiTextColor,
            paddingTop: "0px",
            fontSize: fontsize
        })
        controlPanelRight.addControl(juliaConstantInputText);

        return [controlMesh, controlPanelLeft, controlPanelRight];
    }

    //
    // Get XR ready
    //
    try {
        const xr = await scene.createDefaultXRExperienceAsync({
            teleportationOptions: {
                // Disables teleportation at all
                forceHandedness: 'none'
            },
            // uiOptions: { sessionMode: 'immersive-ar' }
        });
        var xrCam = xr.input.xrCamera;
        // On xrCam loaded
        xrCam.onXRCameraInitializedObservable.add(function () {
            viewPlane.position = xrCam.getFrontPosition(1.5);
            controlMesh.position = xrCam.getFrontPosition(1);

            // On xrCam changed
            scene.onBeforeRenderObservable.add(function () {
                viewPlane.position = xrCam.getFrontPosition(1.5);
                controlMesh.position = xrCam.getFrontPosition(1);
            });
        })

        xr.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => { // Gets motion controller
                if (motionController.handness === 'left') {
                    const xr_ids = motionController.getComponentIds();

                    // Control forward/backward movement when thumbstick changes
                    let thumbstickComponent = motionController.getComponent(xr_ids[2]);
                    thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                        // Translation of xrCam in space
                        let dir = xrCam.target.add(xrCam.position.scale(-1)).normalize();
                        xrCam.position = xrCam.position.add(dir.scale(-axes.y * controllerSpeed));
                    });

                    //
                    let ybuttonComponent = motionController.getComponent(xr_ids[4]);
                    ybuttonComponent.onButtonStateChangedObservable.add(() => {
                        if (ybuttonComponent.pressed) {
                            toggleControl();
                        }
                    });
                }
            })
        });
    }
    catch {
    }

    return scene;
};

createScene().then((scene) => {
    // Generate time variable which updates and get passed to shader
    //var time = 0.;
    engine.runRenderLoop(function () {
        //scene.getMaterialByName("shader").setFloat("time", time);
        //time += 0.02;
        scene.render();
    });
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});


function w(value) {
    return console.log(value);
}