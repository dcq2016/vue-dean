function Compile(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    console.log('this.el:', this.el);
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
        var that = this;
        var childNodes = el.childNodes;
        [].slice.call(childNodes).forEach(function(node) {
            console.log('node:', node);
            var reg = /\{\{(.*)\}\}/;
            var text = node.textContent;

            if (that.isElementNode(node)) {
                that.compile(node);
            } else if (that.isTextNode(node) && reg.test(text)) {
                that.compileText(node, reg.exec(text)[1]);
            }
            // 遍历子节点
            if (node.childNodes && node.childNodes.length) {
                that.compileElement(node);
            }
        });
    },
    compile: function(node) {
        var that = this;
        var nodeAttrs = node.attributes;
        // console.log('nodeAttrs:', nodeAttrs);
        Array.prototype.forEach.call(nodeAttrs, function(attr){
            console.log('attr:', attr);
            var attrName = attr.name;
            if (that.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (that.isEventDirective(dir)) { // 事件指令
                    that.compileEvent(node, that.vm, exp, dir)
                } else { // v-model 指令
                    that.compileModel(node, that.vm, exp, dir)
                }
                node.removeAttribute(attrName)
            }
        })
    },
    compileText: function(node, exp){
        var that = this;
        var initText = this.vm[exp];
        this.updateText(node, initText);
        new Watcher(this.vm, exp, function (value) {
            that.updateText(node, value);
        });
    },
    compileEvent: function(node, vm, exp, dir){
        var eventType = dir.split(':')[1];
        var cb = vm.methods && vm.methods[exp]

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);
        }
    },
    compileModel: function (node, vm, exp) {
        var that = this;
        var val = vm[exp];
        this.modelUpdater(node, val);
        new Watcher(this.vm, exp, function(value) {
            that.modelUpdater(node, value);
        });
        
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            vm[exp] = newValue;
            val = newValue;
        }, false)
    },
    updateText: function(node, value){
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    modelUpdater: function(node, value){
        node.value = typeof value == 'undefined' ? '' : value;
    },
    isDirective: function(attr) {
        return attr.indexOf('v-') === 0
    },
    isEventDirective: function(dir){
        return dir.indexOf('on:') === 0
    },
    // node.nodeType:1 元素节点
    isElementNode: function(node){
        return node.nodeType == 1
    },
    // node.nodeType:3 文本节点
    isTextNode: function(node){
        return node.nodeType == 3;
    }
}