import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import { TwitterApi } from 'twitter-api-v2';
import { connectToDatabase } from '$lib/server/db.js';

export async function GET({ url, cookies, request }) {
    try {
        // Get the user's wallet address from the query parameter
        const address = url.searchParams.get('address');
        console.log(address);
        
        if (!address) {
            error(400, 'Wallet address is required');
        }
        
        const CALLBACK_URL = `${url.origin}/api/auth/twitter/callback`;

        const client = new TwitterApi({
            clientId: TWITTER_CLIENT_ID,
            clientSecret: TWITTER_CLIENT_SECRET
        });

        // Generate OAuth details
        const authDetails = client.generateOAuth2AuthLink(CALLBACK_URL, { scope: ['tweet.read', 'users.read'] });
        const codeVerifier = authDetails.codeVerifier;
        const state = authDetails.state;
        
        // Connect to the database
        const db = await connectToDatabase();
        
        // Store the state and codeVerifier in MongoDB, associated with the user's address
        await db.collection('twitter_auth').updateOne(
            { address },
            { 
                $set: { 
                    state,
                    codeVerifier,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        
        return json({ url: authDetails.url });
    } catch (err) {
        console.error('Twitter auth error:', err);
        error(500, 'Failed to generate Twitter authorization URL');
    }
}