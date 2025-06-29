const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const app = express();

dotenv.config();

// Middleware to parse JSON
app.use(express.json());

// SportsDB API Proxy
app.get('/api/sportsdb/:endpoint', async (req, res) => {
  try {
    const response = await axios.get(`https://www.thesportsdb.com/api/v1/json/${process.env.SPORTS_DB_API_KEY}/${req.params.endpoint}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SportMonks API Proxy
app.get('/api/sportmonks/:endpoint', async (req, res) => {
  try {
    const response = await axios.get(`https://api.sportmonks.com/v3/football/${req.params.endpoint}`, {
      headers: { Authorization: `Bearer ${process.env.SPORTMONKS_API_TOKEN}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scorebat API Proxy
app.get('/api/scorebat/:endpoint', async (req, res) => {
  try {
    const response = await axios.get(`https://www.scorebat.com/${req.params.endpoint}?token=${process.env.SCOREBAT_API_TOKEN}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI API Proxy
app.post('/api/openai/chat', async (req, res) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));