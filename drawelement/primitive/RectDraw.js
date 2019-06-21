define([
    'Cesium',
    './PrimitiveBase'
], function (Cesium, PrimitiveBase) {
    'use strict';

    function rectDraw(viewer) {
        PrimitiveBase.call(this, viewer);

        this._options = {
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
        };
        // 线的颜色
        this._color = Cesium.Color.CHARTREUSE.withAlpha(.5);

        this._editPointOptions = {
            image: './js/component/create/images/peak.png',
            scale: 0.35
        }

        //初始化编辑元素所需的变量
        //两个顶角，billboard
        this._editOptions.points = [];
        this._editOptions.primitive = undefined;
        this._editOptions.positions = undefined;
        //中心点，billboard
        this._editOptions.center = undefined;
    }

    rectDraw.prototype = Object.create(PrimitiveBase.prototype);
    rectDraw.prototype.constructor = rectDraw;


    rectDraw.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        let rectangle = Cesium.Rectangle.fromCartesianArray(newOptions.positions, this._scene.globe.ellipsoid);

        let assinObj = Object.assign({
            rectangle: rectangle
        }, this._options);

        let newId = this.getPrimitiveId();
        if (oldPrimitive) {
            newId = oldPrimitive.geometryInstances.id;
            this._geoContainer.remove(oldPrimitive);
        }

        //创建新的要素
        let rectInstance = new Cesium.GeometryInstance({
            geometry: Cesium.RectangleGeometry.createGeometry(new Cesium.RectangleGeometry(assinObj)),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.CHARTREUSE.withAlpha(.2)),
                show: new Cesium.ShowGeometryInstanceAttribute(true) //显示或者隐藏
            },
            id: newId
        });

        let rectPrimitive = this._geoContainer.add(new Cesium.Primitive({
            geometryInstances: rectInstance,
            appearance: new Cesium.EllipsoidSurfaceAppearance({
                material: Cesium.Material.fromType('Color', {
                    color: this._color
                })
            }),
            releaseGeometryInstances: false
        }));

        let self = this;
        // 给实例添加修改和删除方法
        rectPrimitive.setEdit = function (isEdit) {
            if (isEdit) {
                self._setEditOptions({
                    primitive: this,
                    positions: newOptions.positions
                });
                self._setEditModel(true);
            } else {
                self._clearEditOptions();
                self._setEditModel(false);
            }
        }

        rectPrimitive.edit = function (_handler, callBack) {
            self._beginEdit(_handler, callBack);
        }

        rectPrimitive.setDelete = function () {
            self._delete();
        }
        return rectPrimitive;

    }
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

        let rectPrimitive = undefined;

        _handler.setInputAction(function (click) {
            var cartesian = self._camera.pickEllipsoid(click.position, self._scene.globe.ellipsoid);
            if (cartesian) {
                if (cartesianlist.length == 0) {
                    cartesianlist.push(cartesian);
                }
                if (cartesianlist.length == 1) {
                    // 移动过来的，不可能是1了
                    moveStatus = true;

                } else if (cartesianlist.length == 2) {
                    moveStatus = false;
                    cartesianlist.pop();
                    cartesianlist.push(cartesian);
                    rectPrimitive = self.addPrimitive(rectPrimitive, {
                        positions: cartesianlist
                    });
                    // 结束当前操作
                    self._execute(callBack, {
                        primitive: rectPrimitive,
                        finish: true
                    });
                    _handler.destroy();
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        _handler.setInputAction(function (movement) {

                var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
                if (cartesian) {
                    if (moveStatus == true) {
                        if (cartesianlist.length == 1) {} else if (cartesianlist.length == 2) {
                            cartesianlist.pop();
                        }
                        cartesianlist.push(cartesian);
                        rectPrimitive = self.addPrimitive(rectPrimitive, {
                            positions: cartesianlist
                        });
                        self._execute(callBack, {
                            primitive: rectPrimitive,
                            finish: true
                        });
                    }
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction(function (click) {
            _handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);


        return _handler;
    }
    //#region 
    /**
     * 设置将要修改的元素
     */
    rectDraw.prototype._setEditOptions = function (options) {
        this._editOptions.primitive = options.primitive;
        this._editOptions.positions = options.positions;
    }
    rectDraw.prototype._clearEditOptions = function () {
        this._editOptions.primitive = undefined;
        this._editOptions.positions = undefined;
        this._editOptions.points=[];
        this._editOptions.center=undefined;
    }
    rectDraw.prototype._setEditModel = function (isEdit) {
        if (isEdit == true) {
            // 显示当前编辑点,
            //根据positions生成billboard
            let linePoints = [];
            // 生成编辑点
            this._editOptions.positions.forEach((element, index) => {
                let tempPoint = element.clone();
                let bid = this.getPrimitiveId();
                let billboard = this._billboards.add(Object.assign({
                    position: tempPoint,
                    id: bid
                }, this._editPointOptions));
                linePoints.push(billboard);
            });
            this._editOptions.points = linePoints;

            //center,实际上可以根据父类提供的获取中点的方法，得到，此处用矩形的center，但是center得到的是Cartographic，需要进行转换
            let centerCartographicPosition = Cesium.Rectangle.center(Cesium.Rectangle.fromCartesianArray(this._editOptions.positions, this._scene.globe.ellipsoid));
            let centerPosition = Cesium.Cartographic.toCartesian(centerCartographicPosition, this._scene.globe.ellipsoid);
            let centerid = this.getPrimitiveId();
            let centerbillboard = this._billboards.add(Object.assign({
                position: centerPosition,
                id: centerid
            }, this._editPointOptions))
            this._editOptions.center = centerbillboard;
        } else {
            //  删除当前编辑点
            this._billboards.removeAll();
        }
    }

    rectDraw.prototype._delete = function () {
        this._geoContainer.remove(this._editOptions.primitive);
        this._billboards.removeAll();
        this._clearEditOptions();
    }

    /**
     * 移动中心点
     */
    rectDraw.prototype._getNewPositinsByCenterBillboard = function (centerPosition) {
        //移动两个顶角，修改editoptions的positions
        let oldCenter = self._editOptions.center.position.clone();
        //计算xy的偏移

    }

    rectDraw.prototype._beginEdit = function (_handler, callBack) {

        let self = this;
        let moveStatus = false;

        let changeFirstPoint = false;

        let changeThirdPoint = false;

        _handler.setInputAction((event) => {
            var pickedFeature = self._viewer.scene.pick(event.position);
            if (Cesium.defined(pickedFeature)) {
                if (pickedFeature.id == self._editOptions.points[0].id) {
                    // 改变顶角位置
                    moveStatus = false;
                    changeFirstPoint = true;
                    changeThirdPoint = false;
                } else if (pickedFeature.id == self._editOptions.points[1].id) {
                    //改变底角的位置
                    moveStatus = false;
                    changeFirstPoint = false;
                    changeThirdPoint = true;
                } else if (pickedFeature.id == self._editOptions.center.id) {
                    //移动矩形
                    moveStatus = true;
                    changeFirstPoint = false;
                    changeThirdPoint = false;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);


        _handler.setInputAction((movement) => {
            if(moveStatus==false && changeFirstPoint==false && changeThirdPoint==false){
                return;
            }
            var cartesian = self._viewer.camera.pickEllipsoid(movement.endPosition, self._viewer.scene.globe.ellipsoid);
            if (cartesian) {
                let newPositions=[self._editOptions.positions[0].clone(),self._editOptions.positions[1].clone()];
                if (moveStatus == true) {
                    //移动,要根据中心点的偏移量，得到两个顶角的新坐标，重新绘制
                    //尚未实现
                    console.log('尚未实现矩形的移动功能');
                } else if (changeFirstPoint == true) {
                    newPositions = [cartesian,self._editOptions.positions[1]];
                    self._editOptions.points[0].position = cartesian;
                    self._editOptions.center.position = self.getMidPointLocation(cartesian,self._editOptions.positions[1]);
                    
                } else if (changeThirdPoint == true) {
                    newPositions = [self._editOptions.positions[0],cartesian];
                    self._editOptions.points[1].position = cartesian;
                    self._editOptions.center.position = self.getMidPointLocation(self._editOptions.positions[0],cartesian);
                   
                }                
                self._editOptions.primitive = self.addPrimitive(self._editOptions.primitive, {
                    positions:newPositions
                });
                self._editOptions.positions = newPositions;
                self._execute(callBack, {
                    primitive: self._editOptions.primitive,
                    finish: true
                });
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        _handler.setInputAction((event) => {
            moveStatus = false;
            changeFirstPoint = false;
            changeThirdPoint = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    //#endregion
    return rectDraw;
});