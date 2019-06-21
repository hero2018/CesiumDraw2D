define([
    'Cesium'
], function (Cesium) {
    'use strict';

    /**
     * 元素编辑管理类
     * @param {viewer} viewer 
     */
    let editController = function (viewer) {
        this._viewer = viewer;
        this._editPrimitive = undefined;
        this._editHandler = undefined;
    }

    editController.prototype = Object.create(Object.prototype);

    editController.prototype.constructor = editController;

    editController.prototype.beginEdit = function () {
        let _handler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
        let self = this;
        _handler.setInputAction(function (click) {  
            self.clearEditEntity();
            var pickedObj = self._viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObj)) {
                self._viewer.scene.screenSpaceCameraController.enableRotate = false;
                self._viewer.scene.screenSpaceCameraController.enableZoom = false;
                let editPrimitive = pickedObj.primitive;
                if (editPrimitive &&  typeof editPrimitive.edit == 'function') {
                    self._editPrimitive = editPrimitive;
                    self._editHandler = new Cesium.ScreenSpaceEventHandler(self._viewer.scene.canvas);
                    editPrimitive.setEdit(true);
                    editPrimitive.edit(self._editHandler,function(reDrawParams){
                        if(reDrawParams.primitive){
                            self._editPrimitive = reDrawParams.primitive;
                        }
                    });
                }else{
                    self.recover();
                }
            }
            else{
                self.recover();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        return _handler;
    };

    editController.prototype.recover = function () {
        this._viewer.scene.screenSpaceCameraController.enableRotate = true;
        this._viewer.scene.screenSpaceCameraController.enableZoom = true;
    };

    editController.prototype.clearEditEntity = function () {
        if (this._editPrimitive && typeof this._editPrimitive.setEdit == 'function') {
            this._editPrimitive.setEdit(false);
        }
        if (this._editHandler) {
            this._editHandler.destroy();
            this._editHandler = undefined;
        }
    };

    /**
     *删除当前选择的要素
     */
    editController.prototype.deleteEntity = function () {
        if (this._editPrimitive && this._viewer) {
            if (typeof this._editPrimitive.setDelete == 'function') {
                this._editPrimitive.setDelete();
            }
        }
    };
    return editController;
});
