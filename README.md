# @umajs/plugin-react-ssr
> 针对Umajs提供React服务端渲染模式的开发插件，可以在`controller`和`middleware`中灵活使用react页面组件进行服务端渲染。插件基于[mini-next](https://github.com/dazjean/mini-next)进行封装；

# 特性
- 支持多页面组件，各个页面构建bundle单独打包
- 不默认路由，路由通过controller调用reactView模板引擎渲染
- 提供原始React+webpack原始配置方法
- 支持getInitProps钩子函数和服务端传递Props两种预数据处理方式
- 轻量级，客户端不依赖任何框架API
- 支持SSR,CSR两种渲染模式灵活切换
- SSR缓存
- 服务端渲染异常降级渲染
- html支持模板解析

# 集成Umajs
- 插件配置
```ts
    // plugin.config.ts
    export default <{ [key: string]: TPluginConfig }>{
        'react-ssr': {
            enable:true,
            options:{
                rootDir:'client',
                ssr: true, // 全局开启服务端渲染
                cache: false, // 全局使用服务端渲染缓存 开发环境设置true无效
            }
        }
    };
```

- 新建client目录结构
```js
   - client # rootDir配置可修改
        - pages # 固定目录
            - home #页面名称 
                - index.tsx 
                - index.scss
```

- 创建react页面组件
> 页面组件开发模式支持js ,tsx。

```tsx
import './home.scss';
import React from 'react';
type typeProps = {
    say:string
}
export default function (props:typeProps){
     const {say} = props;
    return (
        <div className ='ts-demo' >{say}</div>
    )
}
```


- .babelrc配置
> 应用配置依赖babel编译，babel插件和配置可按需开启和新增

```js
{
    "presets":["@babel/react",[
      "@babel/env",
      {
        "targets": {
          "browsers": ["last 2 versions", "ie >= 7"]
        }
      }
    ],
    "@babel/preset-typescript"
    ],
    "plugins": [
      [
        "@babel/plugin-transform-runtime",
        { "helpers": false, "regenerator": true }
      ],
      "@babel/plugin-transform-modules-commonjs",
      "@babel/plugin-proposal-class-properties"
    ]
}

```

# 使用
>  插件扩展了`Umajs`中提供的统一返回处理`Result`方法，新增了`reactView`页面组件可在`controller`自由调用,方式类似传统模板引擎使用方法；也同时将方法挂载到了koa中间件中的`ctx`对象上；当一些公关的页面组件，比如404、异常提示页面、登录或者需要在中间件中拦截跳转时可以在`middleware`中调用。
```ts
type TssrOption = {
    cache:boolean, // 开启缓存 默认false 开发环境设置true无效
    ssr:boolean // 开启服务端渲染 默认true
};
Result.reactView(viewName:string,initProps?:object,options?:TssrOption);
ctx.reactView(viewName:string,initProps?:object,options?:TssrOption);
```
**如果options参数传递为空 则默认会使用全局配置属性，全局配置采用插件集成时传递的options参数**

- **controller**中使用

```ts

import { BaseController,Path } from '@umajs/core';
import { Result } from '@umajs/plugin-react-ssr'

export default class Index extends BaseController {
    @Path("/")
    index() {
        return Result.reactView('home',{say:"hi,I am a ReactView"},{cache:true});
    }
}
```

- **middleware**中使用
> 对于中间件的使用，引入顺序需要在插件之后。
```js
async(ctx,next)=>{
    try{
        await next()
    }catch(e){
       return ctx.reactView('error',{msg:e.stack},{cache:false})
    }
}
```

- **browserRouter**使用
> 在页面组件中使用react-router时，只能在controller中使用，切需要服务端对路由做支持。框架默认集成了BrowserRouter，无需开发者在页面组件中引入
```js
// 页面组件 client/browserRouter/index.js 
export default class APP extends Component {
    render() {
        return (
            <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/about" component={About} />
                <Route exact path="/about/:msg" component={About} />
                <Route component={Home} />
            </Switch>
        );
    }
}

// 服务端路由 前后端路由规则必须保持一致
@Path("/browserRouter","/browserRouter/:path")  
browserRouter() {
    return Result.reactView('browserRouter',{say:"hi,I am a ReactView"},{cache:true});
}
```


- **html中使用模板引擎**
> 在客户端html模板中如果需要使用模板引擎，需要依赖使用`@umajs/plugin-views`插件;建议和`nunjucks`搭配使用。[参考demo](https://github.com/Umajs/umajs-react-ssr/tree/master/client/pages/template)
```js
// plugin.config.ts
views: {
        enable: true,
        name: 'views',
        options: {
            root: `${process.cwd()}/views`,
            autoRender:true,
            opts: {
                map: { html: 'nunjucks' },
            },
        },
    },

// controller
Result.reactView('template',{msg:"This is the template text！",title:'hi,umajs-react-ssr'},{cache:false});

// html
<body>
    <div>{{title}}</div>
    <div>{{msg}}</div>
    <div id="app"></div>
</body>
```

# 部署
> 在部署生产环境之前，需要提前编译好客户端bundle文件，否则线上首次访问时会耗时比较长，影响用户体验。编译脚本命令为`npx mininext build true`
```
"scripts": {
    "dev": "ts-node-dev --respawn src/app.ts",
    "build": "tsc && npx mininext build true",
    "prepublish": "npm run build",
    "prod": "node app/app.js --production"
  },

```
