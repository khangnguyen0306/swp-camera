import express from 'express';
import {

  createRequest,
  getRequests,
  rescheduleRequest,
  updateCallResult
} from '../controllers/consultation.controller.js';

const router = express.Router();

// Create a new consultation request
router.post('/requests', createRequest);

// Get consultation requests
router.get('/requests', getRequests);

// Reschedule a consultation
router.put('/requests/:id/reschedule', rescheduleRequest);

// Update call result
router.put('/requests/:id/call-result', updateCallResult);

export default router;