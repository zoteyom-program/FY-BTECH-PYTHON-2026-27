import os
# Import os to read environment variables and build file paths
import json
# Import json to read and save shared subject study notes permanently
import html
# Import html to decode HTML entities from Open Trivia DB questions
import fitz
# Import fitz (PyMuPDF) to read text from uploaded PDF files
import httpx
# Import httpx to make web API requests to Groq and Open Trivia DB
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
# Import FastAPI tools for creating the server, handling errors, and uploading files
from fastapi.middleware.cors import CORSMiddleware
# Import CORS middleware so the frontend can safely talk to the backend
from fastapi.responses import FileResponse
# Import FileResponse to send HTML, CSS, and JS files to the browser
from pydantic import BaseModel
# Import BaseModel to define the structure of incoming JSON data
from dotenv import load_dotenv
# Import load_dotenv to load secret keys from the .env file

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Find the exact folder where main.py is located (backend/)
load_dotenv(os.path.join(BASE_DIR, ".env"))
# Load API keys directly from backend/.env no matter where uvicorn is started
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))
# Also check the project root .env as a backup

GROQ_KEY_1 = os.getenv("GROQ_API_KEY_1", "").strip()
# Read the first Groq API key from the .env file
GROQ_KEY_2 = os.getenv("GROQ_API_KEY_2", "").strip()
# Read the optional second Groq API key from the .env file
GROQ_KEYS = [k for k in [GROQ_KEY_1, GROQ_KEY_2] if k]
# Keep only the non-empty API keys loaded from .env
current_key_index = 0
# Keep track of which API key we will use next

MODEL_SMART = "openai/gpt-oss-120b"
# Larger AI model used for God Mode, PDF Viva, and generating study content
MODEL_FAST = "openai/gpt-oss-20b"
# Faster AI model used for Super Mode and Mock Interviews

CACHE_FILE = os.path.join(BASE_DIR, "content_cache.json")
# Shared JSON file that permanently stores subject lessons, revision notes, and Q&A for every user
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
# Find the exact folder path of the frontend directory next to backend

app = FastAPI(title="VIVA Prep")
# Create the FastAPI backend application

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Allow requests from any origin, method, and header so the frontend never gets blocked


def load_content_cache():
    # Loads the shared subject study content dictionary from backend/content_cache.json
    if not os.path.exists(CACHE_FILE):
        # Return empty dictionary if cache file does not exist yet
        return {}
        # Empty fallback
    try:
        # Read and parse JSON cache file
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            # Open cache file for reading
            return json.load(f)
            # Return parsed subject data
    except Exception:
        # Return empty dict if file is corrupted
        return {}
        # Safe fallback


def save_content_cache(cache_data):
    # Saves the shared subject study content dictionary permanently to backend/content_cache.json
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        # Open cache file for writing
        json.dump(cache_data, f, indent=2, ensure_ascii=False)
        # Write formatted JSON so it stays forever for all users


def require_login(authorization: str = Header(None)):
    # Checks that every API request includes a Firebase Bearer token from a logged-in user
    if not authorization or not authorization.startswith("Bearer "):
        # Reject requests without an Authorization Bearer header
        raise HTTPException(status_code=401, detail="Please login first")
        # Return HTTP 401 Unauthorized
    token = authorization.split(" ", 1)[1].strip()
    # Extract the token string after "Bearer "
    if not token:
        # Reject empty tokens
        raise HTTPException(status_code=401, detail="Please login first")
        # Return HTTP 401 Unauthorized
    return token
    # Allow the logged-in request to continue


def get_next_api_key():
    # Simple helper function that alternates between the configured API keys
    global current_key_index
    # Allow this function to update the global index variable
    key = GROQ_KEYS[current_key_index]
    # Pick the API key at the current index
    current_key_index = (current_key_index + 1) % len(GROQ_KEYS)
    # Move to the next key and wrap back to 0 at the end of the list
    return key
    # Return the selected API key


async def ask_ai(prompt: str, fallback: str, fast: bool = False):
    # Async function to send a text prompt to Groq AI and return the reply and token count
    if not GROQ_KEYS:
        # Check if no API keys were found in .env
        print("[Groq Error]: No GROQ_API_KEY_1 found in backend/.env")
        # Print a clear reminder in the terminal
        return fallback, 0
        # Return fallback text and 0 tokens

    if fast:
        # Check if we want the faster model first
        models_to_try = [MODEL_FAST, MODEL_SMART]
        # Try the fast model first, then the smart model if it fails
    else:
        # Otherwise we want the smarter model first
        models_to_try = [MODEL_SMART, MODEL_FAST]
        # Try the smart model first, then the fast model if it fails

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Open an async HTTP client with a 30-second timeout
        for _ in range(len(GROQ_KEYS)):
            # Loop once for each API key we have
            api_key = get_next_api_key()
            # Get the next Groq API key
            if not api_key:
                # Skip if the key is empty
                continue
                # Move to the next key in the loop

            for model_name in models_to_try:
                # Try each model in our priority list
                try:
                    # Wrap the API call in try/except so errors do not crash the server
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    }
                    # Set the authentication token and JSON header for Groq
                    payload = {
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                    # Prepare the JSON body with the chosen model and user prompt
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    # Send the POST request to Groq's chat completions API
                    response.raise_for_status()
                    # Raise an error if Groq responds with a failure status code
                    data = response.json()
                    # Convert the JSON response into a Python dictionary
                    reply_text = data["choices"][0]["message"]["content"]
                    # Extract the AI's reply message from the response
                    usage = data.get("usage", {})
                    # Get the token usage dictionary if provided
                    total_tokens = usage.get("total_tokens", (len(prompt) + len(reply_text)) // 4)
                    # Read exact token count or estimate it from the text length
                    return reply_text, int(total_tokens)
                    # Return the AI reply and the number of tokens used
                except Exception as error:
                    # Catch any network or API error
                    print(f"[Groq Error | {model_name}]: {error}")
                    # Print the error to the terminal so we can debug it
                    continue
                    # Try the next model or key

    return fallback, 0
    # If all keys and models fail, return the fallback message and 0 tokens


def parse_ai_json(raw_text: str):
    # Extracts and parses a JSON object from an AI response even if wrapped in ```json fences
    cleaned = raw_text.strip()
    # Remove leading and trailing whitespace
    if "```" in cleaned:
        # Strip markdown code fences if the AI added them
        parts = cleaned.split("```")
        # Split on backticks
        for part in parts:
            # Check each fenced block
            p = part.strip()
            # Clean whitespace
            if p.startswith("json"):
                # Remove leading "json" label
                p = p[4:].strip()
                # Keep raw JSON string
            if p.startswith("{") and p.endswith("}"):
                # Found a JSON object block
                cleaned = p
                # Use this block
                break
                # Stop searching
    start = cleaned.find("{")
    # Find opening curly brace
    end = cleaned.rfind("}")
    # Find closing curly brace
    if start != -1 and end != -1:
        # Slice out the JSON object
        return json.loads(cleaned[start:end + 1])
        # Parse and return dictionary
    return None
    # Return None if JSON could not be parsed


@app.get("/")
# Route for the home page URL
def home():
    # Function that runs when the user visits the root URL
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
    # Send the main HTML page to the browser


@app.get("/style.css")
# Route for the CSS stylesheet
def serve_css():
    # Function that serves the styling file
    return FileResponse(os.path.join(FRONTEND_DIR, "style.css"))
    # Send frontend/style.css to the browser


@app.get("/script.js")
# Route for the JavaScript file
def serve_js():
    # Function that serves the frontend logic file
    return FileResponse(os.path.join(FRONTEND_DIR, "script.js"))
    # Send frontend/script.js to the browser


@app.get("/healthz")
# Simple health-check route used by hosting platforms
def healthz():
    # Function that confirms the server is running
    return {"status": "alive"}
    # Return a small JSON status object


@app.get("/api/subject-content")
# GET route that returns all permanently cached B.Tech CSE subject notes for everyone
async def get_all_subject_content(_token: str = Depends(require_login)):
    # Returns the full shared content dictionary so Lessons, Quick Revision, and Q&A are never blank
    return {"content": load_content_cache()}
    # Send shared cache to frontend


class SubjectContentRequest(BaseModel):
    # Blueprint for requesting AI-generated study content for a subject
    subject: str
    # Subject name to fetch or enrich with AI


@app.post("/api/subject-content/fetch")
# POST route that fetches fresh Lessons, Quick Revision, and Q&A from AI and saves them permanently for everyone
async def fetch_subject_content(data: SubjectContentRequest, _token: str = Depends(require_login)):
    # Calls Groq AI for additional lessons, quick revision points, and Q&A with answers, then saves to content_cache.json
    subject = data.subject.strip()
    # Clean subject name
    cache = load_content_cache()
    # Load existing shared cache
    prompt = (
        f"Return ONLY valid JSON (no extra text) for B.Tech CSE subject '{subject}' with keys: "
        f'"overview" (1 sentence), '
        f'"concepts" (list of 2 [title, short explanation] pairs), '
        f'"revision" (list of 2 [title, crisp exam point] pairs), '
        f'"questions" (list of 2 objects with "q" and "a" short model answer).'
    )
    # Ask Groq for structured JSON study content
    raw_reply, tokens = await ask_ai(prompt, "", fast=True)
    # Call Groq AI
    parsed = parse_ai_json(raw_reply) if raw_reply else None
    # Parse AI JSON safely

    if parsed:
        # Merge newly fetched AI items into the shared permanent cache
        existing = cache.get(subject, {"overview": parsed.get("overview", ""), "concepts": [], "revision": [], "questions": []})
        # Load or create subject entry
        if not existing.get("overview") and parsed.get("overview"):
            # Fill overview if missing
            existing["overview"] = parsed["overview"]
            # Save overview
        existing_concept_titles = {c[0].lower() for c in existing.get("concepts", [])}
        # Track existing concept titles to avoid duplicates
        for c in parsed.get("concepts", []):
            # Add each new concept
            if isinstance(c, list) and len(c) == 2 and c[0].lower() not in existing_concept_titles:
                # Only append unique concepts
                existing["concepts"].append([str(c[0]), str(c[1])])
                # Save new concept
        existing_rev_titles = {r[0].lower() for r in existing.get("revision", [])}
        # Track existing revision titles
        for r in parsed.get("revision", []):
            # Add each new revision note
            if isinstance(r, list) and len(r) == 2 and r[0].lower() not in existing_rev_titles:
                # Only append unique revision points
                existing["revision"].append([str(r[0]), str(r[1])])
                # Save new revision note
        existing_qs = {q["q"].lower() for q in existing.get("questions", []) if isinstance(q, dict)}
        # Track existing questions
        for q in parsed.get("questions", []):
            # Add each new Q&A pair
            if isinstance(q, dict) and "q" in q and "a" in q and q["q"].lower() not in existing_qs:
                # Only append unique questions with answers
                existing["questions"].append({"q": str(q["q"]), "a": str(q["a"])})
                # Save new Q&A pair
        cache[subject] = existing
        # Update subject in cache dictionary
        save_content_cache(cache)
        # Save permanently to backend/content_cache.json for all users
        return {"subject": subject, "data": existing, "tokens_used": tokens}
        # Return updated subject data and token count

    return {"subject": subject, "data": cache.get(subject), "tokens_used": tokens}
    # Return existing cached data if AI was offline


class ChatRequest(BaseModel):
    # Blueprint for the JSON data sent to /api/chat
    question: str
    # The user's message text
    mode: str = "super"
    # Selected AI mode ("super" or "god")
    subjects: str = "B.Tech CSE"
    # Currently selected subject context


@app.post("/api/chat")
# POST route for the floating Prep AI chatbot
async def chat(data: ChatRequest, _token: str = Depends(require_login)):
    # Async handler for incoming chat questions
    is_god_mode = data.mode == "god"
    # Check if the user chose God Mode
    fallback_msg = "AI service is currently unavailable. Please try again."
    # Backup message shown if the API cannot be reached
    reply, tokens = await ask_ai(data.question, fallback_msg, fast=not is_god_mode)
    # Send the raw user question to Groq (fast model for Super, smart model for God)
    return {"reply": reply, "tokens_used": tokens}
    # Send the AI reply and token count back to the frontend


@app.post("/api/pdf-viva")
# POST route for generating viva questions from an uploaded PDF
async def pdf_viva(file: UploadFile = File(...), _token: str = Depends(require_login)):
    # Async handler that accepts an uploaded file
    if not file.filename.lower().endswith(".pdf"):
        # Make sure the uploaded file is actually a PDF
        raise HTTPException(status_code=400, detail="Please upload a PDF file")
        # Return a 400 Bad Request error for non-PDF files

    pdf_bytes = await file.read()
    # Read the uploaded file bytes into memory
    pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    # Open the PDF document using PyMuPDF
    all_pages_text = []
    # Create an empty list to collect text from each page
    for page in pdf_doc:
        # Loop through every page in the PDF
        all_pages_text.append(page.get_text())
        # Extract the text from the current page and add it to the list
    extracted_text = "\n".join(all_pages_text)[:6000]
    # Join all page texts together and keep the first 6000 characters

    if not extracted_text.strip():
        # Check if the PDF had no readable text (like a scanned image)
        raise HTTPException(status_code=400, detail="No text found in PDF")
        # Return an error telling the user the PDF has no text

    prompt = f"Generate 5 viva questions with short model answers from this syllabus:\n{extracted_text}"
    # Build the prompt asking Groq for 5 viva questions and short answers
    fallback_msg = "1. What are the main objectives of this syllabus?\n2. Explain the core concept from Unit 1.\n3. Give a real-world engineering application."
    # Backup questions if the AI API is offline
    result, tokens = await ask_ai(prompt, fallback_msg, fast=False)
    # Ask the smarter Groq model to generate the viva questions
    return {"result": result, "tokens_used": tokens}
    # Return the generated questions and token count


class InterviewRequest(BaseModel):
    # Blueprint for the JSON data sent to /api/interview
    subject: str
    # Subject name for the mock interview
    answer: str = ""
    # Student's answer (blank means ask a new opening question)


@app.post("/api/interview")
# POST route for the AI Mock Interview feature
async def interview(data: InterviewRequest, _token: str = Depends(require_login)):
    # Async handler for mock interview questions and grading
    if not data.answer.strip():
        # If the user did not type an answer, ask a new question
        prompt = f"Ask 1 practical technical viva question on {data.subject}."
        # Prompt the AI to ask one viva question on the subject
        fallback_msg = f"Explain the core principle of {data.subject} with one real-world example."
        # Backup opening question
    else:
        # If the user typed an answer, ask the AI to grade it
        prompt = f"Grade this {data.subject} answer out of 10, give 1 strength, 1 tip, and 1 follow-up: {data.answer}"
        # Prompt the AI to score the answer and give feedback
        fallback_msg = f"Score: 8/10\nStrength: Good clarity.\nTip: Add an example.\nNext: What are the edge cases in {data.subject}?"
        # Backup grading response

    result, tokens = await ask_ai(prompt, fallback_msg, fast=True)
    # Call Groq using the fast model for quick interview responses
    return {"result": result, "tokens_used": tokens}
    # Return the interview response and token count


@app.get("/api/infinite-questions")
# GET route that fetches fresh Computer Science questions with answers from Open Trivia DB
async def infinite_questions(_token: str = Depends(require_login)):
    # Async handler used inside the Questions tab
    questions_list = []
    # Create an empty list to store formatted questions
    try:
        # Wrap the external API call in try/except
        async with httpx.AsyncClient() as client:
            # Open an async HTTP client
            res = await client.get(
                "https://opentdb.com/api.php?amount=5&category=18&type=multiple",
                timeout=10.0,
            )
            # Request 5 Computer Science trivia questions from Open Trivia DB
            raw_items = res.json().get("results", [])
            # Pull the list of question items from the JSON response
            for item in raw_items:
                # Loop through each question item
                questions_list.append({
                    "q": html.unescape(item["question"]),
                    "a": html.unescape(item["correct_answer"]),
                    "difficulty": item.get("difficulty", "medium"),
                })
                # Decode HTML entities and add question, answer, and difficulty
    except Exception:
        # If the external website is down or slow, use a fallback question
        questions_list = [
            {"q": "What is the time complexity of binary search?", "a": "O(log n)", "difficulty": "easy"}
        ]
        # Provide one default CS question

    return {"questions": questions_list}
    # Send the list of questions back to the frontend
