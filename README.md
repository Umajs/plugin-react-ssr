# @umajs/plugin-react-ssr
> 针对Umajs提供React服务端渲染模式的开发插件，插件基于服务端渲染骨架工具[Srejs](https://github.com/dazjean/srejs)开发。

## 插件介绍
`plugin-react-ssr`插件扩展了`Umajs`中提供的统一返回处理`Result`对象，新增了`reactView`页面组件渲染方法，可在`controller`自由调用,使用类似传统模板引擎；也同时将方法挂载到了koa中间件中的`ctx`对象上；当一些公关的页面组件，比如404、异常提示页面、登录或者需要在中间件中拦截跳转时可以在`middleware`中调用。

## 插件安装

```
 yarn add @umajs/plugin-react-ssr --save
```
## 插件配置
```ts
    // plugin.config.ts
    export default <{ [key: string]: TPluginConfig }>{
        'react-ssr': {
            enable:true,
            options:{
                rootDir:'web', // 客户端页面组件根文件夹
                rootNode:'app', // 客户端页面挂载根元素ID
                ssr: true, // 全局开启服务端渲染
                cache: false, // 全局使用服务端渲染缓存 开发环境设置true无效
                prefixCDN: '/' // 客户端代码部署CDN前缀
            }
        }
    };
```

## **[使用文档](https://umajs.gitee.io/%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%B8%B2%E6%9F%93/React-ssr.html)**

## 案例
- [uma-css-module](https://github.com/dazjean/Srejs/tree/mian/example/uma-css-module)
- [uma-react-redux](https://github.com/dazjean/Srejs/tree/mian/example/uma-react-redux)
- [uma-useContext-useReducer](https://github.com/dazjean/Srejs/tree/mian/example/uma-useContext-useReducer)