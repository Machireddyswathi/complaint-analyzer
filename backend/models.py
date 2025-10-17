from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ComplaintInput(BaseModel):
    text: str = Field(..., min_length=10, description="Complaint text")
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    original_text: str
    category: str
    category_confidence: float
    sentiment: str
    sentiment_score: float
    priority: str
    priority_score: int
    timestamp: datetime