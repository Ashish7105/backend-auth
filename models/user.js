const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const userSchema = mongoose.Schema({

    username: String,
    name: String,
    agge: Number,
    email: String,
    password: String,
    post: [
        { type: mongoose.Schema.ObjectId, ref: "post" }
    ],
})


module.exports = mongoose.model('user', userSchema);