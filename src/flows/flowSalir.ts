import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
// Flujo para salir
export const flowSalir = addKeyword<Provider, Database>(['salir', 'chau', 'adios', 'adiós', 'hasta pronto', 'hasta luego']).
addAnswer('¡Hasta luego! 👋');