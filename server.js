import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { createDefaultAdmin } from './utils/InitAccount.js';
import UserRoute from './routes/User.route.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
// const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// import productRoutes from './routes/productRoutes.js';
// import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

connectDB();
createDefaultAdmin();
app.use('/api/users', UserRoute);
// app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));