import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
    },
    postPk: {
        type: Number,
        required: true,
    },
    postOwner: {
        username: {
            type: String,
            required: true,
        },
        profileUrl:{
            type: String,
            required: true,
        },
    },
    location:{
        type:Object,
    },
    caption:{
        type: String,
    },
    images:{
        type:[String]
    },
    videos:{
        type:[String]
    },
    lastFetchDate: {
        type: Date,
        default: Date.now
    },
}, { strict: false })

export default mongoose.models.Post || mongoose.model('Post', postSchema)
