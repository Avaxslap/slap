import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

// Connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'slap';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    // If we already have a connection, use it
    if (cachedDb) {
        return cachedDb;
    }

    // If no connection, create a new one
    if (!cachedClient) {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
    }

    // Get the database
    const db = cachedClient.db(DB_NAME);
    cachedDb = db;
    
    return db;
}

// Optional: Close connection when the app is shutting down
export async function closeDbConnection() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
        cachedDb = null;
    }
}