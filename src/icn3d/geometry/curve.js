/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

//import * as THREE from 'three';

import {UtilsCls} from '../../utils/utilsCls.js';
import {ParasCls} from '../../utils/parasCls.js';
import {SubdivideCls} from '../../utils/subdivideCls.js';

import {Strip} from '../geometry/strip.js';

class Curve {
    constructor(icn3d) {
        this.icn3d = icn3d;
    }

    // modified from iview (http://star.cse.cuhk.edu.hk/iview/)
    createCurveSub(_pnts, width, colors, div, bHighlight, bRibbon, bNoSmoothen, bShowArray, calphaIdArray, positions, prevone, nexttwo) { var ic = this.icn3d, me = ic.icn3dui;
        if(ic.icn3dui.bNode) return;

        if (_pnts.length === 0) return;
        div = div || 5;
        var pnts;
        if(!bNoSmoothen) {
            var bExtendLastRes = true;
            var pnts_clrs = me.subdivideCls.subdivide(_pnts, colors, div, bShowArray, bHighlight, prevone, nexttwo, bExtendLastRes);
            pnts = pnts_clrs[0];
            colors = pnts_clrs[2];
        }
        else {
            pnts = _pnts;
        }
        if (pnts.length === 0) return;

        ic.stripCls.setCalphaDrawnCoord(pnts, div, calphaIdArray);

        if(bHighlight === 1) {
            var radius = ic.coilWidth / 2;
            //var radiusSegments = 8;
            var radiusSegments = 4; // save memory
            var closed = false;

            if(pnts.length > 1) {
                if(positions !== undefined) {
                    var currPos, prevPos;
                    var currPoints = [];
                    for(var i = 0, il = pnts.length; i < il; ++i) {
                        currPos = positions[i];

                        if( (currPos !== prevPos && currPos !== prevPos + 1 && prevPos !== undefined) || (i === il -1) ) {
                            // first tube
                            var geometry0 = new THREE.TubeGeometry(
                                new THREE.CatmullRomCurve3(currPoints), // path
                                currPoints.length, // segments
                                radius,
                                radiusSegments,
                                closed
                            );

                            var mesh = new THREE.Mesh(geometry0, ic.matShader);
                            mesh.renderOrder = ic.renderOrderPicking;
                            //ic.mdlPicking.add(mesh);
                            ic.mdl.add(mesh);

                            ic.prevHighlightObjects.push(mesh);

                            geometry0 = null;

                            currPoints = [];
                        }

                        currPoints.push(pnts[i]);

                        prevPos = currPos;
                    }

                    currPoints = [];
                }
                else {
                    var geometry0 = new THREE.TubeGeometry(
                        new THREE.CatmullRomCurve3(pnts), // path
                        pnts.length, // segments
                        radius,
                        radiusSegments,
                        closed
                    );

                    var mesh = new THREE.Mesh(geometry0, ic.matShader);
                    mesh.renderOrder = ic.renderOrderPicking;
                    //ic.mdlPicking.add(mesh);
                    ic.mdl.add(mesh);

                    ic.prevHighlightObjects.push(mesh);

                    geometry0 = null;
                }
            }
        }
        else {
            var geo = new THREE.Geometry();

            if(bHighlight === 2 && bRibbon) {
                for (var i = 0, divInv = 1 / div; i < pnts.length; ++i) {
                    // shift the highlight a little bit to avoid the overlap with ribbon
                    pnts[i].addScalar(0.6); // ic.ribbonthickness is 0.4
                    geo.vertices.push(pnts[i]);
                    //geo.colors.push(me.parasCls.thr(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
                    geo.colors.push(me.parasCls.thr(colors[i]));
                }
            }
            else {
                for (var i = 0, divInv = 1 / div; i < pnts.length; ++i) {
                    geo.vertices.push(pnts[i]);
                    //geo.colors.push(me.parasCls.thr(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
                    geo.colors.push(me.parasCls.thr(colors[i]));
                }
            }

            //var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: width, vertexColors: true }), THREE.LineStrip);
            var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: width, vertexColors: true }));
            ic.mdl.add(line);
            if(bHighlight === 2) {
                ic.prevHighlightObjects.push(line);
            }
            else {
                ic.objects.push(line);
            }
        }

        pnts = null;
    }
}

export {Curve}