define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function ellipseDraw(viewer) {
        DrawBase.call(this, viewer);

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
    }

    ellipseDraw.prototype = Object.create(DrawBase.prototype);
    ellipseDraw.prototype.constructor = ellipseDraw;



    ellipseDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = false;
        let centerPoint = undefined;
        let mindistance = 0;
        let majdistance = 0;
        let assinObj = Object.assign({
                semiMinorAxis: new Cesium.CallbackProperty(function () {
                    return mindistance;
                }, false),
                semiMajorAxis: new Cesium.CallbackProperty(function () {
                    return majdistance;
                }, false)
            },
            options || self._options);

        let ellipseEntity = self._viewer.entities.add({
            position: new Cesium.CallbackProperty(function () {
                if (centerPoint) {
                    return centerPoint;
                }
            }, false),
            ellipse: assinObj
        });
        ellipseEntity.setEdit = function (isEditing) {
            if (isEditing == false) {
                // 移除
                self.remove(this.editOptions.center);
                self.remove(this.editOptions.semiMinor);
                self.remove(this.editOptions.semiMajor);
                return;
            }
            let centerPoint = this.position.getValue();
            let majDistance = this.ellipse.semiMajorAxis.getValue();
            let minDistance = this.ellipse.semiMinorAxis.getValue();

            //得到边界矩形
            let boundingRect = Cesium.EllipseGeometry.computeRectangle({
                center: centerPoint,
                semiMajorAxis: majDistance,
                semiMinorAxis: minDistance
            });
            let midPoints = self.getRectMidPointsLocation(boundingRect);
            // 生成编辑点
            // 圆心
            let centerEntity = self._viewer.entities.add({
                position: centerPoint,
                billboard: self._editPointOptions
            });
            // 短半径点
            let semiMinorEntity = self._viewer.entities.add({
                position: centerPoint ? midPoints[0] : undefined,
                billboard: self._editPointOptions
            });

            // 长半径点
            let semiMajorEntity = self._viewer.entities.add({
                position: centerPoint ? midPoints[1] : undefined,
                billboard: self._editPointOptions
            });
            this.editOptions = {
                center: centerEntity,
                semiMinor: semiMinorEntity,
                semiMajor: semiMajorEntity
            };
        }
        ellipseEntity.edit = function (editHandler) {
            self.startEdit(editHandler, ellipseEntity, options, callBack);
        }

        ellipseEntity.setDelete = function () {
            self.remove(this.editOptions.center);
            self.remove(this.editOptions.semiMinor);
            self.remove(this.editOptions.semiMajor);
        }
        _handler.setInputAction(function (click) {

            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length == 0) {
                    centerPoint = cartesian;
                    cartesianlist.push(cartesian.clone());
                    moveStatus = true;
                }
                if (cartesianlist.length == 1) {
                    // 移动过来的，不可能是1了

                } else if (cartesianlist.length == 2) {
                    moveStatus = false;
                    cartesianlist.pop();
                    cartesianlist.push(cartesian.clone());
                    // 结束当前操作
                    self._execute(callBack, {
                        radius: cartesianlist,
                        entity: ellipseEntity,
                        finish: true
                    });
                    _handler.destroy();
                    return;
                }
            }
            self._execute(callBack, {
                points: cartesianlist,
                entity: ellipseEntity,
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
                        majdistance = self.getDistance(cartesian, centerPoint);
                        mindistance = majdistance * 0.618;
                    }
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        _handler.setInputAction(function (click) {
            self._execute(callBack, {
                points: cartesianlist,
                entity: ellipseEntity,
                finish: true
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }

    ellipseDraw.prototype.startEdit = function (_handler, entity, options, callBack) {

        let self = this;

        let moveStatus = false;

        let changeMin = false;

        let changeMaj = false;

        let newCenter = entity.editOptions.center.position.getValue();
        let newPosition = new Cesium.CallbackProperty(function () {
            return newCenter;
        }, false);


        let newDistance = entity.ellipse.semiMinorAxis.getValue();
        let newMinRadius = new Cesium.CallbackProperty(function () {
            return newDistance;
        }, false);

        let newMajDistance = entity.ellipse.semiMajorAxis.getValue();
        let newMajRadius = new Cesium.CallbackProperty(function () {
            return newMajDistance;
        }, false);

        let newMinPoint = entity.editOptions.semiMinor.position.getValue();
        let newMinPointPosition = new Cesium.CallbackProperty(function () {
            return newMinPoint;
        }, false);

        let newMajPoint = entity.editOptions.semiMajor.position.getValue();
        let newMajPointPosition = new Cesium.CallbackProperty(function () {
            return newMajPoint;
        }, false);
        entity.editOptions.center.position = newPosition;
        entity.editOptions.semiMinor.position = newMinPointPosition;
        entity.editOptions.semiMajor.position = newMajPointPosition;
        entity.ellipse.semiMinorAxis = newMinRadius;
        entity.ellipse.semiMajorAxis = newMajRadius;
        entity.position = newPosition;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id.id == entity.editOptions.center.id) {
                    moveStatus = true;
                    changeMin = false;
                    changeMaj = false;
                } else if (pickedFeature.id.id == entity.editOptions.semiMinor.id) {
                    changeMin = true;
                    moveStatus = false;
                    changeMaj = false;
                } else if (pickedFeature.id.id == entity.editOptions.semiMajor.id) {
                    changeMin = false;
                    moveStatus = false;
                    changeMaj = true;
                } else if (pickedFeature.id.id == entity.id) {} else {
                    moveStatus = false;
                    changeMin = false;
                    changeMaj = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (moveStatus == true) {
                    newCenter = cartesian;
                    newMinPoint = {
                        x: newCenter.x,
                        y: newCenter.y + newDistance,
                        z: newCenter.z
                    };
                    newMajPoint = {
                        x: newCenter.x + newMajDistance,
                        y: newCenter.y,
                        z: newCenter.z
                    }
                    return;
                }

                if (changeMin == true) {
                    let cPoint = entity.editOptions.center.position.getValue();
                    newMinPoint = cartesian;
                    newDistance = self.getDistance(cPoint, cartesian);
                    return;
                }

                if (changeMaj == true) {
                    let cPoint = entity.editOptions.center.position.getValue();
                    newMajPoint = cartesian;
                    newMajDistance = self.getDistance(cPoint, cartesian);
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changeMin = false;
            changeMaj = false;
            self._execute(callBack, {
                entity: entity,
                finish: true
            });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return ellipseDraw;
});