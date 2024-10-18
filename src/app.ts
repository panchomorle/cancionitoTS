import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { MemoryDB as Database } from '@builderbot/bot';
import axios from 'axios';

const getSongs = async () => {
    try {
        const response = await axios.get('https://cancionito-net.onrender.com/api/songs');
        return response.data;
    } catch (error) {
        console.error('Error al obtener canciones:', error);
        return [];
    }
};

const getSongImages = async (id) => {
    try {
        const response = await axios.get(`https://cancionito-net.onrender.com/api/songs/${id}/images`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        return [];
    }
};

// Flujo para canción aleatoria
const flowRandom = addKeyword<Provider, Database>(['random', 'aleatoria', 'canción aleatoria'])
    .addAnswer('Voy a elegir una canción aleatoria para ti...', null, async (ctx, { flowDynamic, provider }) => {
        const randomSongs = await getSongs();
        const randomSong = randomSongs[Math.floor(Math.random() * randomSongs.length)];
        const images = await getSongImages(randomSong.id);

        await flowDynamic([{ body: `¡Aquí tienes una canción aleatoria! 🎶\nTítulo: ${randomSong.title}`}]);

        if (images.length > 0) {
            for (const image of images) {
                await provider.sendMedia(ctx.from + '@s.whatsapp.net', image.url, "");
            }
        } else {
            await flowDynamic([{ body: "Lo siento, no encontré imágenes para esta canción." }]);
        }
    })
    .addAnswer('¿Quieres otra canción aleatoria? Escribe "otra" para repetir, o elige otra opción.', { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const userMessage = ctx.body.trim().toLowerCase();
        if (userMessage === 'otra') {
            return gotoFlow(flowRandom); // Repite el flujo de canción aleatoria
        }
        if (userMessage === 'buscar') {
            return gotoFlow(flowBuscar); // Redirige al flujo de búsqueda
        }
        if (userMessage === 'sugerencias') {
            return gotoFlow(flowSugerencias); // Redirige al flujo de sugerencias
        }
        await flowDynamic([{ body: "Lo siento, no entendí eso. Por favor, elige otra opción." }]);
    });

// Otros flujos de ejemplo
const flowBuscar = addKeyword<Provider, Database>(['buscar']).addAnswer('Este es el flujo de búsqueda...');
const flowSugerencias = addKeyword<Provider, Database>(['sugerencias']).addAnswer('Aquí tienes sugerencias...');

// Flujo de saludo principal
const flowSaludo = addKeyword<Provider, Database>(['hola', 'hi', 'hello'])
    .addAnswer('¡Hola! Soy CancioNito, tu bot musical.')
    .addAnswer('Puedes escribir "random" para una canción aleatoria, "buscar" para buscar canciones, o "sugerencias" para recibir recomendaciones.', { capture: true }, async (ctx, { gotoFlow }) => {
        const message = ctx.body.toLowerCase();
        if (message === 'random') return gotoFlow(flowRandom);
        if (message === 'buscar') return gotoFlow(flowBuscar);
        if (message === 'sugerencias') return gotoFlow(flowSugerencias);
    });

// Crear el bot
const main = async () => {
    const adapterFlow = createFlow([flowSaludo, flowRandom, flowBuscar, flowSugerencias]);
    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database();

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    httpServer(3000);
};

main();
