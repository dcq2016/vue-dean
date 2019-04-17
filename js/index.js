function dVue(options) {
    var that = this;
    this.data = options.data;
    this.methods = options.methods;

    Object.keys(this.data).forEach(function(key) {
        that.proxyKeys(key); // 绑定代理属性
    })

    observe(this.data);
    new Compile(options.el, this);
    options.mounted.call(this); // 所有事情处理好后执行mounted函数
}
dVue.prototype = {
    proxyKeys: function(key) {
        var that = this;
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get:function() {
                return that.data[key];
            },
            set:function(newVal) {
                that.data[key] = newVal;
            }
        })
    }
}