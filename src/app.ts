import { createBot, createProvider, createFlow, addKeyword, addAnswer } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { MemoryDB as Database } from '@builderbot/bot';
import { MENU_TEXT, INFO_TEXT, WAITING_TEXT } from './constants';
import { getSongs, getSongImages, suggestSongs, calculateDistance, normalizeText } from './services';

//////////////---------FLUJOS---------//////////////

// Flujo para salir
const flowSalir = addKeyword<Provider, Database>(['salir', 'chau', 'adios', 'adiós', 'hasta pronto', 'hasta luego']).
addAnswer('¡Hasta luego! 👋');

const flowMenu = addKeyword<Provider, Database>(["menu", "no", "menú"])
.addAnswer(['🎙️🔸🔸🔸➡️MENÚ⬅️🔸🔸🔸🎙️', MENU_TEXT],
    { capture: true }, async (ctx, { gotoFlow }) => {
        const message = ctx.body.toLowerCase();
        if (message === 'random') return gotoFlow(flowRandom);
        if (message === 'buscar') return gotoFlow(flowBuscar);
        if (message === 'sugerencias') return gotoFlow(flowSugerencias);
        if (message === 'salir') return gotoFlow(flowSalir);
        if (message === 'info') return gotoFlow(flowInfo);
    });

//Flujo informativo
const flowInfo = addKeyword<Provider, Database>('info')
.addAnswer(INFO_TEXT, null, (ctx, { gotoFlow }) =>{ return gotoFlow(flowPostInfo)} );
const flowPostInfo = addKeyword<Provider, Database>("info")
.addAnswer('Para volver al Menú escribe "menu".', null, null, [flowMenu, flowSalir]);

// Flujo para canción aleatoria
const flowRandom = addKeyword<Provider, Database>(['random', 'aleatoria', 'canción aleatoria', 'otra'])
    .addAction(async (ctx, { flowDynamic, provider, gotoFlow }) => {
        await flowDynamic([{ body: WAITING_TEXT }]);
        try {
            const randomSongs = await getSongs();
            //si el fetch de la lista de canciones falló (vino vacío)
            if (randomSongs.length === 0){
                throw new Error("Error al obtener canciones.");
            }
            //calculamos un indice random dentro de la lista
            const randomSong = randomSongs[Math.floor(Math.random() * randomSongs.length)];
            //comunico al usuario la canción elegida
            await flowDynamic([{ body: `¡Aquí tienes una canción aleatoria! 🎶\nTítulo: ${randomSong.title}`}]);

            //traemos las imágenes de la canción elegida
            const images = await getSongImages(randomSong.id);
            //si la canción contiene imagenes
            if (images.length > 0)
            {
                for (const image of images) {
                    await provider.sendImage(ctx.from + '@s.whatsapp.net', image.url, "");
                }
            }
            else //si no contiene imagenes
            {
                await flowDynamic([{ body: "Lo siento, no encontré imágenes para esta canción." }]);
            }
        } catch (error) {
            console.error('Error: ', error);
            await flowDynamic([{ body: "No se pudieron obtener las canciones :(\nSi el error persiste, contacta a mis desarrolladores vía instagram: @cancionito" }]);
        }
        return gotoFlow(flowPostRandom);
    })

const flowPostRandom = addKeyword<Provider, Database>("random")
.addAnswer('¿Quieres otra canción aleatoria? Escribe "otra" para repetir o "menu" para ir al menú.', null, null, [flowRandom, flowMenu]);

// Flujo para buscar una canción

const flowBuscar = addKeyword<Provider, Database>(["pedir", "buscar", "si"])
.addAnswer('Escribe el nombre de la canción que quieres buscar:', { capture: true }, async (ctx, { flowDynamic, gotoFlow, provider }) => {
    await flowDynamic([{ body: WAITING_TEXT }]);
    const userMessage = normalizeText(ctx.body);
    
    try{
        const songs = await getSongs();
        if (songs.length === 0){
            throw new Error("Error en el fetch de canciones");
        }
        const matchingSong = songs.find(song => song.title.includes(userMessage));

        if (matchingSong) {
            const images = await getSongImages(matchingSong.id);
            await flowDynamic([{ body: `¡Encontré la canción que buscas! 🎶\nTítulo: ${matchingSong.title}` }]);

            if (images.length > 0) {
                try {
                    for (const image of images) {
                        await provider.sendImage(ctx.from + '@s.whatsapp.net', image.url, "");
                    }
                } catch (error) {
                    console.error('Error: ', error);
                    await flowDynamic([{ body: "Hubo un error al envíarte las imágenes :(\nSi el error persiste, contacta a mis desarrolladores vía instagram: @cancionito" }]);
                }
            } else {
                await flowDynamic([{ body: "Lo siento, no encontré imágenes para esta canción." }]);
            }
        }
        else{
            // Calcular coincidencia para cada canción y filtrar las que superen el umbral (50%)
            const matches = songs.filter(song => {
                const matchPercentage = calculateDistance(userMessage, song.title);
                return matchPercentage >= 70;
            });
            
            //se encontró 1 solo match probable, se mandan sus imagenes
            if (matches.length === 1) {
                const images = await getSongImages(matches[0].id);
                await flowDynamic([{ body: `¡Encontré la canción que buscas! 🎶\nTítulo: ${matches[0].title}` }]);

                if (images.length > 0) {
                    try {
                        for (const image of images) {
                            await provider.sendImage(ctx.from + '@s.whatsapp.net', image.url, "");
                        }
                    } catch (error) {
                        console.error('Error: ', error);
                        await flowDynamic([{ body: "Hubo un error al envíarte las imágenes :(\nSi el error persiste, contacta a mis desarrolladores vía mail: badrithm@hotmail.com" }]);
                    }
                } else {
                    await flowDynamic([{ body: "Lo siento, no encontré imágenes para esta canción." }]);
                }
            }
            //se encontró más de un match probable, se listan los matches
            else if (matches.length > 1) {
                const matchText = matches.map(song => song.title).join('\n- ');
                await flowDynamic([{ body: `No encontré la canción exacta, pero tal vez quisiste decir:\n- ${matchText}` }]);
            }
            //no se encontraron matches.
            else{
                await flowDynamic([{ body: "Lo siento, no encontré ninguna canción con ese título." }]);
            }
        }
    }
    catch(error){
        console.error(error);
        await flowDynamic([{ body: "Tuve un error interno, porfa volvé a intentar :c" }]);
    }
    return gotoFlow(flowPostBuscar); // Redirige de vuelta a este flujo para buscar otra canción
});

const flowPostBuscar = addKeyword<Provider, Database>(['buscar'])
.addAnswer('¿Quieres seguir buscando? Escribe "si" para buscar otra, o "no" para volver al menú.', null, null, [flowBuscar, flowMenu]);

// Flujo para sugerencias
const flowSugerencias = addKeyword<Provider, Database>(['sugerencias', 'recomendaciones', 'sugerir', 'sugerencia', 'mas', 'más'])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        await flowDynamic([{ body: WAITING_TEXT }]);
        const suggestions = await suggestSongs();

        const suggestionText = suggestions.map((song, index) => `${index + 1}. ${song}`).join('\n'); // `song` ya es el título
        await flowDynamic([{ body: `Aquí tienes algunas sugerencias:\n${suggestionText}` }]);

        return gotoFlow(flowPostSugerencias);
    });

const flowPostSugerencias = addKeyword<Provider, Database>("sugerencias")
.addAnswer('Escribe *"más"* para ver más sugerencias, *"buscar"* para comenzar a buscar imágenes o *"menu"* para volver al menú.', null, null, [flowSugerencias, flowMenu, flowBuscar]);


// Flujo de saludo principal
const flowSaludo = addKeyword<Provider, Database>(['hola', 'hi', 'hello', 'hey', 'buenas', 'que onda', 'que tal', 'saludos', 'como estás', 'cómo andás', 'como andas', 'cómo andas', 'como andás'])
    .addAnswer("¡Hola! Soy *CancioNito* 🎵, ¿qué te gustaría hacer?")
    .addAnswer(MENU_TEXT,
        null,
        null, [flowRandom, flowBuscar, flowSugerencias, flowSalir, flowInfo]);

// Crear el bot
const main = async () => {
    const adapterFlow = createFlow([flowSaludo, flowRandom, flowBuscar, flowSugerencias, flowMenu]);
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
