import { json, error } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db';

// Get chat messages
export async function GET() {
    try {
        const db = await connectToDatabase();
        
        // Create the collection if it doesn't exist
        const collections = await db.listCollections({ name: 'chat_messages' }).toArray();
        if (collections.length === 0) {
            await db.createCollection('chat_messages');
            console.log('Created chat_messages collection');
        }
        
        // Get the most recent 100 messages
        const messages = await db.collection('chat_messages')
            .find({})
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();
        
        // Return messages in chronological order
        return json({ messages: messages.reverse() });
    } catch (err) {
        console.error('Error fetching chat messages:', err);
        return json({ messages: [] }, { status: 200 });
    }
}

// Send a new message
export async function POST({ request }) {
    try {
        const { sender, content } = await request.json();
        
        if (!sender || !content) {
            error(400, 'Sender and content are required');
        }
        
        // Validate content length
        if (content.length > 500) {
            error(400, 'Message is too long (max 500 characters)');
        }
        
        const db = await connectToDatabase();
        
        // Create the collection if it doesn't exist
        const collections = await db.listCollections({ name: 'chat_messages' }).toArray();
        if (collections.length === 0) {
            await db.createCollection('chat_messages');
            console.log('Created chat_messages collection');
        }
        
        // Create the new message
        const message = {
            sender: sender.toLowerCase(),
            content,
            timestamp: new Date()
        };
        
        // Insert the message
        await db.collection('chat_messages').insertOne(message);
        
        return json({ success: true, message });
    } catch (err) {
        console.error('Error sending chat message:', err);
        error(500, 'Failed to send message');
    }
}