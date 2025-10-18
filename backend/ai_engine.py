import requests
import re
import os
from dotenv import load_dotenv

load_dotenv()

# Get HuggingFace API token from environment
HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

# API endpoints
CLASSIFIER_API = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
SENTIMENT_API = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"

HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

print("✅ AI engine initialized (using HuggingFace Inference API)")

# Categories for classification
CATEGORIES = [
    "Billing and Payments",
    "Delivery and Shipping",
    "Technical Support",
    "Product Quality",
    "Customer Service",
    "Refund and Returns",
    "Account Issues"
]

URGENT_KEYWORDS = ["urgent", "asap", "immediately", "emergency", "critical", "refund", "fraud", "lawsuit"]

def preprocess_text(text):
    """Clean and preprocess complaint text"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def classify_complaint(text):
    """Classify complaint using HuggingFace API"""
    try:
        payload = {
            "inputs": text,
            "parameters": {"candidate_labels": CATEGORIES}
        }
        
        response = requests.post(CLASSIFIER_API, headers=HEADERS, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result["labels"][0], result["scores"][0]
        else:
            print(f"⚠️ Classification API error: {response.status_code}")
            return "Customer Service", 0.5
            
    except Exception as e:
        print(f"❌ Classification error: {e}")
        return "Customer Service", 0.5

def analyze_sentiment(text):
    """Analyze sentiment using HuggingFace API"""
    try:
        # Truncate long text
        truncated_text = text[:512]
        
        payload = {"inputs": truncated_text}
        
        response = requests.post(SENTIMENT_API, headers=HEADERS, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()[0][0]
            return result["label"], result["score"]
        else:
            print(f"⚠️ Sentiment API error: {response.status_code}")
            return "NEGATIVE", 0.5
            
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return "NEGATIVE", 0.5

def calculate_priority(text, sentiment_label):
    """Calculate priority score"""
    priority_score = 0
    
    if sentiment_label == "NEGATIVE":
        priority_score += 3
    elif sentiment_label == "POSITIVE":
        priority_score += 1
    
    text_lower = text.lower()
    for keyword in URGENT_KEYWORDS:
        if keyword in text_lower:
            priority_score += 2
            break
    
    if priority_score >= 4:
        return "High", priority_score
    elif priority_score >= 2:
        return "Medium", priority_score
    else:
        return "Low", priority_score

def process_complaint(text):
    """Main processing function"""
    print(f"🔄 Processing complaint via HuggingFace API: {text[:50]}...")
    
    processed_text = preprocess_text(text)
    
    # Call HuggingFace APIs
    category, category_confidence = classify_complaint(processed_text)
    sentiment_label, sentiment_score = analyze_sentiment(processed_text)
    priority, priority_score = calculate_priority(text, sentiment_label)
    
    result = {
        "original_text": text,
        "category": category,
        "category_confidence": float(category_confidence),
        "sentiment": sentiment_label,
        "sentiment_score": float(sentiment_score),
        "priority": priority,
        "priority_score": priority_score
    }
    
    print(f"✅ Analysis complete: {category} | {sentiment_label} | {priority}")
    return result