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
        this._editEntity = undefined;
        this._editHandler = undefined;
    }

    editController.prototype = Object.create(Object.prototype);

    editController.prototype.constructor = editController;

    editController.prototype.beginEdit = function () {
        let _handler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
        let self = this;
        _handler.setInputAction(function (click) {
            self.clearEditEntity();
            var pickedFeature = self._viewer.scene.pick(click.position);
            if (Cesium.defined(pickedFeature) && pickedFeature.id.id) {

                self._viewer.scene.screenSpaceCameraController.enableRotate = false;
                self._viewer.scene.screenSpaceCameraController.enableZoom = false;
                let featureId = pickedFeature.id.id;
                let editEntity = self._viewer.entities.getById(featureId);
                if (editEntity && typeof editEntity.edit == 'function') {
                    self._editEntity = editEntity;
                    self._editHandler = new Cesium.ScreenSpaceEventHandler(self._viewer.scene.canvas);
                    editEntity.setEdit(true);
                    editEntity.edit(self._editHandler);
                } else {
                    self._editEntity = undefined;
                    self._editHandler = undefined;
                }
            } else {
                self._viewer.scene.screenSpaceCameraController.enableRotate = true;
                self._viewer.scene.screenSpaceCameraController.enableZoom = true;
                self._editEntity = undefined;
                self._editHandler = undefined;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        return _handler;
    }

    editController.prototype.clearEditEntity = function () {
        if (this._editEntity && typeof this._editEntity.setEdit == 'function') {
            this._editEntity.setEdit(false);
        }
        if (this._editHandler) {
            this._editHandler.destroy();
            this._editHandler = undefined;
        }
    };

    editController.prototype.deleteEntity = function () {
        if (this._editEntity &&  this._viewer ) {
            if(typeof this._editEntity.setDelete == 'function'){
                this._editEntity.setDelete();
            }
            this._viewer.entities.remove(this._editEntity);
        }
    };
    return editController;
});