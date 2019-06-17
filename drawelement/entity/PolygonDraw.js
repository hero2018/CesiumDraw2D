define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function polygonDraw(viewer) {
        DrawBase.call(this, viewer);

        this._options = {
            height: 0,
            outline: true,
            outlineColor:Cesium.Color.LAVENDAR_BLUSH,
            material: Cesium.Color.CHARTREUSE.withAlpha(.2)
        };
        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        }

        this._editMidPointOptions = {
            color: Cesium.Color.RED,
            material: Cesium.Color.CHARTREUSE.withAlpha(.5),
            pixelSize: 10,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
        }
    }

    polygonDraw.prototype = Object.create(DrawBase.prototype);
    polygonDraw.prototype.constructor = polygonDraw;


    polygonDraw.prototype.startDraw = function (options, callBack) {
        let self = this;
        let _handler = new Cesium.ScreenSpaceEventHandler(self._canvas);
        let cartesianlist = [];
        let moveStatus = true;
        let drawStatus = false; //是否开始绘制

        let polygonEntity = undefined;

        let assinObj = Object.assign({
                hierarchy: new Cesium.CallbackProperty(function () {
                    return cartesianlist;
                }, false),
            },
            options || self._options);
        polygonEntity = self._viewer.entities.add({
            polygon: assinObj
        });


        polygonEntity.setEdit = function (isEditing) {
            if (isEditing == false) {
                // 移除
                if (this.editOptions) {
                    for (var item of this.editOptions.points.entries()) {
                        self.remove(item[1].entity);
                    }
                    for (var item of this.editOptions.midPoints.entries()) {
                        self.remove(item[1].entity);
                    }
                }
                return;
            }
            let pointMap = new Map();
            let midPointMap = new Map();
            // 生成编辑点
            let positions = this.polygon.hierarchy.getValue();
            positions.forEach((element, index) => {
                let newLocation = element.clone();
                let newPosition = new Cesium.CallbackProperty(function () {
                    return newLocation;
                }, false);

                let pent = self._viewer.entities.add({
                    position: newPosition,
                    billboard: self._editPointOptions
                });
                pointMap.set(pent.id, {
                    entity: pent,
                    index: index
                });

            });
            let iLength = positions.length;
            for (let i = 1; i < iLength; i++) {
                // 获取上一个点
                let prePoint = positions[i - 1].clone();
                let nowPoint = positions[i].clone()
                let midNewPosition = self.getMidPointLocation(prePoint, nowPoint);
                let mid = self._viewer.entities.add({
                    position: new Cesium.CallbackProperty(function () {
                        return midNewPosition;
                    }, false),
                    point: self._editMidPointOptions
                });

                midPointMap.set(mid.id, {
                    entity: mid,
                    index: i - 1
                });
            }


            let prePointlast = positions[iLength - 1].clone();
            let nowPointlast = positions[0].clone()
            let midNewPositionlast = self.getMidPointLocation(prePointlast, nowPointlast);
            let midlast = self._viewer.entities.add({
                position: new Cesium.CallbackProperty(function () {
                    return midNewPositionlast;
                }, false),
                point: self._editMidPointOptions
            });

            midPointMap.set(midlast.id, {
                entity: midlast,
                index: iLength - 1
            });

            this.editOptions = {
                points: pointMap,
                midPoints: midPointMap
            };
        }

        polygonEntity.edit = function (editHandler) {
            self.startEdit(editHandler,polygonEntity, options, callBack);
        }

        polygonEntity.setDelete = function(){
            if (this.editOptions) {
                for (var item of this.editOptions.points.entries()) {
                    self.remove(item[1].entity);
                }
                for (var item of this.editOptions.midPoints.entries()) {
                    self.remove(item[1].entity);
                }
            }
            return;
        }
        //第一条边，因为绘制多边形的时候，在三个点尚未确定之前，界面没有任何动静，
        //因此先虚拟的绘制第一条边，也就是前两个点的连线，当第三个点确定后，多边形将展现，此时删除第一条边
        let firstDrawOverStatus = false;
        let firstMoveLineCList = [];
        let firstMoveAssinObj = Object.assign({
                positions: new Cesium.CallbackProperty(function () {
                    return firstMoveLineCList;
                }, false),
            },
            options || self._options);
        let firstMoveEntity = self._viewer.entities.add({
            polyline: firstMoveAssinObj
        });

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length < 1) {
                    // 设置绘制状态为开始；在添加到列表之前
                    drawStatus = true;
                    cartesianlist.push(cartesian);
                } else {
                    cartesianlist.pop();
                    cartesianlist.push(cartesian);
                }
                // 设置移动状态为false
                moveStatus = false;

                if (cartesianlist.length == 0) {
                    // do nothing
                } else if (cartesianlist.length == 1) {
                    firstMoveLineCList.push(cartesian.clone());
                    firstDrawOverStatus = false;
                } else if (cartesianlist.length == 2) {
                    if (firstMoveLineCList.length < 2) {} else {
                        firstMoveLineCList.pop();
                    }
                    firstMoveLineCList.push(cartesian.clone());
                    firstDrawOverStatus = true;
                } else {
                    // 此时多边形的形状已经勾勒出来，移除第一条边
                    if (firstMoveEntity) {
                        self.remove(firstMoveEntity);
                    }
                }
            }

            self._execute(callBack, {
                points: cartesianlist,
                entity: polygonEntity,
                finish: false
            });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (movement) {

                var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
                if (cartesian) {
                    if (firstDrawOverStatus == false) {
                        if (firstMoveLineCList.length == 1) {
                            firstMoveLineCList.push(cartesian.clone());
                        } else if (firstMoveLineCList.length > 1) {
                            firstMoveLineCList.pop();
                            firstMoveLineCList.push(cartesian.clone());
                        }
                    }

                    if (drawStatus == true) {
                        // 左键已经点击过了
                        if (moveStatus == false) {
                            //刚刚点击左键
                            cartesianlist.push(cartesian);
                            moveStatus = true;
                        } else {
                            cartesianlist.pop();
                            cartesianlist.push(cartesian);
                        }
                    }

                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                cartesianlist.pop();
                cartesianlist.push(cartesian);
            }
            self._execute(callBack, {
                points: cartesianlist,
                entity: polygonEntity,
                finish: true
            });
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        return _handler;
    }

    polygonDraw.prototype.startEdit = function (_handler,entity, options, callBack) {

        let self = this;

        let moveStatus = false;

        let addPointStatus = false;

        let changePoint = false;

        let currentEditPointId = undefined;

        entity.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            let positions = [];
            for (var item of entity.editOptions.points.entries()) {
                positions.push(item[1].entity.position.getValue());
            }
            return positions;
        }, false);


        let clickPointEntity = function (pointid) {
            return entity.editOptions.points.has(pointid);
        }


        let clickMidPointEntity = function (pointid) {
            return entity.editOptions.midPoints.has(pointid);
        }
        //多边形点
        let getPrevNextEntity = function (pointid) {
            if (clickPointEntity(pointid) == false) {
                return undefined;
            }

            let curEntity = entity.editOptions.points.get(pointid);
            let iCount = entity.editOptions.points.size;
            let curIndex = curEntity.index;
            let prevIndex = curIndex == 0 ? iCount - 1 : curIndex - 1;
            let nextIndex = curIndex == iCount - 1 ? 0 : curIndex + 1;

            let prevEntity = undefined;
            let nextEntity = undefined;
            for (var item of entity.editOptions.points.entries()) {
                if (item[1].index == prevIndex) {
                    prevEntity = item[1].entity;
                }

                if (item[1].index == nextIndex) {
                    nextEntity = item[1].entity;
                }
            }
            return [prevEntity, nextEntity];
        }

        let getMidEntity = function (index) {
            let ret = undefined;
            for (var item of entity.editOptions.midPoints.entries()) {
                if (item[1].index == index) {
                    ret = item[1].entity;
                    break;
                }
            }
            return ret;
        }
        //边线中点
        let getPrevNextMidEntity = function (pointid) {
            if (clickPointEntity(pointid) == false) {
                return undefined;
            }
            let curEntity = entity.editOptions.points.get(pointid);
            let iCount = entity.editOptions.points.size;
            if (curEntity.index == 0) {
                return [getMidEntity(iCount - 1), getMidEntity(0)];
            } else {
                return [getMidEntity(curEntity.index - 1), getMidEntity(curEntity.index)];
            }
        }

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (clickPointEntity(pickedFeature.id.id)) {
                    moveStatus = false;
                    changePoint = true;
                    addPointStatus = false;
                    currentEditPointId = pickedFeature.id.id;
                } else if (clickMidPointEntity(pickedFeature.id.id)) {
                    currentEditPointId = pickedFeature.id.id;
                    addPointStatus = true;
                    moveStatus = false;
                    changePoint = false;
                    //添加节点，重新初始化点
                    let index = entity.editOptions.midPoints.get(pickedFeature.id.id).index;
                    //要在第index位置插入当前点

                    var cartesian = self._viewer.camera.pickEllipsoid(event.position, self._viewer.scene.globe.ellipsoid);
                    let newMap = new Map();
                    let newIndex = 0;
                    for (var item of entity.editOptions.points.entries()) {
                        newMap.set(item[0], {
                            entity: item[1].entity,
                            index: newIndex
                        });
                        newIndex++;
                        if (item[1].index == index) {
                            let nLocation = cartesian;
                            let nPosition = new Cesium.CallbackProperty(function () {
                                return nLocation;
                            }, false);

                            let nEntity = self._viewer.entities.add({
                                position: nPosition,
                                point: self._editPointOptions
                            });
                            newMap.set(nEntity.id, {
                                entity: nEntity,
                                index: newIndex
                            });
                            newIndex++;
                        }
                    }
                    
                    // entity.editOptions.points.clear();
                    entity.editOptions.points = newMap;

                    entity.setEdit(false);
                    entity.setEdit(true);
                } else {
                    moveStatus = false;
                    changePoint = false;
                    addPointStatus = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        _handler.setInputAction((movement) => {
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (changePoint == true) {
                    if (currentEditPointId && clickPointEntity(currentEditPointId)) {
                        let currentEntity = entity.editOptions.points.get(currentEditPointId).entity;
                        currentEntity.position = cartesian;
                        //重新计算中点，计算当前点相邻的前后两个点
                        let midEntities = getPrevNextMidEntity(currentEditPointId);
                        if (midEntities instanceof Array) {
                            //前面
                            let prevNext = getPrevNextEntity(currentEditPointId);
                            let prevPosition = prevNext[0].position.getValue();
                            let nextPosition = prevNext[1].position.getValue();
                            midEntities[0].position = self.getMidPointLocation(prevPosition, cartesian);
                            midEntities[1].position = self.getMidPointLocation(cartesian, nextPosition);
                        }
                    }
                    return;
                }
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {

            moveStatus = false;
            changePoint = false;
            addPointStatus = false;
            self._execute(callBack, {
                entity: entity,
                finish: true
            });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return _handler;
    }

    return polygonDraw;
});