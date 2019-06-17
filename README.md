# CesiumDraw2D
Cesium draw and edit 2D feature; billboard,point,polyline,etc.

两种方式，entity和primitive

//调用,需要先引入js和css

var drawControl = new DrawControl({
    //名称，optional
    name: '绘制',
    //绘制工具栏的dom id，optional
    domId: 'draw_control',
    //父容器id
    parentDomId: 'cesiumContainer',
    //Cesium.Viewer对象
    viewer: viewer，
    //绘制方式，entity=1，primitive=0,默认0
    type:0
});


