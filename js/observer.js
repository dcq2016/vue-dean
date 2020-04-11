function Observer(data) {
    this.data = data;
    this.init(data);
}
Observer.prototype = {
    init:function (data) {
        Object.keys(data).forEach(key=>{
            this.defineReactive(data, key, data[key])
        })
    },
    defineReactive: function(data, key, val) {
        var dep = new Dep();
        observe(val); // 递归遍历所有子属性
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            set: function(newVal) {
                console.log('属性 '+ key +' 已经被监听，以前的值为：'+ val +'，现在的值为：'+ newVal);
                if (newVal === val) {
                    return;
                }
                val = newVal;
                dep.notify(); // 如果数据变化，通知所有订阅者
            },
            get: function(){
                if (Dep.target) {
                    dep.addSub(Dep.target);
                }
                return val;
            }
        })

    }
}

function observe(value){
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
}

// Dep.js
function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub:function(sub) {
        this.subs.push(sub);
    },
    notify:function() {
        this.subs.forEach(function(sub) {
            sub.update();
        })
    }
}