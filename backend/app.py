#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
from datetime import datetime
import openai
from io import BytesIO
import base64

from nextstep_assistant import NextStepAssistant

# Initialize FastAPI app
app = FastAPI(
    title="NextStep Healthcare Assistant",
    description="AI-powered multilingual healthcare resource finder for Houston",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    print("Warning: OPENAI_API_KEY not set. Text-to-speech will not work.")

# Global assistant instance
assistant = NextStepAssistant()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    category: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"  # alloy, echo, fable, onyx, nova, shimmer
    model: Optional[str] = "tts-1"  # tts-1 or tts-1-hd

class ChatResponseResource(BaseModel):
    name: str
    category: str
    address: Optional[str] = None
    phone: Optional[str] = None
    score: float

class ChatResponse(BaseModel):
    query: str
    response: str
    resources_found: int
    top_resources: List[ChatResponseResource]
    timestamp: str
    audio_url: Optional[str] = None  # URL to generated audio

class HealthCheck(BaseModel):
    status: str
    version: str
    timestamp: str

# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def read_index():
    """Serve the main HTML page."""
    try:
        frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "index.html")
        with open(frontend_path, "r") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>NextStep Healthcare Navigator</h1><p>Frontend files not found. Please check file structure.</p>", status_code=200)

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    return HealthCheck(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    print("IN HERE")

    if not openai.api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    try:
        client = openai.OpenAI(api_key=openai.api_key)
        
        response = client.audio.speech.create(
            model=request.model,
            voice=request.voice,
            input=request.text[:4096],
            response_format="mp3"
        )
        
        return Response(
            content=response.content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint for the healthcare assistant."""
    try:
        result = assistant.chat(request.message, request.category)
        
        # Format resources for API response
        formatted_resources = []
        for resource in result.get('top_resources', []):
            formatted_resources.append(ChatResponseResource(
                name=resource.get('name', 'Unknown'),
                category=resource.get('category', 'Unknown'),
                address=resource.get('address'),
                phone=resource.get('phone'),
                score=resource.get('score', 0.0)
            ))
        
        response_data = ChatResponse(
            query=result.get('query', request.message),
            response=result.get('response', ''),
            resources_found=result.get('resources_found', 0),
            top_resources=formatted_resources,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # If OpenAI is configured, provide audio URL
        if openai.api_key and result.get('response'):
            # Create a unique identifier for this response
            response_id = hash(result.get('response', ''))
            response_data.audio_url = f"/tts-for-response?text={result.get('response', '')}&id={response_id}"
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/tts-for-response")
async def tts_for_response(text: str, voice: str = "alloy", model: str = "tts-1"):
    """Generate TTS for a specific response."""
    if not openai.api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    try:
        client = openai.OpenAI(api_key=openai.api_key)
        
        response = client.audio.speech.create(
            model=model,
            voice=voice,
            input=text[:4096],
            response_format="mp3"
        )
        
        return Response(
            content=response.content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=response.mp3",
                "Cache-Control": "max-age=300"  # Cache for 5 minutes
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

@app.get("/categories")
async def get_categories():
    """Get available resource categories."""
    categories = [
        {"id": "food", "name": "Food Assistance", "icon": "🍽️"},
        {"id": "mental_health", "name": "Mental Health", "icon": "🧠"},
        {"id": "healthcare", "name": "Healthcare", "icon": "🏥"},
        {"id": "housing", "name": "Housing", "icon": "🏠"},
        {"id": "substance_abuse", "name": "Substance Abuse", "icon": "💊"},
        {"id": "dental", "name": "Dental Care", "icon": "🦷"},
        {"id": "vision", "name": "Vision Care", "icon": "👁️"},
        {"id": "transportation", "name": "Transportation", "icon": "🚌"},
        {"id": "education", "name": "Education", "icon": "📚"},
        {"id": "telecommunications", "name": "Phone Services", "icon": "📱"},
        {"id": "interpersonal_violence", "name": "Domestic Violence", "icon": "🛡️"}
    ]
    return {"categories": categories}

@app.get("/voices")
async def get_available_voices():
    """Get available OpenAI TTS voices."""
    return {
        "voices": [
            {"id": "alloy", "name": "Alloy", "description": "Neutral, balanced voice"},
            {"id": "echo", "name": "Echo", "description": "Male voice"},
            {"id": "fable", "name": "Fable", "description": "British accent"},
            {"id": "onyx", "name": "Onyx", "description": "Deep male voice"},
            {"id": "nova", "name": "Nova", "description": "Female voice"},
            {"id": "shimmer", "name": "Shimmer", "description": "Soft female voice"}
        ]
    }

@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    try:
        all_resources = assistant.db.get_all_resources()
        
        # Count by category
        category_counts = {}
        for resource in all_resources:
            category = resource.get('category', 'unknown')
            category_counts[category] = category_counts.get(category, 0) + 1
        
        return {
            "total_resources": len(all_resources),
            "categories": len(category_counts),
            "category_breakdown": category_counts,
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

# Mount static files with absolute path resolution
try:
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    if os.path.exists(frontend_dir):
        app.mount("/static", StaticFiles(directory=frontend_dir), name="static")
except Exception as e:
    print(f"Warning: Could not mount static files: {e}")

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    assistant.close()

if __name__ == "__main__":
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)