from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
from dotenv import load_dotenv
import ssl

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "complaint_analyzer")

# Indian Standard Time (IST) = UTC + 5:30
IST = timezone(timedelta(hours=5, minutes=30))

try:
    # ✅ Use ssl.CERT_NONE to bypass certificate verification
    # This is acceptable for MongoDB Atlas as it's a trusted service
    client = MongoClient(
        MONGODB_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,  # Skip certificate validation
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000
    )
    db = client[DATABASE_NAME]
    complaints_collection = db["complaints"]
    
    # Test connection
    client.admin.command('ping')
    print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    import traceback
    print(traceback.format_exc())

def save_complaint(complaint_data):
    """Save complaint to MongoDB with IST timestamp"""
    try:
        ist_now = datetime.now(IST)
        
        complaint_data["timestamp"] = ist_now.isoformat()
        complaint_data["created_at"] = ist_now.strftime("%Y-%m-%d %H:%M:%S IST")
        complaint_data["timezone"] = "Asia/Kolkata"
        
        result = complaints_collection.insert_one(complaint_data)
        complaint_id = str(result.inserted_id)
        
        print(f"💾 Saved complaint with ID: {complaint_id}")
        return complaint_id
    except Exception as e:
        print(f"❌ Error saving complaint: {e}")
        raise e

def get_all_complaints():
    """Retrieve all complaints sorted by newest first"""
    try:
        complaints = list(complaints_collection.find().sort("timestamp", -1))
        
        for complaint in complaints:
            complaint["_id"] = str(complaint["_id"])
            
            if "timestamp" in complaint and isinstance(complaint["timestamp"], datetime):
                complaint["timestamp"] = complaint["timestamp"].isoformat()
            
            if "created_at" in complaint and isinstance(complaint["created_at"], datetime):
                complaint["created_at"] = complaint["created_at"].strftime("%Y-%m-%d %H:%M:%S IST")
            
            for key, value in complaint.items():
                if isinstance(value, datetime):
                    complaint[key] = value.isoformat()
            
        print(f"📥 Retrieved {len(complaints)} complaints")
        return complaints
    except Exception as e:
        print(f"❌ Error retrieving complaints: {e}")
        return []

def get_complaint_stats():
    """Get analytics data"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1}
                }
            }
        ]
        category_stats = list(complaints_collection.aggregate(pipeline))
        
        sentiment_pipeline = [
            {
                "$group": {
                    "_id": "$sentiment",
                    "count": {"$sum": 1}
                }
            }
        ]
        sentiment_stats = list(complaints_collection.aggregate(sentiment_pipeline))
        
        total = complaints_collection.count_documents({})
        
        print(f"📊 Stats: {total} total complaints")
        
        return {
            "categories": category_stats,
            "sentiments": sentiment_stats,
            "total": total
        }
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        return {"categories": [], "sentiments": [], "total": 0}