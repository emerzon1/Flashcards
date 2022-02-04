const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.static("public"));
const StudySet = require("./models/StudySet");
const User = require("./models/User");
app.use(express.json());
app.set("view engine", "ejs");
var GoogleStrategy = require("passport-google-oauth2").Strategy;
passport.serializeUser(function (user, done) {
	console.log(user);
	done(null, user);
});
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/auth/google");
};

app.use(
	session({
		secret: "evanmerzon",
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.initialize()); // init passport on every route call
app.use(passport.session());
passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: `${process.env.URL}/auth/google/callback`,
			passReqToCallback: true,
		},
		function (request, accessToken, refreshToken, profile, done) {
			User.findOrCreate(
				{ userId: profile.id, name: profile.displayName },
				function (err, user) {
					return done(err, user._id);
				}
			);
		}
	)
);

const db = mongoose.connect(
	`mongodb+srv://emerzon:${process.env.DB_CONNECTION}@cluster0.21dvt.mongodb.net/studySets?retryWrites=true&w=majority`
);
app.get("/", (req, res) => {
	console.log(req.user);
	res.render("pages/home.ejs", { user: req.user });
});
app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
	"/auth/google/callback",
	passport.authenticate("google", {
		successRedirect: "/",
		failureRedirect: "/auth/google",
	})
);

app.get("/api/", checkAuthenticated, async (req, res) => {
	const all = await StudySet.find({ user: req.userId });
	const arr = [];
	for (let i of all) {
		arr.push(i.title);
	}
	res.send(arr);
});
app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});
app.get("/api/set", checkAuthenticated, async (req, res) => {
	const title = req.body.title.toLowerCase();
	console.log(title);
	const result = await StudySet.findOne({ title, user: req.user.userId });
	if (result) {
		console.log(result);
		res.send(result);
	} else {
		res.status(404).send("No set with that title");
	}
});

app.post("/api/set", checkAuthenticated, async (req, res) => {
	const title = req.body.title.toLowerCase();
	const definition = req.body.definition;
	const term = req.body.term;
	const isOne = await StudySet.findOne({ title, user: req.user.userId });
	if (isOne) {
		res.status(400).send("Already a study set with that title");
	} else {
		const newset = new StudySet({
			title,
			definition,
			term,
			user: req.user.userId,
		});
		newset.save();
		res.send(newset);
	}
});

app.patch("/api/set", checkAuthenticated, async (req, res) => {
	const title = req.body.title.toLowerCase();
	const definition = req.body.definition;
	const term = req.body.definition;
	const isOne = await StudySet.findOne({ title });
	if (isOne) {
		await StudySet.findOneAndUpdate(
			{ title, user: req.user.userId },
			{ title, definition, term }
		);
		res.send(await StudySet.findOne({ title, user: req.user.userId }));
	} else {
		res.send(404).send("No study set with that name found");
	}
});

app.listen(3000, () => {
	console.log("Running");
});
