define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function ellipseDraw(viewer) {
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
        // 编辑辅助变量
        this._editOptions.position = undefined;
        this._editOptions.maxRadius = 0.0;
        this._editOptions.minRadius = 0.0;
        this._editOptions.primitive = undefined;
        this._editOptions.centerBillboard = undefined;
        this._editOptions.maxSideBillboard = undefined;
        this._editOptions.minSideBillboard = undefined;
    }

    ellipseDraw.prototype = Object.create(PrimitiveBase.prototype);
    ellipseDraw.prototype.constructor = ellipseDraw;

    //#region 
    /**
     * 设置将要修改的元素
     */
    ellipseDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.position = options.position;
        this._editOptions.maxRadius = options.maxRadius;
        this._editOptions.minRadius = options.minRadius;
    }

    ellipseDraw.prototype._clearEditOptions = function () {
        this._editOptions.position = undefined;
        this._editOptions.maxRadius = 0.0;
        this._editOptions.minRadius = 0.0;
        this._editOptions.primitive = undefined;
        this._editOptions.centerBillboard = undefined;
        this._editOptions.maxSideBillboard = undefined;
        this._editOptions.minSideBillboard = undefined;
    }

    ellipseDraw.prototype._setEditModel = function (isEdit) {
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

            //得到边界矩形
            let boundingRect = Cesium.EllipseGeometry.computeRectangle({
                center:tempPoint,
                semiMajorAxis:this._editOptions.maxRadius,
                semiMinorAxis:this._editOptions.minRadius
            });
            let midPoints = this.getRectMidPointsLocation(boundingRect);
            //max边线点
            let maxSideTempPoint = midPoints[1];

            let sid = this.getPrimitiveId();
            let maxSideBillboard = this._billboards.add(Object.assign({
                position: maxSideTempPoint,
                id: sid
            }, this._editPointOptions));

            this._editOptions.maxSideBillboard = maxSideBillboard;

            //min边线点
            let minSideTempPoint = midPoints[0];

            let minsid = this.getPrimitiveId();
            let minSideBillboard = this._billboards.add(Object.assign({
                position: minSideTempPoint,
                id: minsid
            }, this._editPointOptions));

            this._editOptions.minSideBillboard = minSideBillboard;

        } else {
            //  删除当前编辑点
            this._billboards.removeAll();
        }
    }
    ellipseDraw.prototype._delete = function () {
        this._geoContainer.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditOption();
    }
    ellipseDraw.prototype._move = function (position) {
        this._editOptions.position = position;
        this._editOptions.centerBillboard.position = position;
        // 重新计算边点位置，并赋值
        let sidePosition = {
            x: position.x + this._editOptions.maxRadius,
            y: position.y,
            z: position.z
        };
        this._editOptions.maxSideBillboard.position = sidePosition;

        //min
        let minSidePosition = {
            x: position.x,
            y: position.y + this._editOptions.minRadius,
            z: position.z
        };
        this._editOptions.minSideBillboard.position = minSidePosition;
    }
    ellipseDraw.prototype._changeMaxRadius = function (radius, newPosition) {
        // 重新计算边点位置，并赋值
        this._editOptions.maxRadius = radius;
        this._editOptions.maxSideBillboard.position = newPosition;
    }
    ellipseDraw.prototype._changeMinRadius = function (radius, newPosition) {
        // 重新计算边点位置，并赋值
        this._editOptions.minRadius = radius;
        this._editOptions.minSideBillboard.position = newPosition;
    }
    ellipseDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let assinObj = {
            center: newOptions.center,
            semiMajorAxis: newOptions.maxRadius,
            semiMinorAxis: newOptions.minRadius
        };
        let newId = this.getPrimitiveId();
        if (oldPrimitive) {
            newId = oldPrimitive.geometryInstances.id;
            this._geoContainer.remove(oldPrimitive);
        }
        //创建新的要素
        let ellipseInstance = new Cesium.GeometryInstance({
            geometry: Cesium.EllipseGeometry.createGeometry(new Cesium.EllipseGeometry(assinObj)),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CHARTREUSE.withAlpha(.2)),
                show: new Cesium.ShowGeometryInstanceAttribute(true) //显示或者隐藏
            },
            id: newId
        });

        let ellipsePrimitive = this._geoContainer.add(new Cesium.Primitive({
            geometryInstances: ellipseInstance,
            appearance: new Cesium.PerInstanceColorAppearance({
                // translucent: false,
                // closed: true
            }),
            releaseGeometryInstances: false
        }));

        let self = this;
        // 给实例添加修改和删除方法
        ellipsePrimitive.setEdit = function (isEdit) {
            if (isEdit) {
                self._setEditOptions({
                    primitive: this,
                    maxRadius: newOptions.maxRadius,
                    minRadius: newOptions.minRadius,
                    position: newOptions.center
                });
                self._setEditModel(true);
            } else {
                self._clearEditOptions();
                self._setEditModel(false);
            }
        }
        ellipsePrimitive.edit = function (editHandler, callBack) {
            self._beginEdit(editHandler, callBack);
        }
        ellipsePrimitive.setDelete = function () {
            self._delete();
        }

        return ellipsePrimitive;
    }

    ellipseDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = false;


        let ellipsePrimitive = undefined;

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
                    if (ellipsePrimitive) {
                        // 计算半径
                        let radius = self.getDistance(cartesianlist[0], cartesianlist[1]);
                        // 移除，在添加
                        ellipsePrimitive = self.addPrimitive(ellipsePrimitive, {
                            center: cartesianlist[0],
                            maxRadius: radius,
                            minRadius: radius * 0.618,
                            edit: false
                        });
                    }
                    // 结束当前操作
                    self._execute(callBack, {
                        primitive: ellipsePrimitive,
                        finish: true
                    });
                    _handler.destroy();
                    return;
                }
            }
            self._execute(callBack, {
                primitive: ellipsePrimitive,
                finish: false
            });
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
                        ellipsePrimitive = self.addPrimitive(ellipsePrimitive, {
                            center: cartesianlist[0],
                            maxRadius: radius,
                            minRadius: radius * 0.618,
                            edit: true
                        });
                    }
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        return _handler;
    }

    ellipseDraw.prototype._beginEdit = function (_handler, callBack) {

        let self = this;

        let moveStatus = false;

        let changeMaxRadius = false;

        let changeMinRadius = false;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id == self._editOptions.centerBillboard.id) {
                    moveStatus = true;
                    changeMaxRadius = false;
                    changeMinRadius = false;
                } else if (pickedFeature.id == self._editOptions.maxSideBillboard.id) {
                    changeMaxRadius = true;
                    moveStatus = false;
                    changeMinRadius = false;
                } else if (pickedFeature.id == self._editOptions.minSideBillboard.id) {
                    changeMaxRadius = false;
                    moveStatus = false;
                    changeMinRadius = true;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            if (changeMaxRadius == false && moveStatus == false && changeMinRadius == false) {
                return;
            }
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                
                let newCenter = self._editOptions.position.clone();
                let maxRadius = self._editOptions.maxRadius;
                let minRadius = self._editOptions.minRadius;
                if (moveStatus == true) {
                    // 半径没变
                    newCenter = cartesian.clone();
                    self._move(newCenter);
                }

                if (changeMaxRadius == true) {
                    let maxPoint = cartesian.clone();
                    // 长半径变
                    maxRadius = self.getDistance(maxPoint, newCenter);
                    
                    self._changeMaxRadius(maxRadius, cartesian);
                }

                if (changeMinRadius == true) {
                    let minPoint = cartesian.clone();
                    // 短半径变
                     minRadius = self.getDistance(minPoint, newCenter);
                    
                    self._changeMinRadius(minRadius, cartesian);                   
                }

                self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                    center: newCenter,
                    maxRadius: maxRadius,
                    minRadius: minRadius,
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
            changeMaxRadius = false;
            changeMinRadius = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    return ellipseDraw;
});