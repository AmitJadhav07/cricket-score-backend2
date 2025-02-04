const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Serve static files from "public" directory (for frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Allow cross-origin requests with credentials (for authentication)
app.use(cors({
  origin: "https://cricket-score-backend2-api.onrender.com",
  credentials: true
}));

// ✅ Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configure session middleware (secure in production)
app.use(session({
  secret: 'mysecret', // 🔹 Change this to a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' } // secure: false for HTTP (true for HTTPS)
}));

// Dummy user (use a database in production)
const dummyUser = {
  username: "admin",
  password: "password"
};

// ✅ Authentication Middleware (Protects Routes)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// ✅ AUTH ROUTES

// 🔹 Login Route (POST /login)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === dummyUser.username && password === dummyUser.password) {
    req.session.user = { username };
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// 🔹 Logout Route (POST /logout)
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
});

// 🔹 Check Authentication Status (GET /check-auth)
app.get('/check-auth', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ isAuthenticated: true, username: req.session.user.username });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// ✅ PUBLIC ENDPOINTS

// 🔹 Fetch Live Scores (GET /live-scores)
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

// ✅ PROTECTED ENDPOINTS (Require Login)

// 🔹 Fetch & Save Commentary (GET /fetch-commentary)
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

// 🔹 Load Saved Commentary (GET /saved-commentary)
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

// ✅ Serve Frontend (For SPA Support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
