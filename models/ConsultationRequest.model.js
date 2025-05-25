import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     CallHistory:
 *       type: object
 *       properties:
 *         callTime:
 *           type: string
 *           format: date-time
 *         result:
 *           type: string
 *           enum: [success, rescheduled, rejected, no_answer]
 *         notes:
 *           type: string
 *         callerInfo:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             name:
 *               type: string
 */

const CallHistorySchema = new mongoose.Schema({
  callTime: {
    type: Date,
    required: true
  },
  result: {
    type: String,
    enum: ['success', 'rescheduled', 'rejected', 'no_answer'],
    required: true
  },
  notes: String,
  callerInfo: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String
  }
}, { timestamps: true });

/**
 * @swagger
 * components:
 *   schemas:
 *     ConsultationRequest:
 *       type: object
 *       properties:
 *         customerName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *         consultationType:
 *           type: string
 *           enum: [call_now, schedule]
 *         preferredTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, scheduled, pending_reschedule, completed, cancelled]
 *         callHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CallHistory'
 *         notes:
 *           type: string
 */

const ConsultationRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: String,
  consultationType: {
    type: String,
    enum: ['call_now', 'schedule'],
    required: true
  },
  preferredTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'pending_reschedule', 'completed', 'cancelled'],
    default: 'pending'
  },
  callHistory: [CallHistorySchema],
  notes: String
}, { timestamps: true });

// Index for sorting by preferredTime
ConsultationRequestSchema.index({ preferredTime: 1, status: 1 });

const ConsultationRequest = mongoose.model('ConsultationRequest', ConsultationRequestSchema);

export default ConsultationRequest; 