const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'product',
      required: true
    },
    quantity: {
      type: Number,
      min: 1,
      required: true
    }
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    items: {
      type: [reservationItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Reservation must include at least one item'
      }
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELED'],
      default: 'ACTIVE'
    },
    source: {
      type: String,
      enum: ['CART', 'MANUAL'],
      required: true
    },
    canceledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('reservation', reservationSchema);
