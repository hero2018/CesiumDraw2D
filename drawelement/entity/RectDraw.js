define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function rectDraw(viewer) {
        DrawBase.call(this, viewer);

        this._options = {
            // material: "./js/component/create/images/peak.png",
            height: 0,
            outline: true,
            outlineColor:Cesium.Color.LAVENDAR_BLUSH,
            material: Cesium.Color.CHARTREUSE.withAlpha(.2)
        };

        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        }
    }

    rectDraw.prototype = Object.create(DrawBase.prototype);
    rectDraw.prototype.constructor = rectDraw;


    rectDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        
        let cartesianlist = [];
        let moveStatus = false;
        let assinObj = Object.assign({
                coordinates: new Cesium.CallbackProperty(function () {
                    if (cartesianlist.length == 2) {
                        return Cesium.Rectangle.fromCartesianArray(cartesianlist, self._scene.globe.ellipsoid);
                    }
                }, false),
            },
            options || self._options);

        let rectangleEntity = self._viewer.entities.add({
            rectangle: assinObj
        });

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length == 0) {
                    cartesianlist.push(cartesian);
                    moveStatus = true;
                }
                if (cartesianlist.length == 1) {
                    // 移动过来的，不可能是1了

                } else if (cartesianlist.length == 2) {
                    moveStatus = false;
                    cartesianlist.pop();
                    cartesianlist.push(cartesian);
                    // 结束当前操作
                    self._execute(callBack, {
                        points: cartesianlist,
                        entity: rectangleEntity,
                        finish: true
                    });
                    _handler.destroy();
                    return;
                }
            }
            self._execute(callBack, {
                points: cartesianlist,
                entity: rectangleEntity,
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
                    }
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction(function (click) {
            self._execute(callBack, {
                points: cartesianlist,
                entity: rectangleEntity,
                finish: true
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
       
        rectangleEntity.setEdit=function(isEditing){
            if (isEditing == false) {
                // 移除
                if (this.editOptions) {
                    self.remove(this.editOptions.center);
                    self.remove(this.editOptions.leftop);
                    self.remove(this.editOptions.rightbom);
                }
                return;
            }
            let ltrb = this.rectangle.coordinates.getValue();
    
            // ltrb 弧度为单位的东南西北数值,转换为度
            let positions = [Cesium.Cartesian3.fromRadians(ltrb.east, ltrb.south), Cesium.Cartesian3.fromRadians(ltrb.west, ltrb.north)];
            // 生成编辑点
            // 中心
            let centerLong = Cesium.Rectangle.center(new Cesium.Rectangle(ltrb.west, ltrb.south, ltrb.east, ltrb.north));
    
            let centerEntity = self._viewer.entities.add({
                position: Cesium.Cartesian3.fromRadians(centerLong.longitude, centerLong.latitude, centerLong.height),
                billboard: self._editPointOptions
            });
            // 左上点
            let ltEntity = self._viewer.entities.add({
                position: positions[0],
                billboard: self._editPointOptions
            });
            // 右下
            let rbEntity = self._viewer.entities.add({
                position: positions[1],
                billboard: self._editPointOptions
            });
    
            this.editOptions = {
                center: centerEntity,
                leftop: ltEntity,
                rightbom: rbEntity
            };
        }
        rectangleEntity.edit=function(_handler, options, callBack){
            self.startEdit(_handler, rectangleEntity, options, callBack);
        }

        rectangleEntity.setDelete = function(){
            if (this.editOptions) {
                self.remove(this.editOptions.center);
                self.remove(this.editOptions.leftop);
                self.remove(this.editOptions.rightbom);
            }
        }
        return _handler;
    }


    rectDraw.prototype.startEdit = function (_handler, entity, options, callBack) {
        let self = this;

        let moveStatus = false;

        let changelt = false;
        let changerb = false;

        let newCenter = entity.editOptions.center.position.getValue();
        let newPosition = new Cesium.CallbackProperty(function () {
            return newCenter;
        }, false);


        let newLT = entity.editOptions.leftop.position.getValue();
        let newLTPosition = new Cesium.CallbackProperty(function () {
            return newLT;
        }, false);

        let newRB = entity.editOptions.rightbom.position.getValue();
        let newRBPosition = new Cesium.CallbackProperty(function () {
            return newRB;
        }, false);

        entity.editOptions.center.position = newPosition;
        entity.editOptions.rightbom.position = newRBPosition;
        entity.editOptions.leftop.position = newLTPosition;



        entity.rectangle.coordinates = new Cesium.CallbackProperty(function () {
            if (newLT && newRB) {
                return Cesium.Rectangle.fromCartesianArray([newLT, newRB], self._scene.globe.ellipsoid);
            }

        }, false);

        //获取中心点平移后的矩形对角坐标
        let moveRect = function (oldp, newp, lt, rb) {
            let oldCart = Cesium.Cartographic.fromCartesian(oldp);
            let newCart = Cesium.Cartographic.fromCartesian(newp);
            let xDis = newCart.longitude - oldCart.longitude;
            let yDis = newCart.latitude - oldCart.latitude;
            let ltCart = Cesium.Cartographic.fromCartesian(lt);
            let rbCart = Cesium.Cartographic.fromCartesian(rb);

            let newlt = Cesium.Cartographic.fromRadians(ltCart.longitude + xDis, ltCart.latitude + yDis);
            let newrb = Cesium.Cartographic.fromRadians(rbCart.longitude + xDis, rbCart.latitude + yDis);

            return [Cesium.Cartographic.toCartesian(newlt), Cesium.Cartographic.toCartesian(newrb)];
        }

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id.id == entity.editOptions.center.id) {
                    moveStatus = true;
                    changelt = false;
                    changerb = false;
                } else if (pickedFeature.id.id == entity.editOptions.leftop.id) {
                    changelt = true;
                    moveStatus = false;
                    changerb = false;
                } else if (pickedFeature.id.id == entity.editOptions.rightbom.id) {
                    changelt = false;
                    moveStatus = false;
                    changerb = true;
                } else if (pickedFeature.id.id == entity.id) {} else {
                    moveStatus = false;
                    changelt = false;
                    changerb = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (moveStatus == true) {
                    // 根据中心点计算两个顶角
                    let ltrb = moveRect(newCenter.clone(), cartesian, newLT, newRB);
                    newCenter = cartesian;

                    newLT = ltrb[0];
                    newRB = ltrb[1];
                    return;
                }

                if (changelt == true) {
                    newLT = cartesian;
                    // 计算中心点
                    newCenter = self.getMidPointLocation(newLT, newRB);
                    return;
                }

                if (changerb == true) {
                    newRB = cartesian;
                    newCenter = self.getMidPointLocation(newLT, newRB);
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changelt = false;
            changerb = false;
            self._execute(callBack, {
                entity: entity,
                finish: true
            });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return rectDraw;
});