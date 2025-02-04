/* script.js */

const backendURL = 'https://cricket-score-backend2-api.onrender.com'; // Update with your deployed backend URL if needed

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
 * For this demo, we use localStorage to store a simple flag.
 */
function updateAuthUI(isLoggedIn) {
  if (isLoggedIn) {
    authMessage.textContent = 'Logged in as ' + usernameInput.value;
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

// Login form submission handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const res = await fetch(`${backendURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('isLoggedIn', 'true');
      updateAuthUI(true);
      authMessage.textContent = data.message;
    } else {
      authMessage.textContent = data.error;
    }
  } catch (err) {
    console.error('Login error:', err);
    authMessage.textContent = 'Login failed. Please try again.';
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
      localStorage.removeItem('isLoggedIn');
      updateAuthUI(false);
      authMessage.textContent = data.message;
    } else {
      authMessage.textContent = data.error;
    }
  } catch (err) {
    console.error('Logout error:', err);
    authMessage.textContent = 'Logout failed. Please try again.';
  }
});

// Function to fetch live scores once and update the list
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

// Handle auto-fetch toggle change
autoFetchToggle.addEventListener('change', () => {
  if (autoFetchToggle.checked) {
    // Start interval to fetch live scores every second
    liveScoreInterval = setInterval(fetchLiveScores, 1000);
  } else {
    // Clear the interval so that live scores are no longer auto-fetched
    if (liveScoreInterval) {
      clearInterval(liveScoreInterval);
      liveScoreInterval = null;
    }
  }
});

// Initially, fetch live scores once on page load
fetchLiveScores();

// Handler for "Fetch & Save Commentary" button (protected route)
fetchCommentaryBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${backendURL}/fetch-commentary`, { credentials: 'include' });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error('Error fetching commentary:', err);
    alert('Error fetching commentary.');
  }
});

// Handler for "Load Saved Commentary" button (protected route)
loadCommentaryBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(`${backendURL}/saved-commentary`, { credentials: 'include' });
    const data = await res.json();
    commentaryPre.textContent = JSON.stringify(data.commentary, null, 2);
  } catch (err) {
    console.error('Error loading commentary:', err);
    commentaryPre.textContent = 'Error loading commentary.';
  }
});

// On page load, update the authentication UI based on localStorage flag
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  updateAuthUI(isLoggedIn);
});
