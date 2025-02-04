const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path'); // Import path module
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow cross-origin requests and send cookies (for sessions)
app.use(cors({
  origin: "https://cricket-score-backend2-api.onrender.com", // Change this to your frontend URL if different
  credentials: true
}));

// Middleware to parse JSON bodies and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Configure session middleware (in production, use a secure secret and HTTPS)
app.use(session({
  secret: 'mysecret', // Change this to a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, sameSite: 'none' } // Ensure SameSite=None for cross-origin cookies
}));

// Dummy user (in production, use a database and hashed passwords)
const dummyUser = {
  username: "admin",
  password: "password"
};

// Authentication middleware to protect endpoints
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// --- AUTHENTICATION ROUTES ---
// Login route: POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === dummyUser.username && password === dummyUser.password) {
    req.session.user = { username };
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Logout route: POST /logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
    } else {
      res.json({ message: "Logout successful" });
    }
  });
});

// --- PUBLIC ENDPOINTS ---
// Endpoint to fetch live scores (public)
app.get('/live-scores', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores');
    const $ = cheerio.load(data);
    const liveScoresElements = $('div.cb-scr-wll-chvrn.cb-lv-scrs-col');
    let liveScores = [];
    liveScoresElements.each((i, element) => {
      liveScores.push($(element).text().trim());
    });
    res.json({ liveScores });
  } catch (error) {
    console.error('Error fetching live scores:', error.message);
    res.status(500).json({ error: 'Failed to fetch live scores.' });
  }
});

// --- PROTECTED ENDPOINTS (Require Authentication) ---
// Endpoint to fetch and save commentary from the given JSON API
app.get('/fetch-commentary', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get('https://www.cricbuzz.com/api/cricket-match/109733/full-commentary/1');
    const commentaryData = response.data;
    fs.writeFileSync('commentary.json', JSON.stringify(commentaryData, null, 2));
    res.json({ message: 'Commentary fetched and saved successfully.', commentary: commentaryData });
  } catch (error) {
    console.error('Error fetching commentary:', error.message);
    res.status(500).json({ error: 'Failed to fetch commentary.' });
  }
});

// Endpoint to retrieve saved commentary
app.get('/saved-commentary', isAuthenticated, (req, res) => {
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

// Serve index.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
