define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function pointDraw(viewer) {
        PrimitiveBase.call(this, viewer);

        this._options = {
            pixelSize: 10,
            color: Cesium.Color.CHARTREUSE
        };


        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.4
        }

        this._dpoints = this._scene.primitives.add(new Cesium.PointPrimitiveCollection());
      
        this._editOptions.position = undefined;
        this._editOptions.editBillboard = undefined;
        this._editOptions.primitive = undefined;
    }

    pointDraw.prototype = Object.create(PrimitiveBase.prototype);
    pointDraw.prototype.constructor = pointDraw;

    pointDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let id = oldPrimitive && oldPrimitive.id ?
            oldPrimitive.id : undefined;
        if (id) {
            this._dpoints.remove(oldPrimitive);
        }
        id = id || this.getPrimitiveId();

        let newPointOption = Object.assign({
            position: newOptions.position,
            id: id
        }, this._options);

        let pointPrimitive = this._dpoints.add(newPointOption);

        let self = this;
        pointPrimitive.setEdit = function (isEdit) {
            if (isEdit) {
                self._setEditOptions({
                    primitive: this,
                    position: newOptions.position
                });
                self._setEditModel(true);
            } else {
                self._clearEditOptions();
                self._setEditModel(false);
            }
        }

        pointPrimitive.edit = function (_handler, callBack) {
            self._beginEdit(_handler, callBack);
        }

        pointPrimitive.setDelete = function () {
            self._delete();
        }
        return pointPrimitive;
    }
    //#region 
    /**
     * 设置将要修改的元素
     */
    pointDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.position = options.position;
    }

    pointDraw.prototype._clearEditOptions = function () {
        this._editOptions.primitive = undefined;
        this._editOptions.position = undefined;
    }

    pointDraw.prototype._setEditModel = function (isEdit) {
        if (isEdit == true) {
            // 显示当前编辑点,
            //根据position生成编辑billboard
            let bid = this.getPrimitiveId();
            let tempPoint = this._editOptions.position.clone();
            let billboard = this._billboards.add(Object.assign({
                position: tempPoint,
                id: bid
            }, this._editPointOptions));
            this._editOptions.editBillboard = billboard;
        } else {
            //  删除当前编辑点
            this._billboards.removeAll();
        }
    }
    pointDraw.prototype._delete = function () {
        this._dpoints.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditPrimitive();
        this._clearEditPositions();
    }
    pointDraw.prototype._move = function (position) {
        this._editOptions.editBillboard.position = position;
    }

    pointDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        _handler.setInputAction(function (click) {
            let cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {

                let pointPrimitive = self.addPrimitive(undefined,{
                    position: cartesian
                });

                self._execute(callBack, {
                    primitive: pointPrimitive,
                    finish: true
                });
                _handler.destroy();
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (click) {
            self._execute(callBack, {
                primitive: undefined,
                finish: false
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }


    pointDraw.prototype._beginEdit = function (_handler, callBack) {
        let self = this;

        let moveStatus = false;
        _handler.setInputAction((event) => {
            var pickedObj = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedObj)) {
                if (pickedObj.id == self._editOptions.primitive.id) {
                    moveStatus = true;
                } else {
                    moveStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (moveStatus == true) {
                    self._editOptions.position = cartesian;
                    self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                        position: cartesian
                    });
                    //移动编辑点
                    self._move(cartesian);
                    self._execute(callBack, {
                        primitive: self._editOptions.primitive,
                        finish: true
                    });
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return pointDraw;
});