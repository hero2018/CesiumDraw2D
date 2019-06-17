define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function billboardDraw(viewer) {
        DrawBase.call(this, viewer);

        this._options = {
            image: './js/component/create/images/timg.png',
            scale:0.2
        };

        this._editPointOptions = {
            pixelSize: 15,
            color: Cesium.Color.WHITE
        };
    }

    billboardDraw.prototype = Object.create(DrawBase.prototype);
    billboardDraw.prototype.constructor = billboardDraw;


    billboardDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        _handler.setInputAction(function (click) {
            let cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                let entity = self._viewer.entities.add({
                    position: cartesian,
                    billboard: options || self._options
                });

                entity.setEdit = function (isEditing) {
                    if (isEditing == false) {
                        // 移除
                        self.remove(this.editOptions.center);
                        return;
                    }
                    let centerPoint = this.position.getValue();
                    // 生成编辑点
                    let centerEntity = self._viewer.entities.add({
                        position: centerPoint,
                        point: self._editPointOptions
                    });
                    this.editOptions = {
                        center: centerEntity
                    };
                }

                entity.edit = function (editHandler) {
                    self.startEdit(editHandler, entity, options, callBack);
                }
                entity.setDelete = function(){
                    self.remove(this.editOptions.center);
                }
                self._execute(callBack, {
                    entity: entity,
                    finish: false
                });
                _handler.destroy();
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (click) {
            self._execute(callBack, {
                entity: undefined,
                finish: false
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }


    billboardDraw.prototype.startEdit = function (_handler, entity, options, callBack) {
        let self = this;

        let moveStatus = false;

        let newCenter = entity.editOptions.center.position.getValue();
        let newPosition = new Cesium.CallbackProperty(function () {
            return newCenter;
        }, false);

        entity.editOptions.center.position = newPosition;
        entity.position = newPosition;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id.id == entity.editOptions.center.id) {
                    moveStatus = true;
                } else {
                    moveStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (moveStatus == true) {
                    newCenter = cartesian;
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            self._execute(callBack, {
                entity: entity,
                finish: true
            });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return billboardDraw;
});