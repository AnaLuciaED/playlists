const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyClient {
  constructor(accessToken) {
    this.spotifyApi = new SpotifyWebApi({
      accessToken: accessToken
    });
  }
  // Función auxiliar para selección aleatoria de géneros
  selectRandomGenres(genres, count) {
    if (!genres || genres.length === 0) return [];
    if (genres.length <= count) return genres;
    
    // Mezclar usando Fisher-Yates
    const shuffled = [...genres];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  async searchTracks(preferences) {
    const { energiaRelajado, descansoConcentracion, conSinLetra, nuevosClasicos, generoMezcla } = preferences;
    
    // 1. Definir todos los géneros posibles
    const energyGenre = energiaRelajado === 'energia' ? 'rock' : 'jazz';
    const focusGenre = descansoConcentracion === 'descanso' ? 'chill' : 'classical';
    const userGenres = generoMezcla ? generoMezcla.split(',').map(g => g.trim()).filter(g => g) : [];
    
    // 2. Combinar y seleccionar 3 aleatoriamente
    const allGenres = [...userGenres, energyGenre, focusGenre];
    const uniqueGenres = [...new Set(allGenres)]; // Eliminar duplicados
    const selectedGenres = this.selectRandomGenres(uniqueGenres, 3);
    
    // 3. Parámetros de búsqueda
    const yearRange = nuevosClasicos === 'nuevos' ? '2000-2025' : '1950-1999';
    const instrumentalness = conSinLetra === 'sin' ? 0.5 : 0;
    
    // 4. Construir query
    let query = `genre:${selectedGenres.join(',')} year:${yearRange}`;
    if (instrumentalness > 0) query += ` instrumentalness:>${instrumentalness}`;
    
    console.log('Query generada:', query);
    
    try {
      // 5. Ejecutar búsqueda
      const results = await this.spotifyApi.searchTracks(query, { limit: 50 });
      
      // 6. Si no hay resultados, intentar con menos filtros
      if (results.body.tracks.items.length === 0) {
        console.log('No hay resultados, intentando con menos filtros...');
        const fallbackQuery = `genre:${selectedGenres.join(',')}`;
        const fallbackResults = await this.spotifyApi.searchTracks(fallbackQuery, { limit: 50 });
        return fallbackResults.body.tracks.items.slice(0, 20);
      }
      
      return results.body.tracks.items.slice(0, 20);
    } catch (err) {
      console.error('Error en búsqueda:', {
        query,
        error: err.message
      });
      throw new Error(`Error al buscar canciones: ${err.message}`);
    }
  }

async createPlaylist(userId, name, preferences) {
  try {
    // 1. Buscar tracks primero (esto generará el log de la query)
    const tracks = await this.searchTracks(preferences);
    
    if (!tracks || tracks.length === 0) {
      throw new Error("No se encontraron canciones para crear la playlist");
    }

    // 2. Generar nombre descriptivo
    const { energiaRelajado, descansoConcentracion, conSinLetra, nuevosClasicos, generoMezcla } = preferences;
    
    const energyLabel = energiaRelajado === 'energia' ? 'Energía' : 'Relajado';
    const focusLabel = descansoConcentracion === 'descanso' ? 'Descanso' : 'Concentración';
    const lyricsLabel = conSinLetra === 'sin' ? 'Instrumental' : 'Con Letra';
    const eraLabel = nuevosClasicos === 'nuevos' ? 'Nuevos' : 'Clásicos';
    const genreLabel = generoMezcla ? generoMezcla.split(',')[0] : 'Mix';
    
    const playlistName = `${name} | ${genreLabel} | ${energyLabel} | ${focusLabel} | ${lyricsLabel} | ${eraLabel}`;

    // 3. Crear playlist con nombre descriptivo
    const playlist = await this.spotifyApi.createPlaylist(userId, {
      name: playlistName,
      description: `Playlist generada automáticamente con: ${energyLabel}, ${focusLabel}, ${lyricsLabel}, ${eraLabel}. Género: ${genreLabel}`
    });

    // 4. Añadir tracks
    const trackUris = tracks.map(track => track.uri).filter(uri => uri);
    await this.spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);
    
    console.log(`Playlist creada exitosamente: ${playlistName}`);
    return {
      ...playlist.body,
      generatedName: playlistName // Para referencia
    };
    
  } catch (error) {
    console.error("Error al crear playlist:", {
      error: error.message,
      preferences
    });
    throw error;
  }
}

  async getUserProfile() {
    try {
      const profile = await this.spotifyApi.getMe();
      return profile.body;
    } catch (err) {
      console.error('Error getting user profile:', err);
      throw err;
    }
  }
}

module.exports = SpotifyClient;