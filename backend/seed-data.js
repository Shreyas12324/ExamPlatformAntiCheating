const mongoose = require('mongoose');
const Test = require('./models/testModel');
const Question = require('./models/questionModel');
const User = require('./models/usersModel');
const { doHash } = require('./utils/hashing');

// Sample test data - Multiple tests
const sampleTests = [
	{
		title: 'JavaScript Basics - Sample Test',
		description: 'A quick test to evaluate your JavaScript fundamentals',
		duration: 15, // 15 minutes
		totalMarks: 5,
		passingMarks: 3,
		isActive: true,
		allowedAttempts: 2,
		instructions: 'Answer all questions to the best of your ability. No external help allowed. Your webcam will be monitored.',
		createdBy: null,
	},
	{
		title: 'Python Programming Quiz',
		description: 'Test your Python knowledge with this comprehensive quiz',
		duration: 30,
		totalMarks: 10,
		passingMarks: 6,
		isActive: true,
		allowedAttempts: 1,
		instructions: 'Read each question carefully. Multiple attempts are not allowed. Stay focused and avoid tab switching.',
		createdBy: null,
	},
	{
		title: 'Web Development Fundamentals',
		description: 'HTML, CSS, and JavaScript concepts',
		duration: 25,
		totalMarks: 8,
		passingMarks: 5,
		isActive: true,
		allowedAttempts: 2,
		instructions: 'This test covers basic web development concepts. Make sure your face is visible in the webcam.',
		createdBy: null,
	},
	{
		title: 'Data Structures & Algorithms Assessment',
		description: 'Covers arrays, linked lists, trees, and algorithm analysis',
		duration: 45,
		totalMarks: 15,
		passingMarks: 9,
		isActive: true,
		allowedAttempts: 1,
		instructions: 'Solve each problem carefully. Keep diagrams or scratch work off-camera.',
		createdBy: null,
	},
	{
		title: 'Database Management Systems Essentials',
		description: 'SQL queries, normalization, and transaction concepts',
		duration: 20,
		totalMarks: 10,
		passingMarks: 6,
		isActive: true,
		allowedAttempts: 2,
		instructions: 'Query building questions ahead. Avoid referencing external cheat sheets.',
		createdBy: null,
	},
	
];

const sampleQuestions = {
	javascript: [
		{
			questionText: 'What does "const" keyword do in JavaScript?',
			options: [
				{ optionIndex: 'A', optionText: 'Declares a variable that cannot be reassigned' },
				{ optionIndex: 'B', optionText: 'Creates a constant function' },
				{ optionIndex: 'C', optionText: 'Makes a variable immutable' },
				{ optionIndex: 'D', optionText: 'Declares a global variable' },
			],
			correctAnswer: 'A',
			marks: 1,
			questionNumber: 1,
		},
		{
			questionText: 'Which method is used to add an element at the end of an array?',
			options: [
				{ optionIndex: 'A', optionText: 'array.add()' },
				{ optionIndex: 'B', optionText: 'array.push()' },
				{ optionIndex: 'C', optionText: 'array.append()' },
				{ optionIndex: 'D', optionText: 'array.insert()' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 2,
		},
		{
			questionText: 'What is the output of: typeof null',
			options: [
				{ optionIndex: 'A', optionText: '"null"' },
				{ optionIndex: 'B', optionText: '"undefined"' },
				{ optionIndex: 'C', optionText: '"object"' },
				{ optionIndex: 'D', optionText: '"number"' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 3,
		},
		{
			questionText: 'Which of the following is NOT a JavaScript data type?',
			options: [
				{ optionIndex: 'A', optionText: 'String' },
				{ optionIndex: 'B', optionText: 'Boolean' },
				{ optionIndex: 'C', optionText: 'Float' },
				{ optionIndex: 'D', optionText: 'Symbol' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 4,
		},
		{
			questionText: 'What does the "===" operator do?',
			options: [
				{ optionIndex: 'A', optionText: 'Compares values only' },
				{ optionIndex: 'B', optionText: 'Compares values and types' },
				{ optionIndex: 'C', optionText: 'Assigns a value' },
				{ optionIndex: 'D', optionText: 'Checks if value exists' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 5,
		},
	],
	python: [
		{
			questionText: 'Which keyword is used to define a function in Python?',
			options: [
				{ optionIndex: 'A', optionText: 'function' },
				{ optionIndex: 'B', optionText: 'def' },
				{ optionIndex: 'C', optionText: 'func' },
				{ optionIndex: 'D', optionText: 'define' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 1,
		},
		{
			questionText: 'What is the correct way to create a list in Python?',
			options: [
				{ optionIndex: 'A', optionText: 'list = (1, 2, 3)' },
				{ optionIndex: 'B', optionText: 'list = [1, 2, 3]' },
				{ optionIndex: 'C', optionText: 'list = {1, 2, 3}' },
				{ optionIndex: 'D', optionText: 'list = <1, 2, 3>' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 2,
		},
		{
			questionText: 'What does the len() function return?',
			options: [
				{ optionIndex: 'A', optionText: 'The length of a string or collection' },
				{ optionIndex: 'B', optionText: 'The last element' },
				{ optionIndex: 'C', optionText: 'The type of object' },
				{ optionIndex: 'D', optionText: 'The memory size' },
			],
			correctAnswer: 'A',
			marks: 1,
			questionNumber: 3,
		},
		{
			questionText: 'Which of these is used for comments in Python?',
			options: [
				{ optionIndex: 'A', optionText: '//' },
				{ optionIndex: 'B', optionText: '/* */' },
				{ optionIndex: 'C', optionText: '#' },
				{ optionIndex: 'D', optionText: '<!-- -->' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 4,
		},
		{
			questionText: 'What is the output of: print(type([]))?',
			options: [
				{ optionIndex: 'A', optionText: '<class \'array\'>' },
				{ optionIndex: 'B', optionText: '<class \'list\'>' },
				{ optionIndex: 'C', optionText: '<class \'tuple\'>' },
				{ optionIndex: 'D', optionText: '<class \'dict\'>' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 5,
		},
		{
			questionText: 'Which operator is used for exponentiation in Python?',
			options: [
				{ optionIndex: 'A', optionText: '^' },
				{ optionIndex: 'B', optionText: '**' },
				{ optionIndex: 'C', optionText: 'exp()' },
				{ optionIndex: 'D', optionText: 'pow()' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 6,
		},
		{
			questionText: 'What is a correct syntax to output "Hello World" in Python?',
			options: [
				{ optionIndex: 'A', optionText: 'echo("Hello World")' },
				{ optionIndex: 'B', optionText: 'p("Hello World")' },
				{ optionIndex: 'C', optionText: 'print("Hello World")' },
				{ optionIndex: 'D', optionText: 'console.log("Hello World")' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 7,
		},
		{
			questionText: 'Which collection is ordered and unchangeable?',
			options: [
				{ optionIndex: 'A', optionText: 'List' },
				{ optionIndex: 'B', optionText: 'Tuple' },
				{ optionIndex: 'C', optionText: 'Set' },
				{ optionIndex: 'D', optionText: 'Dictionary' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 8,
		},
		{
			questionText: 'What is the correct file extension for Python files?',
			options: [
				{ optionIndex: 'A', optionText: '.pyth' },
				{ optionIndex: 'B', optionText: '.pt' },
				{ optionIndex: 'C', optionText: '.py' },
				{ optionIndex: 'D', optionText: '.python' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 9,
		},
		{
			questionText: 'Which statement is used to stop a loop?',
			options: [
				{ optionIndex: 'A', optionText: 'stop' },
				{ optionIndex: 'B', optionText: 'break' },
				{ optionIndex: 'C', optionText: 'exit' },
				{ optionIndex: 'D', optionText: 'end' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 10,
		},
	],
	webdev: [
		{
			questionText: 'What does HTML stand for?',
			options: [
				{ optionIndex: 'A', optionText: 'Hyper Text Markup Language' },
				{ optionIndex: 'B', optionText: 'High Tech Modern Language' },
				{ optionIndex: 'C', optionText: 'Home Tool Markup Language' },
				{ optionIndex: 'D', optionText: 'Hyperlinks and Text Markup Language' },
			],
			correctAnswer: 'A',
			marks: 1,
			questionNumber: 1,
		},
		{
			questionText: 'Which HTML tag is used for the largest heading?',
			options: [
				{ optionIndex: 'A', optionText: '<heading>' },
				{ optionIndex: 'B', optionText: '<h6>' },
				{ optionIndex: 'C', optionText: '<h1>' },
				{ optionIndex: 'D', optionText: '<head>' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 2,
		},
		{
			questionText: 'What does CSS stand for?',
			options: [
				{ optionIndex: 'A', optionText: 'Computer Style Sheets' },
				{ optionIndex: 'B', optionText: 'Cascading Style Sheets' },
				{ optionIndex: 'C', optionText: 'Creative Style Sheets' },
				{ optionIndex: 'D', optionText: 'Colorful Style Sheets' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 3,
		},
		{
			questionText: 'Which property is used to change the background color in CSS?',
			options: [
				{ optionIndex: 'A', optionText: 'color' },
				{ optionIndex: 'B', optionText: 'bgcolor' },
				{ optionIndex: 'C', optionText: 'background-color' },
				{ optionIndex: 'D', optionText: 'bg-color' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 4,
		},
		{
			questionText: 'How do you insert a comment in a CSS file?',
			options: [
				{ optionIndex: 'A', optionText: '// this is a comment' },
				{ optionIndex: 'B', optionText: '<!-- this is a comment -->' },
				{ optionIndex: 'C', optionText: '/* this is a comment */' },
				{ optionIndex: 'D', optionText: '# this is a comment' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 5,
		},
		{
			questionText: 'Which HTML attribute specifies an alternate text for an image?',
			options: [
				{ optionIndex: 'A', optionText: 'title' },
				{ optionIndex: 'B', optionText: 'alt' },
				{ optionIndex: 'C', optionText: 'src' },
				{ optionIndex: 'D', optionText: 'longdesc' },
			],
			correctAnswer: 'B',
			marks: 1,
			questionNumber: 6,
		},
		{
			questionText: 'Inside which HTML element do we put the JavaScript?',
			options: [
				{ optionIndex: 'A', optionText: '<js>' },
				{ optionIndex: 'B', optionText: '<scripting>' },
				{ optionIndex: 'C', optionText: '<script>' },
				{ optionIndex: 'D', optionText: '<javascript>' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 7,
		},
		{
			questionText: 'How do you create a function in JavaScript?',
			options: [
				{ optionIndex: 'A', optionText: 'function:myFunction()' },
				{ optionIndex: 'B', optionText: 'function = myFunction()' },
				{ optionIndex: 'C', optionText: 'function myFunction()' },
				{ optionIndex: 'D', optionText: 'def myFunction()' },
			],
			correctAnswer: 'C',
			marks: 1,
			questionNumber: 8,
		},
	],
	dsa: [
		{
			questionText: 'What is the time complexity of searching in a balanced binary search tree?',
			options: [
				{ optionIndex: 'A', optionText: 'O(1)' },
				{ optionIndex: 'B', optionText: 'O(log n)' },
				{ optionIndex: 'C', optionText: 'O(n)' },
				{ optionIndex: 'D', optionText: 'O(n log n)' },
			],
			correctAnswer: 'B',
			marks: 2,
			questionNumber: 1,
		},
		{
			questionText: 'Which data structure is best suited for implementing recursion?',
			options: [
				{ optionIndex: 'A', optionText: 'Queue' },
				{ optionIndex: 'B', optionText: 'Array' },
				{ optionIndex: 'C', optionText: 'Stack' },
				{ optionIndex: 'D', optionText: 'Heap' },
			],
			correctAnswer: 'C',
			marks: 3,
			questionNumber: 2,
		},
		{
			questionText: 'Which traversal of a binary tree yields nodes in sorted order if it is a BST?',
			options: [
				{ optionIndex: 'A', optionText: 'Pre-order' },
				{ optionIndex: 'B', optionText: 'In-order' },
				{ optionIndex: 'C', optionText: 'Post-order' },
				{ optionIndex: 'D', optionText: 'Level-order' },
			],
			correctAnswer: 'B',
			marks: 2,
			questionNumber: 3,
		},
		{
			questionText: 'What is the worst-case time complexity of Quick Sort?',
			options: [
				{ optionIndex: 'A', optionText: 'O(n)' },
				{ optionIndex: 'B', optionText: 'O(n log n)' },
				{ optionIndex: 'C', optionText: 'O(n^2)' },
				{ optionIndex: 'D', optionText: 'O(log n)' },
			],
			correctAnswer: 'C',
			marks: 4,
			questionNumber: 4,
		},
		{
			questionText: 'Which algorithm uses dynamic programming to find the shortest path in a weighted DAG?',
			options: [
				{ optionIndex: 'A', optionText: 'Bellman-Ford' },
				{ optionIndex: 'B', optionText: "Dijkstra's" },
				{ optionIndex: 'C', optionText: 'Floyd-Warshall' },
				{ optionIndex: 'D', optionText: 'Topological order-based shortest path' },
			],
			correctAnswer: 'D',
			marks: 4,
			questionNumber: 5,
		},
	],
	database: [
		{
			questionText: 'Which SQL command is used to remove a table and its data permanently?',
			options: [
				{ optionIndex: 'A', optionText: 'DELETE' },
				{ optionIndex: 'B', optionText: 'DROP' },
				{ optionIndex: 'C', optionText: 'TRUNCATE' },
				{ optionIndex: 'D', optionText: 'REMOVE' },
			],
			correctAnswer: 'B',
			marks: 2,
			questionNumber: 1,
		},
		{
			questionText: 'Which normal form eliminates transitive dependencies?',
			options: [
				{ optionIndex: 'A', optionText: 'First Normal Form' },
				{ optionIndex: 'B', optionText: 'Second Normal Form' },
				{ optionIndex: 'C', optionText: 'Third Normal Form' },
				{ optionIndex: 'D', optionText: 'Boyce-Codd Normal Form' },
			],
			correctAnswer: 'C',
			marks: 2,
			questionNumber: 2,
		},
		{
			questionText: 'What does ACID stand for in database transactions?',
			options: [
				{ optionIndex: 'A', optionText: 'Atomicity, Consistency, Isolation, Durability' },
				{ optionIndex: 'B', optionText: 'Accuracy, Consistency, Isolation, Dependability' },
				{ optionIndex: 'C', optionText: 'Atomicity, Correctness, Integrity, Durability' },
				{ optionIndex: 'D', optionText: 'Aggregated, Consistent, Integrated, Distributed' },
			],
			correctAnswer: 'A',
			marks: 2,
			questionNumber: 3,
		},
		{
			questionText: 'Which SQL clause is used to filter the results after GROUP BY?',
			options: [
				{ optionIndex: 'A', optionText: 'WHERE' },
				{ optionIndex: 'B', optionText: 'HAVING' },
				{ optionIndex: 'C', optionText: 'ORDER BY' },
				{ optionIndex: 'D', optionText: 'LIMIT' },
			],
			correctAnswer: 'B',
			marks: 2,
			questionNumber: 4,
		},
		{
			questionText: 'Which index type maintains separate storage for each column to accelerate search?',
			options: [
				{ optionIndex: 'A', optionText: 'Clustered index' },
				{ optionIndex: 'B', optionText: 'Composite index' },
				{ optionIndex: 'C', optionText: 'Non-clustered index' },
				{ optionIndex: 'D', optionText: 'Hash index' },
			],
			correctAnswer: 'C',
			marks: 2,
			questionNumber: 5,
		},
	],
};

async function seedData() {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-platform';
		await mongoose.connect(mongoUri);
		console.log('✅ Connected to MongoDB');

		// Clear existing data
		console.log('🗑️  Clearing existing data...');
		await Test.deleteMany({});
		await Question.deleteMany({});
		await User.deleteMany({ email: { $in: ['admin@test.com', 'student@test.com'] } });

		// Create admin user
		console.log('👤 Creating admin user...');
		const hashedAdminPassword = await doHash('admin123', 12);
		const admin = await User.create({
			email: 'admin@test.com',
			password: hashedAdminPassword,
			type: 'admin',
			verified: true,
		});
		console.log('✅ Admin user created: admin@test.com / admin123');

		// Create sample candidate user
		console.log('👤 Creating candidate user...');
		const hashedStudentPassword = await doHash('student123', 12);
		const student = await User.create({
			email: 'student@test.com',
			password: hashedStudentPassword,
			type: 'candidate',
			verified: true,
		});
		console.log('✅ Candidate user created: student@test.com / student123');

		// Create tests and questions
		console.log('\n📝 Creating tests and questions...');
		
		// Create each test & attach its question bank
		const createdTests = [];

		const attachQuestions = async (testIndex, questionKey) => {
			sampleTests[testIndex].createdBy = admin._id;
			const createdTest = await Test.create(sampleTests[testIndex]);
			const linkedQuestions = sampleQuestions[questionKey].map((q) => ({
				...q,
				testId: createdTest._id,
			}));
			await Question.insertMany(linkedQuestions);
			createdTests.push({
				title: createdTest.title,
				questionCount: linkedQuestions.length,
			});
			console.log(`✅ ${createdTest.title} - ${linkedQuestions.length} questions`);
		};

		await attachQuestions(0, 'javascript');
		await attachQuestions(1, 'python');
		await attachQuestions(2, 'webdev');
		await attachQuestions(3, 'dsa');
		await attachQuestions(4, 'database');

		console.log('\n🎉 Sample data seeded successfully!\n');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📊 DATABASE SUMMARY:');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('👥 Users Created:');
		console.log('   Admin    : admin@test.com / admin123');
		console.log('   Student  : student@test.com / student123');
		console.log('\n📝 Tests Created:');
		createdTests.forEach((item, index) => {
			console.log(`   ${index + 1}. ${item.title} (${item.questionCount} questions)`);
		});
		const totalQuestions = createdTests.reduce((sum, item) => sum + item.questionCount, 0);
		console.log(`\n🎯 Total: ${createdTests.length} Tests, ${totalQuestions} Questions`);
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('\n🚀 Next Steps:');
		console.log('1. Start the backend: npm run dev');
		console.log('2. Start the ML service: python main.py');
		console.log('3. Start the frontend: npm run dev');
		console.log('4. Login with student@test.com / student123');
		console.log('5. Take a test and see anti-cheating in action!\n');

		mongoose.connection.close();
	} catch (error) {
		console.error('❌ Error seeding data:', error);
		mongoose.connection.close();
		process.exit(1);
	}
}

seedData();
