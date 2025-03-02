import { error, json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db.js';
import * as config from '$lib/config';

const ADMIN_ADDRESSES = config.ADMIN_ADDRESSES;

export async function GET({ request, url }) {
    try {
        // Get the requester's address from the request headers or query params
        // This is a simplified approach - in production, you should use proper authentication
        const requesterAddress = url.searchParams.get('address');
        
        if (!requesterAddress) {
            error(400, 'Address is required');
        }
        
        // Check if the requester is an admin
        if (!ADMIN_ADDRESSES.includes(requesterAddress)) {
            error(403, 'Unauthorized access');
        }
        
        // Connect to the database
        const db = await connectToDatabase();
        
        // Get all whitelist applications
        const applications = await db.collection('whitelist')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        
        return json({ applications });
    } catch (err) {
        console.error('Admin whitelist fetch error:', err);
        error(500, err.message || 'Failed to fetch whitelist applications');
    }
}