import pymongo

client = pymongo.MongoClient('localhost', 27017)
db = client.data  # Create and export the database instance
