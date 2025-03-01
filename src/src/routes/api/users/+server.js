import { json, error } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db';

export async function GET({ url }) {
    try {
        const address = url.searchParams.get('address');
        
        if (!address || address.trim() === '') {
            return json({ user: null }, { status: 200 });
        }

        const db = await connectToDatabase();
        const result = await db.collection('users').findOne({ address: address.toLowerCase() });

        return json({ user: result }, { status: 200 });
    } catch (err) {
        console.error('Error fetching user:', err);
        return json({ user: null, error: 'Failed to retrieve user' }, { status: 200 });
    }
}

export async function POST({ request }) {
    try {
        const { address, username } = await request.json();
        
        if (!address || address.trim() === '') {
            error(400, 'Address is required');
        }
        
        const db = await connectToDatabase();
        
        // Use updateOne with upsert to avoid race conditions and duplicate insertions
        const result = await db.collection('users').updateOne(
            { address: address.toLowerCase() },
            { 
                $set: { 
                    lastSeen: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        
        // Get the updated or inserted user
        const user = await db.collection('users').findOne({ address: address.toLowerCase() });
        
        return json({ 
            user,
            created: result.upsertedCount > 0
        }, { status: result.upsertedCount > 0 ? 201 : 200 });
    } catch (err) {
        console.error('Error creating/updating user:', err);
        return json({ error: 'Failed to create or update user' }, { status: 200 });
    }
}