class Observer {
    constructor(data){
        this.observe(data)
    }

    observe(data){
        if(data && typeof data === 'object'){
            Object.keys(data).forEach(key =>{
                this.defineReactive(data,key,data[key])
            })
        }
    }

    // 数据响应化
    defineReactive(obj,key,value){
        this.observe(value)
        const dep = new Dep()
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:true,
            get(){
                // 定义数据变化， 往dep里面添加观察者
                Dep.target && dep.addsub(Dep.target)
                return value
            },
            set:(newval)=>{
                this.observe(newval)
                if(newval !== value){
                    value = newval
                    dep.notify()
                }
            }
        })
    }
}

class Dep {
    constructor(){
        this.subs = []
    }
    // 收集观察者
    addsub(watcher){
        this.subs.push(watcher)
    }
    // 通知观察者
    notify(){
        this.subs.forEach(w => w.update())
    }
}

class Watcher {
    constructor(vm,expr,cb){
        this.vm = vm
        this.expr = expr
        this.cb = cb
        // 把旧值保存起来
        this.oldval = this.getOldVal()
    }
    getOldVal(){
        Dep.target = this
        const oldval = compileUtil.getVal(this.expr,this.vm)
        Dep.target = null
        return oldval
    }
    update(){
        const newval = compileUtil.getVal(this.expr,this.vm)
        this.cb(newval)
    }
}