import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { flowMenu } from './flowMenu';
import { getSongs,  getSongImages } from '~/services';
// Flujo para canción aleatoria
export const flowRandom = addKeyword<Provider, Database>(['random', 'aleatoria', 'canción aleatoria', 'otra'])
    .addAction(async (ctx, { flowDynamic, provider, gotoFlow }) => {
        await flowDynamic([{ body: "Bancáme un cachito que busco..." }]);
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
            //si la canción no contiene imagenes
            if (images.length > 0) {
                for (const image of images) {
                    await provider.sendImage(ctx.from + '@s.whatsapp.net', image.url, "");
                }
            } else {
                await flowDynamic([{ body: "Lo siento, no encontré imágenes para esta canción." }]);
            }
        } catch (error) {
            console.error('Error: ', error);
            await flowDynamic([{ body: "No se pudieron obtener las canciones :(\nSi el error persiste, contacta a mis desarrolladores vía instagram: @cancionito" }]);
        }
        return gotoFlow(flowPostRandom);
    })

const flowPostRandom = addKeyword<Provider, Database>("random")
.addAnswer('¿Quieres otra canción aleatoria? Escribe "otra" para repetir o "menu" para ir al menú.', null, null, [flowRandom, await import('./flowMenu').then(mod => mod.flowMenu)]);