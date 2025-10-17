from transformers import pipeline
import re

# Load pre-trained models
print("Loading AI models... (This may take a minute on first run)")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
print("✅ AI models loaded successfully!")

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

# Urgent keywords
URGENT_KEYWORDS = ["urgent", "asap", "immediately", "emergency", "critical", "refund", "fraud", "lawsuit"]

def preprocess_text(text):
    """Clean and preprocess complaint text"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def classify_complaint(text):
    """Classify complaint into categories"""
    try:
        result = classifier(text, CATEGORIES)
        return result["labels"][0], result["scores"][0]
    except Exception as e:
        print(f"❌ Classification error: {e}")
        return "Customer Service", 0.5

def analyze_sentiment(text):
    """Analyze sentiment of complaint"""
    try:
        result = sentiment_analyzer(text)[0]
        return result["label"], result["score"]
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return "NEGATIVE", 0.5

def calculate_priority(text, sentiment_label):
    """Calculate priority score based on sentiment and keywords"""
    priority_score = 0
    
    # Sentiment weight
    if sentiment_label == "NEGATIVE":
        priority_score += 3
    elif sentiment_label == "POSITIVE":
        priority_score += 1
    
    # Keyword detection
    text_lower = text.lower()
    for keyword in URGENT_KEYWORDS:
        if keyword in text_lower:
            priority_score += 2
            break
    
    # Determine priority level
    if priority_score >= 4:
        return "High", priority_score
    elif priority_score >= 2:
        return "Medium", priority_score
    else:
        return "Low", priority_score

def process_complaint(text):
    """Main processing function"""
    print(f"🔄 Processing complaint: {text[:50]}...")
    
    processed_text = preprocess_text(text)
    
    # AI Analysis
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