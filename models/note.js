const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const date = new Date(Date.now());
const day = date.getDate().toString().padStart(2, '0'); // Ensures the day is two digits
const month = date.toLocaleString('default', { month: 'short' }); // Get the short month name
const year = date.getFullYear();

const d=`${day} ${month} ${year}`;

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        // required: true
        default: "Here comes your Notes..."
    },
    tag: {
        type: [],
    },
    views: {
        type: Number,
        default: 0
    },
    date:{
        type:String,
        default:d   }
});

const note = mongoose.model('note', noteSchema);

module.exports = note;
