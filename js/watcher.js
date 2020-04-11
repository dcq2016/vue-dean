function Watcher(vm, expr, cb) {
    this.cb = cb;
    this.vm = vm;
    this.expr = expr;
    this.value = this.get();
}

Watcher.prototype = {
    update:function() {
        const value = this.expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, this.vm);

        console.log('watcher新值：', value);
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            // this.cb.call(this.vm, value, oldVal);
            this.cb(value);
        }
    },
    get:function() {
        Dep.target = this;
        // var value = this.vm[this.expr];
        const value = this.expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, this.vm);
        Dep.target = null;
        console.log('watcher旧值：', value);
        return value;
    }
}