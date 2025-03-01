import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from '$env/static/private';
import { TwitterApi } from 'twitter-api-v2';
import { connectToDatabase } from '$lib/server/db';

export async function GET({ url, cookies }) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
        return new Response(null, {
            status: 303,
            headers: { Location: '/whitelist?error=missing_code' }
        });
    }
    
    if (!state) {
        return new Response(null, {
            status: 303,
            headers: { Location: '/whitelist?error=missing_state' }
        });
    }
    
    try {
        // Connect to the database
        const db = await connectToDatabase();
        
        // Find the auth record with the matching state
        const authRecord = await db.collection('twitter_auth').findOne({ state });
        
        if (!authRecord) {
            return new Response(null, {
                status: 303,
                headers: { Location: '/whitelist?error=invalid_state' }
            });
        }
        
        const { address, codeVerifier } = authRecord;
        console.log("Processing callback for address:", address);
        
        // Create a new Twitter API client
        const client = new TwitterApi({
            clientId: TWITTER_CLIENT_ID,
            clientSecret: TWITTER_CLIENT_SECRET
        });
        
        // Exchange the code for access token
        const CALLBACK_URL = `${url.origin}/api/auth/twitter/callback`;
        const { accessToken, refreshToken } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: CALLBACK_URL
        });
        
        // Create a client with the access token
        const twitterClient = new TwitterApi(accessToken);
        const { data: user } = await twitterClient.v2.me();
        
        console.log("Twitter user connected:", user.username);
        
        // Check if this Twitter username is already linked to another wallet
        const existingUser = await db.collection('whitelist').findOne({ 
            twitterUsername: user.username,
            address: { $ne: address } // Not equal to the current address
        });
        
        if (existingUser) {
            console.log(`Twitter username ${user.username} is already linked to address ${existingUser.address}`);
            return new Response(null, {
                status: 303,
                headers: { Location: '/whitelist?error=twitter_already_linked' }
            });
        }
        
        // Store the Twitter connection in the database
        await db.collection('whitelist').updateOne(
            { address },
            { 
                $set: { 
                    twitterConnected: true,
                    twitterId: user.id,
                    twitterUsername: user.username,
                    twitterName: user.name,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        //update the regular users collection with the twitter data
        const userAddress = address.toLowerCase();
        await db.collection('users').updateOne(
            { address: userAddress },
            { 
                $set: { 
                    twitterConnected: true,
                    twitterId: user.id,
                    twitterUsername: user.username,
                    twitterName: user.name,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        
        // Clean up the auth record
        await db.collection('twitter_auth').deleteOne({ state });
        
        // Redirect back to the whitelist page
        return new Response(null, {
            status: 303,
            headers: { Location: '/whitelist?twitter=connected' }
        });
    } catch (err) {
        console.error('Twitter callback error:', err);
        return new Response(null, {
            status: 303,
            headers: { Location: `/whitelist?error=${encodeURIComponent(err.message || 'Failed to complete Twitter authentication')}` }
        });
    }
}