import axios from 'axios';

export const getSongs = async () => {
    try {
        const response = await axios.get('https://cancionito-net.onrender.com/api/songs');
        return response.data;
    } catch (error) {
        console.error('Error al obtener canciones:', error);
        return [];
    }
};
export const getSongImages = async (id) => {
    try {
        const response = await axios.get(`https://cancionito-net.onrender.com/api/songs/${id}/images`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        return [];
    }
};

// Función para sugerir 3 canciones aleatorias
export const suggestSongs = async () => {
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

export const normalizeText = (text) => {
    return text
        .toLowerCase() // Convertir a minúsculas
        .normalize('NFD') // Descomponer caracteres con tildes
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
        .replace(/[^a-z0-9\s]/g, "") // Eliminar caracteres especiales
        .trim(); // Quitar espacios al inicio y al final
};

export const calculateDistance = (a, b) => {
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