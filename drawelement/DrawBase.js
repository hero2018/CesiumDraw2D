define([
    'Cesium'
], function (Cesium) {
    'use strict';

    function drawBase(viewer) {
        if (viewer == undefined) {
            throw 'viewer is undfined.';
        }

        this._viewer = viewer;
        this._scene = viewer.scene;
        this._camera = viewer.camera;
        this._canvas = viewer.scene.canvas;
        this._drawStatus = viewer.drawType || 1; //0 = P，1，entity
        this._geoContainer = viewer.drawType == 0 ? this._scene.primitives : this._viewer.entities;
    }

    drawBase.prototype = Object.create(Object.prototype);
    drawBase.prototype.constructor = drawBase;

    drawBase.prototype._execute = function (callBack, options) {
        if (callBack && typeof callBack == 'function') {
            callBack(options);
        }
    }

    drawBase.prototype.startDraw = function (options, callBack) {
        throw 'current class can not be instanced.';
    }


    drawBase.prototype.remove = function (entity) {
        this._viewer.entities.remove(entity);
    }

    drawBase.prototype.startEdit = function (options, callBack) {
        throw 'current class can not be instanced.';
    }


    drawBase.prototype.clearHandler = function (handler) {
        if (handler) {
            handler.destroy();
        }
    }

    //根据两个点，得到中点
    drawBase.prototype.getMidPointLocation = function (cartesian1, cartesian2) {
        let carto1 = Cesium.Cartographic.fromCartesian(cartesian1, this._scene.globe.ellipsoid);
        let carto2 = Cesium.Cartographic.fromCartesian(cartesian2, this._scene.globe.ellipsoid);
        return Cesium.Cartesian3.fromRadians((carto1.longitude + carto2.longitude) / 2, (carto1.latitude + carto2.latitude) / 2);

        // return Cesium.Cartesian3.midpoint(cartesian1, cartesian2);
    }
    //根据两个点，得到距离
    drawBase.prototype.getDistance = function (cartesian1, cartesian2) {
        // var point1cartographic = Cesium.Cartographic.fromCartesian(cartesian1);
        // var point2cartographic = Cesium.Cartographic.fromCartesian(cartesian2);
        // /**根据经纬度计算出距离**/
        // var geodesic = new Cesium.EllipsoidGeodesic();
        // geodesic.setEndPoints(point1cartographic, point2cartographic);
        // var dis = geodesic.surfaceDistance;
        // return dis;

        return Cesium.Cartesian3.distance(cartesian1, cartesian2);
    }
    // 根据对角线交点和正方形边长获取rect的cood参数
    drawBase.prototype.getSquarePointsLocation = function (cartesian1, pixSize) {
        pixSize = pixSize || 10;
        let radius = Math.sqrt(Math.pow(pixSize, 2) / 2);
        let lt = this.getCirclePointsLocation(cartesian1, radius, 135);
        let lb = this.getCirclePointsLocation(cartesian1, radius, 225);
        let rb = this.getCirclePointsLocation(cartesian1, radius, 315);
        let rt = this.getCirclePointsLocation(cartesian1, radius, 45);
        return [lt, lb, rb, rt];
    }
    // 获取圆上一点的坐标,Cartographic
    drawBase.prototype.getCirclePointsLocation = function (cartesian1, radius, angle) {
        //let centerCarto = Cesium.Cartographic.fromCartesian(cartesian1, this._scene.globe.ellipsoid);

        // let x0 = centerCarto.longitude;
        // let y0 = centerCarto.latitude;

        let x0 = cartesian1.x;
        let y0 = cartesian1.y;
        let x1 = x0 + radius * Math.cos(angle * Math.PI / 180);
        let y1 = y0 + radius * Math.sin(angle * Math.PI / 180);

        let ret = Cesium.Cartesian3.fromElements(x1, y1);
        return ret;
    }

    // 获取矩形的四个顶点坐标，左上，右上，右下，左下，顺序，Cartographic，弧度
    drawBase.prototype.getRectPointsLocation = function (rectangle) {

        let lt = Cesium.Rectangle.northwest(rectangle);
        let rt = Cesium.Rectangle.northeast(rectangle);
        let rb = Cesium.Rectangle.southeast(rectangle);
        let lb = Cesium.Rectangle.southwest(rectangle);

        return [lt, rt, rb, lb];
    }

    // 获取矩形的四个顶点坐标，上，右，下，左
    drawBase.prototype.getRectMidPointsLocation = function (rectangle) {

        let lt = Cesium.Rectangle.northwest(rectangle);
        let rt = Cesium.Rectangle.northeast(rectangle);
        let rb = Cesium.Rectangle.southeast(rectangle);
        let lb = Cesium.Rectangle.southwest(rectangle);
        //以上为弧度
        // 转为世界坐标
        let cartlt = Cesium.Cartesian3.fromRadians(lt.longitude, lt.latitude, lt.height);
        let cartrt = Cesium.Cartesian3.fromRadians(rt.longitude, rt.latitude, rt.height);
        let cartrb = Cesium.Cartesian3.fromRadians(rb.longitude, rb.latitude, rb.height);
        let cartlb = Cesium.Cartesian3.fromRadians(lb.longitude, lb.latitude, lb.height);

        let retlt = this.getMidPointLocation(cartlt, cartrt);
        let retrt = this.getMidPointLocation(cartrt, cartrb);
        let retrb = this.getMidPointLocation(cartrb, cartlb);
        let retlb = this.getMidPointLocation(cartlb, cartlt);
        return [retlt, retrt, retrb, retlb];
    }
    return drawBase;
});