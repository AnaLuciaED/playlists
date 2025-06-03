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
  console.log(req.body.accessToken)
  try {
    const accessToken = "BQCrTCQST611CeqL2vPJ_de0lLmDJ69F004ntxYjHadLIyNmw3kASs1cknaS7GCkQeUDmSz2Y5QAaXBFp8OB1c-k2ozImf6AWiPFx8qft1C9Dner0wy5PfYgnrDpEet-ReICKcDwy1OeHrHRWUDdG9pFnIxjfXw1Iw6B8yYpKunZ9m1FAs_b-STSk5_Av3ATbtjtfOi829oKU42BgJRpt6Ysp5X5X3sDqmGSqhvQ3N9EyYwxE5-0dKQ1caTLDL1aN0Y_5iSvCEk8aahQALtYy26neEPG_kFiiNaQtJuBoZBy"
    const {preferences } = req.body;
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
})