import { IContext, TPlugin, Result as R, Uma, TPluginConfig } from '@umajs/core';
import * as engineSource from 'consolidate';
import Srejs from '@srejs/react';

interface TviewOptions{
    ssr?: boolean, // 全局开启服务端渲染
    cache?: boolean, // 全局使用服务端渲染缓存
    useEngine?:boolean // 渲染自定义html的页面组件时，选择性开启使用模板引擎
}

export interface TssrPluginOptions extends TviewOptions {
    rootDir?:string, // 客户端页面组件根文件夹
    rootNode?:string, // 客户端页面挂载根元素ID
    defaultRouter?:boolean, // 开启默认文件路由
    prefixCDN?:string, // 构建后静态资源CDN地址前缀
    prefixRouter?:string // 默认页面路由前缀(在defaultRouter设置为true时有效)
}

interface IReactViewParms{
    viewName :string;
    initProps : any,
    options:TviewOptions
}
export class Result extends R {
    static reactView(viewName: string, initProps?: any, options?:TviewOptions) {
        return new Result({
            type: 'reactView',
            data: {
                viewName,
                initProps,
                options,
            },
        });
    }
}
const NODE_ENV = (process.env && process.env.NODE_ENV) || 'development';
let SrejsInstance;

/** 插件配置读取放到了@srejs/react框架中进行兼容，在生产环境部署前构建阶段不会执行插件 */
let opt:TssrPluginOptions = Uma.config?.ssr || {}; // ssr.config.ts
const reactSsrPlugin = <TPluginConfig>Uma.config?.plugin['react-ssr'];

if (reactSsrPlugin?.options) {
    opt = reactSsrPlugin.options;
}

let defaultRouter = false;

// eslint-disable-next-line no-prototype-builtins
if (opt.hasOwnProperty('defaultRouter')) {
    defaultRouter = opt.defaultRouter;
}

try {
    SrejsInstance = new Srejs(Uma.app, NODE_ENV === 'development', defaultRouter, opt);
} catch (error) {
    console.error(error);
}

const renderView = async (ctx:IContext, viewName:string, initProps?:any, options?:TviewOptions) => {
    let html = await SrejsInstance.render(ctx, viewName, initProps, options);

    const viewPlugin = <TPluginConfig>Uma.config?.plugin.views; // use @umajs/plugin-views

    if (viewPlugin?.enable && options.useEngine) {
        const { opts } = viewPlugin.options;
        const { map } = opts;
        const engineName = map?.html;

        console.assert(engineName, '@umajs/plugin-views must be setting; eg====>  map:{html:"nunjucks"}');
        const engine = engineSource[engineName];
        const state = { ...options, ...ctx.state || {}, ...initProps };

        html = await engine.render(html, state);
    }

    ctx.type = 'text/html';
    ctx.body = html;
};

export default (): TPlugin => ({
    results: {
        async reactView(ctx: IContext, data: IReactViewParms) {
            const {
                viewName,
                initProps = {},
                options = {},
            } = data;

            await renderView(ctx, viewName, initProps, options);
        },
    },
    context: {
        async reactView(viewName:string, initProps?:any, options?:TviewOptions) {
            await renderView(this, viewName, initProps, options);
        },
    },

});
