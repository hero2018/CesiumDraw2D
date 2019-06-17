define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function polygonDraw(viewer) {
        PrimitiveBase.call(this, viewer);

        this._options = {
            // width: 1.0,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
        };
        // 线的颜色
        this._color = Cesium.Color.CHARTREUSE.withAlpha(.5);
        //new Cesium.Color(1.0, 0.0, 0.0, 1.0);
        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        };

        this._editMidPointOptions = {
            color: Cesium.Color.RED,
            image: './js/component/create/images/peak.png',
            scale: 0.25
        };

        //初始化编辑元素所需的变量
        this._editOptions.points = new Map();
        this._editOptions.midPoints = new Map();
        this._editOptions.primitive = undefined;
        this._editOptions.positions = undefined;
    }

    polygonDraw.prototype = Object.create(PrimitiveBase.prototype);
    polygonDraw.prototype.constructor = polygonDraw;


    polygonDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let assinObj = Object.assign({
            polygonHierarchy: new Cesium.PolygonHierarchy(newOptions.positions)
        }, this._options);

        let newId = this.getPrimitiveId();
        if (oldPrimitive) {
            newId = oldPrimitive.geometryInstances.id;
            this._geoContainer.remove(oldPrimitive);
        }

        //创建新的要素
        let polygonInstance = new Cesium.GeometryInstance({
            geometry: Cesium.PolygonGeometry.createGeometry(new Cesium.PolygonGeometry(assinObj)),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CHARTREUSE.withAlpha(.2)),
                show: new Cesium.ShowGeometryInstanceAttribute(true) //显示或者隐藏
            },
            id: newId
        });

        let polygonPrimitive = this._geoContainer.add(new Cesium.Primitive({
            geometryInstances: polygonInstance,
            appearance: new Cesium.EllipsoidSurfaceAppearance({
                material: Cesium.Material.fromType('Color', {
                    color: this._color
                })
            }),
            releaseGeometryInstances: false
        }));

        let self = this;
        // 给实例添加修改和删除方法
        polygonPrimitive.setEdit = function (isEdit) {
            if (isEdit) {
                self._setEditOptions({
                    primitive: this,
                    positions: newOptions.positions
                });
                self._setEditModel(true);
            } else {
                self._clearEditOptions();
                self._setEditModel(false);
            }
        }

        polygonPrimitive.edit = function (_handler, callBack) {
            self._beginEdit(_handler, callBack);
        }

        polygonPrimitive.setDelete = function () {
            self._delete();
        }
        return polygonPrimitive;
    }

    /**
     * 第一条边，因为绘制多边形的时候，在三个点尚未确定之前，界面没有任何动静，
     *因此先虚拟的绘制第一条边，也就是前两个点的连线，当第三个点确定后，多边形将展现，此时删除第一条边
     */
    polygonDraw.prototype.drawFirstLine = function (oldLinePrimitive, newOptions) {
        let id = oldLinePrimitive && oldLinePrimitive.geometryInstances && oldLinePrimitive.geometryInstances.id ?
            oldLinePrimitive.geometryInstances.id : undefined;
        if (id) {
            this._geoContainer.remove(oldLinePrimitive);
        }
        let assinObj = Object.assign({
            positions: newOptions.positions,
        }, this._options);

        id = id || this.getPrimitiveId();

        let polylineInstance = new Cesium.GeometryInstance({
            geometry: Cesium.PolylineGeometry.createGeometry(new Cesium.PolylineGeometry(assinObj)),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CHARTREUSE.withAlpha(.2)),
                show: new Cesium.ShowGeometryInstanceAttribute(true)
            },
            id: id
        });
        let tempLinePrimitive = this._geoContainer.add(new Cesium.Primitive({
            geometryInstances: polylineInstance,
            appearance: new Cesium.PolylineMaterialAppearance({
                material: Cesium.Material.fromType('Color', {
                    color: this._color
                })
            }),
            releaseGeometryInstances: false
        }));
        // console.log(`${newOptions.positions[1]},-,${newOptions.positions.length}`);
        return tempLinePrimitive;
    }
    polygonDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = true;
        let drawStatus = false; //是否开始绘制

        //当前绘制的多边形对象
        let polygonPrimitive = undefined;
        let firstDrawOverStatus = true;

        let firstMoveLineCList = [];

        let firstLinePrimitive = undefined;

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length < 1) {
                    // 设置绘制状态为开始；在添加到列表之前
                    drawStatus = true;
                } else {
                    cartesianlist.pop();
                }
                cartesianlist.push(cartesian);
                // 设置移动状态为false
                moveStatus = false;

                if (cartesianlist.length == 0) {
                    // do nothing
                } else if (cartesianlist.length == 1) {
                    firstMoveLineCList.push(cartesian.clone());
                } else if (cartesianlist.length == 2) {
                    if (firstMoveLineCList.length < 2) {} else {
                        firstMoveLineCList.pop();
                    }
                    firstMoveLineCList.push(cartesian.clone());
                    firstDrawOverStatus = false;
                } else {
                    // 此时第一条线绘制结束，多边形的第一条边，一旦第三个点出现，马上就删除
                    if (firstLinePrimitive) {
                        self._geoContainer.remove(firstLinePrimitive);
                    }
                    if (cartesianlist.length > 2) {
                        polygonPrimitive = self.addPrimitive(polygonPrimitive, {
                            positions: cartesianlist
                        });
                    }

                    self._execute(callBack, {
                        primitive: polygonPrimitive,
                        finish: false
                    });
                }

            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (movement) {

                var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
                if (cartesian) {
                    if (firstDrawOverStatus == true) {
                        if (firstMoveLineCList.length == 1) {
                            firstMoveLineCList.push(cartesian.clone());
                        } else if (firstMoveLineCList.length > 1) {
                            firstMoveLineCList.pop();
                            firstMoveLineCList.push(cartesian.clone());
                            firstLinePrimitive = self.drawFirstLine(firstLinePrimitive, {
                                positions: firstMoveLineCList
                            });
                        }
                    }

                    if (drawStatus == true) {
                        // 左键已经点击过了
                        if (moveStatus == false) {
                            //刚刚点击左键
                            cartesianlist.push(cartesian);
                            moveStatus = true;
                        } else {
                            cartesianlist.pop();
                            cartesianlist.push(cartesian);
                        }
                        if (cartesianlist.length > 2) {
                            polygonPrimitive = self.addPrimitive(polygonPrimitive, {
                                positions: cartesianlist
                            });
                        }
                        self._execute(callBack, {
                            primitive: polygonPrimitive,
                            finish: false
                        });
                    }

                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                cartesianlist.pop();
                cartesianlist.push(cartesian);
                polygonPrimitive = self.addPrimitive(polygonPrimitive, {
                    positions: cartesianlist
                });

                self._execute(callBack, {
                    primitive: polygonPrimitive,
                    finish: true
                });
            }
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }


    //#region 
    /**
     * 设置将要修改的元素
     */
    polygonDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.positions = options.positions;
    }
    polygonDraw.prototype._clearEditOptions = function () {
        this._editOptions.primitive = undefined;
        this._editOptions.positions = undefined;
        this._editOptions.points.clear();
        this._editOptions.midPoints.clear();
    }
    polygonDraw.prototype._setEditModel = function (isEdit) {
        if (isEdit == true) {
            // 显示当前编辑点,
            //根据positions生成billboard
            let linePoints = new Map();
            // 生成编辑点
            this._editOptions.positions.forEach((element, index) => {
                let tempPoint = element.clone();
                let bid = this.getPrimitiveId();
                let billboard = this._billboards.add(Object.assign({
                    position: tempPoint,
                    id: bid
                }, this._editPointOptions));
                linePoints.set(bid, {
                    billboard: billboard,
                    index: index
                });
            });

            let midPositions = new Map();
            let prePoint = this._editOptions.positions[0].clone();
            // 添加边线中点,最少两个点
            for (let i = 1; i < this._editOptions.positions.length; i++) {
                let currentPoint = this._editOptions.positions[i];
                //得到中点
                let sideCenterPoint = this.getMidPointLocation(prePoint, currentPoint);
                let mid = this.getPrimitiveId();
                let billboard = this._billboards.add(Object.assign({
                    position: sideCenterPoint,
                    id: mid
                }, this._editMidPointOptions));

                midPositions.set(mid, {
                    billboard: billboard,
                    index: i - 1
                });
                prePoint = this._editOptions.positions[i];
            }
            // 最后一个点到第一个点的连线中点
            let firstPoint = this._editOptions.positions[0].clone();
            //得到中点
            let sideCenterPoint = this.getMidPointLocation(prePoint, firstPoint);
            let lastMid = this.getPrimitiveId();
            let lastMidbillboard = this._billboards.add(Object.assign({
                position: sideCenterPoint,
                id: lastMid
            }, this._editMidPointOptions));

            midPositions.set(lastMid, {
                billboard: lastMidbillboard,
                index: this._editOptions.positions.length - 1
            });

            this._editOptions.points = linePoints;
            this._editOptions.midPoints = midPositions;
        } else {
            //  删除当前编辑点
            this._billboards.removeAll();
        }
    }

    polygonDraw.prototype._delete = function () {
        this._geoContainer.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditOptions();
    }
    polygonDraw.prototype._getSideBillboard = function (id) {
        return this._editOptions.points.get(id);
    }
    polygonDraw.prototype._getMidBillboard = function (id) {
        return this._editOptions.midPoints.get(id);
    }
    polygonDraw.prototype._getMidBillboard = function (index) {
        let ret = undefined;
        for (var item of this._editOptions.midPoints.entries()) {
            if (item[1].index == index) {
                ret = item[1].billboard;
                break;
            }
        }
        return ret;
    }
    /**
     * 移动边线顶点
     * 会带动相邻两个中点billboard移动
     */
    polygonDraw.prototype._moveSideBillboard = function (billboardId, newPosition) {
        let _billboardObj = this._getSideBillboard(billboardId);
        // 设置新位置
        let index = _billboardObj.index;
        _billboardObj.billboard.position = newPosition;
        let nPoints = this._getPrevNextBillboard(index);

        let nMidPoints = this._getPrevNextMidBillboard(index);
        //成对存在
        if (nMidPoints[0]) {
            //计算新的中点position
            let preCenterPosition = this.getMidPointLocation(nPoints[0].position.clone(), newPosition);
            nMidPoints[0].position = preCenterPosition;
        }

        if (nMidPoints[1]) {
            //计算新的中点position
            let nextCenterPosition = this.getMidPointLocation(newPosition, nPoints[1].position.clone());
            nMidPoints[1].position = nextCenterPosition;
        }
    }

    polygonDraw.prototype._insertSideBillboard = function (midBillboardId) {
        this._setEditModel(false);
        this._setEditModel(true);

    }
    /**
     * 获取index节点的前后节点数组，[prev,next],prev 和next 有可能是undefined
     */
    polygonDraw.prototype._getPrevNextBillboard = function (index) {
        let curIndex = index;
        let iCount = this._editOptions.points.size;
        let prevIndex = curIndex == 0 ? iCount - 1 : curIndex - 1;
        let nextIndex = curIndex == iCount - 1 ? 0 : curIndex + 1;

        let prevPrimitive = undefined;
        let nextPrimitive = undefined;
        for (var item of this._editOptions.points.entries()) {
            if (item[1].index == prevIndex) {
                prevPrimitive = item[1].billboard;
            }

            if (item[1].index == nextIndex) {
                nextPrimitive = item[1].billboard;
            }
        }
        return [prevPrimitive, nextPrimitive];
    }


    /**
     * 后去index节点的前后连个中点的billboard对象数组
     * [prev,next],prev和next有可能是undefined
     */
    polygonDraw.prototype._getPrevNextMidBillboard = function (index) {
        let iCount = this._editOptions.midPoints.size;
        if (index == 0) {
            return [undefined, this._getMidBillboard(0)];
        } else if (index == iCount) {
            return [this._getMidBillboard(index - 1), undefined];
        } else {
            return [this._getMidBillboard(index - 1), this._getMidBillboard(index)];
        }
    }

    polygonDraw.prototype._beginEdit = function (_handler, callBack) {

        let self = this;
        let currentEditbillboardId = undefined;
        let moveStatus = false;

        let addPointStatus = false;

        let changePoint = false;
        let clickPointBillboard = function (billboardId) {
            return self._editOptions.points.has(billboardId);
        }

        let clickMidPointBillboard = function (billboardId) {
            return self._editOptions.midPoints.has(billboardId);
        }
        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                currentEditbillboardId = pickedFeature.id;
                if (clickPointBillboard(pickedFeature.id)) {
                    // 移动
                    moveStatus = false;
                    changePoint = true;
                    addPointStatus = false;
                } else if (clickMidPointBillboard(pickedFeature.id)) {
                    addPointStatus = true;
                    moveStatus = false;
                    changePoint = false;

                    //点击了中点billboard，添加节点，重新初始化点
                    let midBillBoard = self._editOptions.midPoints.get(pickedFeature.id);
                    let index = midBillBoard.index;
                    let midPosition = midBillBoard.billboard.position;
                    //要在第index位置插入当前点

                    let newPositions = [];
                    for (var item of self._editOptions.points.entries()) {
                        newPositions.push(item[1].billboard.position.clone());
                        if (item[1].index == index) {
                            let nLocation = midPosition;
                            newPositions.push(nLocation);
                        }
                    }
                    self._editOptions.positions = newPositions;

                    // 添加，重新绘制
                    self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                        positions: newPositions,
                        edit: true
                    });

                    self._insertSideBillboard(pickedFeature.id);

                    self._execute(callBack, {
                        primitive: self._editOptions.primitive,
                        finish: true
                    });
                } else {
                    // moveStatus = false;
                    // changePoint = false;
                    // addPointStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);


        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (changePoint == true) {
                    if (currentEditbillboardId && clickPointBillboard(currentEditbillboardId)) {
                        // 点击了线段点，代表开始移动该点
                        let currentBillboard = self._editOptions.points.get(currentEditbillboardId);
                        let index = currentBillboard.index;
                        let newPositions = [];
                        for (var item of self._editOptions.points.entries()) {
                            if (item[1].index == index) {
                                let nLocation = cartesian;
                                newPositions.push(nLocation);
                            } else {
                                newPositions.push(item[1].billboard.position.clone());
                            }
                        }
                        self._editOptions.positions = newPositions;
                        // 添加，重新绘制
                        self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                            positions: newPositions,
                            edit: true
                        });

                        // 移动当前billboard和前后中点的billboard
                        // 此处不能删除
                        self._moveSideBillboard(currentEditbillboardId, cartesian);
                        self._execute(callBack, {
                            primitive: self._editOptions.primitive,
                            finish: true
                        });
                    }
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changePoint = false;
            addPointStatus = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    //#endregion
    return polygonDraw;
});