/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

// // The following four files are for VR view:
// import {VRButton} from "../../thirdparty/three/vr/VRButton.js";
// import {ARButton} from "../../thirdparty/three/vr/ARButton.js";
import {GLTFLoader} from "../../thirdparty/three/vr/GLTFLoader.js";
import {Constants, MotionController, fetchProfile, fetchProfilesList} from "../../thirdparty/three/vr/motion-controllers.module.js";
import {XRControllerModelFactory} from "../../thirdparty/three/vr/XRControllerModelFactory.js";
import {ControllerGestures} from "../../thirdparty/three/vr/ControllerGestures.js";
import {CanvasKeyboard} from "../../thirdparty/three/vr/CanvasKeyboard.js";
import {CanvasUI} from "../../thirdparty/three/vr/CanvasUI.js";

class Scene {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    //This core function sets up the scene and display the structure according to the input
    //options (shown above), which is a hash containing values for different keys.
    rebuildScene(options) { let ic = this.icn3d, me = ic.icn3dui;
        if(options === undefined) options = ic.opts;

        this.rebuildSceneBase(options);

        ic.fogCls.setFog();

        // if(!ic.bVr && !ic.bAr) { // first time
            ic.cameraCls.setCamera();
        // }

        // if(!ic.bSetVrArButtons) { // call once
            this.setVrArButtons();
        // }

        // if((ic.bVr || ic.bAr) && !ic.bSetVrAr) { // call once
            this.setVrAr();
        // }

        if(ic.bSkipChemicalbinding === undefined || !ic.bSkipChemicalbinding) {
            ic.applyOtherCls.applyChemicalbindingOptions();
        }

        ic.bSkipChemicalbinding = true;

        if (options.chemicalbinding === 'show') {
            ic.opts["hbonds"] = "yes";
        }

        // show disulfide bonds, set side chains
        ic.applySsbondsCls.applySsbondsOptions();

        // show cross-linkages, set side chains
        ic.applyClbondsCls.applyClbondsOptions();

        ic.applyDisplayCls.applyDisplayOptions(ic.opts, ic.dAtoms);

        ic.applyOtherCls.applyOtherOptions();

        //ic.setFog();

        //ic.setCamera();

        //https://stackoverflow.com/questions/15726560/three-js-raycaster-intersection-empty-when-objects-not-part-of-scene
        ic.scene_ghost.updateMatrixWorld(true);
    }

    rebuildSceneBase(options) { let ic = this.icn3d, me = ic.icn3dui;
        $.extend(ic.opts, options);

        ic.cam_z = ic.maxD * 2;
        //ic.cam_z = -ic.maxD * 2;

        if(ic.scene !== undefined) {
            for(let i = ic.scene.children.length - 1; i >= 0; i--) {
                let obj = ic.scene.children[i];
                // if(ic.bVr) {
                //     if(ic.dollyId && obj.id != ic.dollyId) {
                //         ic.scene.remove(obj);
                //     }
                // }
                // else {
                    ic.scene.remove(obj);
                // }
            }
        }
        else {
            ic.scene = new THREE.Scene();
        }

        if(ic.scene_ghost !== undefined) {
            for(let i = ic.scene_ghost.children.length - 1; i >= 0; i--) {
                 let obj = ic.scene_ghost.children[i];
                 ic.scene_ghost.remove(obj);
            }
        }
        else {
            ic.scene_ghost = new THREE.Scene();
        }

        // get parameters from cookies
        if(me.htmlCls.setHtmlCls.getCookie('shininess') != '') {
            let shininess = parseFloat(me.htmlCls.setHtmlCls.getCookie('shininess'));

            if(ic.shininess != shininess) {
                me.htmlCls.clickMenuCls.setLogCmd('set shininess ' + shininess, true);
            }

            ic.shininess = shininess;
        }

        if(!me.bNode && me.htmlCls.setHtmlCls.getCookie('light1') != '') {
            let light1 = parseFloat(me.htmlCls.setHtmlCls.getCookie('light1'));
            let light2 = parseFloat(me.htmlCls.setHtmlCls.getCookie('light2'));
            let light3 = parseFloat(me.htmlCls.setHtmlCls.getCookie('light3'));

            if(ic.light1 != light1 || ic.light2 != light2 || ic.light3 != light3) {
                me.htmlCls.clickMenuCls.setLogCmd('set light | light1 ' + light1 + ' | light2 ' + light2 + ' | light3 ' + light3, true);
            }

            ic.light1 = light1;
            ic.light2 = light2;
            ic.light3 = light3;
        }

        ic.directionalLight = new THREE.DirectionalLight(0xFFFFFF, ic.light1); //1.0);
        ic.directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, ic.light2);
        ic.directionalLight3 = new THREE.DirectionalLight(0xFFFFFF, ic.light3);

        if(ic.cam_z > 0) {
          ic.directionalLight.position.set(-1, 1, 1); //(0, 1, 1);
          ic.directionalLight2.position.set(1, 1, 1); //(0, -1, 1);
          ic.directionalLight3.position.set(1, 1, -1); //(0, 1, -1);

          ic.lightPos = new THREE.Vector3(-1, 1, 1); //(0, 1, 1);
          ic.lightPos2 = new THREE.Vector3(1, 1, 1); //(0, -1, 1);
          ic.lightPos3 = new THREE.Vector3(1, 1, -1); //(0, 1, -1);
        }
        else {
          ic.directionalLight.position.set(-1, 1, -1); //(0, 1, -1);
          ic.directionalLight2.position.set(1, 1, -1); //(0, -1, -1);
          ic.directionalLight3.position.set(1, 1, 1); //(0, 1, 1);

          ic.lightPos = new THREE.Vector3(-1, 1, -1); //(0, 1, -1);
          ic.lightPos2 = new THREE.Vector3(1, 1, -1); //(0, -1, -1);
          ic.lightPos3 = new THREE.Vector3(1, 1, 1); //(0, 1, 1);
        }

        let ambientLight = new THREE.AmbientLight(0x888888); //(0x404040);

        ic.scene.add(ic.directionalLight);
        ic.scene.add(ambientLight);

        if(ic.mdl !== undefined) {
            for(let i = ic.mdl.children.length - 1; i >= 0; i--) {
                 let obj = ic.mdl.children[i];
                 if(obj.geometry) obj.geometry.dispose();
                 if(obj.material) obj.material.dispose();
                 ic.mdl.remove(obj);
            }
        }

        if(ic.mdlImpostor !== undefined) {
            for(let i = ic.mdlImpostor.children.length - 1; i >= 0; i--) {
                 let obj = ic.mdlImpostor.children[i];
                 if(obj.geometry) obj.geometry.dispose();
                 if(obj.material) obj.material.dispose();
                 ic.mdlImpostor.remove(obj);
            }

            ic.mdlImpostor.children.length = 0;
        }

        // https://discourse.threejs.org/t/correctly-remove-mesh-from-scene-and-dispose-material-and-geometry/5448/2
        // clear memory
        if(!me.bNode) ic.renderer.renderLists.dispose();

        ic.mdl = new THREE.Object3D();  // regular display
        ic.mdlImpostor = new THREE.Object3D();  // Impostor display

        ic.scene.add(ic.mdl);
        ic.scene.add(ic.mdlImpostor);

        // highlight on impostors
        ic.mdl_ghost = new THREE.Object3D();  // Impostor display
        ic.scene_ghost.add(ic.mdl_ghost);
 
        // related to pk
        ic.objects = []; // define objects for pk, not all elements are used for pk
        ic.objects_ghost = []; // define objects for pk, not all elements are used for pk

        ic.raycaster = new THREE.Raycaster();
        ic.projector = new THREE.Projector();
        ic.mouse = new THREE.Vector2();

        let background = me.parasCls.backgroundColors[ic.opts.background.toLowerCase()];

        if(!me.bNode) {
            if(ic.opts.background.toLowerCase() === 'transparent') {
                ic.renderer.setClearColor(background, 0);
            }
            else {
                ic.renderer.setClearColor(background, 1);
            }
        }

        ic.perspectiveCamera = new THREE.PerspectiveCamera(20, ic.container.whratio, 0.1, 10000);
        ic.perspectiveCamera.position.set(0, 0, ic.cam_z);
        ic.perspectiveCamera.lookAt(new THREE.Vector3(0, 0, 0));

        ic.orthographicCamera = new THREE.OrthographicCamera();
        ic.orthographicCamera.position.set(0, 0, ic.cam_z);
        ic.orthographicCamera.lookAt(new THREE.Vector3(0, 0, 0));

        ic.cams = {
            perspective: ic.perspectiveCamera,
            orthographic: ic.orthographicCamera,
        };       
    };

    setVrAr() { let ic = this.icn3d, me = ic.icn3dui;
        let thisClass = this;

        ic.bSetVrAr = true;

        // https://github.com/NikLever/Learn-WebXR/tree/master/start
        // https://github.com/mrdoob/three.js/blob/master/examples/webxr_ar_cones.html
        // https://github.com/mrdoob/three.js/blob/master/examples/webxr_vr_cubes.html

        //if(ic.bVr && !ic.dolly) {       
        if(ic.bVr) {      
            ic.canvasUI = this.createUI();
            //ic.canvasUILog = this.createUILog();
            // add canvasUI
            //ic.cam.add( ic.canvasUI.mesh );
            //ic.cam.add( ic.canvasUILog.mesh );

            //ic.cam.remove( ic.canvasUI.mesh );

            ic.raycasterVR = new THREE.Raycaster();
            ic.workingMatrix = new THREE.Matrix4();
            ic.workingVector = new THREE.Vector3();
            ic.origin = new THREE.Vector3();

            let radius = 0.08;
            //let geometry = new THREE.IcosahedronBufferGeometry( radius, 2 );

            // modified from https://github.com/NikLever/Learn-WebXR/blob/master/complete/lecture3_7/app.js
            // add dolly to move camera
            ic.dolly = new THREE.Object3D();
            
            ic.dolly.position.z = 5;
            ic.dolly.add(ic.cam);
            ic.scene.add(ic.dolly);

            ic.dollyId = ic.dolly.id;

            //ic.cameraVector = new THREE.Vector3(); // create once and reuse it!

            ic.dummyCam = new THREE.Object3D();
            ic.cam.add(ic.dummyCam);

            ic.clock = new THREE.Clock();

            //controllers
            ic.controllers = this.getControllers();

            ic.controllers.forEach( (controller) => {
                controller.addEventListener( 'connected', function ( event ) {
                    try {
                        //https://github.com/NikLever/Learn-WebXR/blob/master/complete/lecture3_6/app.js
                        const info = {};

                        const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles';
                        const DEFAULT_PROFILE = 'generic-trigger';

                        fetchProfile( event.data, DEFAULT_PROFILES_PATH, DEFAULT_PROFILE ).then( ( { profile, assetPath } ) => {
                            //console.log( JSON.stringify(profile));
                            //ic.canvasUILog.updateElement( "info", "profile " + JSON.stringify(profile) );

                            info.name = profile.profileId;
                            info.targetRayMode = event.data.targetRayMode;
                
                            Object.entries( profile.layouts ).forEach( ( [key, layout] ) => {
                                const components = {};
                                Object.values( layout.components ).forEach( ( component ) => {
                                    components[component.rootNodeName] = component.gamepadIndices;
                                });
                                info[key] = components;
                            });
                
                            //self.createButtonStates( info.right );
                            
                            //console.log( JSON.stringify(info) );
                
                            thisClass.updateControllers( info );
                            //ic.canvasUILog.updateElement( "info", JSON.stringify(info).replace(/,/g, ', ') );
                        } );
                    }
                    catch(err) {
                        //ic.canvasUILog.updateElement("info", "ERROR: " + error);
                    }
                } );

                controller.addEventListener( 'disconnected', function () {
                    this.remove( this.children[ 0 ] );
                    ic.controllers.forEach( (controllerTmp) => {
                        controllerTmp = null;
                    });
                    //self.controllerGrip = null;
                } );
             
            });        
        }      
        else if(ic.bAr) {
            //Add gestures here
            ic.gestures = new ControllerGestures(ic.renderer);
            ic.scene.add(ic.gestures.controller1);
            ic.scene.add(ic.gestures.controller2);

            ic.gestures.addEventListener('tap', (ev) => {
                //if(!ic.mdl.visible) {
                //    ic.mdl.visible = true;
                //}

                const controller = ic.gestures.controller1; 
                //ic.mdl.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
                ic.mdl.position.set( -0.03, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
                //ic.mdl.scale.copy(ic.mdl.scale.multiplyScalar(0.1));
                ic.mdl.scale.copy(new THREE.Vector3( 0.001, 0.001, 0.001 ));  
            });

            ic.gestures.addEventListener('doubletap', (ev) => {
                const controller = ic.gestures.controller1; 
                //ic.mdl.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
                ic.mdl.position.set( -0.06, 0, - 0.6 ).applyMatrix4( controller.matrixWorld );
                //ic.mdl.scale.copy(ic.mdl.scale.multiplyScalar(10));
                ic.mdl.scale.copy(new THREE.Vector3( 0.005, 0.005, 0.005 )); 
            });
/*
            ic.gestures.addEventListener('swipe', (ev) => {
                // if(ic.mdl.visible) {
                //     ic.mdl.visible = false;
                // }
            });
  
            ic.gestures.addEventListener('pan', (ev) => {
                // if(ev.initialise !== undefined) {
                //     thisClass.startPosition = ic.mdl.position.clone();
                // }
                // else {
                //     const pos = thisClass.startPosition.clone().add(ev.delta.multiplyScalar(3));
                //     ic.mdl.position.copy(pos);
                // }
            });

            ic.gestures.addEventListener('pinch', (ev) => {
                // if(ev.initialise !== undefined) {
                //     thisClass.startScale = ic.mdl.scale.clone();                   
                // }
                // else {
                //     const scale = thisClass.startScale.clone().multiplyScalar(ev.scale);                  
                //     ic.mdl.scale.copy(scale);
                // }
            });
 
            ic.gestures.addEventListener('rotate', (ev) => {
                // if(ev.initialise !== undefined) {
                //     thisClass.startQuaternion = ic.mdl.quaternion.clone();
                // }
                // else {
                //     ic.mdl.quaternion.copy(thisClass.startQuaternion);
                //     ic.mdl.rotateY(ev.theta);
                // }
            });  
*/                            
        }
    }

    setVrArButtons() { let ic = this.icn3d, me = ic.icn3dui;
        // call just once
        ic.bSetVrArButtons = true;

        if(!me.bNode) {
            $("#" + me.pre + "VRButton").remove();
            $("#" + me.pre + "viewer").get(0).appendChild( ic.VRButtonCls.createButton( ic.renderer ) );

            $("#" + me.pre + "ARButton").remove();
            $("#" + me.pre + "viewer").get(0).appendChild( ic.ARButtonCls.createButton( ic.renderer ) );
        }
    }

    //https://github.com/NikLever/Learn-WebXR/blob/master/complete/lecture3_6/app.js
    updateControllers(info){ let ic = this.icn3d, me = ic.icn3dui;
        this.addEventForController(info, 'right');
        this.addEventForController(info, 'left');
    }

    addEventForController(info, left_right) { let ic = this.icn3d, me = ic.icn3dui;
        let thisClass = this;

        const controller = (left_right == 'right') ? ic.renderer.xr.getController(0) : ic.renderer.xr.getController(1);
        const controllerInfo = (left_right == 'right') ? info.right : info.left;

        function onSelectStart() {
            this.userData.selectPressed = true;
        }

        function onSelectEnd() {
            this.userData.selectPressed = false;
            this.userData.selected = undefined;
        }

        function onSqueezeStart( ){
            this.userData.squeezePressed = true;

            ic.cam.add( ic.canvasUI.mesh );
        }

        function onSqueezeEnd( ){
            this.userData.squeezePressed = false;

            ic.cam.remove( ic.canvasUI.mesh );
        }

        if (controllerInfo !== undefined){
            // "trigger":{"button":0},
            // "squeeze":{"button":1},
            // "thumbstick":{"button":3,"xAxis":2,"yAxis":3},   "touchpad":{"button":2,"xAxis":0,"yAxis":1},
            //======= left => right =========
            // "x_button":{"button":4},     "a_button":{"button":4}
            // "y_button":{"button":5},     "b_button":{"button":5}
            // "thumbrest":{"button":6}

            let trigger = false, squeeze = false, thumbstick = false, touchpad = false;
            //right: 
            // let a_button = false, b_button = false, thumbrest = false;
            //left: 
            //let a_button = false, b_button = false, thumbrest = false;
            
            Object.keys( controllerInfo ).forEach( (key) => {
                if (key.indexOf('trigger')!=-1) trigger = true;                   
                if (key.indexOf('squeeze')!=-1) squeeze = true;     
                if (key.indexOf('thumbstick')!=-1 || key.indexOf('touchpad')!=-1) {
                    thumbstick = true; 
                    ic.xAxisIndex = controllerInfo[key].xAxis;
                    ic.yAxisIndex = controllerInfo[key].yAxis;
                }
                // if (key.indexOf('a_button')!=-1) a_button = true; 
                // if (key.indexOf('b_button')!=-1) b_button = true; 
                // if (key.indexOf('x_button')!=-1) a_button = true; 
                // if (key.indexOf('y_button')!=-1) b_button = true; 
                // if (key.indexOf('thumbrest')!=-1) thumbrest = true; 
            });
            
            if (trigger){
                controller.addEventListener( 'selectstart', onSelectStart );
                controller.addEventListener( 'selectend', onSelectEnd );
            }

            if (squeeze){
                controller.addEventListener( 'squeezestart', onSqueezeStart );
                controller.addEventListener( 'squeezeend', onSqueezeEnd );
            }
        }
    }

    createUI() { let ic = this.icn3d, me = ic.icn3dui;
        let maxSize = 512, margin = 6, btnWidth = 94, btnHeight = 50, btnWidth2 = 44;
        let fontSize = 12, fontLarge = 14, fontColor = "#1c94c4", bkgdColor = "#ccc", hoverColor = "#fbcb09";

        const config = {
            panelSize: { width: 2, height: 1.2 },
            height: 300,
            select: { type: "button", position:{ top: margin, left: margin }, width: btnWidth, height: btnHeight, fontColor: "#000", fontSize: fontLarge, backgroundColor: bkgdColor},
            residue: { type: "button", position:{ top: margin, left: margin + (btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.pk = 2;
                //ic.opts['pk'] = 'residue';
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            secondarySelect: { type: "button", position:{ top: margin, left: margin + 2*(btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.pk = 3;
                //ic.opts['pk'] = 'strand';
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            chainSelect: { type: "button", position:{ top: margin, left: margin + 3*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.pk = 5;
                //ic.opts['pk'] = 'chain';
                ic.cam.remove( ic.canvasUI.mesh );
            } },

            style: { type: "button", position:{ top: margin + (btnHeight + margin), left: margin }, width: btnWidth, height: btnHeight, fontColor: "#000", fontSize: fontLarge, backgroundColor: bkgdColor},
            ribbon: { type: "button", position:{ top: margin + (btnHeight + margin), left: margin + (btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setStyle("proteins", "ribbon");
                ic.setOptionCls.setStyle("nucleotides", "nucleotide cartoon");
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            schematic: { type: "button", position:{ top: margin + (btnHeight + margin), left: margin + 2*(btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setStyle("proteins", "schematic");
                ic.setOptionCls.setStyle("nucleotides", "schematic");
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            stick: { type: "button", position:{ top: margin + (btnHeight + margin), left: margin + 3*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setStyle("proteins", "stick");
                ic.setOptionCls.setStyle("nucleotides", "stick");
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            sphere: { type: "button", position:{ top: margin + (btnHeight + margin), left: margin + 4*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setStyle("proteins", "sphere");
                ic.setOptionCls.setStyle("nucleotides", "sphere");
                ic.cam.remove( ic.canvasUI.mesh );
            } },

            color: { type: "button", position:{ top: margin + 2*(btnHeight + margin), left: margin }, width: btnWidth, height: btnHeight, fontColor: "#000", fontSize: fontLarge, backgroundColor: bkgdColor},
            rainbow: { type: "button", position:{ top: margin + 2*(btnHeight + margin), left: margin + (btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'rainbow for chains');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            atomColor: { type: "button", position:{ top: margin + 2*(btnHeight + margin), left: margin + 2*(btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'atom');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            secondaryColor: { type: "button", position:{ top: margin + 2*(btnHeight + margin), left: margin + 3*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'secondary structure green');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            AlphaFold: { type: "button", position:{ top: margin + 2*(btnHeight + margin), left: margin + 4*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'confidence');
                 ic.cam.remove( ic.canvasUI.mesh );
            } },

            unicolor: { type: "button", position:{ top: margin + 3*(btnHeight + margin), left: margin }, width: btnWidth, height: btnHeight, fontColor: "#000", fontSize: fontLarge, backgroundColor: bkgdColor},
            red: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth}, width: btnWidth2, height: btnHeight, fontColor: 'red', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'red');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            green: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + (btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'green', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'green');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            blue: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 2*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'blue', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'blue');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            magenta: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 3*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'magenta', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'magenta');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            orange: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 4*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'orange', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'FFA500');
                 ic.cam.remove( ic.canvasUI.mesh );
            } },
            cyan: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 5*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'cyan', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'cyan');
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            gray: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 6*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'gray', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', '888888');
                 ic.cam.remove( ic.canvasUI.mesh );
            } },
            white: { type: "button", position:{ top: 3*(btnHeight + margin), left: margin + btnWidth + 7*(btnWidth2 + margin)}, width: btnWidth2, height: btnHeight, fontColor: 'white', hover: hoverColor, onSelect: function() {
                ic.setOptionCls.setOption('color', 'white');
                ic.cam.remove( ic.canvasUI.mesh );
            } },

            analysis: { type: "button", position:{ top: margin + 4*(btnHeight + margin), left: margin }, width: btnWidth, height: btnHeight, fontColor: "#000", fontSize: fontLarge, backgroundColor: bkgdColor},
            interaction: { type: "button", position:{ top: margin + 4*(btnHeight + margin), left: margin + (btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                 try {
                    ic.viewInterPairsCls.viewInteractionPairs(['selected'], ['non-selected'], false, '3d', 1, 1, 1, 1, 1, 1);
                    ic.cam.remove( ic.canvasUI.mesh );
                 }
                 catch(err) {
                    ic.canvasUILog.updateElement( "info", "ERROR: " + err );
                 }
            } },
            // delphi: { type: "button", position:{ top: margin + 4*(btnHeight + margin), left: margin + 2*(btnWidth + margin)}, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
            //     ic.debugStr = '###ic.hAtoms: ' + Object.keys(ic.hAtoms).length  + ' ic.dAtoms: ' + Object.keys(ic.dAtoms).length;
            //     let gsize = 65, salt = 0.15, contour = 2, bSurface = true;
            //     ic.delphiCls.CalcPhi(gsize, salt, contour, bSurface);
            //     ic.canvasUILog.updateElement( "info", "debug: " + ic.debugStr );
            //     ic.cam.remove( ic.canvasUI.mesh );
            // } },
            removeLabel: { type: "button", position:{ top: margin + 4*(btnHeight + margin), left: margin + 2*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                for(let name in ic.labels) {
                    //if(name === 'residue' || name === 'custom') {
                        ic.labels[name] = [];
                    //}
                }
        
                ic.drawCls.draw();
                ic.cam.remove( ic.canvasUI.mesh );
            } },
            reset: { type: "button", position:{ top: margin + 4*(btnHeight + margin), left: margin + 3*(btnWidth + margin) }, width: btnWidth, height: btnHeight, fontColor: fontColor, fontSize: fontSize, backgroundColor: bkgdColor, hover: hoverColor, onSelect: function() {
                ic.selectionCls.resetAll();
                
                ic.cam.remove( ic.canvasUI.mesh );
            } },


            renderer: ic.renderer
        };

        const content = {
            select: "Select",
            residue: "Residue",
            secondarySelect: "SSE",
            chainSelect: "Chain",

            style: "Style",
            ribbon: "Ribbon",
            schematic: "Schem.",
            stick: "Stick",
            sphere: "Sphere",

            color: "Color",
            rainbow: "Rainbow",
            atomColor: "Atom",
            secondaryColor: "SSE",
            AlphaFold: "AlphaFold",

            unicolor: "UniColor",
            red: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            green: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            blue: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            magenta: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            orange: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            cyan: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            gray: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",
            white: "<path>M 50 15 L 15 15 L 15 50 L 50 50 Z<path>",

            analysis: "Analysis",
            interaction: "Interact",
            //delphi: "DelPhi",
            removeLabel: "No Label",
            reset: "Reset"
        };

        const ui = new CanvasUI( content, config );
        
        //ui.mesh.position.set( 0, 1.5, -1.2 );
        //ui.mesh.position.set( 0, 2, -2 );
        ui.mesh.position.set( 0, 0, -3 );

        return ui;
    }

    createUILog() { let ic = this.icn3d, me = ic.icn3dui;
        const config = {
            panelSize: { width: 2, height: 2 },
            height: 512,
            info: { type: "text", overflow: "scroll", position:{ top: 6, left: 6 }, width: 506, height: 506, backgroundColor: "#aaa", fontColor: "#000" },
            renderer: ic.renderer
        }
        const content = {
            info: ""
        }

        const ui = new CanvasUI( content, config );
        
        //ui.mesh.position.set( 0, 1.5, -1.2 );
        //ui.mesh.position.set( 0, 0, -1.2 );
        ui.mesh.position.set( 0, -2, -3 );

        return ui;
    }

    getControllers() { let ic = this.icn3d, me = ic.icn3dui;
        const controllerModelFactory = new XRControllerModelFactory();
     
        // The camera is right above the headset, lower the line a bit.
        // Then the menu selection was off. So don't change it.
        const yAdjust = 0; //-1;
        const geometry = new THREE.BufferGeometry().setFromPoints( [
            new THREE.Vector3(0, yAdjust, 0),
            new THREE.Vector3(0, yAdjust,-1)
        ]);
        const line = new THREE.Line( geometry );
        line.name = 'line';
        line.scale.z = 50; //10; // extend the line 10 time

        const controllers = [];
        
        for(let i=0; i<=1; i++){
            const controller = ic.renderer.xr.getController( i );
            ic.dolly.add( controller );

            controller.add( line.clone() );
            
            controller.userData.selectPressed = false;
//            ic.scene.add(controller);
            ic.cam.add(controller);
            
            controllers.push( controller );
            
            const grip = ic.renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ));
            ic.scene.add( grip );
        }
        
        return controllers;
    }
}

export {Scene}
