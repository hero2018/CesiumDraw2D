define([], function () {
    function Control(options) {
        this.name = options.name;
        this.domId = options.domId;
        this.parentDomId = options.parentDomId;
        this.container = document.getElementById(this.domId);
        this.parentDom = document.getElementById(this.parentDomId);
        // 控件是否显示，默认不可见
        this.hidden = true;
        this.createElement();
        this.render();
    }
    Control.prototype = Object.create(Object.prototype);
    Control.prototype.Constructor = Control;

    Control.prototype.createElement = function () {
        if (this.container == undefined) {
            this.container = document.createElement('div');
            this.container.id = this.domId;
        }
        if (this.parentDom == undefined) {
            document.appendChild(this.container);
        } else {
            this.parentDom.appendChild(this.container);
        }
    };
    Control.prototype.render = function () {};

    Control.prototype.close = function () {
        this.hidden = true;
        this.container.hidden = true;
    };

    Control.prototype.open = function () {
        this.hidden = false;
        this.container.hidden = false;
    };

    return Control;
});