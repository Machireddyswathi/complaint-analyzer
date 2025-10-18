from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import ComplaintInput
from ai_engine import process_complaint
from database import save_complaint, get_all_complaints, get_complaint_stats
import traceback

app = FastAPI(title="AI Complaint Analyzer API")

# CORS middleware - MORE PERMISSIVE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

@app.get("/")
def root():
    return {
        "message": "AI Complaint Analyzer API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.post("/api/complaints")
def create_complaint(complaint: ComplaintInput):
    """Analyze and save complaint"""
    try:
        print(f"\n{'='*50}")
        print(f"📥 NEW COMPLAINT RECEIVED")
        print(f"{'='*50}")
        print(f"Text: {complaint.text}")
        print(f"Name: {complaint.customer_name or 'Not provided'}")
        print(f"Email: {complaint.customer_email or 'Not provided'}")
        
        # Process with AI
        print("🤖 Starting AI analysis...")
        analysis = process_complaint(complaint.text)
        
        # Add customer info
        analysis["customer_name"] = complaint.customer_name
        analysis["customer_email"] = complaint.customer_email
        
        # Save to database - returns string ID
        print("💾 Saving to database...")
        complaint_id = save_complaint(analysis)
        
        # Create clean response (no ObjectId)
        response_data = {
            "id": complaint_id,
            "category": analysis["category"],
            "category_confidence": float(analysis["category_confidence"]),
            "sentiment": analysis["sentiment"],
            "sentiment_score": float(analysis["sentiment_score"]),
            "priority": analysis["priority"],
            "priority_score": int(analysis["priority_score"]),
            "original_text": analysis["original_text"],
            "customer_name": analysis.get("customer_name"),
            "customer_email": analysis.get("customer_email")
        }
        
        print(f"✅ SUCCESS! Complaint ID: {complaint_id}")
        print(f"{'='*50}\n")
        
        # Return with explicit headers
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": response_data,
                "message": "Complaint analyzed successfully"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n{'='*50}")
        print(f"❌ ERROR OCCURRED")
        print(f"{'='*50}")
        print(f"Error: {error_msg}")
        print(f"Traceback:\n{traceback.format_exc()}")
        print(f"{'='*50}\n")
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": error_msg,
                "detail": f"Analysis failed: {error_msg}"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
            }
        )

@app.options("/api/complaints")
async def options_complaints():
    """Handle OPTIONS request for CORS preflight"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/api/complaints")
def list_complaints():
    """Get all complaints"""
    try:
        complaints = get_all_complaints()
        return JSONResponse(
            content={"success": True, "data": complaints},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        print(f"❌ Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)},
            headers={"Access-Control-Allow-Origin": "*"}
        )

@app.get("/api/analytics")
def get_analytics():
    """Get complaint statistics"""
    try:
        stats = get_complaint_stats()
        return JSONResponse(
            content={"success": True, "data": stats},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        print(f"❌ Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)},
            headers={"Access-Control-Allow-Origin": "*"}
        )

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend is running",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 8000))
    
    print("\n" + "="*60)
    print("🚀 AI COMPLAINT ANALYZER - BACKEND SERVER")
    print("="*60)
    print(f"📡 Server URL: http://0.0.0.0:{port}")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port)


@app.get("/warmup")
def warmup():
    """Pre-load AI models (call this once after deployment)"""
    try:
        from ai_engine import load_models
        load_models()
        return {
            "status": "success",
            "message": "AI models loaded and ready!"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }