from transformers import pipeline
import re
import os

# Set cache directory to /tmp (Railway allows this)
os.environ['TRANSFORMERS_CACHE'] = '/tmp/transformers_cache'
os.environ['HF_HOME'] = '/tmp/huggingface'

print("✅ AI engine initialized (models will load on first use)")

# Global variables to store loaded models
_classifier = None
_sentiment_analyzer = None

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

def load_models():
    """Load AI models lazily (only when first needed)"""
    global _classifier, _sentiment_analyzer
    
    if _classifier is None or _sentiment_analyzer is None:
        print("📥 Loading AI models for the first time (this may take 30-60 seconds)...")
        
        try:
            # Load classification model
            print("Loading classification model...")
            _classifier = pipeline(
                "zero-shot-classification", 
                model="facebook/bart-large-mnli",
                device=-1  # Force CPU
            )
            
            # Load sentiment model
            print("Loading sentiment model...")
            _sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # Force CPU
            )
            
            print("✅ AI models loaded successfully!")
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            raise e
    
    return _classifier, _sentiment_analyzer

def preprocess_text(text):
    """Clean and preprocess complaint text"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def classify_complaint(text):
    """Classify complaint into categories"""
    try:
        classifier, _ = load_models()
        
        # Use only top 5 categories to save memory
        result = classifier(text, CATEGORIES[:5], multi_label=False)
        return result["labels"][0], result["scores"][0]
    except Exception as e:
        print(f"❌ Classification error: {e}")
        return "Customer Service", 0.5

def analyze_sentiment(text):
    """Analyze sentiment of complaint"""
    try:
        _, sentiment_analyzer = load_models()
        
        # Truncate long text to save memory
        truncated_text = text[:512]
        result = sentiment_analyzer(truncated_text)[0]
        return result["label"], result["score"]
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return "NEGATIVE", 0.5

def calculate_priority(text, sentiment_label):
    """Calculate priority score based on sentiment and keywords"""
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
    print(f"🔄 Processing complaint: {text[:50]}...")
    
    processed_text = preprocess_text(text)
    
    # AI Analysis (models loaded on first call)
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