const CompileUtil = {
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal];
        }, vm);
    },
    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm);
        });
    },
    text(node, expr, vm) {
        const value = this.getVal(expr, vm);
        new Watcher(vm, expr, (value) => {
            this.updater.textUpdater(node, value);
        })
        this.updater.textUpdater(node, value);
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm);
        new Watcher(vm, expr, (value) => {
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
    },
    on(node, expr, vm, eventName) {
        const fn = this.options.methods && this.options.methods[expr];

        node.addEventListener(event, fn.vind(vm), false);
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




