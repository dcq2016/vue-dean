/*
 * @Author: Dean 
 * @Date: 2020-04-11
 * @Last Modified by: Dean
 * @Last Modified time: 2020-04-13 11:46:59
 */
function Compile(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    this.fragment = null;
    this.init();
}

Compile.prototype = {
    init: function () {
        if (this.el) {
            this.fragment = this.nodeToFragment(this.el);
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        } else {
            console.log('Dom元素不存在');
        }
    },
    // 转化为文档碎片放入内存中，提高性能
    nodeToFragment: function (el) {
        var fragment = document.createDocumentFragment();
        var child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild;
        }
        return fragment;
    },
    compileElement: function (el) {
        var childNodes = el.childNodes;
        [].slice.call(childNodes).forEach((node) => {

            var reg = /\{\{(.+?)\}\}/g;
            var text = node.textContent;

            if (this.isElementNode(node)) {
                this.compile(node);
            } else if (this.isTextNode(node)) {
                if (reg.test(text)) {
                    this.compileText(node, text);
                }
            }

            // 遍历子节点
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node);
            }
        });
    },
    compile: function (node) {
        const nodeAttrs = node.attributes;

        // nodeAttrs转化为数组 Array.prototype.forEach.call(nodeAttrs
        Array.prototype.forEach.call(nodeAttrs, (attr) => {
            const {
                name,
                value
            } = attr;
            if (this.isDirective(name)) { // v-text v-html v-model v-on:click
                const expr = value;
                const [, direct] = name.split('-');
                const [directName, eventName] = direct.split(':');

                if (this.isEventDirective(directName)) { // 事件指令 v-on:click
                    this.compileEvent(node, this.vm, expr, eventName);
                } else if (directName == 'text') { // v-text v-html v-model 指令
                    this.compileText(node, expr);
                } else if (directName == 'html') {
                    this.compileHtml(node, expr);
                } else if (directName == 'model') {
                    this.compileModel(node, expr);
                }
                node.removeAttribute(name);
            } else if (this.isDirectiveClick(name)) { // @click
                this.compileEvent(node, this.vm, value, name.split('@')[1]);
                node.removeAttribute(name);
            }
        })
    },

    // v-on:click
    compileEvent: function (node, vm, expr, eventName) {
        var fn = vm.methods && vm.methods[expr];

        if (eventName && fn) {
            node.addEventListener(eventName, fn.bind(vm), false);
        }
    },
    compileText: function (node, expr) {
        console.log('expr---:', expr);
        // {{person.name}}---{{peson.age}}  person.name  msg
        let value;
        const reg = /\{\{(.+?)\}\}/g;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(reg, (...args) => {
                return this.getVal(args[1], this.vm);
            })
        } else {
            value = this.getVal(expr, this.vm);
        }

        new Watcher(this.vm, expr, (value) => {
            console.log('Watcher--textUpdater');
            this.textUpdater(node, value);
        });
        this.textUpdater(node, value);
    },
    compileHtml: function (node, expr) {
        var value = this.vm[expr];
        this.htmlUpdater(node, value);
        new Watcher(this.vm, expr, (value) => {
            this.htmlUpdater(node, value);
        });
    },

    compileModel: function (node, expr) {
        const value = expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, this.vm);

        new Watcher(this.vm, expr, (value) => {
            this.modelUpdater(node, value);
        });
        this.modelUpdater(node, value);

        node.addEventListener('input', (e) => {
            const newValue = e.target.value;
            if (value === newValue) {
                return;
            }
            console.log('expr', expr);
            this.setVal(expr, this.vm, newValue);
        }, false)
    },
    getVal(expr, vm) {
        console.log('expr:', expr);
        const [data, key] = expr.split('.');
        if (expr.split('.').length > 1) {
            return key.split('.').reduce((data, currentVal) => {
                return data[currentVal];
            }, vm[data]);
        } else {
            return expr.split('.').reduce((data, currentVal) => {
                return data[currentVal];
            }, vm);
        }
    },
    setVal(expr, vm, inputVal) {
        console.log('setVal');
        const [data, key] = expr.split('.');
        if (expr.split('.').length > 1) {
            return key.split('.').reduce((data, currentVal) => {
                data[currentVal] = inputVal;
            }, vm[data]);
        } else {
            return expr.split('.').reduce((data, currentVal) => {
                data[currentVal] = inputVal;
            }, vm);
        }
    },
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    modelUpdater: function (node, value) {
        node.value = typeof value == 'undefined' ? '' : value;
    },
    isDirective: function (attr) {
        return attr.indexOf('v-') === 0
    },
    isDirectiveClick: function (attr) {
        return attr.startsWith('@')
    },
    isEventDirective: function (eventName) {
        return eventName.indexOf('on') === 0
    },
    // node.nodeType:1 元素节点
    isElementNode: function (node) {
        return node.nodeType == 1
    },
    // node.nodeType:3 文本节点
    isTextNode: function (node) {
        return node.nodeType == 3;
    }
}