const backendURL = 'https://cricket-score-backend2-api.onrender.com'; // Update if needed

// DOM elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');

const liveScoresList = document.getElementById('live-scores');
const autoFetchToggle = document.getElementById('auto-fetch-toggle');

const fetchCommentaryBtn = document.getElementById('fetch-commentary-btn');
const loadCommentaryBtn = document.getElementById('load-commentary-btn');
const commentaryPre = document.getElementById('commentary');
const commentarySection = document.getElementById('commentary-section');

let liveScoreInterval = null;

/**
 * Updates the UI based on login status.
 */
function updateAuthUI(isLoggedIn, username = '') {
  if (isLoggedIn) {
    authMessage.textContent = `Logged in as ${username}`;
    loginForm.style.display = 'none';
    logoutBtn.style.display = 'block';
    commentarySection.style.display = 'block';
  } else {
    authMessage.textContent = '';
    loginForm.style.display = 'block';
    logoutBtn.style.display = 'none';
    commentarySection.style.display = 'none';
  }
}

// Check session on page load
async function checkSession() {
  try {
    const res = await fetch(`${backendURL}/check-auth`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.isAuthenticated) {
      updateAuthUI(true, data.username);
    } else {
      updateAuthUI(false);
    }
  } catch (err) {
    console.error('Error checking session:', err);
    updateAuthUI(false);
  }
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const res = await fetch(`${backendURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Ensure cookies are sent
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      updateAuthUI(true, username);
      alert('Login successful');
    } else {
      alert(`Login failed: ${data.error}`);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login failed. Please try again.');
  }
});

// Logout button handler
logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${backendURL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();

    if (res.ok) {
      updateAuthUI(false);
      alert('Logout successful');
    } else {
      alert(`Logout failed: ${data.error}`);
    }
  } catch (err) {
    console.error('Logout error:', err);
    alert('Logout failed. Please try again.');
  }
});

// Fetch live scores and update the list
async function fetchLiveScores() {
  try {
    const res = await fetch(`${backendURL}/live-scores`);
    const data = await res.json();

    liveScoresList.innerHTML = '';
    data.liveScores.forEach(score => {
      const li = document.createElement('li');
      li.textContent = score;
      liveScoresList.appendChild(li);
    });
  } catch (err) {
    console.error('Error fetching live scores:', err);
  }
}

// Auto-fetch toggle for live scores
autoFetchToggle.addEventListener('change', () => {
  if (autoFetchToggle.checked) {
    liveScoreInterval = setInterval(fetchLiveScores, 1000);
  } else {
    clearInterval(liveScoreInterval);
    liveScoreInterval = null;
  }
});

// Fetch & Save Commentary (Authenticated)
fetchCommentaryBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${backendURL}/fetch-commentary`, { credentials: 'include' });
    const data = await res.json();

    if (res.ok) {
      alert('Commentary fetched and saved successfully.');
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error('Error fetching commentary:', err);
    alert('Error fetching commentary.');
  }
});

// Load Saved Commentary (Authenticated)
loadCommentaryBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${backendURL}/saved-commentary`, { credentials: 'include' });
    const data = await res.json();

    if (res.ok && data.commentary) {
      commentaryPre.textContent = JSON.stringify(data.commentary, null, 2);
    } else {
      commentaryPre.textContent = 'No commentary available.';
    }
  } catch (err) {
    console.error('Error loading commentary:', err);
    commentaryPre.textContent = 'Error loading commentary.';
  }
});

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSession(); // Check if user is logged in
  fetchLiveScores(); // Fetch scores once on load
});
