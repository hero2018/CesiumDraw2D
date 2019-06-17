define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function circleDraw(viewer) {
        PrimitiveBase.call(this, viewer);

        this._options = {
            height: 0,
            outline: true,
            outlineColor: Cesium.Color.LAVENDAR_BLUSH,
            material: Cesium.Color.CHARTREUSE.withAlpha(.2)
        };

        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        }
        this._editOptions.position = undefined;
        this._editOptions.radius = 0.0;
        this._editOptions.primitive = undefined;
        this._editOptions.centerBillboard = undefined;
        this._editOptions.sideBillboard = undefined;
    }

    circleDraw.prototype = Object.create(PrimitiveBase.prototype);
    circleDraw.prototype.constructor = circleDraw;

    //#region 
    /**
     * 设置将要修改的元素
     */
    circleDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.radius = options.radius;
        this._editOptions.position = options.position;
    }

    circleDraw.prototype._clearEditOptions = function () {
        this._editOptions.position = undefined;
        this._editOptions.radius = 0.0;
        this._editOptions.primitive = undefined;
        this._editOptions.centerBillboard = undefined;
        this._editOptions.sideBillboard = undefined;
    }

    circleDraw.prototype._setEditModel = function (isEdit) {
        if (isEdit == true) {
            // 显示当前编辑点,
            //根据position生成编辑圆心billboard
            let bid = this.getPrimitiveId();
            let tempPoint = this._editOptions.position.clone();
            let billboard = this._billboards.add(Object.assign({
                position: tempPoint,
                id: bid
            }, this._editPointOptions));
            this._editOptions.centerBillboard = billboard;

            let boundingRect = Cesium.EllipseGeometry.computeRectangle({
                center:tempPoint,
                semiMajorAxis:this._editOptions.radius,
                semiMinorAxis:this._editOptions.radius
            });
            let midPoints = this.getRectMidPointsLocation(boundingRect);
            //边线点
            let sideTempPoint = midPoints[1];
            let sid = this.getPrimitiveId();
            let sidebillboard = this._billboards.add(Object.assign({
                position: sideTempPoint,
                id: sid
            }, this._editPointOptions));
            this._editOptions.sideBillboard = sidebillboard;

        } else {
            //  删除当前编辑点
            this._billboards.removeAll();
        }
    }
    circleDraw.prototype._delete = function () {
        this._geoContainer.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditOption();
    }
    circleDraw.prototype._move = function (position) {
        this._editOptions.position = position;
        this._editOptions.centerBillboard.position = position;
        // 重新计算边点位置，并赋值
        let sidePosition = {
            x: position.x + this._editOptions.radius,
            y: position.y,
            z: position.z
        };
        this._editOptions.sideBillboard.position = sidePosition;
    }

    circleDraw.prototype._changeRadius = function (radius, newPosition) {
        // 重新计算边点位置，并赋值
        this._editOptions.radius = radius;
        this._editOptions.sideBillboard.position = newPosition;
    }

    circleDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let assinObj = {
            center: newOptions.center,
            radius: newOptions.radius
        };
        let newId = this.getPrimitiveId();
        if (oldPrimitive) {
            newId = oldPrimitive.geometryInstances.id;
            this._geoContainer.remove(oldPrimitive);
        }

        //创建新的要素
        let circleInstance = new Cesium.GeometryInstance({
            geometry: Cesium.CircleGeometry.createGeometry(new Cesium.CircleGeometry(assinObj)),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CHARTREUSE.withAlpha(.2)),
                show: new Cesium.ShowGeometryInstanceAttribute(true) //显示或者隐藏
            },
            id: newId
        });

        let circlePrimitive = this._geoContainer.add(new Cesium.Primitive({
            geometryInstances: circleInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                // translucent: false,
                // closed: true
            }),
            releaseGeometryInstances: false
        }));

        let self = this;
        // 给实例添加修改和删除方法
        circlePrimitive.setEdit = function (isEdit) {
            if (isEdit) {
                self._setEditOptions({
                    primitive: this,
                    radius: newOptions.radius,
                    position: newOptions.center
                });
                self._setEditModel(true);
            } else {
                self._clearEditOptions();
                self._setEditModel(false);
            }
        }

        circlePrimitive.edit = function (_handler, callBack) {
            self._beginEdit(_handler, callBack);
        }

        circlePrimitive.setDelete = function () {
            self._delete();
        }
        return circlePrimitive;
    }

    circleDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = false;

        let circlePrimitive = undefined;

        _handler.setInputAction(function (click) {

            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length == 0) {
                    cartesianlist.push(cartesian.clone());
                    moveStatus = true;
                }
                if (cartesianlist.length == 1) {
                    // 移动过来的，不可能是1了
                } else if (cartesianlist.length == 2) {
                    moveStatus = false;
                    cartesianlist.pop();
                    cartesianlist.push(cartesian.clone());
                    if (circlePrimitive) {
                        // 计算半径
                        let radius = self.getDistance(cartesianlist[0], cartesianlist[1]);
                        // 移除，在添加
                        circlePrimitive = self.addPrimitive(circlePrimitive, {
                            center: cartesianlist[0],
                            radius: radius,
                            edit: false
                        });
                    }
                    // 结束当前操作
                    self._execute(callBack, {
                        primitive: circlePrimitive,
                        finish: true
                    });
                    _handler.destroy();
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (movement) {
                var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
                if (cartesian) {
                    if (moveStatus == true) {
                        if (cartesianlist.length == 1) {
                            cartesianlist.push(cartesian);
                        } else if (cartesianlist.length == 2) {
                            cartesianlist.pop();
                            cartesianlist.push(cartesian);
                        }
                        //计算半径
                        let radius = self.getDistance(cartesianlist[0], cartesianlist[1]);
                        // 移除，在添加
                        circlePrimitive = self.addPrimitive(circlePrimitive, {
                            center: cartesianlist[0],
                            radius: radius,
                            edit: true
                        });
                    }
                }

                self._execute(callBack, {
                    primitive: circlePrimitive,
                    finish: false
                });
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        return _handler;
    }

    circleDraw.prototype._beginEdit = function (_handler, callBack) {

        let self = this;

        let moveStatus = false;

        let changeradius = false;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id == self._editOptions.centerBillboard.id) {
                    moveStatus = true;
                    changeradius = false;
                } else if (pickedFeature.id == self._editOptions.sideBillboard.id) {
                    changeradius = true;
                    moveStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {

            if (changeradius == false && moveStatus == false) {
                return;
            }
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {

                let newCenter = self._editOptions.position.clone();
                let radius = self._editOptions.radius;
                if (moveStatus == true) {
                    newCenter = cartesian.clone();
                    // 半径没变
                    self._move(newCenter);
                }

                if (changeradius == true) {
                    //位置没变
                    radius = self.getDistance(newCenter, cartesian);
                    self._changeRadius(radius, cartesian);
                }

                self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                    radius: radius,
                    center: newCenter,
                    edit: true
                });
                self._execute(callBack, {
                    primitive: self._editOptions.primitive,
                    finish: false
                });
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changeradius = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    return circleDraw;
});