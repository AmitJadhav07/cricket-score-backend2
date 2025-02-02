// Import required libraries
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cors = require('cors');

// Initialize the Express app and set the port
const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// Helper function: Saves commentary data to a local file
const saveCommentary = (commentary) => {
  fs.writeFileSync('commentary.json', JSON.stringify(commentary, null, 2));
};

// -----------------------------------------------------
// Endpoint 1: Fetch Live Scores from CricBuzz
// -----------------------------------------------------
app.get('/live-scores', async (req, res) => {
  try {
    // Request the live scores page
    const { data } = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores');
    
    // Load the HTML into Cheerio
    const $ = cheerio.load(data);
    
    // Using a CSS selector equivalent to the provided XPath:
    // XPath: //div[@class='cb-scr-wll-chvrn cb-lv-scrs-col ']
    // CSS Selector: div.cb-scr-wll-chvrn.cb-lv-scrs-col
    const liveScoresElements = $('div.cb-scr-wll-chvrn.cb-lv-scrs-col');
    
    // Gather text from each matching element
    let liveScores = [];
    liveScoresElements.each((i, element) => {
      liveScores.push($(element).text().trim());
    });
    
    // Return the live scores as JSON
    res.json({ liveScores });
  } catch (error) {
    console.error('Error fetching live scores:', error.message);
    res.status(500).json({ error: 'Failed to fetch live scores.' });
  }
});

// -----------------------------------------------------
// Endpoint 2: Fetch and Save Full Commentary from API
// -----------------------------------------------------
app.get('/fetch-commentary', async (req, res) => {
  try {
    // Request the JSON commentary data from CricBuzz
    const response = await axios.get('https://www.cricbuzz.com/api/cricket-match/109733/full-commentary/1');
    const commentaryData = response.data;
    
    // Save the commentary data locally for future access
    saveCommentary(commentaryData);
    
    res.json({ message: 'Commentary fetched and saved successfully.', commentary: commentaryData });
  } catch (error) {
    console.error('Error fetching commentary:', error.message);
    res.status(500).json({ error: 'Failed to fetch commentary.' });
  }
});

// -----------------------------------------------------
// Endpoint 3: Retrieve Saved Commentary
// -----------------------------------------------------
app.get('/saved-commentary', (req, res) => {
  try {
    if (fs.existsSync('commentary.json')) {
      const commentaryData = JSON.parse(fs.readFileSync('commentary.json', 'utf-8'));
      res.json({ commentary: commentaryData });
    } else {
      res.json({ commentary: null });
    }
  } catch (error) {
    console.error('Error retrieving saved commentary:', error.message);
    res.status(500).json({ error: 'Failed to retrieve saved commentary.' });
  }
});

// Start the server and listen on PORT 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
