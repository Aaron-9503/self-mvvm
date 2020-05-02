const compileUtil = {
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
    },
    getContent(expr, vm) {
        return value = expr.replace(/\{\{(.+?)\}\}/g, (...rest) => {
            return this.getVal(rest[1], vm)
        })
    },
    setVal(expr, vm, value) {
        expr.split('.').reduce((data, currentVal,...rest) => {
            const [index,arr] = rest
            if(index === arr.length - 1){
                data[currentVal] = value
            } else {
                return data[currentVal]
            }            
        }, vm.$data)
    },
    text(node, expr, vm) {
        let value
        if (/\{\{(.+?)\}\}/.test(expr)) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...rest) => {
                new Watcher(vm, rest[1], () => {
                    this.updater.textUpdater(node, this.getContent(expr, vm))
                })
                return this.getVal(rest[1], vm)
            })
        } else {
            value = this.getVal(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm)
        new Watcher(vm, expr, (newval) => {
            this.updater.htmlUpdate(node, newval)
        })
        this.updater.htmlUpdate(node, value)
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm)
        node.addEventListener('input', (event) => {
            let value = event.target.value
            this.setVal(expr, vm, value)
        })
        new Watcher(vm, expr, (newval) => {
            this.updater.modelUpdate(node, newval)
        })
        this.updater.modelUpdate(node, value)
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(eventName, fn.bind(vm), false)
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdate(node, value) {
            node.innerHTML = value
        },
        modelUpdate(node, value) {
            node.value = value
        }
    }

}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        //1.获取文档碎片对象,放入内存中避免频繁操作dom出发浏览器的回流和重绘
        const fragment = this.node2Frament(this.el)
        this.compile(fragment)
        this.el.appendChild(fragment)
    }
    isElementNode(node) {
        return node.nodeType === 1
    }

    compile(framaent) {
        // 1.获取子节点
        const childNodes = framaent.childNodes;
        [...childNodes].forEach(child => {
            if (this.isElementNode(child)) {
                // 是元素节点
                //编译元素节点
                // console.log('元素节点', child);
                this.compileElement(child)

            } else {
                // 文本节点
                // console.log('文本节点', child)
                this.conpileText(child)

            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        })
    }

    node2Frament(el) {
        // 创建文档碎片对象
        const f = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
    compileElement(node) {
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            const { name, value } = attr
            if (this.isDirective(name)) {
                const [, directives] = name.split('-') // text html model
                const [dirName, eventName] = directives.split(':')
                //更新数据，数据视图更新
                compileUtil[dirName](node, value, this.vm, eventName)
                // 删除有指令的属性
                node.removeAttribute('v-' + directives)
            }

        })
    }

    conpileText(node) {
        const content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil['text'](node, content, this.vm)
        }
    }

    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
}


class Kvue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            // 1.实现一个数据观察者
            new Observer(this.$data)
            // 2.实现一个编译器
            new Compile(this.$el, this)
            // 数据代理
            this.proxyData(this.$data)
        }
    }
    proxyData(data){
        for(let key in data){
            Object.defineProperty(this,key,{
                get:()=>{
                    return data[key]
                },
                set:(newval)=>{
                    data[key] = newval
                }

            })
        }
    }



}