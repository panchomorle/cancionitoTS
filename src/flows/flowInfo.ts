import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { flowSalir } from './flowSalir';
import { flowMenu } from './flowMenu';
import { INFO_TEXT } from '~/constants';
//Flujo informativo
export const flowInfo = addKeyword<Provider, Database>('info')
.addAnswer(INFO_TEXT, null, (ctx, { gotoFlow }) =>{ return gotoFlow(flowPostInfo)} );
const flowPostInfo = addKeyword<Provider, Database>("info")
.addAnswer('Para volver al Menú escribe "menu".', null, null, [(await import('./flowMenu')).flowMenu, flowSalir]);
