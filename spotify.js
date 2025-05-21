const SpotifyWebApi = require('spotify-web-api-node');

// Nueva versión que no almacena credenciales globalmente
class SpotifyClient {
  constructor(accessToken) {
    this.spotifyApi = new SpotifyWebApi({
      accessToken: accessToken
    });
  }

  async searchTracks(preferences) {
    const { energiaRelajado, descansoConcentracion, conSinLetra, nuevosClasicos, generoMezcla } = preferences;
    
    // Mapear preferencias (igual que antes)
    const targetEnergy = energiaRelajado;
    const targetValence = descansoConcentracion;
    const instrumentalness = conSinLetra === 'sin' ? 0.7 : 0;
    const year = nuevosClasicos === 'nuevos' ? '2001-2023' : '1980-2000';
    const genres = generoMezcla.split(',').slice(0, 2);
    
    try {
      const query = `genre:${genres.join(',')} year:${year}`;
      const results = await this.spotifyApi.searchTracks(query, { limit: 50 });
      
      // Filtrar y ordenar resultados basados en preferencias
      const tracks = results.body.tracks.items
        .sort((a, b) => {
          // Lógica de ordenamiento personalizada
          return 0;
        })
        .slice(0, 20);
      
      return tracks;
    } catch (err) {
      console.error('Error searching tracks:', err);
      throw err;
    }
    if (tracks.length === 0) {
      throw new Error("No se encontraron canciones con esos criterios");
    }
  
    console.log("Tracks encontrados:", tracks.map(t => `${t.name} - ${t.uri}`));
    return tracks;
  }

  async createPlaylist(userId, name, preferences) {
    try {
      // 1. Buscar tracks primero
      const tracks = await this.searchTracks(preferences);
      
      if (!tracks || tracks.length === 0) {
        throw new Error("No tracks found to add to playlist");
      }
  
      // 2. Crear playlist vacía
      const playlist = await this.spotifyApi.createPlaylist(userId, {
        name: name,
        description: "Playlist generada automáticamente"
      });
  
      // 3. Preparar URIs (asegúrate que sean URIs válidos)
      const trackUris = tracks.map(track => {
        if (!track.uri) {
          console.warn("Track sin URI:", track);
          return null;
        }
        return track.uri;
      }).filter(uri => uri !== null);
  
      if (trackUris.length === 0) {
        throw new Error("No hay URIs válidos para añadir");
      }
  
      // 4. Añadir tracks a la playlist
      await this.spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);
      
      return playlist.body;
    } catch (error) {
      console.error("Error en createPlaylist:", error);
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