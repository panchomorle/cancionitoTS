import { flowMenu } from './flowMenu';
import { flowRandom } from './flowRandom';
import { flowInfo } from './flowInfo';
import { flowSalir } from './flowSalir';
import { flowSugerencias } from './flowSugerencias';
import { flowSaludo } from './flowSaludo';
import { flowBuscar } from './flowBuscar';

export const loadFlows = async () => {
    return Promise.all([flowMenu, flowRandom, flowInfo, flowSalir, flowSugerencias, flowSaludo, flowBuscar]);
};