const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");
const postModel = require("./models/post");

const app = express();


const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/', (req, res) => {
    res.render('index');
})



app.post('/register', async (req, res) => {
    let { email, password, username, name, age, } = req.body;

    console.log("password entered:", password);


    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("user already register")

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log(hash);

            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            })

            let token = jwt.sign({ email: email, userid: user._id }, "shhh");
            res.cookie("token", token);

            res.send("registered");

        })
    })

})



app.get('/login', (req, res) => {
    res.render('login');
})


app.post('/login', async (req, res) => {
    let { email, password } = req.body;


    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("user not found");


    bcrypt.compare(password, user.password, function (err, result) {
        console.log("password entered:", password);
        console.log("password from db:", user.password);
        console.log("bcrypt error:", err);
        console.log("password result:", result);


        if (result) {
            let token = jwt.sign({ email: user.email, userid: user._id }, "shhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");

        }
        else 
            res.redirect("/login");
    })

})


app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})




function isloggedIn(req, res, next) {
    if (!req.cookies.token){
         return res.redirect("/login");
    }
    
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();

}




app.get('/profile', isloggedIn, async (req, res) => {

    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    console.log(user);
    res.render("profile", { user });

})


app.get('/like/:id', isloggedIn, async (req, res) => {

    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){ // it check userid is there or not in  post ke likes array me wo id present nahi hota to -1 return karega  
        post.likes.push(req.user.userid); // this will increase the like
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    
    await post.save();

    res.redirect("/profile");

})




app.post('/post', isloggedIn, async (req, res) => {

    let user = await userModel.findOne({ email: req.user.email });  // this line will find which user is loggedIn 
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    })
    
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

})


app.listen(3001);

