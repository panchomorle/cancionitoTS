import { createBot, createProvider, createFlow} from '@builderbot/bot';
import { loadFlows } from './flows';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath, pathToFileURL} from 'url';

import { BaileysProvider as cancionitoProvider } from '@builderbot/provider-baileys'
import { MemoryDB as cancionitoDB } from '@builderbot/bot'
// Define los tipos explícitamente para utilizarlos en otras partes del código
export type Provider = cancionitoProvider;
export type Database = cancionitoDB;


// Obtén el equivalente de __dirname en ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const flowsDir = path.join(__dirname, 'flows');
// const flows = [];

// // Lee todos los archivos TypeScript en la carpeta 'flows'
// const loadFlows = async () => {
//     const files = fs.readdirSync(flowsDir);
    
//     for (const file of files) {
//         if (file.endsWith('.ts')) {
//             const flowPath = pathToFileURL(path.join(flowsDir, file)).href; // Convierte a URL válida
//             const flowModule = await import(flowPath);
//             // Si el archivo exporta un flujo, agrégalo a la lista de flows
//             flows.push(flowModule.default || flowModule);
//         }
//     }
// };

// await loadFlows();

// export default flows;

// Crear el bot
const main = async () => {
    const adapterFlow = createFlow(await loadFlows())
    const adapterProvider = createProvider(cancionitoProvider);
    const adapterDB = new cancionitoDB();

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    httpServer(3000);
};

main();
