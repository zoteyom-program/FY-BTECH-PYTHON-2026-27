const firebaseConfig = {
// Store Firebase project credentials for Auth and Firestore
  apiKey: "AIzaSyD01PNHO98NB-4qvJD_CVgcC0WncSKO4uQ",
  // Public Firebase API key
  authDomain: "vivaprep82dfb.firebaseapp.com",
  // Domain used for Firebase login
  projectId: "vivaprep82dfb",
  // Unique Firebase project ID
  storageBucket: "vivaprep82dfb.firebasestorage.app",
  // Cloud storage bucket name
  messagingSenderId: "620155248072",
  // Sender ID for Firebase messaging
  appId: "1:620155248072:web:32a0c4e5cb07375089f4fd",
  // Registered web app ID
  measurementId: "G-22L62EY3ZY"
  // Google Analytics measurement ID
};
// End of Firebase configuration object

firebase.initializeApp(firebaseConfig);
// Start Firebase using the config above
const fbAuth = firebase.auth();
// Shortcut to Firebase Authentication service
const fbDb = firebase.firestore();
// Shortcut to Firebase Cloud Firestore database

let selectedPrep = "";
// Stores which preparation track the user clicked
let selectedSubjects = [];
// List of subjects currently selected by the user
let aiMode = "super";
// Current Prep AI mode ("super" or "god")
let authMode = "login";
// Current Auth page tab ("login" or "signup")
let quizState = { index: 0, score: 0, answered: false, questions: [] };
// Keeps track of current quiz question, score, and question list
let toastTimer = null;
// Timer ID used to auto-hide toast popups
let currentUser = null;
// Stores the logged-in user's profile from Firestore
let liveQuestionsList = [];
// Stores live CS trivia questions loaded from the backend

const PROGRESS_KEY = "vivaPrepProgressV2";
// Key name used to save local progress in browser localStorage

const ACHIEVEMENTS = [
// List of all 6 student achievement badges
  { id: "first-step", icon: "🚀", title: "First Step", text: "Complete your first preparation action." },
  // Badge 1: do any 1 study action
  { id: "explorer", icon: "🧭", title: "Explorer", text: "Explore 3 different workspace sections." },
  // Badge 2: visit 3 different tabs
  { id: "quiz-starter", icon: "🧠", title: "Quiz Starter", text: "Complete your first quiz." },
  // Badge 3: finish 1 practice quiz
  { id: "sharp-mind", icon: "🎯", title: "Sharp Mind", text: "Score 80% or higher in a quiz." },
  // Badge 4: score 80% or more on a quiz
  { id: "xp-100", icon: "💎", title: "100 XP", text: "Earn your first 100 XP." },
  // Badge 5: reach 100 total XP
  { id: "streak-3", icon: "🔥", title: "On Fire", text: "Maintain a 3-day preparation streak." }
  // Badge 6: study 3 days in a row
];
// End of achievements list

const pathConfig = {
// Details for the 3 B.Tech CSE preparation tracks shown on the home page
  "B.Tech CSE": { image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=85", icon: "💻", desc: "Conquer university curriculum for all Computer Science specializations." },
  // B.Tech CSE academic track details
  "Interview & Placement": { image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85", icon: "💼", desc: "Nail technical interviews, system design rounds, and aptitude tests." },
  // Placement prep track details
  "Hackathons & Projects": { image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=85", icon: "🚀", desc: "Build blockchain ledgers, optimize LLMs, and prep your pitch decks." }
  // Hackathon prep track details
};
// End of pathConfig object

const filterOptions = {
// Dropdown filter choices for each B.Tech CSE track
  "B.Tech CSE": ["All Specializations", "CSE Core", "CSE (AI & ML)", "CSE (Data Science)", "CSE (Cyber Security)", "CSE (Cloud Computing)"],
  // Filter choices for B.Tech CSE
  "Interview & Placement": ["All Topics", "Technical", "Aptitude", "HR"],
  // Filter choices for placements
  "Hackathons & Projects": ["All Domains", "Web3/Blockchain", "AI/ML", "General"]
  // Filter choices for hackathons
};
// End of filterOptions object

const masterSubjectDatabase = [
// Master list of all B.Tech CSE subjects and track topics
  { name: "Data Structures & Algorithms", icon: "🧩", tag: "CSE Core", paths: ["B.Tech CSE", "Interview & Placement"] },
  // Subject entry for DSA
  { name: "Database Management (DBMS)", icon: "🗄️", tag: "CSE Core", paths: ["B.Tech CSE", "Interview & Placement"] },
  // Subject entry for DBMS
  { name: "Operating Systems", icon: "💻", tag: "CSE Core", paths: ["B.Tech CSE"] },
  // Subject entry for OS
  { name: "Computer Networks", icon: "🌐", tag: "CSE Core", paths: ["B.Tech CSE"] },
  // Subject entry for Computer Networks
  { name: "Python Programming", icon: "🐍", tag: "CSE Core", paths: ["B.Tech CSE"] },
  // Subject entry for Python
  { name: "Machine Learning", icon: "🤖", tag: "CSE (AI & ML)", paths: ["B.Tech CSE"] },
  // Subject entry for Machine Learning
  { name: "Deep Learning", icon: "🧠", tag: "CSE (AI & ML)", paths: ["B.Tech CSE"] },
  // Subject entry for Deep Learning
  { name: "Data Science Fundamentals", icon: "📊", tag: "CSE (Data Science)", paths: ["B.Tech CSE"] },
  // Subject entry for Data Science
  { name: "Cryptography", icon: "🔐", tag: "CSE (Cyber Security)", paths: ["B.Tech CSE"] },
  // Subject entry for Cryptography
  { name: "Cloud Computing Architecture", icon: "☁️", tag: "CSE (Cloud Computing)", paths: ["B.Tech CSE"] },
  // Subject entry for Cloud Computing
  { name: "System Design", icon: "🏗️", tag: "Technical", paths: ["Interview & Placement"] },
  // Subject entry for System Design
  { name: "Advanced DSA", icon: "💻", tag: "Technical", paths: ["Interview & Placement"] },
  // Subject entry for Advanced DSA
  { name: "Quantitative Aptitude", icon: "📊", tag: "Aptitude", paths: ["Interview & Placement"] },
  // Subject entry for Aptitude
  { name: "Blockchain & Smart Contracts", icon: "⛓️", tag: "Web3/Blockchain", paths: ["Hackathons & Projects"] },
  // Subject entry for Blockchain
  { name: "LLM Prompt Engineering", icon: "🧠", tag: "AI/ML", paths: ["Hackathons & Projects"] },
  // Subject entry for Prompt Engineering
  { name: "SIH Pitching & Viva", icon: "🎤", tag: "General", paths: ["Hackathons & Projects"] }
  // Subject entry for SIH Pitching
];
// End of masterSubjectDatabase array

const contentData = {
// Study notes and sample viva questions for B.Tech CSE subjects
  "Data Structures & Algorithms": {
  // Notes for DSA
    overview: "Organizing data efficiently and designing fast algorithms using Big-O analysis.",
    // Short overview
    concepts: [["Arrays & Linked Lists", "Contiguous memory vs node-based dynamic lists."], ["Stacks & Queues", "LIFO and FIFO linear data structures."], ["Trees & Graphs", "Hierarchical structures, BFS, DFS, and shortest paths."], ["Sorting & Searching", "Merge sort, quick sort, and binary search."]],
    // Core topics
    questions: ["What is the time complexity of binary search?", "Difference between a stack and a queue?"]
    // Sample viva questions
  },
  // End of DSA
  "Database Management (DBMS)": {
  // Notes for DBMS
    overview: "Storing, querying, normalizing, and protecting structured data reliably.",
    // Short overview
    concepts: [["Normalization", "1NF, 2NF, 3NF, and BCNF to remove redundancy."], ["ACID Properties", "Atomicity, Consistency, Isolation, Durability."], ["SQL Joins", "INNER, LEFT, RIGHT, and FULL joins across tables."], ["Indexing", "B-Trees and hash indexes to speed up queries."]],
    // Core topics
    questions: ["Explain ACID properties in DBMS.", "What is the difference between 3NF and BCNF?"]
    // Sample viva questions
  },
  // End of DBMS
  "Operating Systems": {
  // Notes for Operating Systems
    overview: "Managing CPU scheduling, memory, processes, threads, and deadlocks.",
    // Short overview
    concepts: [["Processes & Threads", "Independent programs vs lightweight execution units."], ["CPU Scheduling", "FCFS, SJF, Round Robin, and Priority scheduling."], ["Deadlocks", "Mutual exclusion, hold & wait, no preemption, circular wait."], ["Virtual Memory", "Paging, segmentation, and page replacement algorithms."]],
    // Core topics
    questions: ["What are the four necessary conditions for a deadlock?", "Difference between a process and a thread?"]
    // Sample viva questions
  },
  // End of OS
  "Computer Networks": {
  // Notes for Computer Networks
    overview: "How data travels across the Internet using OSI and TCP/IP layers.",
    // Short overview
    concepts: [["OSI & TCP/IP Models", "7-layer OSI model vs 4-layer TCP/IP stack."], ["TCP vs UDP", "Reliable connection-oriented vs fast connectionless transport."], ["HTTP & DNS", "Web request-response protocol and domain name lookup."], ["IP Addressing", "IPv4 subnetting, CIDR, and routing."]],
    // Core topics
    questions: ["Explain the TCP 3-way handshake.", "What is the difference between TCP and UDP?"]
    // Sample viva questions
  },
  // End of Computer Networks
  "Python Programming": {
  // Notes for Python Programming
    overview: "High-level interpreted language widely used for backend, automation, and AI.",
    // Short overview
    concepts: [["Data Types", "Lists, tuples, dictionaries, and sets."], ["Functions & OOP", "Classes, inheritance, decorators, and generators."], ["File & Error Handling", "Reading files safely with with-blocks and try/except."], ["Libraries", "FastAPI, NumPy, Pandas, and PyMuPDF."]],
    // Core topics
    questions: ["Difference between a list and a tuple in Python?", "What is a Python decorator?"]
    // Sample viva questions
  },
  // End of Python Programming
  "Machine Learning": {
  // Notes for Machine Learning
    overview: "Training models to learn patterns from data without explicit rules.",
    // Short overview
    concepts: [["Supervised Learning", "Regression and classification with labeled data."], ["Unsupervised Learning", "Clustering (K-Means) and dimensionality reduction (PCA)."], ["Overfitting & Regularization", "Bias-variance tradeoff, L1/L2 penalties, cross-validation."], ["Evaluation Metrics", "Accuracy, Precision, Recall, F1-score, and ROC-AUC."]],
    // Core topics
    questions: ["What is the bias-variance tradeoff?", "When should you use F1-score instead of accuracy?"]
    // Sample viva questions
  },
  // End of Machine Learning
  "Cloud Computing Architecture": {
  // Notes for Cloud Computing
    overview: "Cloud computing delivers scalable computing services over the Internet.",
    // Short overview
    concepts: [["Service Models", "IaaS, PaaS, and SaaS."], ["Deployment Models", "Public, Private, and Hybrid cloud."], ["Virtualization", "Abstracting hardware using Hypervisors."], ["Containers", "Packaging apps cleanly with Docker."]],
    // Core topics
    questions: ["What is the difference between IaaS and PaaS?", "Why use Docker containers?"]
    // Sample viva questions
  }
  // End of Cloud Computing
};
// End of contentData object

function isLoggedIn() {
// Returns true only when a Firebase user is currently signed in
  return Boolean(fbAuth.currentUser);
  // Check Firebase current user
}
// End of isLoggedIn

async function getAuthHeaders(extra) {
// Attaches the logged-in user's Firebase ID token as a Bearer header
  const headers = Object.assign({}, extra || {});
  // Copy any extra headers like Content-Type
  if (fbAuth.currentUser) {
  // Fetch fresh Firebase ID token for the backend
    const token = await fbAuth.currentUser.getIdToken();
    // Get Firebase JWT token
    headers["Authorization"] = "Bearer " + token;
    // Set Bearer header
  }
  // End of user check
  return headers;
  // Return completed headers object
}
// End of getAuthHeaders

async function postJson(url, bodyData) {
// Helper function to send authenticated JSON POST requests to FastAPI
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  // Build auth + JSON headers
  const response = await fetch(url, {
  // Call the backend URL using fetch
    method: "POST",
    // Use HTTP POST method
    headers: headers,
    // Attach headers
    body: JSON.stringify(bodyData)
    // Convert JavaScript object into a JSON string
  });
  // Wait for the server response
  const data = await response.json();
  // Convert the JSON response back into a JavaScript object
  return { ok: response.ok, data: data };
  // Return both success status and response data
}
// End of postJson

async function syncUserToFirestore(addXpPoints = 0, addTokens = 0) {
// Saves the logged-in student's XP, streak, and AI tokens to Cloud Firestore
  const user = fbAuth.currentUser;
  // Get the currently logged-in Firebase user
  if (!user) return;
  // Do nothing if not logged in

  const docRef = fbDb.collection("users").doc(user.uid);
  // Point to this user's document in the "users" collection
  const today = todayKey();
  // Get today's date string
  try {
  // Wrap Firestore calls in try/catch
    const snap = await docRef.get();
    // Fetch existing user data from Firestore
    let profile = {
    // Default user profile for new accounts
      name: user.displayName || "Student",
      // Display name
      email: user.email || "",
      // User email
      streak: 1,
      // Starter streak
      xp: 0,
      // Starter XP
      tokens_used: 0,
      // Starter token count
      last_active: today
      // Today's date
    };
    // End of default profile
    if (snap.exists) {
    // Load existing Firestore profile if found
      profile = snap.data();
      // Replace defaults with saved data
    }
    // End of snap check

    if (profile.last_active && profile.last_active !== today) {
    // Update streak on a new calendar day
      if (dateDiff(profile.last_active, today) === 1) {
      // Studied yesterday, so increment streak
        profile.streak = (profile.streak || 1) + 1;
        // Increment daily streak
      } else {
      // Missed a day, reset streak to 1
        profile.streak = 1;
        // Reset streak
      }
      // End of streak logic
      profile.last_active = today;
      // Save today as last active
    }
    // End of new-day check

    profile.xp = (profile.xp || 0) + addXpPoints;
    // Add earned XP
    profile.tokens_used = (profile.tokens_used || 0) + addTokens;
    // Add used tokens
    await docRef.set(profile, { merge: true });
    // Save updated profile back to Firestore
    currentUser = profile;
    // Update global profile
    updateNavbarUserUI();
    // Refresh navbar UI
    renderDashboard();
    // Refresh dashboard UI
  } catch (error) {
  // Log Firestore errors to console
    console.error("Firestore sync error:", error);
    // Print error
  }
  // End of try/catch
}
// End of syncUserToFirestore

function updateNavbarUserUI() {
// Shows or hides Dashboard, stats pill, Login, Sign Up, and Logout buttons
  const pill = document.getElementById("userStatsPill");
  // Grab stats badge
  const dashBtn = document.getElementById("navDashBtn");
  // Grab Dashboard button
  const loginBtn = document.getElementById("navLoginBtn");
  // Grab Login button
  const signupBtn = document.getElementById("navSignupBtn");
  // Grab Sign Up button
  const logoutBtn = document.getElementById("navLogoutBtn");
  // Grab Logout button

  if (!currentUser || !fbAuth.currentUser) {
  // Hide Dashboard, stats, and Logout when logged out
    pill.classList.add("hidden");
    // Hide stats badge
    dashBtn.classList.add("hidden");
    // Hide Dashboard button
    logoutBtn.classList.add("hidden");
    // Hide Logout button
    loginBtn.classList.remove("hidden");
    // Show Login button
    signupBtn.classList.remove("hidden");
    // Show Sign Up button
    return;
    // Stop here
  }
  // End of logged-out branch

  const tokensText = (currentUser.tokens_used || 0).toLocaleString();
  // Format token count with commas
  pill.textContent = `👤 ${currentUser.name} • 🔥 ${currentUser.streak || 1}d • ⭐ ${currentUser.xp || 0} XP • ⚡ ${tokensText} tk`;
  // Update navbar stats badge
  pill.classList.remove("hidden");
  // Show stats badge
  dashBtn.classList.remove("hidden");
  // Show Dashboard button
  logoutBtn.classList.remove("hidden");
  // Show Logout button
  loginBtn.classList.add("hidden");
  // Hide Login button
  signupBtn.classList.add("hidden");
  // Hide Sign Up button
}
// End of updateNavbarUserUI

async function logoutUser() {
// Logs the student out and locks the website back to the Login screen
  await fbAuth.signOut();
  // Sign out from Firebase
  currentUser = null;
  // Clear user profile
  updateNavbarUserUI();
  // Hide Dashboard and stats
  openAuth("login");
  // Lock screen back to Login page
  showToast("Logged out successfully.");
  // Show confirmation popup
}
// End of logoutUser

async function submitAuth(event) {
// Handles Login and Sign Up using Firebase Authentication + Cloud Firestore
  event.preventDefault();
  // Stop browser from reloading the page on submit
  const email = document.getElementById("authEmail").value.trim();
  // Read email input
  const password = document.getElementById("authPassword").value;
  // Read password input

  if (authMode === "signup") {
  // Create a new user account in Firebase
    const name = document.getElementById("authName").value.trim() || "Student";
    // Read full name
    try {
    // Register with Firebase Auth
      const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
      // Create Firebase Auth user
      await cred.user.updateProfile({ displayName: name });
      // Save user's name on their auth profile
      await fbDb.collection("users").doc(cred.user.uid).set({ name: name, email: email, streak: 1, xp: 10, tokens_used: 0, last_active: todayKey() });
      // Create Firestore document with 10 starter XP
      await syncUserToFirestore(0, 0);
      // Sync profile
      showToast("Account created! Welcome to VIVA Prep.");
      // Show welcome toast
      goHome();
      // Unlock and open the main website
    } catch (err) {
    // Show Firebase error message
      showToast(err.message || "Sign up failed.");
      // Display error toast
    }
    // End of signup try/catch
  } else {
  // Log in an existing user with Firebase Auth
    try {
    // Sign in with email and password
      await fbAuth.signInWithEmailAndPassword(email, password);
      // Authenticate user
      await syncUserToFirestore(5, 0);
      // Award +5 login XP and sync profile
      showToast("Login successful!");
      // Show success toast
      goHome();
      // Unlock and open the main website
    } catch (err) {
    // Show Firebase login error
      showToast(err.message || "Invalid email or password.");
      // Display error toast
    }
    // End of login try/catch
  }
  // End of auth mode check
}
// End of submitAuth

function requireLogin() {
// Strict gatekeeper: blocks every screen and action if the student is not logged in
  if (!isLoggedIn()) {
  // If not logged in, force the Login screen immediately
    openAuth("login");
    // Open mandatory login page
    showToast("Please login first to access VIVA Prep.");
    // Remind user to login
    return false;
    // Tell caller to stop
  }
  // End of login check
  return true;
  // User is logged in, allow action
}
// End of requireLogin

function todayKey() {
// Returns today's date as YYYY-MM-DD
  return new Date().toISOString().slice(0, 10);
  // Extract YYYY-MM-DD from ISO timestamp
}
// End of todayKey

function dateDiff(dateA, dateB) {
// Calculates how many days are between two YYYY-MM-DD dates
  const msPerDay = 86400000;
  // Number of milliseconds in one day
  return Math.round((new Date(dateB) - new Date(dateA)) / msPerDay);
  // Subtract dates and convert to days
}
// End of dateDiff

function defaultProgress() {
// Returns an empty progress object for new students
  return { xp: 0, streak: 0, lastActive: "", totalActions: 0, quizCompleted: 0, bestQuiz: 0, sections: [], subjects: {}, activity: {}, lastPath: "", lastSubject: "", lastTab: "" };
  // Fresh zeroed-out progress values
}
// End of defaultProgress

function loadProgress() {
// Loads saved progress from browser localStorage
  try {
  // Parse saved JSON safely
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    // Read and parse stored string
    return Object.assign(defaultProgress(), saved);
    // Merge with defaults
  } catch (error) {
  // Fall back to empty defaults if storage is corrupted
    return defaultProgress();
    // Return empty progress
  }
  // End of try/catch
}
// End of loadProgress

function saveProgress(data) {
// Saves the progress object into browser localStorage
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  // Convert to JSON string and save
}
// End of saveProgress

function markActivity(action, subject) {
// Records a study action, awards XP, updates streak, and syncs to the database
  if (!isLoggedIn()) return;
  // Ignore actions if not logged in
  const data = loadProgress();
  // Load current local progress
  const today = todayKey();
  // Get today's date

  if (data.lastActive !== today) {
  // Update daily streak if this is the first action today
    if (!data.lastActive) {
    // Start a 1-day streak for first-time users
      data.streak = 1;
      // Set streak to 1
    } else if (dateDiff(data.lastActive, today) === 1) {
    // Studied yesterday, so increment streak
      data.streak = data.streak + 1;
      // Add 1 day to streak
    } else {
    // Missed a day, so reset streak
      data.streak = 1;
      // Reset streak to 1
    }
    // End of streak logic
    data.lastActive = today;
    // Mark today as last active
  }
  // End of date check

  let gainedXp = 10;
  // Default XP reward
  if (action === "quiz-correct") gainedXp = 20;
  // Award 20 XP for a correct quiz answer
  if (action === "quiz-complete") gainedXp = 40;
  // Award 40 XP for completing a quiz

  data.totalActions = data.totalActions + 1;
  // Increase total action count
  data.xp = data.xp + gainedXp;
  // Add XP locally

  if (subject && typeof subject === "string") {
  // Update progress for this subject
    data.lastSubject = subject;
    // Save as last studied subject
    if (!data.subjects[subject]) {
    // Initialize subject record if new
      data.subjects[subject] = { actions: 0, progress: 0 };
      // Create subject stats object
    }
    // End of subject init
    data.subjects[subject].actions = data.subjects[subject].actions + 1;
    // Increase subject action count
    const step = action === "quiz-complete" ? 25 : 10;
    // Quizzes add 25% progress, other actions add 10%
    data.subjects[subject].progress = Math.min(100, data.subjects[subject].progress + step);
    // Cap progress at 100%
  }
  // End of subject update

  data.activity[today] = (data.activity[today] || 0) + 1;
  // Increment today's bar in the 7-day activity chart
  if (action === "quiz-complete") data.quizCompleted = data.quizCompleted + 1;
  // Increment completed quiz count
  if (action === "quiz-score") data.bestQuiz = Math.max(data.bestQuiz || 0, subject || 0);
  // Save highest quiz score
  if (action === "section" && subject) {
  // Track unique workspace tabs visited for the Explorer badge
    const sectionKey = subject + "::" + selectedPrep + "::" + (data.lastTab || "");
    // Build unique key for this tab visit
    if (!data.sections.includes(sectionKey)) {
    // Only record first visit to this tab
      data.sections.push(sectionKey);
      // Save visited section
    }
    // End of unique check
  }
  // End of section tracking

  if (selectedPrep) data.lastPath = selectedPrep;
  // Remember active preparation track
  saveProgress(data);
  // Save updated progress locally
  if (isLoggedIn()) {
  // If user is logged in, save XP to Cloud Firestore
    syncUserToFirestore(gainedXp, 0);
    // Sync earned XP to Firestore
  }
  renderDashboard();
  // Refresh dashboard UI
}
// End of markActivity

function getOverallProgress() {
// Computes the average completion percentage across all started subjects
  const data = loadProgress();
  // Load saved progress
  const keys = Object.keys(data.subjects || {});
  // Get list of started subject names
  if (keys.length === 0) return 0;
  // Return 0% if no subjects started
  let total = 0;
  // Sum of percentages
  for (let i = 0; i < keys.length; i++) {
  // Loop through every started subject
    total = total + (data.subjects[keys[i]].progress || 0);
    // Add progress value
  }
  // End of loop
  return Math.round(total / keys.length);
  // Return rounded average percentage
}
// End of getOverallProgress

function getUnlockedAchievements(data, displayXP, displayStreak) {
// Returns the list of achievement badges earned so far
  const unlocked = [];
  // Empty array for earned badges
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
  // Check each of the 6 badges
    const a = ACHIEVEMENTS[i];
    // Current badge
    let earned = false;
    // Assume locked
    if (a.id === "first-step" && (data.totalActions >= 1 || displayXP > 0)) earned = true;
    // Unlock First Step after 1 action
    if (a.id === "explorer" && (data.sections || []).length >= 3) earned = true;
    // Unlock Explorer after 3 sections
    if (a.id === "quiz-starter" && data.quizCompleted >= 1) earned = true;
    // Unlock Quiz Starter after 1 quiz
    if (a.id === "sharp-mind" && (data.bestQuiz || 0) >= 80) earned = true;
    // Unlock Sharp Mind at 80%+ quiz score
    if (a.id === "xp-100" && displayXP >= 100) earned = true;
    // Unlock 100 XP at 100 XP
    if (a.id === "streak-3" && displayStreak >= 3) earned = true;
    // Unlock On Fire at a 3-day streak
    if (earned) unlocked.push(a);
    // Add earned badge to list
  }
  // End of badge loop
  return unlocked;
  // Return unlocked badges
}
// End of getUnlockedAchievements

function scrollToDashboard() {
// Goes to the landing page and scrolls smoothly to the dashboard (requires login)
  if (!requireLogin()) return;
  // Block if not logged in
  goHome();
  // Show landing page
  setTimeout(function () {
  // Brief delay before scrolling
    document.getElementById("dashboardSection").scrollIntoView({ behavior: "smooth", block: "start" });
    // Scroll to dashboard section
  }, 80);
  // 80ms wait
}
// End of scrollToDashboard

function continuePreparation() {
// Re-opens the student's last studied track and subject (requires login)
  if (!requireLogin()) return;
  // Block if not logged in
  const data = loadProgress();
  // Load saved progress
  if (!pathConfig[data.lastPath]) data.lastPath = "";
  // Ignore any removed old path
  if (!selectedPrep && !data.lastPath) {
  // If nothing saved yet, scroll to track cards
    document.getElementById("prepSection").scrollIntoView({ behavior: "smooth" });
    // Scroll to tracks
    return;
    // Stop here
  }
  // End of empty check
  selectedPrep = selectedPrep || data.lastPath;
  // Restore last track
  if (data.lastSubject) {
  // Open workspace directly if a subject was saved
    selectedSubjects = [data.lastSubject];
    // Restore last subject
    openWorkspace();
    // Open workspace
  } else {
  // Otherwise open subject selection screen
    openSubjects();
    // Open subject picker
  }
  // End of resume check
}
// End of continuePreparation

function renderDashboard() {
// Updates all numbers, badges, rings, and weekly bars on the dashboard
  const data = loadProgress();
  // Load local progress
  const progress = getOverallProgress();
  // Calculate overall percentage
  const displayXP = currentUser ? Math.max(currentUser.xp || 0, data.xp) : data.xp;
  // Show highest XP
  const displayStreak = currentUser ? Math.max(currentUser.streak || 0, data.streak) : data.streak;
  // Show highest streak
  const unlocked = getUnlockedAchievements(data, displayXP, displayStreak);
  // Compute unlocked achievements

  document.getElementById("dashXP").textContent = displayXP;
  // Update XP card
  document.getElementById("dashStreak").textContent = displayStreak + (displayStreak === 1 ? " day" : " days");
  // Update streak card
  document.getElementById("dashProgress").textContent = progress + "%";
  // Update progress percentage
  document.getElementById("dashProgressLabel").textContent = progress > 0 ? "Keep pushing forward" : "Your journey starts here";
  // Update progress subtitle
  document.getElementById("dashAchievements").textContent = unlocked.length + " / " + ACHIEVEMENTS.length;
  // Update achievement count

  const emptyBox = document.getElementById("continueEmpty");
  // Empty Continue view
  const activeBox = document.getElementById("continueActive");
  // Active Continue view
  if (data.lastSubject && pathConfig[data.lastPath]) {
  // Show resume card when a valid last subject exists
    emptyBox.classList.add("hidden");
    // Hide empty view
    activeBox.classList.remove("hidden");
    // Show active view
    document.getElementById("continuePath").textContent = data.lastPath || "B.Tech CSE";
    // Display saved track
    document.getElementById("continueTitle").textContent = data.lastSubject;
    // Display saved subject
    document.getElementById("continueMeta").textContent = (data.lastTab ? data.lastTab + " • " : "") + "Continue from your saved preparation progress.";
    // Display saved tab
    let foundIcon = "📚";
    // Default book icon
    for (let i = 0; i < masterSubjectDatabase.length; i++) {
    // Find emoji icon for saved subject
      if (masterSubjectDatabase[i].name === data.lastSubject) foundIcon = masterSubjectDatabase[i].icon;
      // Use matching subject emoji
    }
    // End of icon loop
    document.getElementById("continueIcon").textContent = foundIcon;
    // Show subject icon
    const subProg = data.subjects[data.lastSubject] ? data.subjects[data.lastSubject].progress : 0;
    // Read subject progress
    document.getElementById("continueBar").style.width = subProg + "%";
    // Update mini progress bar
  } else {
  // Show empty prompt if no subject studied yet
    emptyBox.classList.remove("hidden");
    // Show empty view
    activeBox.classList.add("hidden");
    // Hide active view
  }
  // End of Continue card update

  const challengeDone = data.totalActions > 0 || displayXP > 0;
  // Check if student has completed at least 1 action
  document.getElementById("challengeTitle").textContent = challengeDone ? "Keep your momentum going" : "Complete your first study action";
  // Update challenge title
  document.getElementById("challengeText").textContent = challengeDone ? "Open another workspace section, try PDF Viva AI, or take a Quiz to earn more XP." : "Open a subject workspace and explore Concepts, Questions or Quick Revision.";
  // Update challenge text
  document.getElementById("challengeStatus").textContent = challengeDone ? "Active" : "Not started";
  // Update challenge status label
  document.querySelector(".challenge-status").classList.toggle("done", challengeDone);
  // Turn status dot green when active

  let achHtml = "";
  // Build achievement cards HTML
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
  // Loop through all 6 achievements
    const a = ACHIEVEMENTS[i];
    // Current achievement
    const isUnlocked = unlocked.some(function (u) { return u.id === a.id; });
    // Check if unlocked
    achHtml += `<div class="achievement ${isUnlocked ? "unlocked" : ""}"><div class="achievement-icon">${a.icon}</div><strong>${a.title}</strong><span>${a.text}</span></div>`;
    // Append card HTML
  }
  // End of achievement loop
  document.getElementById("achievementList").innerHTML = achHtml;
  // Display achievement badges

  document.getElementById("signalPercent").textContent = progress + "%";
  // Update ring center text
  document.querySelector(".signal-ring").style.background = `conic-gradient(#7c5cff ${progress * 3.6}deg, rgba(127,127,127,.12) 0deg)`;
  // Update circular progress ring
  let signalTitle = "No activity yet";
  // Default momentum title
  if (progress >= 80) signalTitle = "High momentum";
  // Title for 80%+
  else if (progress >= 40) signalTitle = "Good momentum";
  // Title for 40%–79%
  else if (progress > 0) signalTitle = "Building momentum";
  // Title for 1%–39%
  document.getElementById("signalTitle").textContent = signalTitle;
  // Display momentum title
  document.getElementById("signalText").textContent = progress > 0 ? `${data.totalActions} preparation actions recorded. Keep stacking small wins.` : "Your first workspace action will begin building your preparation profile.";
  // Display momentum text

  let barsHtml = "";
  // Build 7-day activity bars HTML
  for (let i = 6; i >= 0; i--) {
  // Loop through the last 7 days
    const d = new Date();
    // Today's date
    d.setDate(d.getDate() - i);
    // Shift backwards by i days
    const key = d.toISOString().slice(0, 10);
    // Date key YYYY-MM-DD
    const count = data.activity[key] || 0;
    // Action count for that day
    const dayLetter = d.toLocaleDateString(undefined, { weekday: "narrow" });
    // Weekday initial
    const heightPx = Math.max(8, Math.min(50, 8 + count * 8));
    // Bar height in pixels
    barsHtml += `<div class="activity-day ${count > 0 ? "active" : ""}"><i style="height:${heightPx}px"></i><span>${dayLetter}</span></div>`;
    // Append bar HTML
  }
  // End of 7-day loop
  document.getElementById("activityBars").innerHTML = barsHtml;
  // Display weekly activity bars
}
// End of renderDashboard

function getData(subject) {
// Returns study concepts and questions for a subject (or fallback notes)
  if (contentData[subject]) return contentData[subject];
  // Return custom notes if available
  return {
  // Default fallback notes
    overview: subject + " is a core B.Tech CSE preparation topic.",
    // Generic overview
    concepts: [["Fundamentals", "Understand the basic definitions and principles."], ["Core Architecture", "Learn the major components."], ["Applications", "Connect theory with real-world engineering examples."]],
    // Generic concepts
    questions: ["What is the core principle of " + subject + "?", "Explain practical applications of " + subject + "."]
    // Generic questions
  };
  // End of fallback object
}
// End of getData

function isCodingSubject(subject) {
// Returns true if the subject should show the Code Practice tab
  const codingList = ["Python Programming", "Data Structures & Algorithms", "Advanced DSA"];
  // List of coding subjects
  return codingList.includes(subject);
  // Check membership
}
// End of isCodingSubject

function hideAllPages() {
// Hides all main screen sections before showing another screen
  const sections = document.querySelectorAll(".page-section");
  // Grab all screen sections
  for (let i = 0; i < sections.length; i++) {
  // Loop through sections
    sections[i].classList.add("hidden");
    // Hide section
  }
  // End of loop
}
// End of hideAllPages

function goHome() {
// Switches view to the landing page ONLY if the student is logged in
  if (!requireLogin()) return;
  // Force login screen if not authenticated
  hideAllPages();
  // Hide other screens
  document.getElementById("landing").classList.remove("hidden");
  // Show landing page
  showAI();
  // Show floating Prep AI button
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Scroll smoothly to top
}
// End of goHome

function selectPrep(name) {
// Called when the user clicks one of the 3 B.Tech CSE track cards
  if (!requireLogin()) return;
  // Block if not logged in
  selectedPrep = name;
  // Save selected track
  selectedSubjects = [];
  // Clear previous subject choices
  openSubjects();
  // Open subject selection page
}
// End of selectPrep

function openSubjects() {
// Displays the subject selection screen and fills its filter dropdown
  if (!requireLogin()) return;
  // Block if not logged in
  hideAllPages();
  // Hide other screens
  document.getElementById("subjectPage").classList.remove("hidden");
  // Show subject selection page
  document.getElementById("subjectTitle").textContent = selectedPrep;
  // Set page title to selected track
  document.getElementById("subjectSearch").value = "";
  // Clear search input

  const filterSelect = document.getElementById("branchFilter");
  // Grab dropdown element
  filterSelect.innerHTML = "";
  // Clear old options
  const options = filterOptions[selectedPrep] || ["All Topics"];
  // Get filter options for this track
  for (let i = 0; i < options.length; i++) {
  // Add each option to the dropdown
    const optEl = document.createElement("option");
    // Create <option>
    optEl.value = options[i];
    // Set value
    optEl.textContent = options[i];
    // Set visible label
    filterSelect.appendChild(optEl);
    // Append to dropdown
  }
  // End of dropdown loop

  renderSubjects();
  // Draw matching subject cards
  showAI();
  // Show floating AI button
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Scroll to top
}
// End of openSubjects

function renderSubjects() {
// Filters and renders clickable subject cards
  const grid = document.getElementById("subjectGrid");
  // Subject grid container
  const query = document.getElementById("subjectSearch").value.trim().toLowerCase();
  // Search text
  const tag = document.getElementById("branchFilter").value;
  // Selected dropdown tag
  grid.innerHTML = "";
  // Clear old cards

  let matchCount = 0;
  // Count of matching subjects
  for (let i = 0; i < masterSubjectDatabase.length; i++) {
  // Check every subject
    const item = masterSubjectDatabase[i];
    // Current subject
    const matchesPath = item.paths.includes(selectedPrep);
    // Check track match
    const matchesTag = tag.startsWith("All") || item.tag === tag;
    // Check tag match
    const matchesSearch = item.name.toLowerCase().includes(query);
    // Check search match
    if (!matchesPath || !matchesTag || !matchesSearch) continue;
    // Skip non-matching subjects

    matchCount = matchCount + 1;
    // Increment match counter
    const isSelected = selectedSubjects.includes(item.name);
    // Check if selected
    const card = document.createElement("div");
    // Create card div
    card.className = "subject-card" + (isSelected ? " selected" : "");
    // Apply selected highlight if chosen
    card.innerHTML = `<div class="subject-check">${isSelected ? "✓" : ""}</div><div class="subject-icon">${item.icon}</div><div class="subject-name">${item.name}</div><div class="subject-tag">${item.tag}</div>`;
    // Fill card HTML
    card.onclick = function () { toggleSubject(item.name); };
    // Toggle on click
    grid.appendChild(card);
    // Add card to grid
  }
  // End of subject loop

  if (matchCount === 0) {
  // Display message when no subjects match
    grid.innerHTML = `<div class="content-card" style="grid-column:1/-1">No subjects match your current selection.</div>`;
    // Render empty message
  }
  // End of empty check

  const count = selectedSubjects.length;
  // Number of selected subjects
  document.getElementById("selectionCount").textContent = count + (count === 1 ? " subject selected" : " subjects selected");
  // Update counter text
  document.getElementById("selectionHelper").textContent = count > 0 ? "Ready to build your workspace." : "Select at least one subject to continue.";
  // Update helper text
}
// End of renderSubjects

function toggleSubject(name) {
// Adds or removes a subject from selectedSubjects
  if (selectedSubjects.includes(name)) {
  // Remove subject if already selected
    selectedSubjects = selectedSubjects.filter(function (s) { return s !== name; });
    // Filter out clicked subject
  } else {
  // Add subject if not selected
    selectedSubjects.push(name);
    // Append subject name
  }
  // End of toggle check
  renderSubjects();
  // Redraw cards
}
// End of toggleSubject

function clearSubjects() {
// Clears all selected subjects
  selectedSubjects = [];
  // Reset array
  renderSubjects();
  // Redraw cards
  showToast("Selection cleared.");
  // Show toast
}
// End of clearSubjects

function openWorkspace() {
// Opens the study workspace for the chosen subjects (requires login)
  if (!requireLogin()) return;
  // Block if not logged in
  if (selectedSubjects.length === 0) {
  // Require at least one subject
    showToast("Please select at least one subject.");
    // Show reminder toast
    return;
    // Stop here
  }
  // End of validation

  const pd = loadProgress();
  // Load local progress
  pd.lastPath = selectedPrep;
  // Save track
  pd.lastSubject = selectedSubjects[0];
  // Save primary subject
  saveProgress(pd);
  // Save to localStorage
  markActivity("workspace-open", selectedSubjects[0]);
  // Award +10 XP

  hideAllPages();
  // Hide other screens
  document.getElementById("workspacePage").classList.remove("hidden");
  // Show workspace screen
  document.getElementById("workspaceTitle").textContent = selectedPrep + " Workspace";
  // Set heading

  const pills = document.getElementById("subjectPills");
  // Subject pills container
  pills.innerHTML = "";
  // Clear old pills
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Create a pill for each chosen subject
    const pill = document.createElement("div");
    // Create pill div
    pill.className = "subject-pill";
    // Apply pill class
    pill.textContent = selectedSubjects[i];
    // Set subject text
    pills.appendChild(pill);
    // Append pill
  }
  // End of pill loop

  renderTabs();
  // Render sidebar tabs
  showContent("overview");
  // Open Overview tab first
  showAI();
  // Keep floating AI visible
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Scroll to top
}
// End of openWorkspace

function renderTabs() {
// Creates the left sidebar tab buttons inside the workspace
  const sidebar = document.getElementById("workspaceTabs");
  // Sidebar container
  sidebar.innerHTML = "";
  // Clear old tabs
  const tabs = [
  // Default workspace tabs
    ["overview", "📊 Overview"],
    // Overview tab
    ["concepts", "📚 Lessons & Concepts"],
    // Concepts tab
    ["questions", "❓ Questions"],
    // Questions tab
    ["revision", "⚡ Quick Revision"],
    // Quick Revision tab
    ["quiz", "📝 Practice Quiz"],
    // Interactive Quiz tab
    ["pdfviva", "📄 PDF Viva AI"],
    // PDF Viva AI tab
    ["interview", "🎙️ Mock Interview"],
    // Mock Interview tab
    ["liveqs", "🌐 Live Questions"]
    // Live Questions tab
  ];
  // End of tabs array

  if (selectedSubjects.some(isCodingSubject)) {
  // Add Code Practice tab for coding subjects
    tabs.push(["code", "💻 Code Practice"]);
    // Append coding tab
  }
  // End of coding check

  for (let i = 0; i < tabs.length; i++) {
  // Build each tab button
    const tabId = tabs[i][0];
    // Tab key
    const tabLabel = tabs[i][1];
    // Tab label
    const btn = document.createElement("button");
    // Create button
    btn.className = "tab-btn";
    // Apply tab class
    btn.textContent = tabLabel;
    // Set label
    btn.onclick = function () { showContent(tabId, btn); };
    // Switch tab on click
    sidebar.appendChild(btn);
    // Add to sidebar
  }
  // End of tab loop
}
// End of renderTabs

function showContent(type, clickedBtn) {
// Switches the active workspace tab and renders its panel
  if (!requireLogin()) return;
  // Block if not logged in
  const allTabs = document.querySelectorAll(".tab-btn");
  // Find all tab buttons
  for (let i = 0; i < allTabs.length; i++) {
  // Clear active highlight from all tabs
    allTabs[i].classList.remove("active");
    // Remove active class
  }
  // End of loop
  if (clickedBtn) clickedBtn.classList.add("active");
  // Highlight clicked tab
  else if (allTabs.length > 0) allTabs[0].classList.add("active");
  // Highlight first tab by default

  const box = document.getElementById("workspaceContent");
  // Main workspace content panel
  const trackedSubject = selectedSubjects[0] || "";
  // Primary subject
  const data = loadProgress();
  // Load progress
  data.lastTab = type;
  // Save active tab
  saveProgress(data);
  // Save locally
  if (type !== "quiz") markActivity("section", trackedSubject);
  // Record tab visit

  if (type === "overview") renderOverview(box);
  // Show Overview
  if (type === "concepts") renderConcepts(box);
  // Show Concepts
  if (type === "questions") renderQuestions(box);
  // Show Questions
  if (type === "revision") renderRevision(box);
  // Show Quick Revision
  if (type === "quiz") startQuiz(box);
  // Show Quiz
  if (type === "pdfviva") renderPdfViva(box);
  // Show PDF Viva
  if (type === "interview") renderMockInterview(box);
  // Show Mock Interview
  if (type === "liveqs") renderLiveQuestions(box);
  // Show Live Questions
  if (type === "code") renderCodePractice(box);
  // Show Code Practice
}
// End of showContent

function renderOverview(box) {
// Renders the Overview tab showing selected subjects and tracked progress
  let subjectBoxes = "";
  // HTML string for subject cards
  let progSum = 0;
  // Sum of progress values
  const saved = loadProgress();
  // Load progress
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through chosen subjects
    const s = selectedSubjects[i];
    // Subject name
    subjectBoxes += `<div class="topic-box"><strong>${s}</strong><span>${getData(s).overview}</span></div>`;
    // Add overview box
    progSum += saved.subjects[s] ? saved.subjects[s].progress : 0;
    // Add progress
  }
  // End of loop
  const avgProg = selectedSubjects.length > 0 ? Math.round(progSum / selectedSubjects.length) : 0;
  // Average completion percentage
  box.innerHTML = `<div class="content-card"><h2>📊 Preparation Overview</h2><p>You selected ${selectedSubjects.length} subject(s) for ${selectedPrep}.</p><h3>Your Subjects</h3><div class="topic-grid">${subjectBoxes}</div><div class="progress-wrap"><strong>Your tracked progress</strong><p>Concepts → Questions → Quick Revision → Quiz → PDF Viva & Interview</p><div class="progress-bar"><div class="progress-fill" style="width:${avgProg}%"></div></div><p style="margin-top:8px;font-size:12px">${avgProg}% completed for selected subjects.</p></div></div>`;
  // Render Overview card
}
// End of renderOverview

function renderConcepts(box) {
// Renders the Lessons & Core Concepts tab
  let html = `<div class="content-card"><h2>📚 Lessons & Core Concepts</h2><p>Browse core topics for your selected subjects.</p>`;
  // Card header
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const concepts = getData(s).concepts;
    // Concept list
    html += `<h3>${s}</h3><div class="topic-grid">`;
    // Open grid
    for (let j = 0; j < concepts.length; j++) {
    // Add each concept box
      html += `<div class="topic-box"><strong>${concepts[j][0]}</strong><span>${concepts[j][1]}</span></div>`;
      // Append concept
    }
    // End of concept loop
    html += `</div>`;
    // Close grid
  }
  // End of subject loop
  box.innerHTML = html + `</div>`;
  // Render card
}
// End of renderConcepts

function renderQuestions(box) {
// Renders the Practice Questions tab
  let html = `<div class="content-card"><h2>❓ Practice Questions</h2>`;
  // Card header
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const qs = getData(s).questions;
    // Sample questions
    html += `<h3>${s}</h3><ul>`;
    // Open list
    for (let j = 0; j < qs.length; j++) {
    // Add each question
      html += `<li>${qs[j]}</li>`;
      // Append list item
    }
    // End of question loop
    html += `</ul>`;
    // Close list
  }
  // End of subject loop
  box.innerHTML = html + `</div>`;
  // Render card
}
// End of renderQuestions

function renderRevision(box) {
// Renders the Quick Revision tab with top 4 concepts per subject
  let html = `<div class="content-card"><h2>⚡ Quick Revision</h2><p>Fast final review of top concepts.</p>`;
  // Card header
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const topFour = getData(s).concepts.slice(0, 4);
    // First 4 concepts
    html += `<h3>${s}</h3><div class="topic-grid">`;
    // Open grid
    for (let j = 0; j < topFour.length; j++) {
    // Add each box
      html += `<div class="topic-box"><strong>${topFour[j][0]}</strong><span>${topFour[j][1]}</span></div>`;
      // Append concept box
    }
    // End of concept loop
    html += `</div>`;
    // Close grid
  }
  // End of subject loop
  box.innerHTML = html + `</div>`;
  // Render card
}
// End of renderRevision

function startQuiz(box) {
// Generates up to 5 multiple-choice questions from the selected subjects
  const built = [];
  // Array for generated questions
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const concepts = getData(s).concepts;
    // Concept list
    for (let j = 0; j < Math.min(3, concepts.length); j++) {
    // Build up to 3 questions per subject
      const correctDesc = concepts[j][1];
      // Right answer
      const wrong1 = concepts[(j + 1) % concepts.length][1];
      // Distractor 1
      const wrong2 = concepts[(j + 2) % concepts.length][1];
      // Distractor 2
      const options = [correctDesc, wrong1, wrong2, "None of the above."].sort(function () { return Math.random() - 0.5; });
      // Shuffle 4 options randomly
      built.push({ q: `[${s}] Which best describes "${concepts[j][0]}"?`, options: options, answer: correctDesc });
      // Save question
    }
    // End of concept loop
  }
  // End of subject loop
  quizState = { index: 0, score: 0, answered: false, questions: built.slice(0, 5) };
  // Reset quiz state
  renderQuizQuestion(box);
  // Display first question
}
// End of startQuiz

function renderQuizQuestion(box) {
// Renders the current quiz question or final score summary
  if (quizState.index >= quizState.questions.length) {
  // Show score summary when finished
    const pct = quizState.questions.length > 0 ? Math.round((quizState.score / quizState.questions.length) * 100) : 0;
    // Score percentage
    markActivity("quiz-complete", selectedSubjects[0] || "");
    // Award +40 XP
    markActivity("quiz-score", pct);
    // Record best quiz score
    box.innerHTML = `<div class="content-card"><h2>🎉 Quiz Complete!</h2><p>You scored <strong>${quizState.score} / ${quizState.questions.length} (${pct}%)</strong> and earned +40 XP!</p><button class="primary-btn quiz-next" onclick="startQuiz(document.getElementById('workspaceContent'))">Retake Quiz →</button></div>`;
    // Show completion screen
    return;
    // Stop here
  }
  // End of finished check

  const cur = quizState.questions[quizState.index];
  // Current question object
  const card = document.createElement("div");
  // Create card div
  card.className = "content-card";
  // Apply card style
  card.innerHTML = `<h2>📝 Practice Quiz (${quizState.index + 1} / ${quizState.questions.length})</h2><p style="margin-bottom:14px;color:var(--text);font-weight:700">${cur.q}</p><div id="quizOptions"></div><div id="quizNextWrap"></div>`;
  // Render question prompt
  const optBox = card.querySelector("#quizOptions");
  // Options container

  for (let i = 0; i < cur.options.length; i++) {
  // Render each option button
    const optText = cur.options[i];
    // Option text
    const btn = document.createElement("button");
    // Create button
    btn.className = "quiz-option";
    // Apply option class
    btn.textContent = optText;
    // Set button text
    btn.onclick = function () {
    // Check answer when clicked
      if (quizState.answered) return;
      // Ignore extra clicks
      quizState.answered = true;
      // Lock question
      if (optText === cur.answer) {
      // Correct choice
        btn.classList.add("correct");
        // Highlight green
        quizState.score = quizState.score + 1;
        // Increment score
        markActivity("quiz-correct", selectedSubjects[0] || "");
        // Award +20 XP
        showToast("Correct! +20 XP");
        // Show toast
      } else {
      // Wrong choice
        btn.classList.add("wrong");
        // Highlight red
        const allBtns = optBox.querySelectorAll(".quiz-option");
        // Find true answer button
        for (let k = 0; k < allBtns.length; k++) {
        // Loop through options
          if (allBtns[k].textContent === cur.answer) allBtns[k].classList.add("correct");
          // Highlight correct answer in green
        }
        // End of highlight loop
      }
      // End of answer check
      const nextBtn = document.createElement("button");
      // Create Next button
      nextBtn.className = "primary-btn quiz-next";
      // Style as primary button
      nextBtn.textContent = quizState.index + 1 === quizState.questions.length ? "Finish Quiz →" : "Next Question →";
      // Set button text
      nextBtn.onclick = function () {
      // Go to next question
        quizState.index = quizState.index + 1;
        // Advance index
        quizState.answered = false;
        // Unlock next question
        renderQuizQuestion(box);
        // Render next question
      };
      // End of next click handler
      card.querySelector("#quizNextWrap").appendChild(nextBtn);
      // Add Next button
    };
    // End of option click handler
    optBox.appendChild(btn);
    // Add option button
  }
  // End of options loop
  box.innerHTML = "";
  // Clear container
  box.appendChild(card);
  // Display quiz card
}
// End of renderQuizQuestion

function renderPdfViva(box) {
// Renders the PDF Syllabus Viva Generator tab
  box.innerHTML = `<div class="content-card"><h2>📄 PDF Syllabus Viva Generator</h2><p>Upload any syllabus or notes PDF. The Python backend extracts text with PyMuPDF and generates 5 viva questions with model answers.</p><input type="file" id="pdfUploadInput" accept=".pdf" class="workspace-input" /><button class="primary-btn" onclick="submitPdfViva()">Generate Viva Questions →</button><div id="pdfVivaOutput" class="ai-output-box hidden"></div></div>`;
  // Render PDF upload form
}
// End of renderPdfViva

async function submitPdfViva() {
// Uploads the chosen PDF file to /api/pdf-viva and shows generated viva questions
  if (!requireLogin()) return;
  // Block if not logged in
  const input = document.getElementById("pdfUploadInput");
  // File input element
  const out = document.getElementById("pdfVivaOutput");
  // Output box
  if (!input.files || !input.files[0]) {
  // Check that a PDF was chosen
    showToast("Please choose a PDF file first.");
    // Show reminder
    return;
    // Stop here
  }
  // End of validation

  out.classList.remove("hidden");
  // Show output box
  out.textContent = "Extracting PDF text and generating viva questions with AI...";
  // Show loading message
  const formData = new FormData();
  // Create multipart form payload
  formData.append("file", input.files[0]);
  // Attach PDF file

  try {
  // Send PDF to FastAPI
    const res = await fetch("/api/pdf-viva", { method: "POST", headers: await getAuthHeaders(), body: formData });
    // Upload with auth token header
    const data = await res.json();
    // Parse JSON reply
    out.textContent = res.ok ? data.result : (data.detail || "Failed to generate viva.");
    // Display generated questions or error
    markActivity("pdf-viva", selectedSubjects[0] || "");
    // Record activity locally
    if (res.ok && data.tokens_used) syncUserToFirestore(0, data.tokens_used);
    // Refresh user stats
  } catch (error) {
  // Handle connection errors
    out.textContent = "Could not connect to Python backend.";
    // Display error
  }
  // End of try/catch
}
// End of submitPdfViva

function renderMockInterview(box) {
// Renders the AI Mock Interview tab
  const defaultSub = selectedSubjects[0] || "Data Structures & Algorithms";
  // Pre-fill subject name
  box.innerHTML = `<div class="content-card"><h2>🎙️ AI Mock Interview</h2><p>Leave the answer blank to receive an opening viva question, or submit your answer to get a score out of 10 and a follow-up.</p><input id="interviewSubject" class="workspace-input" value="${defaultSub}" placeholder="Subject" /><textarea id="interviewAnswer" rows="4" class="workspace-textarea" placeholder="Leave blank to ask opening question, or type your answer here..."></textarea><button class="primary-btn" onclick="submitMockInterview()">Ask / Evaluate Answer →</button><div id="interviewOutput" class="ai-output-box hidden"></div></div>`;
  // Render mock interview form
}
// End of renderMockInterview

async function submitMockInterview() {
// Sends subject and optional answer to FastAPI /api/interview
  if (!requireLogin()) return;
  // Block if not logged in
  const subject = document.getElementById("interviewSubject").value.trim() || "B.Tech CSE";
  // Read subject
  const answerBox = document.getElementById("interviewAnswer");
  // Answer textarea
  const out = document.getElementById("interviewOutput");
  // Output box
  out.classList.remove("hidden");
  // Show output box
  out.textContent = "Interviewer is thinking...";
  // Show loading state

  try {
  // Call /api/interview
    const result = await postJson("/api/interview", { subject: subject, answer: answerBox.value });
    // Send JSON payload
    out.textContent = result.ok ? result.data.result : (result.data.detail || "Interview request failed.");
    // Show AI question or grade
    answerBox.value = "";
    // Clear textarea
    markActivity("interview", selectedSubjects[0] || "");
    // Record activity
    if (result.ok && result.data.tokens_used) syncUserToFirestore(0, result.data.tokens_used);
    // Refresh user stats
  } catch (error) {
  // Handle offline error
    out.textContent = "Could not connect to Python backend.";
    // Show error message
  }
  // End of try/catch
}
// End of submitMockInterview

function renderLiveQuestions(box) {
// Renders the Infinite Live CS Questions tab
  box.innerHTML = `<div class="content-card"><h2>🌐 Infinite Live CS Questions</h2><p>Pull fresh Computer Science questions live from Open Trivia DB.</p><button class="primary-btn" style="margin-top:14px" onclick="fetchLiveQuestions()">Load 5 More Live Questions →</button><div id="liveQuestionsContainer" class="topic-grid" style="grid-template-columns:1fr;margin-top:20px"></div></div>`;
  // Render tab layout
  drawLiveQuestions();
  // Display already-loaded questions
}
// End of renderLiveQuestions

function drawLiveQuestions() {
// Displays all fetched live CS questions on the page
  const container = document.getElementById("liveQuestionsContainer");
  // Target container
  if (!container) return;
  // Stop if user switched tabs
  if (liveQuestionsList.length === 0) {
  // Show placeholder text when empty
    container.innerHTML = `<div class="topic-box"><span>Click "Load 5 More Live Questions" above to pull fresh CS questions live.</span></div>`;
    // Display prompt
    return;
    // Stop here
  }
  // End of empty check

  let html = "";
  // Build question cards HTML
  for (let i = 0; i < liveQuestionsList.length; i++) {
  // Loop through fetched questions
    const q = liveQuestionsList[i];
    // Current question
    html += `<div class="topic-box"><strong>Q${i + 1} (${q.difficulty.toUpperCase()}): ${q.q}</strong><span>Answer: ${q.a}</span></div>`;
    // Append card
  }
  // End of loop
  container.innerHTML = html;
  // Render questions
}
// End of drawLiveQuestions

async function fetchLiveQuestions() {
// Pulls 5 fresh CS trivia questions from FastAPI /api/infinite-questions
  if (!requireLogin()) return;
  // Block if not logged in
  showToast("Fetching live CS questions...");
  // Show loading toast
  try {
  // Request live questions from backend
    const res = await fetch("/api/infinite-questions", { headers: await getAuthHeaders() });
    // Send GET request with auth header
    const data = await res.json();
    // Parse JSON response
    if (res.ok && data.questions) {
    // Append new questions to our list
      liveQuestionsList = liveQuestionsList.concat(data.questions);
      // Merge lists
      drawLiveQuestions();
      // Redraw UI
      markActivity("live-questions", selectedSubjects[0] || "");
      // Refresh XP
    }
    // End of success check
  } catch (error) {
  // Handle offline backend
    showToast("Could not connect to Python backend.");
    // Show error toast
  }
  // End of try/catch
}
// End of fetchLiveQuestions

function renderCodePractice(box) {
// Renders the Work In Progress panel for coding subjects
  const codingSubs = selectedSubjects.filter(isCodingSubject).join(", ");
  // List selected coding subjects
  box.innerHTML = `<div class="content-card wip"><div><div class="wip-terminal">&lt;/&gt;</div><h2><span>WORK IN PROGRESS</span></h2><p>A complete coding environment is coming soon.</p><div class="scan"></div><p>Selected: ${codingSubs}</p></div></div>`;
  // Render WIP panel
}
// End of renderCodePractice

function openAuth(mode) {
// Opens the mandatory Login / Sign Up screen and hides all other content
  authMode = mode;
  // Save active mode
  hideAllPages();
  // Hide landing, subjects, and workspace
  document.getElementById("authPage").classList.remove("hidden");
  // Show auth page
  renderAuth(mode);
  // Build form inputs
  hideAI();
  // Hide floating AI on auth screen
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Scroll to top
}
// End of openAuth

function renderAuth(mode) {
// Switches the auth form between Login and Sign Up fields
  authMode = mode;
  // Update mode
  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  // Highlight Login tab
  document.getElementById("signupTab").classList.toggle("active", mode === "signup");
  // Highlight Sign Up tab
  const form = document.getElementById("authForm");
  // Grab form element

  if (mode === "login") {
  // Show Login inputs
    document.getElementById("authTitle").textContent = "Welcome back";
    // Set Login heading
    document.getElementById("authSubtitle").textContent = "Login to access your B.Tech CSE preparation workspace.";
    // Set Login subtitle
    form.innerHTML = `<div class="input-group"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com" required></div><div class="input-group"><label>Password</label><input id="authPassword" type="password" placeholder="••••••••" required></div><button class="primary-btn auth-submit" type="submit">Login →</button>`;
    // Render Login form
  } else {
  // Show Sign Up inputs
    document.getElementById("authTitle").textContent = "Create account";
    // Set Sign Up heading
    document.getElementById("authSubtitle").textContent = "Sign up to unlock VIVA Prep.";
    // Set Sign Up subtitle
    form.innerHTML = `<div class="input-group"><label>Full Name</label><input id="authName" type="text" placeholder="Your name" required></div><div class="input-group"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com" required></div><div class="input-group"><label>Password (min 6 chars)</label><input id="authPassword" type="password" minlength="6" placeholder="Create password" required></div><button class="primary-btn auth-submit" type="submit">Sign Up →</button>`;
    // Render Sign Up form
  }
  // End of mode check
}
// End of renderAuth

function showAI() {
// Shows the floating Prep AI launcher ONLY if the student is logged in
  if (!isLoggedIn()) return;
  // Never show Prep AI to logged-out visitors
  document.getElementById("aiFloating").classList.remove("hidden");
  // Reveal floating AI wrapper
}
// End of showAI

function hideAI() {
// Hides the floating Prep AI launcher and popup
  document.getElementById("aiFloating").classList.add("hidden");
  // Hide wrapper
  document.getElementById("chatbot").classList.add("hidden");
  // Hide chat window
  document.getElementById("aiLaunch").classList.remove("hidden");
  // Reset launcher button
}
// End of hideAI

function openChat() {
// Opens the Prep AI chat popup (requires login)
  if (!requireLogin()) return;
  // Block if not logged in
  showAI();
  // Ensure wrapper is visible
  document.getElementById("aiLaunch").classList.add("hidden");
  // Hide round button
  document.getElementById("chatbot").classList.remove("hidden");
  // Show chat window
  setTimeout(function () { document.getElementById("chatInput").focus(); }, 100);
  // Focus input box
}
// End of openChat

function closeChat() {
// Minimizes the Prep AI chat popup back to the floating button
  document.getElementById("chatbot").classList.add("hidden");
  // Hide chat window
  document.getElementById("aiLaunch").classList.remove("hidden");
  // Show round button
}
// End of closeChat

function toggleModelMenu() {
// Opens or closes the Super Mode / God Mode selector menu
  document.getElementById("modelMenu").classList.toggle("hidden");
  // Toggle visibility
}
// End of toggleModelMenu

function setAIMode(mode) {
// Switches Prep AI between Super Mode and God Mode
  aiMode = mode;
  // Save selected mode
  const isSuper = mode === "super";
  // Check if Super Mode is chosen
  document.getElementById("modelName").textContent = isSuper ? "🚀 Super Mode" : "👑 God Mode";
  // Update selector bar text
  document.getElementById("aiStatus").textContent = isSuper ? "Super Mode" : "God Mode";
  // Update header status
  document.getElementById("superOption").classList.toggle("active", isSuper);
  // Highlight Super Mode option
  document.getElementById("godOption").classList.toggle("active", !isSuper);
  // Highlight God Mode option
  document.getElementById("modelMenu").classList.add("hidden");
  // Close dropdown
  showToast(isSuper ? "Prep AI switched to Super Mode." : "Prep AI switched to God Mode.");
  // Show confirmation toast
}
// End of setAIMode

function handleChatKey(event) {
// Sends the message when Enter is pressed inside the chat input
  if (event.key === "Enter" && !event.shiftKey) {
  // Check for Enter without Shift
    event.preventDefault();
    // Prevent newline
    sendQuestion();
    // Send message
  }
  // End of key check
}
// End of handleChatKey

function quickPrompt(text) {
// Inserts a quick-chip prompt into the chat input and sends it
  document.getElementById("chatInput").value = text;
  // Set input text
  sendQuestion();
  // Send immediately
}
// End of quickPrompt

function clearChat() {
// Clears all chat bubbles and resets the welcome greeting
  initializeChat();
  // Reset chat area
  showToast("Chat history cleared.");
  // Show toast
}
// End of clearChat

async function sendQuestion() {
// Sends the user's question to FastAPI /api/chat and displays the AI reply
  if (!requireLogin()) return;
  // Block if not logged in
  const input = document.getElementById("chatInput");
  // Chat input box
  const question = input.value.trim();
  // Read typed message
  if (!question) return;
  // Ignore blank input

  addMessage(question, "user");
  // Display user message bubble
  input.value = "";
  // Clear input box

  const typing = document.createElement("div");
  // Create temporary typing indicator
  typing.className = "message ai";
  // Style as AI bubble
  typing.textContent = "Prep AI is thinking...";
  // Loading message
  const chatBox = document.getElementById("chatMessages");
  // Messages container
  chatBox.appendChild(typing);
  // Show typing bubble
  chatBox.scrollTop = chatBox.scrollHeight;
  // Scroll to bottom

  try {
  // Call FastAPI /api/chat
    const result = await postJson("/api/chat", {
    // Send JSON body
      question: question,
      // User's question
      mode: aiMode,
      // Active mode
      subjects: selectedSubjects.join(", ") || selectedPrep || "B.Tech CSE"
      // Subject context
    });
    // Wait for reply
    typing.remove();
    // Remove typing indicator
    addMessage(result.ok ? result.data.reply : (result.data.detail || "AI error."), "ai");
    // Display AI response
    if (result.ok) syncUserToFirestore(5, result.data.tokens_used || 0);
    // Refresh user stats
  } catch (error) {
  // Handle offline backend
    typing.remove();
    // Remove typing indicator
    addMessage("⚠️ Could not reach Python backend. Make sure uvicorn is running.", "ai");
    // Show offline message
  }
  // End of try/catch
}
// End of sendQuestion

function parseMarkdown(text) {
// Formats basic Markdown (**bold**, `code`, and line breaks) into safe HTML
  let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Escape HTML characters for safety
  safe = safe.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  // Format triple-backtick code blocks
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Format inline code
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Format bold text
  safe = safe.replace(/\n/g, "<br>");
  // Convert newlines into <br> tags
  return safe;
  // Return formatted HTML
}
// End of parseMarkdown

function addMessage(text, sender) {
// Appends a chat bubble to the Prep AI message area
  const box = document.getElementById("chatMessages");
  // Messages container
  const bubble = document.createElement("div");
  // Create bubble div
  bubble.className = "message " + sender;
  // Style as user or ai
  if (sender === "ai") bubble.innerHTML = parseMarkdown(text);
  // Render Markdown for AI replies
  else bubble.textContent = text;
  // Plain text for user messages
  box.appendChild(bubble);
  // Add bubble to chat
  box.scrollTop = box.scrollHeight;
  // Scroll to bottom
}
// End of addMessage

function initializeChat() {
// Resets the chat area and prints the welcome greeting
  document.getElementById("chatMessages").innerHTML = "";
  // Clear old bubbles
  addMessage("👋 Hi! I'm Prep AI.\n\nAsk me anything about B.Tech CSE, placements, or hackathons.", "ai");
  // Show welcome bubble
}
// End of initializeChat

function toggleTheme() {
// Toggles between Dark Mode and Light Mode and saves preference
  document.body.classList.toggle("light");
  // Toggle light class
  const isLight = document.body.classList.contains("light");
  // Check active theme
  document.getElementById("themeSymbol").textContent = isLight ? "☀" : "☾";
  // Update button symbol
  localStorage.setItem("vivaPrepTheme", isLight ? "light" : "dark");
  // Save theme in browser
}
// End of toggleTheme

function restoreTheme() {
// Restores the saved Dark/Light theme when the page loads
  if (localStorage.getItem("vivaPrepTheme") === "light") {
  // Enable Light Mode if previously saved
    document.body.classList.add("light");
    // Add light class
    document.getElementById("themeSymbol").textContent = "☀";
    // Show sun icon
  }
  // End of theme check
}
// End of restoreTheme

function showToast(message) {
// Shows a short notification bar at the bottom of the screen
  const toast = document.getElementById("toast");
  // Toast element
  toast.textContent = message;
  // Set notification text
  toast.classList.add("show");
  // Slide toast into view
  clearTimeout(toastTimer);
  // Cancel any existing hide timer
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  // Hide toast after 2.2 seconds
}
// End of showToast

function createParticles() {
// Creates 35 floating background dots
  const container = document.getElementById("particles");
  // Particles container
  for (let i = 0; i < 35; i++) {
  // Loop 35 times
    const dot = document.createElement("span");
    // Create span element
    dot.className = "particle";
    // Apply particle class
    dot.style.left = Math.random() * 100 + "%";
    // Random horizontal position
    dot.style.animationDelay = Math.random() * 8 + "s";
    // Random delay
    dot.style.animationDuration = 5 + Math.random() * 8 + "s";
    // Random speed
    container.appendChild(dot);
    // Append dot
  }
  // End of particle loop
}
// End of createParticles

function renderPrepCards() {
// Draws the 3 B.Tech CSE track cards on the landing page
  const grid = document.getElementById("prepGrid");
  // Grid container
  grid.innerHTML = "";
  // Clear old cards
  const names = Object.keys(pathConfig);
  // List of track names
  for (let i = 0; i < names.length; i++) {
  // Build one card per track
    const name = names[i];
    // Track title
    const cfg = pathConfig[name];
    // Track image, icon, and description
    const card = document.createElement("div");
    // Create card div
    card.className = "prep-card";
    // Apply card class
    card.innerHTML = `<img src="${cfg.image}" alt="${name}"><div class="prep-card-content"><div class="prep-icon">${cfg.icon}</div><h3>${name}</h3><p>${cfg.desc}</p></div>`;
    // Fill card HTML
    card.onclick = function () { selectPrep(name); };
    // Open subject picker when clicked
    grid.appendChild(card);
    // Append card to grid
  }
  // End of card loop
  document.getElementById("topicCount").textContent = masterSubjectDatabase.length + "+";
  // Update total topics number in hero stats
}
// End of renderPrepCards

fbAuth.onAuthStateChanged(async function (user) {
// Runs automatically on page load and whenever login state changes
  if (user) {
  // User is logged in: sync Firestore profile and unlock the website
    await syncUserToFirestore(0, 0);
    // Load profile from Firestore
    goHome();
    // Unlock the website
  } else {
  // Not logged in: lock everything and force the Login screen
    currentUser = null;
    // Clear profile
    updateNavbarUserUI();
    // Hide Dashboard and user stats
    openAuth("login");
    // Lock the website behind the Login screen
  }
  // End of auth state check
});
// End of Firebase auth listener

function initializeApp() {
// Runs initial UI setup while keeping the website locked until Firebase confirms login
  createParticles();
  // Create animated background particles
  renderPrepCards();
  // Render the 3 B.Tech CSE track cards
  initializeChat();
  // Show the initial Prep AI greeting
  restoreTheme();
  // Apply saved dark/light theme
  openAuth("login");
  // Start strictly on the Login screen
}
// End of initializeApp

initializeApp();
// Run startup function immediately
