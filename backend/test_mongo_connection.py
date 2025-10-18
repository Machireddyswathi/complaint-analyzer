from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://machireddyswathi90_db_user:NZGLo0whrjlq5Bh0@complaint-analyzer-clus.hqokxgc.mongodb.net/complaint_analyzer?retryWrites=true&w=majority&appName=complaint-analyzer-cluster1"

client = MongoClient(uri, server_api=ServerApi('1'))

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
