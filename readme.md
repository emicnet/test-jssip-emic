测试 jssip-emicnet  `npm install & npm start`

jssip-emicnet 使用 babel 6, "babel-preset-env": "^1.7.0",
使用 jssip-emicnet 时候 如果用 babel 7 `@babel/preset-env` webpack打包会出错 

`Error: Cannot find module 'babel-preset-env' from '../test-jssip-emic'`

注：可以使用babel7 的 `@babel/core` 



因为 ["babel-preset-env"](https://www.npmjs.com/package/babel-preset-env) 目前已经处在维护阶段不再更新 

> Now that `babel-preset-env` has stabilized, it has been [moved into the main Babel mono-repo](https://github.com/babel/babel/tree/master/packages/babel-preset-env) and this repo has been archived.

所以  jssip-emicnet 也会在适当时候更新到babel 7



示例里 devDependencies 尽量设置最少的babel包， 比如 `babel-register` 应该是[在 node.js测试才需要](https://x-team.com/blog/setting-up-javascript-testing-tools-for-es6/) 所以没有加。 `babel-loader` 其实在我们这个例子也是不需要的，因为chrome 66 完全不需要转码，但没有它在通常项目中都不太可能，所以加了它。加了它也就意味需要加 `babel-preset-env`

webpack设置`writeToDisk` 可以让webpack-dev-server把文件打包，[不然就只会在生成在内存了](https://stackoverflow.com/questions/33318457/bundle-js-file-output-and-webpack-dev-server)

```
devServer: {
  writeToDisk: true
}
```



如果需要把整个项目打包 （我们示例当然不需要）就还要 `babel-plugin-transform-runtime`  