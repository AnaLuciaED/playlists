const express = require('express');
const path = require('path');
const fs = require('fs');
const { createPlaylist } = require('./src/spotify');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Nueva ruta API para crear playlist
const SpotifyClient = require('./src/spotify');

app.post('/api/create-playlist', async (req, res) => {
  try {
    const { accessToken, preferences } = req.body;
    const spotifyClient = new SpotifyClient(accessToken); // Crear instancia
    
    // Obtener el ID del usuario
    const user = await spotifyClient.getUserProfile();
    
    console.log(preferences)
    // Crear playlist
    const playlist = await spotifyClient.createPlaylist(
      user.id,
      'Mi Playlist Personalizada',
      preferences
    );
    
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ruta para obtener preferencias por defecto
app.get('/api/default-preferences', (req, res) => {
  try {
    const preferences = JSON.parse(fs.readFileSync('./config/preferences.json'));
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Error loading preferences' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});