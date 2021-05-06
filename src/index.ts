import { IContext, TPlugin, Result as R, Uma, TPluginConfig } from '@umajs/core';
import * as engineSource from 'consolidate';
import MiniNext from 'mini-next';

type TpluginOptions = {
    rootDir?:string,
    ssr?: boolean, // 全局开启服务端渲染
    cache?: boolean, // 全局使用服务端渲染缓存
    defaultRouter?:boolean, // 开启默认文件路由
}

interface IReactViewParms{
    viewName :string;
    initProps : any,
    options:TpluginOptions
}
export class Result extends R {
    static reactView(viewName: string, initProps?: any, options?:TpluginOptions) {
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
let MiniNextInstance;

/** 插件配置读取放到了mini-next框架中进行兼容，在生产环境部署前构建阶段不会执行插件 */
let opt:TpluginOptions = Uma.config?.ssr || {}; // ssr.config.ts
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
    MiniNextInstance = new MiniNext(Uma.app, NODE_ENV === 'development', defaultRouter, opt);
} catch (error) {
    console.error(error);
}

const renderView = async (ctx, viewName, initProps, options) => {
    let html = await MiniNextInstance.render(ctx, viewName, initProps, options);

    const viewPlugin = <TPluginConfig>Uma.config?.plugin.views; // use @umajs/plugin-views

    if (viewPlugin?.enable) {
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
        async reactView(viewName:string, initProps?:any, options?:TpluginOptions) {
            await renderView(this, viewName, initProps, options);
        },
    },

});
