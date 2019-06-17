define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function billboardDraw(viewer) {
        PrimitiveBase.call(this, viewer);

        this._options = {
            image: './js/component/create/images/timg.png',
            scale: 0.2
        };


        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        }

        this._dboards = this._scene.primitives.add(new Cesium.BillboardCollection());

        this._editOptions.position = undefined;
        this._editOptions.editBillboard = undefined;
        this._editOptions.primitive = undefined;

    }

    billboardDraw.prototype = Object.create(PrimitiveBase.prototype);
    billboardDraw.prototype.constructor = billboardDraw;

    /**
                    * // Example 1:  Add a billboard, specifying all the default values.
                           var b = billboards.add({
                           show : true,
                           position : Cesium.Cartesian3.ZERO,
                           pixelOffset : Cesium.Cartesian2.ZERO,
                           eyeOffset : Cesium.Cartesian3.ZERO,
                           heightReference : Cesium.HeightReference.NONE,
                           horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                           verticalOrigin : Cesium.VerticalOrigin.CENTER,
                           scale : 1.0,
                           image : 'url/to/image',
                           imageSubRegion : undefined,
                           color : Cesium.Color.WHITE,
                           id : undefined,
                           rotation : 0.0,
                           alignedAxis : Cesium.Cartesian3.ZERO,
                           width : undefined,
                           height : undefined,
                           scaleByDistance : undefined,
                           translucencyByDistance : undefined,
                           pixelOffsetScaleByDistance : undefined,
                           sizeInMeters : false,
                           distanceDisplayCondition : undefined
                           });
                    */
    /**
     * 添加一个billboard
     * 如果第一个参数有值，则新建并替换
     */
    billboardDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let id = oldPrimitive && oldPrimitive.id ?
            oldPrimitive.id : undefined;
        if (id) {
            this._dboards.remove(oldPrimitive);
        }
        id = id || this.getPrimitiveId();

        let newBillboard = Object.assign({
            position: newOptions.position,
            id: id
        }, this._options);

        let boardPrimitive = this._dboards.add(newBillboard);

        let self = this;
        boardPrimitive.setEdit = function (isEdit) {
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

        boardPrimitive.edit = function (_handler, callBack) {
            self._beginEdit(_handler, callBack);
        }

        boardPrimitive.setDelete = function () {
            self._delete();
        }
        return boardPrimitive;
    }
    //#region 
    /**
     * 设置将要修改的元素
     */
    billboardDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.position = options.position;
    }

    billboardDraw.prototype._clearEditOptions = function () {
        this._editOptions.primitive = undefined;
        this._editOptions.position = undefined;
    }

    billboardDraw.prototype._setEditModel = function (isEdit) {
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
    billboardDraw.prototype._delete = function () {
        this._dboards.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditPrimitive();
        this._clearEditPositions();
    }

    billboardDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);

        _handler.setInputAction(function (click) {
            let cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                let billboard = self.addPrimitive(undefined, {
                    position: cartesian
                });
                self._execute(callBack, {
                    primitive: billboard,
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

    billboardDraw.prototype._move = function (position) {
        this._editOptions.editBillboard.position = position;
    }
    billboardDraw.prototype._beginEdit = function (_handler, callBack) {
        let self = this;

        let moveStatus = false;

        _handler.setInputAction((event) => {
            var pickedObj = self._scene.pick(event.position);
            if (Cesium.defined(pickedObj)) {
                if (pickedObj.id == self._editOptions.primitive.id) {
                    moveStatus = true;
                } else {
                    moveStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._camera.pickEllipsoid(movement.endPosition, self._scene.globe.ellipsoid);
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
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    return billboardDraw;
});