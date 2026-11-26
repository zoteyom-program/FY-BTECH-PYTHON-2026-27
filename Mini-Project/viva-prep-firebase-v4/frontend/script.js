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
let aiMode = localStorage.getItem("vivaPrepAiMode") || "super";
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
// Stores live CS trivia questions loaded inside the Questions tab

const PROGRESS_KEY = "vivaPrepProgressV3";
// Key name used to save accurate section-based progress in browser localStorage
const AVATAR_KEY = "vivaPrepAvatarV1";
// Key name used to cache the user's chosen profile picture or emoji avatar

const STUDY_TABS = [
// The 6 real study sections that count toward subject progress (Overview does NOT inflate progress)
  { id: "concepts", label: "📚 Lessons & Concepts" },
  // Section 1: Lessons & Concepts
  { id: "questions", label: "❓ Questions & Live CS" },
  // Section 2: Subject Q&A + Live CS Questions (with answers)
  { id: "revision", label: "⚡ Quick Revision" },
  // Section 3: Quick Revision
  { id: "quiz", label: "📝 Practice Quiz" },
  // Section 4: Practice Quiz
  { id: "pdfviva", label: "📄 PDF Viva AI" },
  // Section 5: PDF Viva AI
  { id: "interview", label: "🎙️ Mock Interview" }
  // Section 6: Mock Interview
];
// End of STUDY_TABS list

const ACHIEVEMENTS = [
// List of all 6 student achievement badges
  { id: "first-step", icon: "🚀", title: "First Step", text: "Complete your first preparation action." },
  // Badge 1: do any 1 study action
  { id: "explorer", icon: "🧭", title: "Explorer", text: "Explore 3 different workspace sections." },
  // Badge 2: visit 3 different study tabs
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
// Master list of all 16 B.Tech CSE subjects and track topics
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

let contentData = {"Data Structures & Algorithms": {"overview": "Organizing data efficiently in memory and designing fast algorithms analyzed with Big-O complexity.", "concepts": [["Arrays & Linked Lists", "Arrays store elements in contiguous memory for O(1) indexing; linked lists use pointers for O(1) insertions and deletions."], ["Stacks & Queues", "Stacks follow LIFO (function calls, undo); queues follow FIFO (CPU scheduling, BFS)."], ["Trees & BST", "Hierarchical data structures; Binary Search Trees allow O(log n) average search, insert, and delete."], ["Graphs & Traversals", "Nodes and edges traversed via BFS (shortest path in unweighted graphs) and DFS (cycle detection, topological sort)."], ["Sorting & Searching", "Binary Search runs in O(log n); Merge Sort and Quick Sort average O(n log n)."]], "revision": [["Big-O Cheat Sheet", "O(1) Hash Lookup < O(log n) Binary Search < O(n) Linear < O(n log n) Merge Sort < O(n^2) Bubble Sort."], ["BFS vs DFS", "BFS uses a Queue (level-order); DFS uses a Stack/Recursion (depth-first)."], ["Hash Tables", "Average O(1) lookup; collisions handled via Chaining or Open Addressing."], ["Dynamic Programming", "Requires Optimal Substructure + Overlapping Subproblems (Memoization or Tabulation)."]], "questions": [{"q": "What is the time complexity of Binary Search and why?", "a": "O(log n), because each comparison eliminates half of the remaining sorted search space."}, {"q": "What is the difference between a Stack and a Queue?", "a": "A Stack is LIFO (Last In, First Out) like recursion/undo, while a Queue is FIFO (First In, First Out) like task scheduling."}, {"q": "When does Quick Sort hit its worst-case O(n^2) time?", "a": "When the pivot is consistently the smallest or largest element (e.g., already sorted array with poor pivot choice)."}, {"q": "Why use a Hash Table over a Binary Search Tree?", "a": "Hash tables give O(1) average lookup, whereas BSTs give O(log n) but keep elements in sorted order."}]}, "Database Management (DBMS)": {"overview": "Storing, querying, normalizing, and protecting structured data reliably using relational databases and SQL.", "concepts": [["Normalization (1NF–BCNF)", "Eliminates data redundancy and update/insert/delete anomalies by decomposing tables cleanly."], ["ACID Properties", "Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent safety), Durability (permanent commit)."], ["SQL Joins", "INNER returns matches; LEFT keeps all left rows; RIGHT keeps all right rows; FULL keeps all rows."], ["Indexing (B+ Trees)", "Speeds up SELECT queries at the cost of extra disk space and slightly slower INSERT/UPDATE."], ["Transactions & Concurrency", "Locks and timestamps prevent dirty reads, non-repeatable reads, and phantom reads."]], "revision": [["Primary vs Foreign Key", "Primary Key uniquely identifies each row (no NULLs); Foreign Key links to another table's Primary Key."], ["DELETE vs TRUNCATE vs DROP", "DELETE removes rows (rollbackable); TRUNCATE clears table fast; DROP deletes the entire table schema."], ["3NF vs BCNF", "3NF removes transitive dependencies; BCNF requires every determinant to be a candidate key."], ["WHERE vs HAVING", "WHERE filters individual rows before GROUP BY; HAVING filters aggregated groups after GROUP BY."]], "questions": [{"q": "Explain the ACID properties of a database transaction.", "a": "Atomicity ensures all steps succeed or none do; Consistency keeps rules valid; Isolation separates concurrent transactions; Durability persists committed data even after crashes."}, {"q": "What is the difference between 3NF and BCNF?", "a": "In 3NF, non-prime attributes cannot depend transitively on keys. BCNF is stricter: for every functional dependency X -> Y, X must be a superkey."}, {"q": "What is the difference between WHERE and HAVING in SQL?", "a": "WHERE filters rows before grouping, whereas HAVING filters groups created by GROUP BY (often with aggregate functions like COUNT or SUM)."}, {"q": "How does a database index speed up queries?", "a": "It builds a sorted data structure (typically a B+ Tree) that lets the database locate matching rows in O(log n) instead of scanning the entire table."}]}, "Operating Systems": {"overview": "Core system software that manages CPU scheduling, memory, processes, threads, file systems, and deadlocks.", "concepts": [["Processes vs Threads", "Processes have isolated memory spaces; threads share memory within a process and switch faster."], ["CPU Scheduling", "FCFS, SJF, Priority, and Round Robin (time quantum) decide which ready process gets the CPU."], ["Deadlocks", "Occurs when processes wait forever for resources held by each other."], ["Virtual Memory & Paging", "Divides memory into fixed-size pages/frames so programs larger than RAM can run smoothly."], ["Synchronization", "Mutexes and Semaphores prevent race conditions inside critical sections."]], "revision": [["4 Deadlock Conditions", "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait (Coffman conditions)."], ["Thrashing", "Excessive page faults causing the OS to spend more time swapping pages than executing code."], ["Paging vs Segmentation", "Paging uses fixed-size blocks (internal fragmentation); Segmentation uses logical variable-size blocks (external fragmentation)."], ["Context Switch", "Saving the PCB (registers, program counter) of the current process and loading the next."]], "questions": [{"q": "What are the four necessary conditions for a deadlock?", "a": "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one prevents deadlock."}, {"q": "What is the difference between a Process and a Thread?", "a": "A process is an independent program with its own address space; a thread is a lightweight execution unit inside a process that shares heap and code memory."}, {"q": "What is Thrashing in Virtual Memory?", "a": "Thrashing happens when a system has too little RAM for active processes, causing constant page faults and disk swapping so CPU utilization collapses."}, {"q": "Difference between a Mutex and a Semaphore?", "a": "A Mutex is a locking mechanism owned by one thread (binary), while a Semaphore is a signaling counter that can allow N threads to access a resource pool."}]}, "Computer Networks": {"overview": "How data moves reliably across local networks and the global Internet via the OSI and TCP/IP models.", "concepts": [["OSI & TCP/IP Models", "7-layer OSI model (Physical to Application) maps to the practical 4-layer TCP/IP stack."], ["TCP vs UDP", "TCP is connection-oriented, reliable, and ordered; UDP is connectionless, faster, and used for streaming/DNS."], ["HTTP, HTTPS & DNS", "HTTP transfers web data; HTTPS adds TLS encryption; DNS translates domain names to IP addresses."], ["IP Addressing & Subnetting", "IPv4 uses 32-bit addresses with CIDR subnet masks to divide networks efficiently."], ["Routing & Switching", "Switches forward frames via MAC addresses (Layer 2); Routers forward packets via IP addresses (Layer 3)."]], "revision": [["TCP 3-Way Handshake", "Client sends SYN -> Server replies SYN-ACK -> Client sends ACK -> Connection established."], ["Common Ports", "HTTP: 80, HTTPS: 443, SSH: 22, DNS: 53, SMTP: 25."], ["Hub vs Switch vs Router", "Hub broadcasts to all (L1); Switch sends to target MAC (L2); Router connects different networks via IP (L3)."], ["ARP Protocol", "Resolves a known IP address to its corresponding physical MAC address on a LAN."]], "questions": [{"q": "Explain the TCP 3-Way Handshake.", "a": "1) Client sends SYN to request a connection. 2) Server replies with SYN-ACK to acknowledge and synchronize. 3) Client sends ACK, establishing a reliable full-duplex session."}, {"q": "What is the difference between TCP and UDP?", "a": "TCP guarantees delivery, ordering, and congestion control via handshakes and ACKs. UDP sends datagrams without guarantees, making it much faster for video calls and gaming."}, {"q": "What happens when you type a URL into a browser?", "a": "DNS resolves the domain to an IP, the browser opens a TCP + TLS handshake, sends an HTTP GET request, and renders the returned HTML/CSS/JS."}, {"q": "What is the role of DNS?", "a": "The Domain Name System translates human-readable domain names (like google.com) into machine-routable IP addresses."}]}, "Python Programming": {"overview": "High-level, dynamically typed language widely used for web backends (FastAPI), scripting, data science, and AI.", "concepts": [["Core Data Structures", "Lists (mutable), Tuples (immutable), Dictionaries (key-value hash maps), Sets (unique items)."], ["Functions & Decorators", "First-class functions, *args/**kwargs, lambda expressions, and decorators that wrap function behavior."], ["Object-Oriented Python", "Classes, __init__, inheritance, encapsulation, and dunder methods (__str__, __len__)."], ["File & Exception Handling", "Using 'with open(...)' for safe file closing and try/except/finally for error handling."], ["Async & FastAPI", "async/await lets Python handle concurrent I/O requests like API calls cleanly."]], "revision": [["List vs Tuple", "Lists use [] and are mutable; Tuples use () and are immutable (faster and hashable)."], ["Shallow vs Deep Copy", "Shallow copy copies outer references; copy.deepcopy() duplicates nested objects too."], ["GIL (Global Interpreter Lock)", "Allows one thread to execute Python bytecode at a time; use multiprocessing for CPU-bound work."], ["Generators (yield)", "Produce items lazily one at a time without loading the entire list into RAM."]], "questions": [{"q": "What is the difference between a list and a tuple in Python?", "a": "A list is mutable (can be modified after creation) and uses [], while a tuple is immutable, slightly faster, uses (), and can be used as a dictionary key."}, {"q": "What is a Python decorator?", "a": "A decorator is a function that takes another function, wraps it with extra behavior (like logging or auth checks), and returns the enhanced function using @syntax."}, {"q": "What is the difference between == and is in Python?", "a": "== checks whether two objects have the same value, whereas 'is' checks whether both variables point to the exact same object in memory."}, {"q": "Why use generators with 'yield'?", "a": "Generators compute values on demand instead of storing the whole sequence in memory, making them ideal for huge files or streams."}]}, "Machine Learning": {"overview": "Algorithms that learn statistical patterns from data to make predictions or decisions without explicit rules.", "concepts": [["Supervised Learning", "Learns from labeled pairs (X, y): Regression predicts continuous values; Classification predicts categories."], ["Unsupervised Learning", "Finds hidden structure in unlabeled data: K-Means clustering and PCA dimensionality reduction."], ["Bias-Variance Tradeoff", "High bias causes underfitting (too simple); high variance causes overfitting (memorizing noise)."], ["Regularization (L1/L2)", "Lasso (L1) drives weak weights to zero (feature selection); Ridge (L2) shrinks weights smoothly."], ["Evaluation Metrics", "Precision, Recall, F1-Score, ROC-AUC for classification; RMSE and R^2 for regression."]], "revision": [["Train / Val / Test Split", "Train fits weights, Validation tunes hyperparameters, Test gives an unbiased final score."], ["Precision vs Recall", "Precision = TP/(TP+FP) (how many predicted positives are right); Recall = TP/(TP+FN) (how many actual positives were caught)."], ["Cross-Validation", "K-Fold splits data into K parts to evaluate generalization reliably on small datasets."], ["Gradient Descent", "Iteratively updates weights in the opposite direction of the loss gradient using learning rate alpha."]], "questions": [{"q": "Explain the Bias-Variance Tradeoff.", "a": "Bias is error from overly simple assumptions (underfitting); variance is error from sensitivity to training noise (overfitting). Good models balance both for low test error."}, {"q": "When should you use F1-Score instead of Accuracy?", "a": "On imbalanced datasets (like fraud or disease detection), accuracy is misleading; F1-score balances Precision and Recall via their harmonic mean."}, {"q": "What is the difference between L1 (Lasso) and L2 (Ridge) regularization?", "a": "L1 adds the sum of absolute weights and produces sparse models (feature selection); L2 adds the sum of squared weights and shrinks coefficients smoothly."}, {"q": "How do you prevent overfitting in a Machine Learning model?", "a": "Use more training data, apply L1/L2 regularization, prune trees, use cross-validation, or simplify model complexity."}]}, "Deep Learning": {"overview": "Multi-layered neural networks that automatically learn hierarchical representations from images, text, and audio.", "concepts": [["Perceptrons & MLPs", "Weighted sums passed through non-linear activation functions (ReLU, Sigmoid, Softmax)."], ["Backpropagation", "Applies the chain rule from output loss backward to compute gradients for every weight."], ["CNNs (Convolutional Nets)", "Use filters and pooling layers to extract spatial features from images."], ["RNNs & Transformers", "Transformers use Self-Attention to process entire sequences in parallel, powering modern LLMs."], ["Dropout & BatchNorm", "Dropout randomly disables neurons during training to reduce overfitting; BatchNorm stabilizes layer inputs."]], "revision": [["Why ReLU?", "ReLU(x) = max(0, x) avoids vanishing gradients and computes much faster than Sigmoid/Tanh."], ["Vanishing Gradient", "Gradients shrink toward zero in deep nets; fixed with ReLU, residual skip connections, and BatchNorm."], ["Adam Optimizer", "Combines Momentum and RMSProp for adaptive per-parameter learning rates."], ["Self-Attention", "Computes Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V to weigh token relationships."]], "questions": [{"q": "Why do neural networks need non-linear activation functions like ReLU?", "a": "Without non-linearity, stacking multiple linear layers collapses mathematically into a single linear transformation, unable to learn complex patterns."}, {"q": "How does Dropout prevent overfitting?", "a": "During each training step, Dropout randomly zeroes out a fraction of neurons so the network cannot rely on any single neuron and learns redundant, generalizable features."}, {"q": "What makes Transformers better than RNNs for long sequences?", "a": "Transformers use self-attention to relate all tokens in parallel in O(1) sequential steps, avoiding RNN bottlenecks and vanishing long-range memory."}, {"q": "What is the role of pooling layers in a CNN?", "a": "Pooling (like Max Pooling) downsamples feature maps to reduce parameter count, speed up computation, and add slight translation invariance."}]}, "Data Science Fundamentals": {"overview": "Turning raw, messy data into actionable insights through cleaning, exploratory analysis, statistics, and visualization.", "concepts": [["Data Cleaning & Wrangling", "Handling missing values (imputation), duplicates, outliers, and inconsistent data types."], ["Exploratory Data Analysis (EDA)", "Summarizing distributions with mean, median, variance, histograms, and correlation matrices."], ["Probability & Distributions", "Normal distribution, Bayes' theorem, Central Limit Theorem, and p-values."], ["Hypothesis Testing", "Null vs alternative hypotheses, t-tests, chi-square tests, and statistical significance (p < 0.05)."], ["Feature Engineering", "One-hot encoding, scaling (StandardScaler/MinMax), and creating domain-specific features."]], "revision": [["Mean vs Median", "Median is robust against extreme outliers; Mean gets pulled toward outliers."], ["Correlation != Causation", "Two variables moving together does not prove one causes the other (confounding variables)."], ["Type I vs Type II Error", "Type I = False Positive (rejecting true H0); Type II = False Negative (failing to reject false H0)."], ["Pandas Essentials", "df.isna().sum(), df.groupby(), df.merge(), df.describe() cover 80% of daily EDA."]], "questions": [{"q": "When should you use Median instead of Mean?", "a": "When the data is skewed or has extreme outliers (like income or house prices), because the median is unaffected by extreme values."}, {"q": "What is a p-value in hypothesis testing?", "a": "The probability of observing results at least as extreme as the sample data assuming the null hypothesis is true. A p-value < 0.05 typically indicates statistical significance."}, {"q": "How do you handle missing values in a dataset?", "a": "Drop rows/columns if very sparse, or impute with mean/median (numeric), mode (categorical), or model-based imputation depending on why data is missing."}, {"q": "Why is feature scaling important?", "a": "Distance- and gradient-based algorithms (KNN, SVM, K-Means, Neural Nets) get dominated by large-scale features unless values are normalized or standardized."}]}, "Cryptography": {"overview": "Securing communication and data integrity using mathematical encryption, hashing, and digital signatures.", "concepts": [["Symmetric Encryption (AES)", "Same secret key encrypts and decrypts data; extremely fast for bulk data."], ["Asymmetric Encryption (RSA/ECC)", "Uses a Public Key to encrypt and a Private Key to decrypt; solves key exchange."], ["Cryptographic Hashing (SHA-256)", "One-way fixed-length digest; tiny input changes produce completely different hashes (avalanche effect)."], ["Digital Signatures & PKI", "Signing a hash with a private key proves authenticity and non-repudiation."], ["Password Hashing (Argon2/bcrypt)", "Uses random salts and intentional slowness to defeat rainbow tables and brute-force attacks."]], "revision": [["CIA Triad", "Confidentiality (encryption), Integrity (hashing/HMAC), Availability (redundancy/DDoS protection)."], ["Encryption vs Hashing", "Encryption is two-way (reversible with a key); Hashing is one-way (irreversible)."], ["HTTPS / TLS", "Uses asymmetric crypto to safely exchange a session key, then symmetric AES for fast encrypted traffic."], ["Salting", "Adds unique random bytes to every password before hashing so identical passwords get different hashes."]], "questions": [{"q": "What is the difference between Symmetric and Asymmetric encryption?", "a": "Symmetric uses one shared key for both encryption and decryption (fast, e.g., AES). Asymmetric uses a public/private key pair (slower, e.g., RSA) for secure key exchange and signatures."}, {"q": "Why should passwords be hashed with Argon2 or bcrypt instead of SHA-256?", "a": "SHA-256 is designed to be ultra-fast, allowing attackers to test billions of guesses per second on GPUs. Argon2/bcrypt are memory-hard and salted to resist brute-force."}, {"q": "How does a Digital Signature work?", "a": "The sender hashes the message and encrypts the hash with their Private Key. Anyone can verify it using the sender's Public Key, proving authenticity and integrity."}, {"q": "How does HTTPS combine symmetric and asymmetric cryptography?", "a": "During the TLS handshake, asymmetric crypto verifies the server certificate and agrees on a symmetric session key; all page data is then encrypted with fast symmetric AES."}]}, "Cloud Computing Architecture": {"overview": "Delivering on-demand, scalable compute, storage, and networking resources over the Internet.", "concepts": [["Service Models (IaaS, PaaS, SaaS)", "IaaS gives raw VMs (EC2); PaaS manages runtime (Render/Heroku); SaaS delivers finished apps (Gmail)."], ["Deployment Models", "Public cloud (AWS/GCP/Azure), Private cloud (dedicated), and Hybrid/Multi-cloud setups."], ["Virtualization & Containers", "Hypervisors run full OS VMs; Docker containers share the host kernel and start in milliseconds."], ["Load Balancing & Auto-Scaling", "Distributes traffic across healthy servers and adds/removes instances based on CPU or request load."], ["Serverless & Object Storage", "Run functions on demand (Cloud Functions/Lambda) and store static files durably in S3/GCS."]], "revision": [["Vertical vs Horizontal Scaling", "Vertical = bigger machine (more RAM/CPU); Horizontal = more machines behind a load balancer."], ["Docker Image vs Container", "An Image is a read-only blueprint (built from a Dockerfile); a Container is a running instance of that image."], ["High Availability", "Deploying across multiple Availability Zones so one data center outage doesn't take the app down."], ["Stateless Services", "Keep session state in Redis/DB/JWT rather than server RAM so any server instance can handle any request."]], "questions": [{"q": "What is the difference between IaaS, PaaS, and SaaS?", "a": "IaaS provides virtual hardware (VMs/storage), PaaS provides a managed deployment platform where you only bring code, and SaaS provides ready-to-use software over the web."}, {"q": "How are Docker Containers different from Virtual Machines?", "a": "VMs virtualize hardware and boot a full guest OS per VM (heavy). Containers share the host OS kernel and isolate processes, making them lightweight and fast to start."}, {"q": "Difference between Horizontal and Vertical scaling?", "a": "Vertical scaling upgrades one server's CPU/RAM (hits hardware limits). Horizontal scaling adds more servers behind a load balancer for near-infinite scale and fault tolerance."}, {"q": "Why should cloud backend servers be stateless?", "a": "Stateless servers store user data in shared databases or tokens instead of local memory, allowing load balancers to route requests to any instance seamlessly."}]}, "System Design": {"overview": "Architecting reliable, scalable distributed systems that handle millions of users with low latency.", "concepts": [["Load Balancers & Reverse Proxies", "Distribute incoming traffic (Round Robin, Least Connections) and handle SSL termination."], ["Caching (Redis / CDN)", "Store hot data in RAM (Redis) and static assets near users (CDN) to cut database load."], ["Database Sharding & Replication", "Read replicas scale reads; horizontal sharding splits huge write-heavy tables across servers."], ["Message Queues (Kafka / RabbitMQ)", "Decouple slow background jobs (emails, video processing) from fast user-facing APIs."], ["CAP Theorem", "Under a network Partition (P), a distributed system must trade off Consistency (C) vs Availability (A)."]], "revision": [["SQL vs NoSQL", "Use SQL for strict ACID relations/joins; NoSQL for massive horizontal write scale or flexible schemas."], ["Rate Limiting", "Token Bucket or Sliding Window algorithms protect APIs from abuse and DDoS spikes."], ["Cache Eviction", "LRU (Least Recently Used) is the most common policy when cache RAM fills up."], ["Consistent Hashing", "Minimizes key remapping when servers are added or removed in distributed caches/shards."]], "questions": [{"q": "Explain the CAP Theorem in distributed systems.", "a": "A distributed store can guarantee at most two of Consistency, Availability, and Partition Tolerance. Since network partitions are unavoidable, systems choose CP or AP."}, {"q": "How does a CDN improve website performance?", "a": "A Content Delivery Network caches static assets (images, CSS, JS) on edge servers geographically close to users, drastically reducing latency and origin server load."}, {"q": "When would you introduce a Message Queue like Kafka?", "a": "When tasks are slow or spiky (like sending emails, generating PDFs, or analytics) so the API can respond immediately while worker services process jobs asynchronously."}, {"q": "What is the difference between Database Replication and Sharding?", "a": "Replication copies the same data to multiple servers to scale reads and redundancy. Sharding splits different rows across servers to scale massive storage and writes."}]}, "Advanced DSA": {"overview": "Interview-focused problem-solving patterns for top product companies: DP, Graphs, Tries, and Heaps.", "concepts": [["Sliding Window & Two Pointers", "Turns O(n^2) subarray and string problems into clean O(n) single-pass solutions."], ["Heaps / Priority Queues", "Solves Top-K elements, median streams, and Dijkstra's shortest path in O(log n) per op."], ["Tries (Prefix Trees)", "Ultra-fast O(L) word search, autocomplete, and dictionary prefix matching."], ["Dynamic Programming Patterns", "0/1 Knapsack, Longest Common Subsequence, Coin Change, and DP on grids/trees."], ["Union-Find (DSU)", "Tracks connected components and detects cycles in near O(1) with path compression and union by rank."]], "revision": [["Dijkstra vs Bellman-Ford", "Dijkstra is O((V+E) log V) for non-negative weights; Bellman-Ford handles negative weights in O(VE)."], ["Monotonic Stack", "Solves Next Greater Element and Largest Rectangle in Histogram in O(n) time."], ["Backtracking Template", "Choose -> Explore recursively -> Unchoose (undo state) for permutations, N-Queens, Sudoku."], ["Binary Search on Answer", "Apply binary search when the answer space is monotonic (e.g., minimum capacity to ship in D days)."]], "questions": [{"q": "When should you use the Sliding Window technique?", "a": "When asked for a contiguous subarray or substring meeting a condition (like max sum of size K or longest substring without repeating characters) in O(n) time."}, {"q": "Why does Dijkstra's algorithm fail with negative edge weights?", "a": "Dijkstra greedily assumes once a node's shortest distance is finalized it cannot be improved, which breaks if a later negative edge reduces the path cost."}, {"q": "What is the time complexity of Union-Find with path compression and union by rank?", "a": "O(alpha(N)) amortized per operation, where alpha is the inverse Ackermann function (effectively O(1) for all practical inputs)."}, {"q": "How do you recognize a Dynamic Programming problem?", "a": "Look for optimization/counting prompts ('min cost', 'number of ways') where choices overlap into repeated subproblems."}]}, "Quantitative Aptitude": {"overview": "Fast mental math, probability, permutations, ratios, and logical reasoning for placement online assessments.", "concepts": [["Percentages, Profit & Loss", "Successive percentage change: a + b + (ab)/100; SP = CP * (1 + profit%/100)."], ["Time, Speed & Distance", "Average speed for equal distances = 2xy/(x+y); relative speed adds in opposite directions."], ["Time & Work", "If A finishes in x days, 1 day's work is 1/x; use LCM method to avoid fractions."], ["Permutations & Combinations", "nPr = n!/(n-r)! (order matters); nCr = n!/(r!(n-r)!) (selection only)."], ["Probability", "P(E) = Favorable / Total; P(at least one) = 1 - P(none)."]], "revision": [["LCM Method for Work", "Assume Total Work = LCM of days so daily efficiencies become simple whole numbers."], ["km/h to m/s", "Multiply by 5/18 to convert km/h to m/s; multiply by 18/5 for the reverse."], ["Simple vs Compound Interest", "SI = PRT/100; CI = P(1 + R/100)^T - P."], ["Pigeonhole Principle", "If N+1 items go into N boxes, at least one box contains 2 or more items."]], "questions": [{"q": "A car travels from A to B at 40 km/h and returns at 60 km/h. What is its average speed?", "a": "48 km/h. Using 2xy/(x+y) = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 km/h."}, {"q": "A can finish a job in 12 days and B in 6 days. How long will they take together?", "a": "4 days. Assume total work = 12 units (A=1/day, B=2/day). Together = 3 units/day -> 12/3 = 4 days."}, {"q": "What is the probability of getting at least one head in 3 coin tosses?", "a": "7/8. P(at least one head) = 1 - P(all tails) = 1 - (1/2)^3 = 1 - 1/8 = 7/8."}, {"q": "In how many ways can 3 students be chosen from a group of 6?", "a": "20 ways. Order doesn't matter, so 6C3 = (6 * 5 * 4) / (3 * 2 * 1) = 20."}]}, "Blockchain & Smart Contracts": {"overview": "Decentralized, tamper-evident ledgers and self-executing Solidity smart contracts on EVM networks.", "concepts": [["Blocks & Cryptographic Hashing", "Each block stores transactions and the previous block's hash, making history tamper-evident."], ["Consensus (PoW vs PoS)", "Proof of Work uses computational mining; Proof of Stake secures the network via staked validators."], ["Smart Contracts (Solidity)", "Immutable programs deployed on-chain that execute automatically when conditions are met."], ["Gas & EVM", "Every EVM operation costs Gas to prevent infinite loops and spam on the network."], ["Web3 Wallets & IPFS", "Wallets sign transactions with private keys; IPFS stores large files off-chain by content hash."]], "revision": [["Reentrancy Attack", "Prevent by following Checks-Effects-Interactions pattern or using OpenZeppelin ReentrancyGuard."], ["Public vs Private Blockchain", "Public (Ethereum) is permissionless; Private/Consortium (Hyperledger) restricts participants."], ["Merkle Tree", "Allows verifying whether a transaction belongs to a block in O(log n) hash checks."], ["ERC-20 vs ERC-721", "ERC-20 is for fungible tokens; ERC-721 is for unique non-fungible tokens (NFTs)."]], "questions": [{"q": "Why is a blockchain considered tamper-evident?", "a": "Each block contains the cryptographic hash of the previous block. Altering any past transaction changes its hash and invalidates every subsequent block in the chain."}, {"q": "What is Gas in Ethereum?", "a": "Gas measures the computational work required to run a transaction or smart contract on the EVM, paid by users to prevent spam and reward validators."}, {"q": "What is a Reentrancy attack and how do you prevent it?", "a": "An attacker contract repeatedly calls back into a vulnerable function before balances are updated. Prevent it with Checks-Effects-Interactions (update state before sending ETH) and ReentrancyGuard."}, {"q": "Why store large files on IPFS instead of directly on the blockchain?", "a": "On-chain storage is replicated across every node and costs huge Gas fees; IPFS stores the file off-chain and puts only its small content hash (CID) on-chain."}]}, "LLM Prompt Engineering": {"overview": "Designing reliable prompts, RAG pipelines, token optimization, and evaluation loops for LLM applications.", "concepts": [["Zero-Shot & Few-Shot Prompting", "Zero-shot asks directly; Few-shot provides 2–5 input/output examples to lock in format and quality."], ["Chain-of-Thought (CoT)", "Asking the model to reason step-by-step dramatically improves math and logic accuracy."], ["RAG (Retrieval-Augmented Generation)", "Embeds documents into a vector DB and injects top-K relevant chunks into the prompt to cut hallucinations."], ["Token Optimization & Caching", "Compressing context, routing simple queries to smaller models, and semantic caching lower API latency and cost."], ["Structured Outputs & Guardrails", "Enforcing strict JSON schemas and validating outputs before displaying them to users."]], "revision": [["Temperature Parameter", "Low (0.0–0.2) = deterministic/factual; High (0.7–1.0) = creative/varied."], ["Hallucination Fixes", "Use RAG with citations, lower temperature, and instruct the model to say 'I don't know' when context lacks answers."], ["Model Routing", "Send easy queries to fast/cheap models (e.g., 20B) and hard reasoning to larger models (e.g., 120B)."], ["Context Window", "The maximum input + output tokens a model can attend to in a single request."]], "questions": [{"q": "How does RAG reduce LLM hallucinations?", "a": "RAG retrieves verified chunks from your own knowledge base and includes them in the prompt, grounding the LLM's answer in real source text rather than guesswork."}, {"q": "What does the Temperature parameter control?", "a": "Temperature controls randomness in token sampling: near 0 produces focused, repeatable answers for coding/facts, while higher values produce more creative outputs."}, {"q": "How can you reduce LLM API costs in production?", "a": "Combine semantic caching for repeated queries, prompt/context compression, and smart query routing that sends simple prompts to smaller, cheaper models."}, {"q": "What is Few-Shot prompting?", "a": "Including a handful of worked input-output examples inside the prompt so the model mirrors the exact tone, logic, and output format you want."}]}, "SIH Pitching & Viva": {"overview": "Structuring winning hackathon demos, defending architecture choices, and answering judge cross-questions clearly.", "concepts": [["Problem -> Solution -> Impact", "Open with a 20-second real-world pain point, show the live working prototype, then quantify measurable impact."], ["Architecture Clarity", "Be ready to draw your Frontend -> Backend API -> Database -> AI pipeline on a whiteboard."], ["USP & Feasibility", "Explain clearly what makes your solution better than existing tools and how it scales affordably."], ["Handling Tough Judge Questions", "Answer directly in 30 seconds: core point -> concrete metric or trade-off -> honest next step."], ["Live Demo Backup Plan", "Always keep a 60-second screen recording and offline fallback in case venue Wi-Fi drops."]], "revision": [["3-Minute Pitch Split", "30s Problem + 90s Live Demo + 30s Tech Architecture + 30s Business/Social Impact."], ["Top Judge Question", "'How is this different from just asking ChatGPT?' -> Highlight domain workflow, auth/persistence, and cost/speed optimization."], ["Security Basics", "Never hardcode API keys in GitHub repos; use .env files and token-based authentication."], ["Team Coordination", "Assign clear roles: 1 speaker for problem/demo, 1 for tech Q&A—never talk over teammates."]], "questions": [{"q": "How is your project different from just using a generic AI chatbot?", "a": "It wraps AI inside a structured B.Tech CSE workflow with mandatory auth, syllabus PDF extraction, progress/XP tracking, mock interview grading, and persistent shared notes."}, {"q": "How do you keep your API keys and user data secure?", "a": "API keys are stored strictly in server-side .env files (excluded via .gitignore), and every backend API route requires a verified authentication Bearer token."}, {"q": "What happens if the AI API rate-limits or goes down during live usage?", "a": "The backend rotates across backup API keys, falls back from the larger model to the faster model, and returns graceful fallback responses so the app never crashes."}, {"q": "How would you scale this project for 10,000 students?", "a": "Containerize with Docker behind a load balancer, cache shared subject content and common AI queries, and rely on Firebase Auth/Firestore for elastic user data scaling."}]}};
// Pre-loaded study notes, quick revision points, and Q&A with answers for all 16 subjects (synced with backend/content_cache.json)

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

async function loadSharedSubjectContent() {
// Loads the permanently saved shared study content from backend/content_cache.json so every user sees all AI-fetched notes
  if (!isLoggedIn()) return;
  // Only fetch after login
  try {
  // Request shared cache from backend
    const res = await fetch("/api/subject-content", { headers: await getAuthHeaders() });
    // Send GET request
    const payload = await res.json();
    // Parse JSON response
    if (res.ok && payload.content) {
    // Merge shared server notes into local contentData
      contentData = Object.assign({}, contentData, payload.content);
      // Keep every subject up to date
    }
    // End of merge check
  } catch (error) {
  // Keep built-in 16-subject data if backend is offline
  }
  // End of try/catch
}
// End of loadSharedSubjectContent

async function fetchMoreSubjectContentWithAI(activeTab) {
// Calls Groq AI to fetch additional Lessons, Quick Revision, and Q&A with answers, and saves them permanently for everyone
  if (!requireLogin()) return;
  // Block if not logged in
  const targetSubject = selectedSubjects[0];
  // Use the primary selected subject
  if (!targetSubject) return;
  // Stop if no subject selected
  showToast("Fetching fresh study material with AI for everyone...");
  // Show loading toast
  try {
  // Call backend AI enrichment endpoint
    const result = await postJson("/api/subject-content/fetch", { subject: targetSubject });
    // Wait for AI response and permanent save
    if (result.ok && result.data.data) {
    // Update local contentData immediately
      contentData[targetSubject] = result.data.data;
      // Save updated subject data
      if (result.data.tokens_used) syncUserToFirestore(0, result.data.tokens_used);
      // Track AI tokens used on Dashboard
      showToast("Saved permanently for all students!");
      // Confirm permanent save
      showContent(activeTab);
      // Refresh current tab to show newly added items
    } else {
    // Inform user if AI could not respond
      showToast("AI fetch failed. Check backend/.env Groq key.");
      // Show error toast
    }
    // End of result check
  } catch (error) {
  // Handle offline backend
    showToast("Could not connect to Python backend.");
    // Show error toast
  }
  // End of try/catch
}
// End of fetchMoreSubjectContentWithAI

function renderAvatarInto(containerEl, avatarVal) {
// Renders either an uploaded image data URL or an emoji inside an avatar element
  if (!containerEl) return;
  // Safety check
  const val = avatarVal || localStorage.getItem(AVATAR_KEY) || "👤";
  // Pick provided avatar, saved avatar, or default icon
  if (val.startsWith("data:image")) {
  // Render uploaded photo
    containerEl.innerHTML = `<img src="${val}" alt="Profile picture">`;
    // Insert photo tag
  } else {
  // Render emoji or icon
    containerEl.textContent = val;
    // Set text icon
  }
  // End of image check
}
// End of renderAvatarInto

function updateAvatarDisplays(avatarVal) {
// Updates both the compact navbar avatar button and the profile drawer preview
  renderAvatarInto(document.getElementById("navAvatarDisplay"), avatarVal);
  // Update navbar icon
  renderAvatarInto(document.getElementById("drawerAvatarPreview"), avatarVal);
  // Update drawer preview
}
// End of updateAvatarDisplays

function openProfileDrawer() {
// Opens the right-side Profile, Settings, and Logout slider drawer
  if (!requireLogin()) return;
  // Only logged-in students can open the drawer
  const drawer = document.getElementById("profileDrawer");
  // Drawer element
  const backdrop = document.getElementById("profileBackdrop");
  // Dimmed backdrop
  document.getElementById("drawerUserName").textContent = (currentUser && currentUser.name) || "Student";
  // Fill user name
  document.getElementById("drawerUserEmail").textContent = (currentUser && currentUser.email) || "";
  // Fill user email
  document.getElementById("settingsNameInput").value = (currentUser && currentUser.name) || "";
  // Pre-fill display name setting
  document.getElementById("drawerAiModeSelect").value = aiMode;
  // Sync default AI mode dropdown
  updateDrawerThemeButton();
  // Sync theme button label
  updateAvatarDisplays(currentUser ? currentUser.avatar : null);
  // Sync profile picture
  backdrop.classList.remove("hidden");
  // Show backdrop
  drawer.classList.add("open");
  // Slide drawer into view
  drawer.setAttribute("aria-hidden", "false");
  // Mark accessible
}
// End of openProfileDrawer

function closeProfileDrawer() {
// Closes the right-side Profile & Settings slider drawer
  const drawer = document.getElementById("profileDrawer");
  // Drawer element
  const backdrop = document.getElementById("profileBackdrop");
  // Backdrop element
  drawer.classList.remove("open");
  // Slide drawer out of view
  backdrop.classList.add("hidden");
  // Hide backdrop
  drawer.setAttribute("aria-hidden", "true");
  // Mark hidden for screen readers
}
// End of closeProfileDrawer

function handleAvatarUpload(event) {
// Resizes an uploaded profile photo on a canvas and saves it to localStorage + Firestore
  const file = event.target.files && event.target.files[0];
  // Grab selected image file
  if (!file) return;
  // Stop if cancelled
  const reader = new FileReader();
  // Create file reader
  reader.onload = function (e) {
  // Runs once image bytes are read
    const img = new Image();
    // Create image object
    img.onload = async function () {
    // Resize image to a small 160x160 square JPEG so Firestore stores it easily
      const canvas = document.createElement("canvas");
      // Create offscreen canvas
      canvas.width = 160;
      // Set target width
      canvas.height = 160;
      // Set target height
      const ctx = canvas.getContext("2d");
      // Get 2D drawing context
      const size = Math.min(img.width, img.height);
      // Compute square center crop size
      const sx = (img.width - size) / 2;
      // Horizontal crop offset
      const sy = (img.height - size) / 2;
      // Vertical crop offset
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
      // Draw cropped square photo
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      // Export compact JPEG data URL
      await saveAvatarValue(dataUrl);
      // Persist avatar
      showToast("Profile picture updated!");
      // Confirm update
    };
    // End of img.onload
    img.src = e.target.result;
    // Load image data
  };
  // End of reader.onload
  reader.readAsDataURL(file);
  // Start reading uploaded file
}
// End of handleAvatarUpload

async function setPresetAvatar(emoji) {
// Sets one of the quick preset emoji avatars
  await saveAvatarValue(emoji);
  // Save preset emoji
  showToast("Avatar updated!");
  // Show toast
}
// End of setPresetAvatar

async function saveAvatarValue(avatarVal) {
// Saves the chosen avatar to localStorage and Cloud Firestore
  localStorage.setItem(AVATAR_KEY, avatarVal);
  // Save locally for instant load
  updateAvatarDisplays(avatarVal);
  // Update navbar and drawer immediately
  const user = fbAuth.currentUser;
  // Check logged-in user
  if (user) {
  // Save avatar in Firestore user document
    try {
    // Update Firestore profile
      await fbDb.collection("users").doc(user.uid).set({ avatar: avatarVal }, { merge: true });
      // Merge avatar field
      if (currentUser) currentUser.avatar = avatarVal;
      // Keep local profile object synced
    } catch (error) {
    // Keep local avatar even if Firestore fails
    }
    // End of try/catch
  }
  // End of user check
}
// End of saveAvatarValue

async function saveDisplayName() {
// Updates the student's display name in Firebase Auth and Cloud Firestore
  const newName = document.getElementById("settingsNameInput").value.trim();
  // Read new name
  if (!newName) return showToast("Please enter a valid name.");
  // Reject blank name
  const user = fbAuth.currentUser;
  // Current Firebase user
  if (!user) return;
  // Stop if not logged in
  try {
  // Save name to Firebase Auth + Firestore
    await user.updateProfile({ displayName: newName });
    // Update Firebase Auth profile
    await fbDb.collection("users").doc(user.uid).set({ name: newName }, { merge: true });
    // Update Firestore document
    if (currentUser) currentUser.name = newName;
    // Update local user object
    document.getElementById("drawerUserName").textContent = newName;
    // Update drawer heading
    showToast("Display name saved!");
    // Show confirmation toast
  } catch (error) {
  // Show error if update failed
    showToast("Could not update name.");
    // Display error toast
  }
  // End of try/catch
}
// End of saveDisplayName

function updateDrawerThemeButton() {
// Keeps the Appearance button inside the slider synced with Dark/Light mode
  const btn = document.getElementById("drawerThemeBtn");
  // Drawer theme button
  if (!btn) return;
  // Safety check
  const isLight = document.body.classList.contains("light");
  // Check active theme
  btn.textContent = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
  // Set matching label
}
// End of updateDrawerThemeButton

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
      avatar: localStorage.getItem(AVATAR_KEY) || "👤",
      // Profile picture or avatar icon
      last_active: today
      // Today's date
    };
    // End of default profile
    if (snap.exists) {
    // Load existing Firestore profile if found
      profile = Object.assign(profile, snap.data());
      // Merge saved fields
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
    // Add used AI tokens
    await docRef.set(profile, { merge: true });
    // Save updated profile back to Firestore
    currentUser = profile;
    // Update global profile
    if (profile.avatar) localStorage.setItem(AVATAR_KEY, profile.avatar);
    // Cache avatar locally
    updateNavbarUserUI();
    // Refresh navbar compact profile icon
    renderDashboard();
    // Refresh dashboard including Tokens Used card
  } catch (error) {
  // Log Firestore errors to console
    console.error("Firestore sync error:", error);
    // Print error
  }
  // End of try/catch
}
// End of syncUserToFirestore

function updateNavbarUserUI() {
// Shows or hides Dashboard, compact profile avatar button, Login, and Sign Up buttons
  const profileBtn = document.getElementById("profileTriggerBtn");
  // Compact profile avatar trigger button
  const dashBtn = document.getElementById("navDashBtn");
  // Grab Dashboard button
  const loginBtn = document.getElementById("navLoginBtn");
  // Grab Login button
  const signupBtn = document.getElementById("navSignupBtn");
  // Grab Sign Up button

  if (!currentUser || !fbAuth.currentUser) {
  // Hide Dashboard and profile icon when logged out
    profileBtn.classList.add("hidden");
    // Hide compact profile button
    dashBtn.classList.add("hidden");
    // Hide Dashboard button
    loginBtn.classList.remove("hidden");
    // Show Login button
    signupBtn.classList.remove("hidden");
    // Show Sign Up button
    return;
    // Stop here
  }
  // End of logged-out branch

  updateAvatarDisplays(currentUser.avatar);
  // Display current user's photo or icon inside the compact button
  profileBtn.classList.remove("hidden");
  // Show compact profile icon button
  dashBtn.classList.remove("hidden");
  // Show Dashboard button
  loginBtn.classList.add("hidden");
  // Hide Login button
  signupBtn.classList.add("hidden");
  // Hide Sign Up button
}
// End of updateNavbarUserUI

async function logoutUser() {
// Logs the student out, closes the drawer, and locks the website back to Login
  closeProfileDrawer();
  // Close slider drawer
  await fbAuth.signOut();
  // Sign out from Firebase
  currentUser = null;
  // Clear user profile
  updateNavbarUserUI();
  // Hide Dashboard and profile button
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
      await fbDb.collection("users").doc(cred.user.uid).set({ name: name, email: email, streak: 1, xp: 10, tokens_used: 0, avatar: "👤", last_active: todayKey() });
      // Create Firestore document with 10 starter XP
      await syncUserToFirestore(0, 0);
      // Sync profile
      await loadSharedSubjectContent();
      // Load shared subject content from server
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
      await loadSharedSubjectContent();
      // Load shared subject content from server
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

function getSubjectViewedTabs(progressData, subjectName) {
// Returns the array of actually viewed study tabs for a given subject
  const sub = progressData.subjects && progressData.subjects[subjectName];
  // Look up subject record
  if (!sub || !Array.isArray(sub.viewedTabs)) return [];
  // Brand new or unviewed subject returns empty array (0%)
  return sub.viewedTabs;
  // Return list of viewed study tab IDs
}
// End of getSubjectViewedTabs

function getSubjectProgressPercent(progressData, subjectName) {
// Calculates accurate 0% to 100% progress based ONLY on real study sections viewed
  const viewed = getSubjectViewedTabs(progressData, subjectName);
  // Count viewed study tabs
  return Math.round((viewed.length / STUDY_TABS.length) * 100);
  // 0 viewed = 0%, all 6 viewed = 100%
}
// End of getSubjectProgressPercent

function markStudyTabViewed(tabId, subjectsList) {
// Marks a real study tab as viewed for the active subjects and awards XP only when genuinely studying
  if (!isLoggedIn()) return;
  // Ignore if not logged in
  const isRealStudyTab = STUDY_TABS.some(function (t) { return t.id === tabId; });
  // Check if tabId is one of the 6 real study tabs (never Overview!)
  if (!isRealStudyTab) return;
  // Do NOT inflate progress for Overview

  const data = loadProgress();
  // Load current progress
  const today = todayKey();
  // Today's date

  if (data.lastActive !== today) {
  // Update daily streak
    if (!data.lastActive) data.streak = 1;
    // Start 1-day streak
    else if (dateDiff(data.lastActive, today) === 1) data.streak = data.streak + 1;
    // Increment consecutive day streak
    else data.streak = 1;
    // Reset streak if a day was missed
    data.lastActive = today;
    // Mark today as active
  }
  // End of streak update

  let newlyViewedCount = 0;
  // Track if this is a brand new section visit
  for (let i = 0; i < subjectsList.length; i++) {
  // Update each currently selected subject
    const subName = subjectsList[i];
    // Subject name
    if (!data.subjects[subName]) {
    // Initialize subject entry with 0 viewed tabs
      data.subjects[subName] = { viewedTabs: [], progress: 0 };
      // Clean initial state
    }
    // End of init
    if (!Array.isArray(data.subjects[subName].viewedTabs)) {
    // Ensure viewedTabs array exists
      data.subjects[subName].viewedTabs = [];
      // Create array
    }
    // End of array guard
    if (!data.subjects[subName].viewedTabs.includes(tabId)) {
    // Record this study section as completed
      data.subjects[subName].viewedTabs.push(tabId);
      // Add tab ID
      newlyViewedCount = newlyViewedCount + 1;
      // Count new completion
    }
    // End of unique tab check
    data.subjects[subName].progress = getSubjectProgressPercent(data, subName);
    // Compute exact percentage out of 6 study sections
    const secKey = subName + "::" + tabId;
    // Global unique section key for Explorer badge
    if (!data.sections.includes(secKey)) data.sections.push(secKey);
    // Save unique section visit
  }
  // End of subjects loop

  const gainedXp = newlyViewedCount > 0 ? 10 : 0;
  // Award +10 XP the first time a student completes a section
  if (newlyViewedCount > 0) {
  // Record activity when a new section is studied
    data.totalActions = data.totalActions + 1;
    // Increment total study actions
    data.xp = data.xp + gainedXp;
    // Add XP locally
    data.activity[today] = (data.activity[today] || 0) + 1;
    // Increment today's bar on the 7-day chart
  }
  // End of new-visit check

  if (subjectsList.length > 0) data.lastSubject = subjectsList[0];
  // Remember last studied subject
  if (selectedPrep) data.lastPath = selectedPrep;
  // Remember active track
  data.lastTab = tabId;
  // Remember last tab
  saveProgress(data);
  // Save to localStorage

  if (gainedXp > 0) syncUserToFirestore(gainedXp, 0);
  // Sync XP to Firestore if earned
  else renderDashboard();
  // Refresh dashboard
}
// End of markStudyTabViewed

function markQuizMetric(action, value) {
// Records quiz XP, quiz completion count, and best quiz score without faking unviewed sections
  if (!isLoggedIn()) return;
  // Ignore if not logged in
  const data = loadProgress();
  // Load local progress
  const today = todayKey();
  // Today's date
  const gainedXp = action === "quiz-correct" ? 20 : action === "quiz-complete" ? 40 : 0;
  // Quiz XP rewards
  if (gainedXp > 0) {
  // Add XP and activity
    data.xp = data.xp + gainedXp;
    // Add XP
    data.totalActions = data.totalActions + 1;
    // Increment actions
    data.activity[today] = (data.activity[today] || 0) + 1;
    // Increment chart bar
  }
  // End of XP check
  if (action === "quiz-complete") data.quizCompleted = data.quizCompleted + 1;
  // Track completed quizzes
  if (action === "quiz-score") data.bestQuiz = Math.max(data.bestQuiz || 0, value || 0);
  // Track best score
  saveProgress(data);
  // Save locally
  if (gainedXp > 0) syncUserToFirestore(gainedXp, 0);
  // Sync XP to Firestore
  else renderDashboard();
  // Refresh dashboard
}
// End of markQuizMetric

function getOverallProgress() {
// Computes the average accurate completion percentage across all started subjects
  const data = loadProgress();
  // Load saved progress
  const keys = Object.keys(data.subjects || {});
  // List of subjects with progress entries
  if (keys.length === 0) return 0;
  // Return 0% if no subjects started
  let total = 0;
  // Sum of percentages
  for (let i = 0; i < keys.length; i++) {
  // Loop through each started subject
    total = total + getSubjectProgressPercent(data, keys[i]);
    // Add accurate percentage
  }
  // End of loop
  return Math.round(total / keys.length);
  // Return rounded average
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
// Updates XP, Streak, Tokens Used, Progress, Achievements, ring, and weekly bars on the dashboard
  const data = loadProgress();
  // Load local progress
  const progress = getOverallProgress();
  // Calculate accurate overall percentage
  const displayXP = currentUser ? Math.max(currentUser.xp || 0, data.xp) : data.xp;
  // Show highest XP
  const displayStreak = currentUser ? Math.max(currentUser.streak || 0, data.streak) : data.streak;
  // Show highest streak
  const displayTokens = currentUser ? (currentUser.tokens_used || 0) : 0;
  // Live AI tokens used from Firestore
  const unlocked = getUnlockedAchievements(data, displayXP, displayStreak);
  // Compute unlocked achievements

  document.getElementById("dashXP").textContent = displayXP;
  // Update XP card
  document.getElementById("dashStreak").textContent = displayStreak + (displayStreak === 1 ? " day" : " days");
  // Update streak card
  document.getElementById("dashTokens").textContent = displayTokens.toLocaleString();
  // Update Tokens Used card on the dashboard
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
    const subProg = getSubjectProgressPercent(data, data.lastSubject);
    // Get accurate subject progress
    document.getElementById("continueMeta").textContent = `${subProg}% completed • Continue from your saved preparation workspace.`;
    // Show accurate completion
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

  const challengeDone = data.totalActions > 0;
  // Check if student has completed at least 1 real study action
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
  document.getElementById("signalText").textContent = progress > 0 ? `${data.totalActions} study actions recorded. Keep stacking small wins.` : "Your first workspace study section will begin building your preparation profile.";
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
// Returns full study concepts, quick revision notes, and Q&A with answers for a subject
  if (contentData[subject]) return contentData[subject];
  // Return cached rich notes for this subject
  return {
  // Safe fallback if a brand new subject is ever added
    overview: subject + " is a core B.Tech CSE preparation topic.",
    // Overview
    concepts: [["Fundamentals", "Click 'Fetch More with AI' to generate permanent study notes for this subject."]],
    // Concepts
    revision: [["Quick Tip", "Click 'Fetch More with AI' to populate permanent quick revision bullets."]],
    // Revision
    questions: [{ q: "What is the core principle of " + subject + "?", a: "Click 'Fetch More with AI' above to generate model Q&A saved for everyone." }]
    // Q&A
  };
  // End of fallback
}
// End of getData

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
  renderDashboard();
  // Refresh dashboard metrics
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
// Opens the study workspace on Overview WITHOUT falsely inflating progress to 20%
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
  // Save primary subject (does NOT add fake progress!)
  saveProgress(pd);
  // Save to localStorage

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
  // Render sidebar tabs (Overview + 6 study sections)
  showContent("overview");
  // Open Overview tab first (shows true 0% until sections are viewed)
  showAI();
  // Keep floating AI visible
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Scroll to top
}
// End of openWorkspace

function renderTabs() {
// Builds the clean sidebar tabs (Overview + 6 real study tabs)
  const sidebar = document.getElementById("workspaceTabs");
  // Sidebar container
  sidebar.innerHTML = "";
  // Clear old tabs
  const tabs = [
  // Sidebar navigation tabs
    ["overview", "📊 Overview"],
    // Connected Overview tab
    ["concepts", "📚 Lessons & Concepts"],
    // Lessons & Concepts tab
    ["questions", "❓ Questions & Live CS"],
    // Combined Subject Q&A + Live CS Questions tab (with answers question-wise)
    ["revision", "⚡ Quick Revision"],
    // Quick Revision tab
    ["quiz", "📝 Practice Quiz"],
    // Interactive Quiz tab
    ["pdfviva", "📄 PDF Viva AI"],
    // PDF Viva AI tab
    ["interview", "🎙️ Mock Interview"]
    // Mock Interview tab
  ];
  // End of tabs array

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
    btn.dataset.tab = tabId;
    // Store tab ID for programmatic switching from Overview checklist
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
// Switches the active workspace tab, renders its panel, and accurately tracks viewed study sections
  if (!requireLogin()) return;
  // Block if not logged in
  const allTabs = document.querySelectorAll(".tab-btn");
  // Find all tab buttons
  for (let i = 0; i < allTabs.length; i++) {
  // Clear active highlight from all tabs
    allTabs[i].classList.remove("active");
    // Remove active class
    if (!clickedBtn && allTabs[i].dataset.tab === type) {
    // Highlight matching tab when switched programmatically
      allTabs[i].classList.add("active");
      // Highlight matching tab
    }
    // End of auto-highlight check
  }
  // End of loop
  if (clickedBtn) clickedBtn.classList.add("active");
  // Highlight clicked tab

  const box = document.getElementById("workspaceContent");
  // Main workspace content panel
  if (type !== "overview" && type !== "quiz") {
  // Only mark real study sections as viewed (Quiz marks itself viewed upon completion)
    markStudyTabViewed(type, selectedSubjects);
    // Record real progress accurately
  }
  // End of study tracking check

  if (type === "overview") renderOverview(box);
  // Show Overview
  if (type === "concepts") renderConcepts(box);
  // Show Concepts
  if (type === "questions") renderQuestions(box);
  // Show Questions + Live CS Questions (with answers)
  if (type === "revision") renderRevision(box);
  // Show Quick Revision
  if (type === "quiz") startQuiz(box);
  // Show Quiz
  if (type === "pdfviva") renderPdfViva(box);
  // Show PDF Viva
  if (type === "interview") renderMockInterview(box);
  // Show Mock Interview
}
// End of showContent

function renderOverview(box) {
// Renders the connected Overview tab showing true per-subject progress (0% if unviewed) and a clickable 6-section checklist
  const saved = loadProgress();
  // Load saved progress
  let subjectBoxes = "";
  // HTML for each subject's card + checklist
  let progSum = 0;
  // Sum of progress percentages

  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through chosen subjects
    const s = selectedSubjects[i];
    // Subject name
    const subProg = getSubjectProgressPercent(saved, s);
    // Accurate percentage (0% until real sections are opened)
    const viewed = getSubjectViewedTabs(saved, s);
    // List of viewed study tab IDs
    progSum = progSum + subProg;
    // Add to total

    let checklistHtml = "";
    // Build clickable 6-section checklist for this subject
    for (let j = 0; j < STUDY_TABS.length; j++) {
    // Check each of the 6 study sections
      const tab = STUDY_TABS[j];
      // Current study section
      const isDone = viewed.includes(tab.id);
      // True only if user actually viewed/completed this section
      checklistHtml += `<button type="button" class="check-pill ${isDone ? "done" : ""}" onclick="showContent('${tab.id}')">${isDone ? "✅" : "○"} ${tab.label}</button>`;
      // Clickable badge that jumps straight to that section
    }
    // End of checklist loop

    subjectBoxes += `
      <div class="progress-wrap">
        <div class="section-head-row" style="margin-bottom:6px">
          <strong>${s}</strong>
          <strong style="color:var(--accent2)">${subProg}% (${viewed.length} / ${STUDY_TABS.length} sections)</strong>
        </div>
        <p style="font-size:13px">${getData(s).overview}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${subProg}%"></div></div>
        <div class="overview-checklist">${checklistHtml}</div>
      </div>
    `;
    // Append subject overview block
  }
  // End of subjects loop

  const avgProg = selectedSubjects.length > 0 ? Math.round(progSum / selectedSubjects.length) : 0;
  // Accurate average progress across selected subjects
  box.innerHTML = `
    <div class="content-card">
      <h2>📊 Preparation Overview</h2>
      <p>You selected <strong>${selectedSubjects.length}</strong> subject(s) for <strong>${selectedPrep}</strong>. Overall workspace progress: <strong>${avgProg}%</strong> (updates only as you actually view each study section below).</p>
      ${subjectBoxes}
    </div>
  `;
  // Render connected Overview card
}
// End of renderOverview

function renderConcepts(box) {
// Renders the Lessons & Core Concepts tab with shared AI-enrichment button
  let html = `
    <div class="content-card">
      <div class="section-head-row">
        <div>
          <h2>📚 Lessons & Core Concepts</h2>
          <p>Core B.Tech CSE explanations saved permanently for every student.</p>
        </div>
        <button type="button" class="secondary-btn compact-btn" onclick="fetchMoreSubjectContentWithAI('concepts')">✨ Fetch More with AI</button>
      </div>
  `;
  // Card header with AI fetch button
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const concepts = getData(s).concepts || [];
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
// Renders the combined Questions section: Subject Viva Q&A (with question-wise answers) + Live CS Questions (with question-wise answers)
  let html = `
    <div class="content-card">
      <div class="section-head-row">
        <div>
          <h2>❓ Questions & Answers</h2>
          <p>Question-wise viva answers for your subjects, plus live Computer Science questions from the web.</p>
        </div>
        <button type="button" class="secondary-btn compact-btn" onclick="fetchMoreSubjectContentWithAI('questions')">✨ Fetch More Q&A with AI</button>
      </div>
  `;
  // Card header

  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through selected subjects
    const s = selectedSubjects[i];
    // Subject name
    const qs = getData(s).questions || [];
    // Subject Q&A list
    html += `<h3>${s}</h3>`;
    // Subject sub-heading
    for (let j = 0; j < qs.length; j++) {
    // Render each question with its answer directly beneath it (question-wise)
      const item = qs[j];
      // Current Q&A object
      const qText = typeof item === "string" ? item : item.q;
      // Question text
      const aText = typeof item === "string" ? "Ask Prep AI for a detailed answer." : item.a;
      // Answer text
      html += `<div class="qa-card"><span class="qa-q">Q${j + 1}. ${qText}</span><div class="qa-a"><strong>Answer:</strong> ${aText}</div></div>`;
      // Append question-wise Q&A card
    }
    // End of question loop
  }
  // End of subject loop

  html += `
      <div style="margin-top:26px;padding-top:18px;border-top:1px solid var(--border)">
        <div class="section-head-row">
          <div>
            <h3 style="margin-top:0">🌐 Live CS Questions (Web)</h3>
            <p>Pull fresh Computer Science questions with answers live from Open Trivia DB.</p>
          </div>
          <button type="button" class="primary-btn compact-btn" onclick="fetchLiveQuestions()">Load 5 More Live Questions →</button>
        </div>
        <div id="liveQuestionsContainer" style="margin-top:14px"></div>
      </div>
    </div>
  `;
  // Append Live CS Questions block inside the Questions tab
  box.innerHTML = html;
  // Render Questions card
  drawLiveQuestions();
  // Display any already-fetched live questions
}
// End of renderQuestions

function drawLiveQuestions() {
// Displays fetched live CS questions with their answers question-wise inside the Questions tab
  const container = document.getElementById("liveQuestionsContainer");
  // Target container
  if (!container) return;
  // Stop if user switched tabs
  if (liveQuestionsList.length === 0) {
  // Show placeholder text when none loaded yet
    container.innerHTML = `<div class="topic-box"><span>Click "Load 5 More Live Questions" above to pull fresh CS questions with answers live from the web.</span></div>`;
    // Display prompt
    return;
    // Stop here
  }
  // End of empty check

  let html = "";
  // Build question-wise cards
  for (let i = 0; i < liveQuestionsList.length; i++) {
  // Loop through fetched live questions
    const q = liveQuestionsList[i];
    // Current question object
    html += `<div class="qa-card"><span class="qa-q">Live Q${i + 1} (${q.difficulty.toUpperCase()}): ${q.q}</span><div class="qa-a"><strong>Answer:</strong> ${q.a}</div></div>`;
    // Append question-wise live Q&A card
  }
  // End of loop
  container.innerHTML = html;
  // Render live questions
}
// End of drawLiveQuestions

async function fetchLiveQuestions() {
// Pulls 5 fresh CS trivia questions with answers from FastAPI /api/infinite-questions
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
      // Redraw question-wise cards
      markStudyTabViewed("questions", selectedSubjects);
      // Ensure Questions section is marked viewed
      showToast("Loaded 5 live CS questions with answers!");
      // Confirm load
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

function renderRevision(box) {
// Renders the Quick Revision tab with crisp exam points and AI-fetch button
  let html = `
    <div class="content-card">
      <div class="section-head-row">
        <div>
          <h2>⚡ Quick Revision</h2>
          <p>High-yield last-minute viva & exam points saved permanently for everyone.</p>
        </div>
        <button type="button" class="secondary-btn compact-btn" onclick="fetchMoreSubjectContentWithAI('revision')">✨ Fetch More with AI</button>
      </div>
  `;
  // Card header
  for (let i = 0; i < selectedSubjects.length; i++) {
  // Loop through subjects
    const s = selectedSubjects[i];
    // Subject name
    const subData = getData(s);
    // Subject content object
    const revPoints = (subData.revision && subData.revision.length > 0) ? subData.revision : (subData.concepts || []).slice(0, 4);
    // Use dedicated quick revision points (fallback to first 4 concepts)
    html += `<h3>${s}</h3><div class="topic-grid">`;
    // Open grid
    for (let j = 0; j < revPoints.length; j++) {
    // Add each revision box
      html += `<div class="topic-box"><strong>${revPoints[j][0]}</strong><span>${revPoints[j][1]}</span></div>`;
      // Append revision box
    }
    // End of revision loop
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
    const concepts = getData(s).concepts || [];
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
  // Show score summary when finished and mark Practice Quiz completed in Overview
    const pct = quizState.questions.length > 0 ? Math.round((quizState.score / quizState.questions.length) * 100) : 0;
    // Score percentage
    markStudyTabViewed("quiz", selectedSubjects);
    // Mark Practice Quiz completed for selected subjects
    markQuizMetric("quiz-complete", 0);
    // Award +40 XP
    markQuizMetric("quiz-score", pct);
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
        markQuizMetric("quiz-correct", 0);
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
    markStudyTabViewed("pdfviva", selectedSubjects);
    // Ensure PDF Viva is marked viewed
    if (res.ok && data.tokens_used) syncUserToFirestore(10, data.tokens_used);
    // Award +10 XP and record AI tokens used on Dashboard
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
    markStudyTabViewed("interview", selectedSubjects);
    // Ensure Mock Interview is marked viewed
    if (result.ok && result.data.tokens_used) syncUserToFirestore(10, result.data.tokens_used);
    // Award +10 XP and record AI tokens used on Dashboard
  } catch (error) {
  // Handle offline error
    out.textContent = "Could not connect to Python backend.";
    // Show error message
  }
  // End of try/catch
}
// End of submitMockInterview

function openAuth(mode) {
// Opens the mandatory Login / Sign Up screen and hides all other content
  authMode = mode;
  // Save active mode
  closeProfileDrawer();
  // Ensure drawer is closed
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
    form.innerHTML = `<div class="input-group"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com" required></div><div class="input-group"><label>Password</label><div class="password-wrap"><input id="authPassword" type="password" placeholder="••••••••" required><button type="button" class="eye-btn" onclick="togglePasswordVisibility(this)" aria-label="Show or hide password" title="Show/Hide Password">👁️</button></div></div><button class="primary-btn auth-submit" type="submit">Login →</button>`;
    // Render Login form
  } else {
  // Show Sign Up inputs
    document.getElementById("authTitle").textContent = "Create account";
    // Set Sign Up heading
    document.getElementById("authSubtitle").textContent = "Sign up to unlock VIVA Prep.";
    // Set Sign Up subtitle
    form.innerHTML = `<div class="input-group"><label>Full Name</label><input id="authName" type="text" placeholder="Your name" required></div><div class="input-group"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com" required></div><div class="input-group"><label>Password (min 6 chars)</label><div class="password-wrap"><input id="authPassword" type="password" minlength="6" placeholder="Create password" required><button type="button" class="eye-btn" onclick="togglePasswordVisibility(this)" aria-label="Show or hide password" title="Show/Hide Password">👁️</button></div></div><button class="primary-btn auth-submit" type="submit">Sign Up →</button>`;
    // Render Sign Up form
  }
  // End of mode check
}
// End of renderAuth

function togglePasswordVisibility(btn) {
// Toggles the password field between hidden dots and visible plain text
  const input = document.getElementById("authPassword");
  // Find the password input box
  if (!input) return;
  // Safety check
  if (input.type === "password") {
  // Currently hidden: reveal the typed password
    input.type = "text";
    // Show password characters
    btn.textContent = "🙈";
    // Switch icon to indicate click will hide
  } else {
  // Currently visible: hide the typed password again
    input.type = "password";
    // Mask password characters as dots
    btn.textContent = "👁️";
    // Switch icon back to eye
  }
  // End of visibility check
}
// End of togglePasswordVisibility


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
// Switches Prep AI between Super Mode and God Mode and saves preference
  aiMode = mode;
  // Save selected mode
  localStorage.setItem("vivaPrepAiMode", mode);
  // Persist default AI mode
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
  const drawerSel = document.getElementById("drawerAiModeSelect");
  // Sync drawer dropdown
  if (drawerSel) drawerSel.value = mode;
  // Set matching dropdown value
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
    // Award +5 XP and update Tokens Used on Dashboard
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
  // Update navbar button symbol
  localStorage.setItem("vivaPrepTheme", isLight ? "light" : "dark");
  // Save theme in browser
  updateDrawerThemeButton();
  // Sync drawer appearance button
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
  updateDrawerThemeButton();
  // Sync drawer button
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
  // User is logged in: sync Firestore profile, load shared study content, and unlock the website
    await syncUserToFirestore(0, 0);
    // Load profile from Firestore
    await loadSharedSubjectContent();
    // Load shared AI-enriched notes from backend/content_cache.json
    goHome();
    // Unlock the website
  } else {
  // Not logged in: lock everything and force the Login screen
    currentUser = null;
    // Clear profile
    updateNavbarUserUI();
    // Hide Dashboard and profile icon
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
  setAIMode(aiMode);
  // Restore saved AI mode
  openAuth("login");
  // Start strictly on the Login screen
}
// End of initializeApp

initializeApp();
// Run startup function immediately
