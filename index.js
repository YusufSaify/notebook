require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const user = require('./models/user');
const note = require('./models/note');
const { body, validationResult } = require('express-validator')
const passport = require('passport');
const { initializePassport, isAuthenticated, isNotAuthenticated } = require('./passportConfig');
const expressSession = require('express-session');
const connectToDB = require('./mongodb');
const upload = require('./multer');

connectToDB();

initializePassport(passport);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', "ejs");
app.use(expressSession({ secret: "yusuf is great", resave: false, saveUninitialized: false }))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));



app.get('/', function (req, res) {
    res.render('index');
})

app.get('/login', isNotAuthenticated, function (req, res) {
    res.render('login', { error: "" });
})

app.get('/signup', isNotAuthenticated, function (req, res) {
    res.render("signup", { error: "" });
})

app.post('/signup',  // Validate note input
    body('username', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Enter a valid password').isLength({ min: 5 }),
    async (req, res) => {
        console.log(req.body.username);

        const userexist = await note.findOne({ email: req.body.email });
        if (userexist) {
            return res.render('signup', { error: [{ msg: 'note already exists with that email id' }] });
        }


        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // If there are validation errors, render the signup page with the error messages
            return res.status(400).render("signup", { error: errors.array() });
        }


        try {
            const newuser = await user.create({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password
            });
            // Respond with success message or redirect to another page
            res.status(200).render('login', { error: '' });
        } catch (error) {
            console.error(error); // Log the error for debugging
            res.status(500).json("Server problem");
        }
    });

app.post('/login', passport.authenticate('local'), (req, res) => {
    // console.log(req.note._id);
    res.redirect('/profile');
});

app.get('/profile', isAuthenticated, async (req, res) => {
    const userfound = await user.findOne({ _id: req.user._id }).populate("notes");
    if (userfound) {
        const reversedNotes = userfound.notes.reverse(); // Reversing the array
        // console.log(reversedNotes);
        res.render('profile', { notes: reversedNotes ,username: userfound.username});
    }
});


// app.get('/editprofile', isAuthenticated, async (req, res) => {
//     const posts = await post.find({ owner: req.note._id });
//     res.render('editprofile', { note: req.note, posts });
// })

// app.get('/editnotedetail', isAuthenticated, (req, res) => {
//     res.render('editnoteprofiledetail', { note: req.note });
// })

// app.post('/updatenoteprofiledetail', isAuthenticated, upload.single('image'), async (req, res) => {
//     if (req.file) {
//         const updatednote = await note.findOneAndUpdate({ notename: req.note.notename }, {
//             notename: req.body.notename,
//             image: req.file.filename,
//             about: req.body.about
//         }, {});
//     } else {
//         const updatednote = await note.findOneAndUpdate({ notename: req.note.notename }, {
//             notename: req.body.notename,
//             about: req.body.about
//         }, {});
//     }
//     // console.log(updatednote);
//     res.redirect('/editprofile');
// })

// app.get('/createpost', isAuthenticated, (req, res) => {
//     res.render('createpost', { note: req.note });

// })

app.post('/addnote', isAuthenticated, async (req, res) => {
    try {
        const userfound = await user.findOne({ email: req.user.email });
        if (userfound) {
            // Split the title into two parts based on the first "/"
            const parts = req.body.title.split("/");
            let title = parts.shift().trim(); // Get the first part as title and trim
            let description = parts.join("/").trim(); // Join the remaining parts and use as description, trimming any leading or trailing whitespace

            const date = Date.now();



            // Create the note object
            const creatednote = await note.create({
                title: title,
                description: description,
            });

            // Push the note ID to the user's notes array
            userfound.notes.push(creatednote._id);
            await userfound.save();
        }
        res.redirect('/profile');
    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/deletenote/:id', isAuthenticated, async (req, res) => {

    const userfound = await note.findByIdAndDelete({ _id: req.params.id });

    res.redirect('/profile');
})
// app.get('/show/:postid', isAuthenticated, async (req, res) => {
//     const foundpost = await post.findOne({ _id: req.params.postid }).populate("owner");
//     res.render('showpost', { post: foundpost });
// })

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('login');
    });
});
app.get("/editnote/:id", isAuthenticated, async (req, res) => {
    const notefound = await note.findOne({ _id: req.params.id });
    if (notefound) {
        res.render('editprofile', { note: notefound });
    }
})
app.post('/updatenote/:id', isAuthenticated, async (req, res) => {
    try {
        const updatedNote = await note.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                description: req.body.description
            },
            { new: true } // Return the updated document
        );
        if (updatedNote) {
            res.status(200).send(updatedNote); // Send the updated note as a response
        } else {
            res.status(404).send('Note not found'); // Send a 404 if the note was not found
        }
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Internal Server Error'); // Handle any errors
    }
});


function formatDateForStorage(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}
app.listen(process.env.PORT, () => {
    console.log("server started....");
});

