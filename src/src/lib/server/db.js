import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private'; // Already importing MONGODB_URI

const DB_NAME = 'slap';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    if (!cachedClient) {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
    }

    const db = cachedClient.db(DB_NAME);
    cachedDb = db;
    
    return db;
}

export async function closeDbConnection() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
        cachedDb = null;
    }
}
