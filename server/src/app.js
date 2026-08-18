// Add near top with other requires
const cookieParser = require('cookie-parser');
const spacesRouter = require('./routes/spaces');
const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/dashboard');
const budgetRouter = require('./routes/budget');
const reportsRouter = require('./routes/reports');
const PDFDocument = require('pdfkit');

// Add before routes are mounted
app.use(cookieParser());
app.use('/api', categoriesRouter);
app.use('/api/spaces', spacesRouter);
app.use('/api', dashboardRouter);
app.use('/api', budgetRouter);
app.use('/api', reportsRouter);