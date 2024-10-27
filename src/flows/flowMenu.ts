import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { flowRandom } from './flowRandom';
import { flowBuscar } from './flowBuscar';
import { flowSugerencias } from './flowSugerencias';
import { flowSalir } from './flowSalir';
import { flowInfo } from './flowInfo';
import { MENU_TEXT } from '~/constants';

export const flowMenu = addKeyword<Provider, Database>(["menu", "no", "menú"])
.addAnswer(['🎙️🔸🔸🔸➡️MENÚ⬅️🔸🔸🔸🎙️', MENU_TEXT],
    { capture: true }, async (ctx, { gotoFlow }) => {
        const message = ctx.body.toLowerCase();
        if (message === 'random') return gotoFlow(flowRandom);
        if (message === 'buscar') return gotoFlow(flowBuscar);
        if (message === 'sugerencias') return gotoFlow(flowSugerencias);
        if (message === 'salir') return gotoFlow(flowSalir);
        if (message === 'info') return gotoFlow(flowInfo);
    });