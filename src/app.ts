import { createBot, createProvider, createFlow, addKeyword, addAnswer } from '@builderbot/bot';
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

// Función para sugerir 3 canciones aleatorias
const suggestSongs = async () => {
    const songs = await getSongs();
    const suggestions = [];
    
    if (songs.length === 0) {
        return ['No hay canciones disponibles en este momento.'];
    }

    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        suggestions.push(songs[randomIndex].title); // Aquí accedemos directamente al título
    }
    
    return suggestions;
};

const normalizeText = (text) => {
    return text
        .toLowerCase() // Convertir a minúsculas
        .normalize('NFD') // Descomponer caracteres con tildes
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
        .replace(/[^a-z0-9\s]/g, "") // Eliminar caracteres especiales
        .trim(); // Quitar espacios al inicio y al final
};

const calculateDistance = (a, b) => {
    const matrix = []; // defino matriz para ejecutar el algoritmo de Levenshtein

    // Incrementa por una línea en la fila cero
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Incrementa por una línea en la columna cero
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Completar la matriz
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Sustitución
                    matrix[i][j - 1] + 1,     // Inserción
                    matrix[i - 1][j] + 1      // Eliminación
                );
            }
        }
    }
    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return ((maxLength - distance) / maxLength) * 100;
}

//////////////---------FLUJOS---------//////////////

// Flujo para salir
const flowSalir = addKeyword<Provider, Database>(['salir', 'chau', 'adios', 'adiós', 'hasta pronto', 'hasta luego']).
addAnswer('¡Hasta luego! 👋');

const flowMenu = addKeyword<Provider, Database>(["menu", "no", "menú"])
.addAnswer(['🎙️🔸🔸🔸➡️MENÚ⬅️🔸🔸🔸🎙️',
    "👉Pedir una canción (escribe 'buscar')" +
    "\n 👉Sugerencias de canciones (escribe 'sugerencias')" +
    "\n 👉Canción aleatoria (escribe 'random')" +
    "\n ❌Terminar conversación (escribe 'salir')"],
    { capture: true }, async (ctx, { gotoFlow }) => {
        const message = ctx.body.toLowerCase();
        if (message === 'random') return gotoFlow(flowRandom);
        if (message === 'buscar') return gotoFlow(flowBuscar);
        if (message === 'sugerencias') return gotoFlow(flowSugerencias);
        if (message === 'salir') return gotoFlow(flowSalir);
    });

// Flujo para canción aleatoria
const flowRandom = addKeyword<Provider, Database>(['random', 'aleatoria', 'canción aleatoria', 'otra'])
    .addAction(async (ctx, { flowDynamic, provider, gotoFlow }) => {
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
        return gotoFlow(flowPostRandom);
    })

const flowPostRandom = addKeyword<Provider, Database>("random")
.addAnswer('¿Quieres otra canción aleatoria? Escribe "otra" para repetir o "menu" para ir al menú.', null, null, [flowRandom, flowMenu]);

// Flujo para buscar una canción

const flowBuscar = addKeyword<Provider, Database>(["buscar", "si"])
.addAnswer('Escribe el nombre de la canción que quieres buscar:', { capture: true }, async (ctx, { flowDynamic, gotoFlow, provider }) => {
    const userMessage = normalizeText(ctx.body);
    const songs = await getSongs();
    const matchingSong = songs.find(song => song.title.includes(userMessage));

    if (matchingSong) {
        const images = await getSongImages(matchingSong.id);
        await flowDynamic([{ body: `¡Encontré la canción que buscas! 🎶\nTítulo: ${matchingSong.title}` }]);

        if (images.length > 0) {
            for (const image of images) {
                await provider.sendMedia(ctx.from + '@s.whatsapp.net', image.url, "");
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
        if (matches.length > 0) {
            const matchText = matches.map(song => song.title).join('\n- ');
            await flowDynamic([{ body: `No encontré la canción exacta, pero tal vez quisiste decir:\n- ${matchText}` }]);
        }
        else{
            await flowDynamic([{ body: "Lo siento, no encontré ninguna canción con ese título." }]);
        }
    }
    return gotoFlow(flowPostBuscar); // Redirige de vuelta a este flujo para buscar otra canción
});

const flowPostBuscar = addKeyword<Provider, Database>(['buscar'])
.addAnswer('¿Quieres seguir buscando? Escribe "si" para buscar otra, o "no" para volver al menú.', null, null, [flowBuscar, flowMenu]);

// Flujo para sugerencias
const flowSugerencias = addKeyword<Provider, Database>(['sugerencias', 'recomendaciones', 'sugerir', 'sugerencia', 'mas', 'más'])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const suggestions = await suggestSongs();

        const suggestionText = suggestions.map((song, index) => `${index + 1}. ${song}`).join('\n'); // `song` ya es el título
        await flowDynamic([{ body: `Aquí tienes algunas sugerencias:\n${suggestionText}` }]);

        return gotoFlow(flowPostSugerencias);
    });

const flowPostSugerencias = addKeyword<Provider, Database>("sugerencias")
.addAnswer('Escribe "más" para ver más sugerencias, o "menu" para volver al menú.', null, null, [flowSugerencias, flowMenu]);


// Flujo de saludo principal
const flowSaludo = addKeyword<Provider, Database>(['hola', 'hi', 'hello', 'hey', 'buenas', 'que onda', 'que tal', 'saludos', 'como estás'])
    .addAnswer("¡Hola! Soy *CancioNito* 🎵, ¿qué te gustaría hacer?")
    .addAnswer("👉Pedir una canción (escribe 'buscar')" +
        "\n 👉Sugerencias de canciones (escribe 'sugerencias')" +
        "\n 👉Canción aleatoria (escribe 'random')" +
        "\n ❌Terminar conversación (escribe 'salir')",
        null,
        null, [flowRandom, flowBuscar, flowSugerencias, flowSalir]);

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
