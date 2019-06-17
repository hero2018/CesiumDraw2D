define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function circleDraw(viewer) {
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

    circleDraw.prototype = Object.create(DrawBase.prototype);
    circleDraw.prototype.constructor = circleDraw;



    circleDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = false;
        let centerPoint = undefined;
        let distance = 0;
        let assinObj = Object.assign({
                semiMinorAxis: new Cesium.CallbackProperty(function () {
                    return distance;
                }, false),
                semiMajorAxis: new Cesium.CallbackProperty(function () {
                    return distance;
                }, false)
            },
            options || self._options);

        let circleEntity = self._viewer.entities.add({
            position: new Cesium.CallbackProperty(function () {
                if (centerPoint) {
                    return centerPoint;
                }
            }, false),
            ellipse: assinObj
        });
        circleEntity.setEdit = function (isEditing) {
            if (isEditing == false) {
                // 移除
                self.remove(this.editOptions.center);
                self.remove(this.editOptions.radius);
                return;
            }
            let centerPoint = this.position.getValue();
            let radius = this.ellipse.semiMajorAxis.getValue();
            //得到边界矩形
            let boundingRect = Cesium.EllipseGeometry.computeRectangle({
                center: centerPoint,
                semiMajorAxis: radius,
                semiMinorAxis: radius
            });
            let midPoints = self.getRectMidPointsLocation(boundingRect);
            // 生成编辑点
            // 圆心
            let centerEntity = self._viewer.entities.add({
                position: centerPoint,
                billboard: self._editPointOptions
            });
            // 半径点
            let radiusPoint = centerPoint ? midPoints[1]: undefined

            let radiusEntity = self._viewer.entities.add({
                position: radiusPoint,
                billboard: self._editPointOptions
            });
            this.editOptions = {
                center: centerEntity,
                radius: radiusEntity
            };
        }
        circleEntity.edit = function (editHandler) {
            self.startEdit(editHandler, circleEntity, options, callBack);
        }
        circleEntity.setDelete = function () {
            self.remove(this.editOptions.center);
            self.remove(this.editOptions.radius);
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
                        entity: circleEntity,
                        finish: true
                    });
                    _handler.destroy();
                    return;
                }
            }
            self._execute(callBack, {
                points: cartesianlist,
                entity: circleEntity,
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
                        distance = Math.sqrt(Math.pow(cartesian.x - centerPoint.x, 2),
                            Math.pow(cartesian.y, centerPoint.y, 2));
                    }
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction(function (click) {
            self._execute(callBack, {
                points: cartesianlist,
                entity: circleEntity,
                finish: true
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }

    circleDraw.prototype.startEdit = function (_handler, entity, options, callBack) {

        let self = this;

        let moveStatus = false;

        let changeradius = false;

        let newCenter = entity.editOptions.center.position.getValue();
        let newPosition = new Cesium.CallbackProperty(function () {
            return newCenter;
        }, false);


        let newDistance = entity.ellipse.semiMajorAxis.getValue();
        let newMinRadius = new Cesium.CallbackProperty(function () {
            return newDistance;
        }, false);
        let newMajRadius = new Cesium.CallbackProperty(function () {
            return newDistance;
        }, false);

        let newRadiusPoint = entity.editOptions.radius.position.getValue();
        let newRadiusPointPosition = new Cesium.CallbackProperty(function () {
            return newRadiusPoint;
        }, false);

        entity.editOptions.center.position = newPosition;
        entity.editOptions.radius.position = newRadiusPointPosition;
        entity.ellipse.semiMinorAxis = newMinRadius;
        entity.ellipse.semiMajorAxis = newMajRadius;
        entity.position = newPosition;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id.id == entity.editOptions.center.id) {
                    moveStatus = true;
                    changeradius = false;
                } else if (pickedFeature.id.id == entity.editOptions.radius.id) {
                    changeradius = true;
                    moveStatus = false;
                } else if (pickedFeature.id.id == entity.id) {} else {
                    moveStatus = false;
                    changeradius = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (moveStatus == true) {
                    newCenter = cartesian;
                    newRadiusPoint = {
                        x: newCenter.x + newDistance,
                        y: newCenter.y,
                        z: newCenter.z
                    };
                    return;
                }

                if (changeradius == true) {
                    let centerPoint = entity.editOptions.center.position.getValue();
                    newDistance = self.getDistance(centerPoint, cartesian);
                    newRadiusPoint = cartesian;
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changeradius = false;
            self._execute(callBack, {
                entity: entity,
                finish: true
            });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return circleDraw;
});