const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const User = new mongoose.Schema({
	userId: String,
	name: String,
});

User.plugin(findOrCreate);

module.exports = mongoose.model("Users", User);
