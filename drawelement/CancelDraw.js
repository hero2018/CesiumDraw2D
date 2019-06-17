define([
    'Cesium',
    './DrawBase'
], function (Cesium, DrawBase) {
    'use strict';

    function cancelDraw(viewer) {
        DrawBase.call(this, viewer);
    }

    cancelDraw.prototype = Object.create(DrawBase.prototype);
    cancelDraw.prototype.constructor = cancelDraw;

    return cancelDraw;
});