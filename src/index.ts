import { IContext, TPluginConfig, TPlugin, Result as R, Uma } from '@umajs/core';
import * as MiniNext from 'mini-next';

interface IReactViewParms{
    viewName :string;
    initProps : any,
    options:any
}
export class Result extends R {
    static reactView(viewName: string, initProps?: any, options?:any) {
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

let opt = Uma.config?.ssr || {}; // ssr.config.ts
const reactSsrPlugin = <TPluginConfig>Uma.config?.plugin['react-ssr'];

if (reactSsrPlugin?.options) {
    opt = reactSsrPlugin.options;
}

try {
    MiniNextInstance = new MiniNext(Uma.app, NODE_ENV === 'development', false, opt);
} catch (error) {
    console.error(error);
}

export default (): TPlugin => ({
    results: {
        reactView(ctx: IContext, data: IReactViewParms) {
            const {
                viewName,
                initProps = {},
                options = {},
            } = data;

            return MiniNextInstance.render(ctx, viewName, initProps, options);
        },
    },
    context: {
        reactView: (viewName, initProps, options) => MiniNextInstance.render(this, viewName, initProps, options),
    },

});
