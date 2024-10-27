import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { MENU_TEXT } from '~/constants';
import { flowRandom } from './flowRandom';
import { flowBuscar } from './flowBuscar';
import { flowSugerencias } from './flowSugerencias';
import { flowSalir } from './flowSalir';
import { flowInfo } from './flowInfo';
// Flujo de saludo principal
export const flowSaludo = addKeyword<Provider, Database>(['hola', 'hi', 'hello', 'hey', 'buenas', 'que onda', 'que tal', 'saludos', 'como estás', 'cómo andás', 'como andas', 'cómo andas', 'como andás'])
    .addAnswer("¡Hola! Soy *CancioNito* 🎵, ¿qué te gustaría hacer?")
    .addAnswer(MENU_TEXT,
        null,
        null, [flowRandom, flowBuscar, flowSugerencias, flowSalir, flowInfo]);