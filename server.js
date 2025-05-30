import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { createDefaultAdmin } from './utils/InitAccount.js';
import UserRoute from './routes/User.route.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import ProductTypeRoute from './routes/productType.routes.js';
import productRoutes from './routes/product.routes.js';
import brandRoutes from './routes/brand.routes.js';
import CartRoute from './routes/Cart.route.js';
import OrderRoute from './routes/Order.route.js';
import PaymentRoute from './routes/Payment.route.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './swaggerConfig.js';
import ConsultationRoute from './routes/consultation.routes.js';
import cors from 'cors';
import ComboRoute from './routes/combo.route.js';

// const { notFound, errorHandler } = require('./middleware/errorMiddleware');

        // import productRoutes from './routes/productRoutes.js';
// import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();
createDefaultAdmin();
app.use('/api/users', UserRoute);
app.use('/api/product-types', ProductTypeRoute);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', CartRoute);
app.use('/api/orders', OrderRoute);
app.use('/api/payments', PaymentRoute);
app.use('/api/consultations', ConsultationRoute);
app.use('/api/combos', ComboRoute);


const specs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));