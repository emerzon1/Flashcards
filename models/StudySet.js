const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const StudySet = new mongoose.Schema({
	title: String,
	term: [String],
	definition: [String],
	user: String,
});

StudySet.plugin(findOrCreate);
module.exports = mongoose.model("Set", StudySet);
