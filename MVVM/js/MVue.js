const ComplieUtil = {
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, vm.data);
    },
    setVal(expr, vm, inputVal) {
        // console.log('expr:', expr); // person.name
        const [data, key] = expr.split('.');
        if (expr.split('.').length > 1) {
            return key.split('.').reduce((data, currentVal) => {
                data[currentVal] = inputVal;
            }, vm.data[data]);
        };
        return expr.split('.').reduce((data, currentVal) => {
            data[currentVal] = inputVal;
        }, vm.data);
    },
    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm);
        })
    },
    text(node, expr, vm) {
        let value;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm, args[1], () => {
                    this.updater.textUpdater(node, this.getContentVal(expr, vm));
                })
                return this.getVal(args[1], vm);
            })
        } else {
            value = this.getVal(expr, vm);
        }
        new Watcher(vm, expr, (value) => {
            console.log('watcher text');
            this.updater.textUpdater(node, value);
        })
        this.updater.textUpdater(node, value);
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm);
        new Watcher(vm, expr, (value) => {
            console.log('watcher html');
            this.updater.htmlUpdater(node, value);
        })
        this.updater.htmlUpdater(node, value);
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm);
        new Watcher(vm, expr, (value) => {
            this.updater.modelUpdater(node, value);
        })
        this.updater.modelUpdater(node, value);
        
        node.addEventListener('input', (e) => {
            console.log(e.target.value, value);
            if (value === e.target.value) return;
            this.setVal(expr, vm, e.target.value);
        }, false);

        
    },
    on(node, expr, vm, eventName) {
        const fn = vm.options.methods && vm.options.methods[expr];
        node.addEventListener(eventName, fn.bind(vm), false);
    },
    updater: {
        textUpdater(node, value) {
            return node.textContent = value;
        },
        htmlUpdater(node, value) {
            return node.innerHTML = value;
        },
        modelUpdater(node, value) {
            return node.value = value;
        }
    }
}
class MVue {
    constructor(options) {
        this.el = options.el;
        this.data = options.data;
        this.methods = options.methods;
        this.options = options;
        if (this.el) {
            new Observer(this.data);
            new Complie(this.el, this);
        }
    }
}

class Complie {
    constructor(el, vm) {
        this.el = document.querySelector(el);
        this.vm = vm;

        // 创建文档碎片
        const fragment = this.nodeToFragment(this.el);

        this.compile(fragment);
        this.el.appendChild(fragment);
    }
    nodeToFragment(el) {
        let fragment = document.createDocumentFragment();
        let child = el.firstChild;
        while (child) {
            fragment.appendChild(child);
            child = el.firstChild;
        }
        return fragment;
    }
    compile(el) {
        const childNodes = el.childNodes;
        [...childNodes].forEach(node => {
            if (this.isElementType(node)) {
                // console.log('元素节点:', node);
                this.compileElement(node);
            } else if (this.isTextType(node)) {
                // console.log('文本节点:', node);
                this.compileText(node);
            }
            if (node.childNodes && node.childNodes.length) {
                this.compile(node);
            }
        })
    }
    compileElement(node) {
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            console.log('attr:', attr);
            const {
                name, // v-model v-on:click
                value // msg
            } = attr;
            if (this.isDireactive(name)) { // v-model="msg" v-on:click="handler"
                // console.log(attr, '是指令v-');

                const [, direact] = name.split('-');
                const [directveName, eventName] = direact.split(':');
                ComplieUtil[directveName](node, value, this.vm, eventName);
            }
        })
    }
    compileText(node) {
        const content = node.textContent;
        if (/\{\{(.+?)\}\}/.test(content)) {
            ComplieUtil['text'](node, content, this.vm);
        }
    }
    isTextType(node) {
        return node.nodeType === 3;
    }
    isElementType(node) {
        return node.nodeType === 1;
    }
    isDireactive(attr) {
        return attr.startsWith('v-');
    }
}

class Observer {
    constructor(data) {
        this.data = data;
        this.observer(this.data);
    }
    observer(data) {
        if (!data || typeof data !== 'object') return;
        Object.keys(data).forEach(key => {
            this.deReactive(data, key, data[key]);
        })
    }
    deReactive(data, key, value) {

        this.observer(value);
        let dep = new Dep();

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get() {
                if (Dep.target) {
                    dep.addSub(Dep.target);
                }
                return value;
            },
            set(newVal) {
                console.log('属性 ' + key + ' 已经被监听，以前的值为：' + value + '，现在的值为：' + newVal);
                if (value === newVal) {
                    return;
                }
                value = newVal;
                // 通知watcher更新数据
                dep.notify();
            },
        })
    }
}

class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub);
    }
    notify() {
        this.subs.forEach(w => {
            w.update(); // 通知watcher.update() 更新
        })
    }
}

class Watcher {
    constructor(vm, expr, callback) {
        this.vm = vm;
        this.expr = expr;
        this.callback = callback;
        this.oldValue = this.getVal();
    }
    update() {
        let value;
        if (this.expr.indexOf("{{") !== -1) {
            value = ComplieUtil.getContentVal(this.expr, this.vm);
        } else {
            value = ComplieUtil.getVal(this.expr, this.vm);
        }
        console.log('新值：', value);
        // 当更新的值不等于旧值时，把新值回调传回去
        if (value !== this.oldValue) {
            this.callback(value);
        }
    }
    getVal() {
        Dep.target = this;
        let value;
        if (this.expr.indexOf("{{") !== -1) {
            value = ComplieUtil.getContentVal(this.expr, this.vm);
        } else {
            value = ComplieUtil.getVal(this.expr, this.vm);
        }
        
        Dep.target = null;
        return value;
    }
}