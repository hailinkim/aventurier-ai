import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    pk:{
        type: Number,
        unique:true,
        required: true,
    },
    username: {
        type: String,
        unique:true,
        required: true,
    },
})

export default mongoose.models.User || mongoose.model('User', userSchema)
