const mongoose = require('mongoose');
const Problem = require('./models/Problem');
require('dotenv').config();

// 🔥 FIX 1: Render aur standard connection ke liye perfect backup string framework
const mongoURI = process.env.MONGO_URI || "mongodb+srv://sumitsahu0683_db_user:Sumit9575@cluster0.brrrh8k.mongodb.net/onlineJudge?retryWrites=true&w=majority";

const questions = [
  {
    title: "1. Even or Odd",
    difficulty: "Easy",
    description: "Given an integer N, print 'Even' if it is even, otherwise print 'Odd'.",
    inputFormat: "A single integer N.",
    outputFormat: "Print 'Even' or 'Odd'.",
    testCases: [
      { input: "4", output: "Even" },
      { input: "7", output: "Odd" }
    ]
  },
  {
    title: "2. Sum of Array",
    difficulty: "Easy",
    description: "Given an integer N followed by N array elements, find the sum of all elements in the array.",
    inputFormat: "First line contains integer N. Second line contains N space-separated integers.",
    outputFormat: "Print a single integer representing the sum.",
    testCases: [
      { input: "3\n1 2 3", output: "6" },
      { input: "5\n10 -2 3 4 5", output: "20" }
    ]
  },
  {
    title: "3. Factorial of N",
    difficulty: "Medium",
    description: "Given an integer N, find its factorial value (N!). Note: N will be up to 12.",
    inputFormat: "A single integer N.",
    outputFormat: "Print the factorial value.",
    testCases: [
      { input: "5", output: "120" },
      { input: "0", output: "1" }
    ]
  },
  {
    title: "4. Find Maximum",
    difficulty: "Easy",
    description: "Given three integers A, B, and C, find and print the maximum value among them.",
    inputFormat: "Three space-separated integers A, B, and C.",
    outputFormat: "Print the largest number.",
    testCases: [
      { input: "5 12 9", output: "12" },
      { input: "-1 -5 0", output: "0" }
    ]
  }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Database connected for seeding... 🔌");
        
        // 🔥 FIX 2: Pehle se maujood saare duplicate/purane questions saaf karo
        await Problem.deleteMany({});
        console.log("Purana saara kachra aur duplicates cleared! 🧹✨");

        // Naye clean questions insert karo
        await Problem.insertMany(questions);
        console.log("Saare premium questions database mein inject ho gaye! 🔥🚀");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();