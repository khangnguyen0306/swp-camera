// back-end/utils/initAdmin.js
import Auth from '../models/Auth.model.js';

export const createDefaultAdmin = async () => {
  const adminUsername = 'admin';
  const adminEmail = 'admin123@gmail.com';
  const adminPassword = '123'; 
  const adminRole = 'admin';

  // Kiểm tra xem đã có admin chưa
  const adminExists = await Auth.findOne({ role: adminRole });
  if (!adminExists) {
    await Auth.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminPassword,
      role: adminRole,
      firstName: 'Admin',
      lastName: 'Admin',
      isEmailVerified: true
    });
    console.log('Default admin account created!');
  } else {
    console.log('Admin account already exists.');
  }
};