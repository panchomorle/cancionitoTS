import { Provider, Database } from '../app';
import {addKeyword} from '@builderbot/bot';
import { flowMenu } from './flowMenu';
import { normalizeText, getSongs, getSongImages, calculateDistance} from '~/services';
// Flujo para buscar una canción
export const flowBuscar = addKeyword<Provider, Database>(["buscar", "si"])
.addAnswer('Escribe el nombre de la canción que quieres buscar:', { capture: true }, async (ctx, { flowDynamic, gotoFlow, provider }) => {
    await flowDynamic([{ body: "Bancáme un cachito que busco..." }]);
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
            if (matches.length > 0) {
                const matchText = matches.map(song => song.title).join('\n- ');
                await flowDynamic([{ body: `No encontré la canción exacta, pero tal vez quisiste decir:\n- ${matchText}` }]);
            }
            else{
                await flowDynamic([{ body: "Lo siento, no encontré ninguna canción con ese título." }]);
            }
        }
    }
    catch(error){
        console.error(error);
        await flowDynamic([{ body: "Tuve un error interno, volvé a intentar :c" }]);
    }
    return gotoFlow(flowPostBuscar); // Redirige de vuelta a este flujo para buscar otra canción
});

const flowPostBuscar = addKeyword<Provider, Database>(['buscar'])
.addAnswer('¿Quieres seguir buscando? Escribe "si" para buscar otra, o "no" para volver al menú.', null, null, [flowBuscar, (await import('./flowMenu')).flowMenu]);