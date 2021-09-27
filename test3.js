'use strict'
let testThis = {
    x: 12,
    y: 20,
    add({ a, b, c }) {
        let d = a + b + c()
        console.log(d)
    },
    test() {
        //the result is NaN
        this.add({
            a: this.x,
            b: this.y,
            c: () => {
                //this here is testThis, NOT the object literal here
                return this.a + this.b
            },
        })
    },
    test2() {
        //64 as expected
        this.add({
            a: this.x,
            b: this.y,
            c: () => {
                return this.x + this.y
            },
        })
    },
    test3() {
        //NaN
        this.add({
            a: this.x,
            b: this.y,
            c: function () {
                //this here is the global object
                return this.x + this.y
            },
        })
    },
}

// testThis.test()
// testThis.test2()
// testThis.test3()

console.log('test this')

var obj = {
    i: 10,
    b: () => console.log(this.i, this),
    c: function () {
        console.log(this.i, this)
    },
    d() {
        setTimeout(() => {
            console.log('inside setTime arrow')
            console.log(this.i, this)
        }, 1000)
    },
    e() {
        setTimeout(function () {
            console.log('inside setTime function')
            console.log(this.i, this)
        }, 1500)
    },
}

obj.b()
obj.c()
obj.d()
obj.e()

console.log('test arrow')

function hi() {
    console.log(this)
}
hi() // undefined

const myFunction = () => {
    console.log(this)
}

myFunction()
