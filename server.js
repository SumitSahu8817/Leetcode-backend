const crypto = require('crypto');
global.crypto = crypto;
const express = require('express');
// server.js ke sabse top par paste karo (Line 1)

const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Problem = require('./models/Problem');

const UserSchemaUpdate = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    solvedEasy: { type: Number, default: 0 },
    solvedMedium: { type: Number, default: 0 },
    solvedHard: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    streak: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const LiveUser = mongoose.models.User || mongoose.model('User', UserSchemaUpdate);

const app = express();
// server.js me app.use(express.json()); ke just upar ya niche paste karo[cite: 4]
const allowedOrigins = [
  'https://sumit-codeengine.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 🔴 CHANGE 1: Render dynamically PORT assign karega, isliye process.env.PORT lagaya hai
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "judge_secret_token_key_123";

const mongoURI = process.env.MONGO_URI || "mongodb+srv://sumitsahu0683_db_user:Sumit9575@cluster0.brrrh8k.mongodb.net/onlineJudge?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
  .then(() => console.log("Cloud MongoDB Atlas connected successfully! 🔥"))
  .catch((err) => console.error("Database connection error:", err));


app.post('/run', (req, res) => {
    const { code, input } = req.body;
    if (!code) return res.status(400).json({ error: "Code khali nahi ho sakta!" });

    const codeDir = path.join(__dirname, 'codes');
    if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir);

    fs.writeFileSync(path.join(codeDir, 'solution.cpp'), code);
    fs.writeFileSync(path.join(codeDir, 'input.txt'), input || "");

    // 🔴 CHANGE 2: Docker run hatakar, direct container ke andar g++ se run karne ki command
    const dockerCmd = `g++ "${path.join(codeDir, 'solution.cpp')}" -o "${path.join(codeDir, 'a.out')}" && "${path.join(codeDir, 'a.out')}" < "${path.join(codeDir, 'input.txt')}"`;

    const startTime = process.hrtime();
    exec(dockerCmd, { timeout: 8000 }, (error, stdout, stderr) => {
        const diff = process.hrtime(startTime);
        const executionTime = Math.round((diff[0] * 1000) + (diff[1] / 1000000));

        if (error) {
            if (error.killed) return res.status(400).json({ status: "TLE", error: "Your code took too long!" });
            return res.status(400).json({ status: "Runtime Error", error: stderr || error.message });
        }
        res.json({ status: "Success", output: stdout, time: `${executionTime}ms`, memory: "4.2 MB" });
    });
});


app.post('/submit', async (req, res) => {
    const { code, problemId, username } = req.body;
    if (!code || !problemId) return res.status(400).json({ error: "Details missing!" });

    try {
        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ error: "Problem not found!" });

        const codeDir = path.join(__dirname, 'codes');
        if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir);

        fs.writeFileSync(path.join(codeDir, 'solution.cpp'), code);

        const startTime = process.hrtime();
        for (let i = 0; i < problem.testCases.length; i++) {
            const tc = problem.testCases[i];
            fs.writeFileSync(path.join(codeDir, 'input.txt'), tc.input || "");

            // 🔴 CHANGE 3: Submit route me bhi docker run hata kar simple execute command lagayi hai
            const dockerCmd = `g++ "${path.join(codeDir, 'solution.cpp')}" -o "${path.join(codeDir, 'a.out')}" && "${path.join(codeDir, 'a.out')}" < "${path.join(codeDir, 'input.txt')}"`;

            const runCode = () => {
                return new Promise((resolve, reject) => {
                    exec(dockerCmd, { timeout: 10000 }, (error, stdout) => {
                        if (error) reject({ status: "Wrong Answer" });
                        resolve(stdout);
                    });
                });
            };

            try {
                const actualOutput = await runCode();
                if (actualOutput.trim() !== tc.output.trim()) {
                    return res.json({ status: "Wrong Answer", failedAtTestCase: i + 1 });
                }
            } catch (err) {
                return res.json({ status: "Compilation/Runtime Error" });
            }
        }

        const diff = process.hrtime(startTime);
        const executionTime = Math.round((diff[0] * 1000) + (diff[1] / 1000000));

        if (username) {
            const user = await LiveUser.findOne({ username });
            if (user) {
                let scoreGain = 10;
                if (problem.difficulty === "Easy") { user.solvedEasy += 1; scoreGain = 10; }
                else if (problem.difficulty === "Medium") { user.solvedMedium += 1; scoreGain = 30; }
                else if (problem.difficulty === "Hard") { user.solvedHard += 1; scoreGain = 100; }
                user.totalScore += scoreGain;
                await user.save();
            }
        }

        res.json({ status: "Accepted", message: "All test cases passed! 🎉", time: `${executionTime}ms`, memory: "3.8 MB" });

    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
});


app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaders = await LiveUser.find({}).sort({ totalScore: -1 }).limit(10).select('username totalScore solvedEasy solvedMedium solvedHard streak');
        res.json(leaders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/problems', async (req, res) => {
    try {
        const all = await Problem.find({}); 
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/problems', async (req, res) => {
    try {
        const n = new Problem(req.body); 
        await n.save(); 
        res.status(201).json(n);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Saari fields bharna zaroori hai!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password kam se kam 6 character ka hona chahiye!" });
        }

        const existingUser = await LiveUser.findOne({ $or: [{ email: email.trim() }, { username: username.trim() }] });
        if (existingUser) {
            return res.status(400).json({ error: "Username ya Email pehle se registered hai!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const u = new LiveUser({ 
            username: username.trim(), 
            email: email.trim(), 
            password: hashedPassword,
            solvedEasy: 0,
            solvedMedium: 0,
            solvedHard: 0,
            totalScore: 0,
            streak: 1
        });

        await u.save(); 
        res.status(201).json({ message: "Success" });
    } catch (error) {
        console.error("Signup validation failure:", error);
        res.status(500).json({ error: "Server Error", details: error.message });
    }
});


app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email/Username aur Password dono daalna zaroori hai!" });
        }

        const user = await LiveUser.findOne({
            $or: [
                { email: email.trim() },
                { username: email.trim() }
            ]
        });

        if (!user) {
            return res.status(400).json({ error: "Bhai yeh account database mein registered nahi hai!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Password galat hai bhai! Ek baar check karo." });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            token, 
            username: user.username,
            message: "Login Successful!" 
        });

    } catch (error) {
        console.error("Login pipeline failure:", error);
        res.status(500).json({ error: "Server Error", details: error.message });
    }
});


app.get('/api/user/stats/:username', async (req, res) => {
    try {
        const user = await LiveUser.findOne({ username: req.params.username });
        res.json(user || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/problems/:id', async (req, res) => {
    try {
        const problemId = req.params.id;
        const deletedProblem = await Problem.findByIdAndDelete(problemId);
        
        if (!deletedProblem) {
            return res.status(404).json({ error: "Bhai yeh question database mein mila hi nahi!" });
        }
        
        res.json({ message: "Question database se successfully uda diya gaya hai! 🚀" });
    } catch (error) {
        res.status(500).json({ error: "Delete pipeline crash ho gayi", details: error.message });
    }
});

// 🔴 CHANGE 4: Port config updated
app.listen(PORT, () => console.log(`Server firing on port ${PORT} 🚀`));