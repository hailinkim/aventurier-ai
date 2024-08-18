import initializeRedis from './redis-client.js';
import { cookies } from 'next/headers';

export const createSession = async (userId, sessionId, ig) => {
    try {
        const client = await initializeRedis();
        const serialized = await ig.state.serialize();
        delete serialized.constants; // remove the large constants
        await client.set(sessionId, JSON.stringify({
            state: serialized,
            userId: userId,
            createdAt: new Date()
        }), {
            EX: 60 * 60 * 24 * 7 // 1 week expiration
        });
        console.log('Session created');
    } catch (error) {
        console.log(`Error saving session: ${error.message}`);
    }
}

export const getSession = async (ig, username) => {
    try{
        const sessionId = cookies().get(username)?.value;
        if (sessionId) {
            const client = await initializeRedis();
            const sessionData = await client.get(sessionId);
            if(sessionData){
                const session = JSON.parse(sessionData);
                await ig.state.deserialize(session.state);
                return true;
            }
        }
        return false;
    }catch(error){
        console.log(`Error getting session: ${error.message}`);
    }
}

export const createCookies = async(username, sessionId) => {
    cookies().set(username, sessionId, {
        httpOnly: true, // Recommended for security purposes
        secure: true,
        sameSite: 'lax', // Can be strict or lax depending on your requirements
        path: '/', // The cookie will be available on all pages
        maxAge: 60 * 60 * 24 * 7 // Cookie expiry set to one week
    })
}