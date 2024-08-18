"use server";
import { IgApiClient } from 'instagram-private-api-hk';
import {addUser} from '@/db/addUser';
import {addPost} from '@/db/addPost';
import User from '@/db/models/User';
import Post from '@/db/models/Post';
import initializeRedis from '@/lib/redis-client';
import { cookies } from 'next/headers';
import { ocr } from './lib/ocr';
import mongoose from 'mongoose';

const ig = new IgApiClient();

export const createSession = async (userId, sessionId) => {
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

export const getSession = async (username) => {
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
        sameSite: 'lax',
        path: '/', // The cookie will be available on all pages
        maxAge: 60 * 60 * 24 * 7 // Cookie expiry set to one week
    })
}

async function fetchSavedFeed(username) {
    try{
        let savedFeed = ig.feed.saved();
        let allItems = [];
        let moreAvailable = false;
        // let stopFetching = false;

        const user = await User.findOne({ username: username });
        if (!user) {
            throw new Error('User not found');
        }

        const existingPosts = await Post.find({ user: user._id }).select('postPk lastFetchDate');
        const existingPostMap = new Map(existingPosts.map(post => [post.postPk, post.lastFetchDate]));

        console.time('async Filtering');
        do {
            const {items, more_available} = await savedFeed.request();
            const newItems = items.filter(item => {
                const postPk = Number(item.media.pk);
                const lastFetchDate = existingPostMap.get(postPk);

                if (existingPostMap.has(postPk)) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
                    if (lastFetchDate && new Date(lastFetchDate) > sevenDaysAgo) {
                        return false; // Skip this item
                    }
                }
                return true;
            });
            console.log("items length: ", newItems.length);
            // if (newItems.length < items.length) { 
            //     stopFetching = true;
            // }
        
            allItems = [...allItems, ...newItems.map(item => item.media)];
            moreAvailable = more_available;
            // moreAvailable = more_available && !stopFetching;
        } while (moreAvailable);
        console.timeEnd('async Filtering');

        return { message: "Success", items: allItems };
    } catch(error) {
        return { message: `Saved Feed Fetch Error: ${error.message}` };
    }
}

export async function login(prevState, formData) {
    try {
        const username = formData.get('username');
        const password = formData.get('password');
        const sessionRestored = await getSession(username);
        if (!sessionRestored) {
            ig.state.generateDevice(username);
            await ig.simulate.preLoginFlow();
            await ig.account.login(username, password);
            process.nextTick(async () => await ig.simulate.postLoginFlow());
            const user = await ig.user.searchExact(username);
            const userId = user.pk;
            await addUser(userId, username);
            const sessionId = ig.state.uuid;
            await createCookies(username, sessionId);
            await createSession(userId, sessionId, ig);
        }
        const res = await fetchSavedFeed(username);
        if(res.message === "Success" && res.items){
            const itemsWithOCR = await ocr(res.items);
            await addPost(username, itemsWithOCR);
        }
        return { message: "Success", username: username};
    } catch (error) {
        return { message: error.message};
    }
}

export async function fetchInitialFeed(username) {
    try{
        const user = await User.findOne({ username: username });
        if (!user) {
            return { success: false, initialFeed: null, message: 'User not found' };
        }
        const initialFeed = await Post.find({user: user._id}).sort({ _id: 1 }).limit(21);
        return { success: true, initialFeed: initialFeed };
    } catch (error) {
        return { success: false, initialFeed: null, message: `Error: ${error.message}` };
    }
}

export async function fetchSourcePosts(postIds) {
    if(postIds){
        const objectIds = postIds.map(id => new mongoose.Types.ObjectId(id));
        const posts = Post.find({ _id: { $in: objectIds }});
        return posts;
    }
}

export async function search(username, query){
    const response = await fetch('http://localhost:3000/api/python', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, question: query, mode: "search"}),
    }); 
    const response_json = await response.json();
    const posts = await fetchSourcePosts(response_json["post_ids"]);
    return posts;
}