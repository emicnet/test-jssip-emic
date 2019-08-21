测试 jssip-emicnet  `npm install & npm start`

jssip-emicnet 使用 babel 6, "babel-preset-env": "^1.7.0",
使用 jssip-emicnet 时候 如果用 babel 7 `@babel/preset-env` webpack打包会出错 

`Error: Cannot find module 'babel-preset-env' from '../test-jssip-emic'`

注：可以使用babel7 的 `@babel/core` 



因为 ["babel-preset-env"](https://www.npmjs.com/package/babel-preset-env) 目前已经处在维护阶段不再更新 

> Now that `babel-preset-env` has stabilized, it has been [moved into the main Babel mono-repo](https://github.com/babel/babel/tree/master/packages/babel-preset-env) and this repo has been archived.

所以  jssip-emicnet 也会在适当时候更新到babel 7

