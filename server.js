const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (make sure MongoDB is running locally)
mongoose.connect('mongodb://localhost:27017/course_exit_survey', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define Course schema
const courseSchema = new mongoose.Schema({
    branch: String,
    year: Number,
    semester: Number,
    subjects: Number,
    subjectNames: [String],
    outcomes: [[String]] // Array of arrays for COs per subject
});
const Course = mongoose.model('Course', courseSchema);

// API to add a course
app.post('/api/courses', async (req, res) => {
    try {
        const { branch, year, semester, subjects, subjectNames = [], outcomes } = req.body;
        const course = new Course({ branch, year, semester, subjects, subjectNames, outcomes });
        await course.save();
        res.json({ message: 'Course and outcomes saved successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving course', error: err });
    }
});

// Get courses (optionally filtered by branch/year/semester)
app.get('/api/courses', async (req, res) => {
    try {
        const { branch, year, semester } = req.query;
        console.log('GET /api/courses query:', req.query);
        const filter = {};
        if (branch) filter.branch = branch;
        if (year) filter.year = Number(year);
        if (semester) filter.semester = Number(semester);
        console.log('Applied filter:', filter);
        const courses = await Course.find(filter);
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching courses', error: err });
    }
});

// Feedback schema and endpoints
const feedbackSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rollno: { type: String, required: false },
    feedback: [[[String]]], // Array per subject, per CO value
    createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

app.post('/api/feedback', async (req, res) => {
    try {
        const { courseId, rollno, feedback } = req.body;
        if (!courseId || !feedback) {
            return res.status(400).json({ message: 'courseId and feedback are required' });
        }
        const fb = new Feedback({ courseId, rollno, feedback });
        await fb.save();
        res.json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving feedback', error: err });
    }
});

// Feedback summary for a course
app.get('/api/feedback/summary', async (req, res) => {
    try {
        const { courseId } = req.query;
        if (!courseId) {
            return res.status(400).json({ message: 'courseId is required' });
        }
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const feedbacks = await Feedback.find({ courseId }).lean();
        // Initialize summary structure: [subjects][coIndex] => counts
        const ratingKeys = ['Excellent', 'Good', 'Average'];
        const summary = (course.outcomes || []).map(subjectCOs =>
            subjectCOs.map(() => ({ Excellent: 0, Good: 0, Average: 0 }))
        );
        for (const fb of feedbacks) {
            // fb.feedback is [subjects][coIndex] = rating string
            (fb.feedback || []).forEach((subjectArr, sIdx) => {
                if (!Array.isArray(subjectArr)) return;
                subjectArr.forEach((rating, coIdx) => {
                    if (!summary[sIdx] || !summary[sIdx][coIdx]) return;
                    if (ratingKeys.includes(rating)) {
                        summary[sIdx][coIdx][rating] += 1;
                    }
                });
            });
        }
        res.json({
            course: {
                _id: course._id,
                branch: course.branch,
                year: course.year,
                semester: course.semester,
                subjectNames: course.subjectNames || [],
                outcomes: course.outcomes || []
            },
            totals: summary,
            numResponses: feedbacks.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Error creating feedback summary', error: err });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));



