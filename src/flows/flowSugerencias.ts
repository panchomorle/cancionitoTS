import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { suggestSongs } from '~/services';
import { flowMenu } from './flowMenu';

// Flujo para sugerencias
export const flowSugerencias = addKeyword<Provider, Database>(['sugerencias', 'recomendaciones', 'sugerir', 'sugerencia', 'mas', 'más'])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const suggestions = await suggestSongs();

        const suggestionText = suggestions.map((song, index) => `${index + 1}. ${song}`).join('\n'); // `song` ya es el título
        await flowDynamic([{ body: `Aquí tienes algunas sugerencias:\n${suggestionText}` }]);

        return gotoFlow(flowPostSugerencias);
    });

const flowPostSugerencias = addKeyword<Provider, Database>("sugerencias")
.addAnswer('Escribe "más" para ver más sugerencias, o "menu" para volver al menú.', null, null, [flowSugerencias, (await import('./flowMenu')).flowMenu]);