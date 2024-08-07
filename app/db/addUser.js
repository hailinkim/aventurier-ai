'use server'
import User from '@/db/models/User'
import mongoose from 'mongoose'

const addUser = async (userId, username) => {
    const userExists = await User.exists({pk: userId});
    if(!userExists){
        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            pk: userId,
            username: username,
            lastFetchDate: new Date()
        });
        await newUser.save();
    }
    return;
}

export { addUser }
