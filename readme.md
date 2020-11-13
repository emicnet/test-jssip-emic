测试 jssip-emicnet `npm install & npm start`

注意事项如下

### babel 版本

jssip-emicnet 使用 babel 6, "babel-preset-env": "^1.7.0",
使用 jssip-emicnet 时候 如果用 babel 7 `@babel/preset-env` webpack 打包会出错

`Error: Cannot find module 'babel-preset-env' from '../test-jssip-emic'`

因为 ["babel-preset-env"](https://www.npmjs.com/package/babel-preset-env) 目前已经处在维护阶段不再更新

> Now that `babel-preset-env` has stabilized, it has been [moved into the main Babel mono-repo](https://github.com/babel/babel/tree/master/packages/babel-preset-env) and this repo has been archived.

所以 jssip-emicnet 也会在适当时候更新到 babel 7

### babel-loader

`babel-loader` 版本是另一个需要注意的地方： babel **7** (`@babel/core`) 必须用 `babel-loader` **8** ，jssip-emicnet 使用 babel **6**, 所以使用它需要用 `babel-loader` **7** 。

`babel-loader` 其实在我们这个例子也是不需要的，因为 chrome 66+ 完全不需要转码 ，把 webpack 设置里 'babel-loader' 部分完全注释掉 webpack-dev-server 也能正常跑起来。但没有它在通常项目中都不太可能，所以加了它，加了它也就意味需设置 `babel-preset-env`。

如果只是运行 webpack-dev-server 因为实际上没有转码，所以用 babel 7 + loader 8 或者 babel 6+ loader 7 的组合都可以。但如果用 babel-loader 7+ @babel/core 打包会报错 `Error: Cannot find module 'babel-core'`

### 打包问题

如果需要把整个项目打包 （我们示例当然不需要）就还要 `babel-plugin-transform-runtime`

这时候需要注意 babel 的版本，使用 babel 7 会报错（因为 jssip-emicnet 使用 6）

```
Module build failed (from ./node_modules/babel-loader/lib/index.js):
TypeError: this.setDynamic is not a function
```

所以打包必须是 babel 6 + loader 7 + babel-plugin-transform-runtime 最新版本

webpack 设置`writeToDisk` 可以让 webpack-dev-server 把文件打包输出，[不然就只会在生成在内存了](https://stackoverflow.com/questions/33318457/bundle-js-file-output-and-webpack-dev-server)

```
devServer: {
  writeToDisk: true //如果想查看打包的bundle.js
}
```

### devDependencies

示例里 devDependencies 尽量设置最少的 babel 包， 比如 `babel-register` 应该是[在 node.js 测试才需要](https://x-team.com/blog/setting-up-javascript-testing-tools-for-es6/) 所以没有加。

### jssip-emicnet 版本修改历史

1. 1.3 之前版本主要是实现 UI 工具条；1.2.8 开始提供 umd 打包方式便于 api 调用。
2. 1.3.3 eslint+prettier 设置更新， 发布 mocha 测试用例；同时 1.3.2 发布时忘了 npm bundle 就 npm publish 造成 1.3.2 不可用。
3. 1.3.4 更新 call 接口，调用只传被叫号码，由 jssip-emicnet 来判断是呼内线还是外线，并通过返回值告知调用者。
4. 1.3.5 webRTC 网关配置正式的 https 证书，更新的相应域名；去掉 mocha 测试用例的发布；更新接口文档，当使用的网关非缺省网关， init 需要传 `socketUri` 参数。
5. 1.3.6 `Phone.init` 参数检测做几个小的改动:
    1. 回调函数如果是 api 文档要求必须提供的，1.3.5 之前版本都会检查如果不提供就不发起注册请求，直接返回。但是实际使用中还是发生没有提供的情况，比如回调 kickedOffLine 没有，但发现没有发起注册，询问原因。所以现在改成，必填回调没提供只是打 log，但还是发起注册。
    2. Phone.init 的返回值是 true/false， true 表示参数检测通过，发起注册, false 参数检测失败，没法发起注册。
6. 1.3.7 为客户正式部署 webRTC 服务器，改用 emicloud.com 的域名以及正式的 https 证书。`Phone.init` 的 socketUri 参数对正式商用用户是必填的参数，不填会连到开发服务器。
7. 1.3.8 为了解决同一个账户在局域网内不同机器同时登录的问题（局域网对外通常只有一个公网 IP，所以我们 sip 服务器需要特殊处理才能区分这是两个不同的登录操作）；当收到踢下线消息，我们的库代码会自动把用户下线；所以这时候只要更新相应的 UI 界面就可以。
8. 1.3.9 不从联调开户的总机号码需要单独处理，他们有自己的运维服务器。
9. 1.4.0 提供支持sip话机登录的接口`getUser2` ，原有接口`getUser`不变， 只支持voip登录，详见api更新文档。
10. 1.4.1 外呼号码不止使用登录总机号，而是从企业外呼资源池选
11. 14.2 至 1.4.5内部开发调试版本，主要改动 node 10升级到 node 12，使用node 12打包发布
12. 1.4.6 开始提供呼叫号码加密功能

注，[npm 的包没有一个标准方法能看到包的发布日志](https://stackoverflow.com/questions/34971504/how-do-i-see-the-release-notes-for-an-npm-package-before-i-upgrade) ，所以把重要的发布日志写在这里。
