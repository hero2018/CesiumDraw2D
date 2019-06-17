define([
    'Cesium',
    '../Control',
    './drawelement/CancelDraw',
    './drawelement/entity/BillboardDraw',
    './drawelement/entity/PointDraw',
    './drawelement/entity/PolylineDraw',
    './drawelement/entity/PolygonDraw',
    './drawelement/entity/RectDraw',
    './drawelement/entity/CircleDraw',
    './drawelement/entity/EllipseDraw',
    './drawelement/entity/EditController',
    './drawelement/primitive/BillboardDraw',
    './drawelement/primitive/PointDraw',
    './drawelement/primitive/PolylineDraw',
    './drawelement/primitive/PolygonDraw',
    './drawelement/primitive/RectDraw',
    './drawelement/primitive/CircleDraw',
    './drawelement/primitive/EllipseDraw',
    './drawelement/primitive/EditController'
], function (Cesium, 
    Control,
    CancelDraw,
    BillboardDraw,
    PointDraw,
    PolylineDraw,
    PolygonDraw,
    RectDraw,
    CircleDraw,
    EllipseDraw,
    EditController,
    PBillboardDraw,
    PPointDraw,
    PPolylineDraw,
    PPolygonDraw,
    PRectDraw,
    PCircleDraw,
    PEllipseDraw,
    PEditController) {
    'use strict';

    /**
     * 创建绘制控件
     * @param {object} options
     */
    let drawControl = function (options) {

        options.domId = options.domId || "h_m_drawControl"
        options.className = 'drawControl';
        Control.call(this, options);
        this.container.classList.add(options.className);

        this._viewer = options.viewer;

        let billElement = this._createBillBoardDom();
        this.container.appendChild(billElement);

        let pointElement = this._createPointDom();
        this.container.appendChild(pointElement);
        let polylineElement = this._createPolylineDom();
        this.container.appendChild(polylineElement);
        let polygonElement = this._createPolygonDom();
        this.container.appendChild(polygonElement);
        let squareElement = this._createSquareDom();
        this.container.appendChild(squareElement);
        let circleElement = this._createCircleDom();
        this.container.appendChild(circleElement);
        let ellipseElement = this._createEllipseDom();
        this.container.appendChild(ellipseElement);
        let clearElement = this._createClearDom();
        this.container.appendChild(clearElement);

        let deleteElement = this._createDeleteDom();
        this.container.appendChild(deleteElement);

        let editElement = this._createEditDom();
        this.container.appendChild(editElement);

        this._initDrawClass(options);

        this._currentHandler = undefined;
    }

    drawControl.prototype = Object.create(Control.prototype);

    drawControl.prototype.constructor = drawControl;

    drawControl.prototype._changeOperation = function () {
        this._editController.clearEditEntity();
        if (this._currentHandler) {
            // 强制清除鼠标左键点击事件处理程序，否则会偶bug
            this._currentHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
        this._cancelDraw.clearHandler(self._currentHandler);
    };
    drawControl.prototype._initDrawClass = function (options) {
        // options.type = 1;//设置为entity方式
        // options.type = 0; //设置为Primitive方式
        options.viewer.drawType = options.type || 0;
        
        this._cancelDraw = new CancelDraw(options.viewer);
        if(options.viewer.drawType == 0){            
            this._billboardDraw = new PBillboardDraw(options.viewer);
            this._pointDraw = new PPointDraw(options.viewer);
            this._polylineDraw = new PPolylineDraw(options.viewer);
            this._polygonDraw = new PPolygonDraw(options.viewer);
            this._rectDraw = new PRectDraw(options.viewer);
            this._circleDraw = new PCircleDraw(options.viewer);
            this._ellipseDraw = new PEllipseDraw(options.viewer);
            this._editController = new PEditController(options.viewer);
        }
        else{
            this._billboardDraw = new BillboardDraw(options.viewer);
            this._pointDraw = new PointDraw(options.viewer);
            this._polylineDraw = new PolylineDraw(options.viewer);
            this._polygonDraw = new PolygonDraw(options.viewer);
            this._rectDraw = new RectDraw(options.viewer);
            this._circleDraw = new CircleDraw(options.viewer);
            this._ellipseDraw = new EllipseDraw(options.viewer);
            this._editController = new EditController(options.viewer);
        }
    }

    drawControl.prototype._createBillBoardDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_billboard');
        iconItem.title = "广告牌";
        iconItem.alt = "广告牌";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._billboardDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }
    drawControl.prototype._createPointDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_point');
        iconItem.title = "点";
        iconItem.alt = "点";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._pointDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }
    drawControl.prototype._createPolylineDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_polyline');
        iconItem.title = "线";
        iconItem.alt = "线";

        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._polylineDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }

    drawControl.prototype._createPolygonDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_polygon');
        iconItem.alt = "面";
        iconItem.title = "面";

        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._polygonDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }

    drawControl.prototype._createSquareDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_square');
        iconItem.alt = "矩形";
        iconItem.title = "矩形";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._rectDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }

    drawControl.prototype._createCircleDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_circle');
        iconItem.alt = "圆";
        iconItem.title = "圆";

        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._circleDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }

    drawControl.prototype._createEllipseDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_ellipse');
        iconItem.alt = "椭圆";
        iconItem.title = "椭圆";

        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._ellipseDraw.startDraw();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }

    drawControl.prototype._createClearDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_clear');
        iconItem.alt = "取消"
        iconItem.title = "取消";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }


    drawControl.prototype._createDeleteDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_delete');
        iconItem.alt = "删除"
        iconItem.title = "删除";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._editController.deleteEntity();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }



    drawControl.prototype._createEditDom = function () {
        let itemContainer = document.createElement('div');
        itemContainer.classList.add('draw_Item_img');
        let iconItem = document.createElement('img');
        iconItem.classList.add('img_dom');
        iconItem.classList.add('img_edit');
        iconItem.alt = "编辑";
        iconItem.title = "编辑";
        let self = this;
        iconItem.addEventListener('click', () => {
            self._changeOperation();
            self._currentHandler = self._editController.beginEdit();
        });

        itemContainer.appendChild(iconItem);
        return itemContainer;
    }
    return drawControl;
});