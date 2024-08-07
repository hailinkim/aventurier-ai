"use server";
// import { IgApiClient } from '../../../../instagram-private-api/dist/core/client.js';
import { IgApiClient } from 'instagram-private-api-hk';
import { createSession, getSession, createCookies} from '@/lib/sessionHandler.js';
import {addUser} from '@/db/addUser';
import {cookies} from 'next/headers';
import {addPost} from '@/db/addPost';
import User from '@/db/models/User';
import Post from '@/db/models/Post';

// import {instaLogin} from '@/lib/loginUtils';

const ig = new IgApiClient();

async function fetchSavedFeed(username) {
    try{
        let allItems = [];
        const savedFeed = ig.feed.saved();
        let moreAvailable = false;
        // let stopFetching = false;

        const user = await User.findOne({ username: username });
        if (!user) {
            throw new Error('User not found');
        }
        // const existingPostPks = await Post.find({ user: user._id }).distinct('postPk');
        do{
            const {items, more_available} = await savedFeed.request();
            allItems = [...allItems, ...items.map(item => item.media)];
            // const newItems = items.filter(item => !existingPostPks.includes(Number(item.media.pk)));
            // if (newItems.length < items.length) {
            //     stopFetching = true;
            // }
            // allItems = [...allItems, ...newItems.map(item => item.media)];
            // moreAvailable = more_available && !stopFetching;
        } while(moreAvailable);
        return allItems;
    } catch(error) {
        console.log('Error fetching posts: ', error.message);
        return;
    }
}

async function fetchInitialFeed(username) {
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

export async function login(prevState, formData) {
    try {
        const username = formData.get('username');
        const password = formData.get('password');
        const sessionRestored = await getSession(ig, username);
        if (!sessionRestored) {
            console.log("create session");
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
        const items = await fetchSavedFeed(username);
        console.log('Items: ', items.length);
        if(items){
            await addPost(username, items);
        }
        const res = await fetchInitialFeed(username);
        if(res.success && res.initialFeed){
            return JSON.stringify({ success: true, username: username, initialFeed: res.initialFeed });
        }
        return JSON.stringify({ success: false, message: res.message });
    } catch (error) {
        console.log('Error: ', error.message);
        return JSON.stringify({ success: false, message: error.message });
    }
}