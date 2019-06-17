define([
    'Cesium',
    '../DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function primitiveBase(viewer) {
        DrawBase.call(this, viewer);

        //for edit points
        this._points = this._scene.primitives.add(new Cesium.PointPrimitiveCollection());
        //for edit points
        this._billboards = this._scene.primitives.add(new Cesium.BillboardCollection());

        //对象为编辑对象，保存当前正在编辑的圆元素的相关信息
        this._editOptions = {};
    }

    primitiveBase.prototype = Object.create(DrawBase.prototype);
    primitiveBase.prototype.constructor = primitiveBase;

    primitiveBase.prototype.remove = function (primitiveInstance) {
        this._scene.primitives.remove(primitiveInstance);
    }

    /**
     * 获取随机数
     * @param  Number lower
     * @param  Number upper
     */
    primitiveBase.prototype.random = function (lower, upper) {
        return Math.floor(Math.random() * (upper - lower + 1)) + lower;
    }

    /**
     * 获取要素id
     */
    primitiveBase.prototype.getPrimitiveId = function () {
        return this.getTimeString() + '' + this.random(1, 10000);
    };

    /**
     * 获取日子字符串
     */
    primitiveBase.prototype.getTimeString = function () {
        var dtime = new Date(); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
        let Y = dtime.getFullYear(); // 获取完整的年份(4位,1970)
        let M = dtime.getMonth() + 1; // 获取月份(0-11,0代表1月,用的时候记得加上1)
        let D = dtime.getDate(); // 获取日(1-31)
        let h = dtime.getHours(); // 获取小时数(0-23)
        let m = dtime.getMinutes(); // 获取分钟数(0-59)
        let s = dtime.getSeconds(); // 获取秒数(0-59)
        return Y + "-" + M + "-" + D + "-" + h + "-" + m + "-" + s;
    }

    //#region abstract method,  edit method
    /**
     * 设置将要修改的元素
     */
    primitiveBase.prototype._setEditOptions = function (options) {
        throw "当前对象不能实例化";
    }

    primitiveBase.prototype._clearEditOptions = function () {
        throw "当前对象不能实例化";
    }

    primitiveBase.prototype._setEditModel = function (isEdit) {
        throw "当前对象不能实例化";
    }
    primitiveBase.prototype._delete = function () {
        throw "当前对象不能实例化";
    }
    primitiveBase.prototype._move = function (position) {
        throw "当前对象不能实例化";
    }

    /**
     * 创建primitive要素实例，
     * 如果oldPrimitive ！= undedined,先删除，在把新创建的要素添加到geoContainer 中
     * 注意，oldprimitive的id和新创建的要素的id相同
     * 返回的要素实例，包含三个function,setEdit(),edit(),setDelete()
     * 这三个实例方法，操作类方法实现当前元素的编辑功能
     */
    primitiveBase.prototype.addPrimitive = function (oldPrimitive, newOptions) {
        throw "当前对象不能实例化";
    }

    
    //#enddregion
    return primitiveBase;
});