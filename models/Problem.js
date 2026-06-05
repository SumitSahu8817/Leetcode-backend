const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    inputFormat: { type: String },
    outputFormat: { type: String },
    testCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true },
            isSample: { type: Boolean, default: false }
        }
    ]
});

module.exports = mongoose.model('Problem', ProblemSchema);