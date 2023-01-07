import mongoose from "mongoose";

const instance = mongoose.Schema({
    caption: String,
    user: String,
    image: String,
    comments:[],
    avater: String,
    timestamps: { type: Date, default: Date.now },
})

export default mongoose.model('posts', instance)








