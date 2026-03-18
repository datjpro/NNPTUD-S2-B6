const express = require('express');
const mongoose = require('mongoose');
const { checkLogin } = require('../utils/authHandler');
const inventoryModel = require('../schemas/inventories');
const reservationModel = require('../schemas/reservations');
const cartModel = require('../schemas/carts');

const router = express.Router();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeItems(itemsInput) {
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    throw new HttpError(400, 'items must be a non-empty array');
  }

  const grouped = new Map();
  for (const item of itemsInput) {
    if (!item || typeof item !== 'object') {
      throw new HttpError(400, 'each item must be an object');
    }
    const { product, quantity } = item;
    if (!mongoose.Types.ObjectId.isValid(product)) {
      throw new HttpError(400, 'invalid product id');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, 'quantity must be a positive integer');
    }
    const key = String(product);
    grouped.set(key, (grouped.get(key) || 0) + quantity);
  }

  return Array.from(grouped.entries()).map(([product, quantity]) => ({
    product: new mongoose.Types.ObjectId(product),
    quantity
  }));
}

async function holdInventoryForItems(session, normalizedItems) {
  const productIds = normalizedItems.map((item) => item.product);
  const inventories = await inventoryModel
    .find({ product: { $in: productIds } })
    .session(session)
    .select('product');

  const foundIds = new Set(inventories.map((inv) => String(inv.product)));
  const missingProducts = normalizedItems.filter(
    (item) => !foundIds.has(String(item.product))
  );
  if (missingProducts.length > 0) {
    throw new HttpError(404, 'product not found');
  }

  for (const item of normalizedItems) {
    const result = await inventoryModel.updateOne(
      {
        product: item.product,
        $expr: {
          $gte: [{ $subtract: ['$stock', '$reserved'] }, item.quantity]
        }
      },
      { $inc: { reserved: item.quantity } },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new HttpError(409, 'insufficient stock to reserve items');
    }
  }
}

async function createReservationInTx({ session, userId, items, source }) {
  await holdInventoryForItems(session, items);
  const created = await reservationModel.create(
    [
      {
        user: userId,
        items,
        source,
        status: 'ACTIVE'
      }
    ],
    { session }
  );
  return created[0];
}

function handleError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).send({ message: error.message });
  }
  return res.status(500).send({ message: error.message || 'internal server error' });
}

router.post('/reserveItems', checkLogin, async function (req, res) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const normalizedItems = normalizeItems(req.body && req.body.items);
    const reservation = await createReservationInTx({
      session,
      userId: req.userId,
      items: normalizedItems,
      source: 'MANUAL'
    });
    await session.commitTransaction();
    await reservation.populate('items.product');
    return res.status(201).send(reservation);
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error);
  } finally {
    session.endSession();
  }
});

router.post('/reserveACart', checkLogin, async function (req, res) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let cart = await cartModel.findOne({ user: req.userId }).session(session);
    if (!cart) {
      cart = new cartModel({ user: req.userId, cartItems: [] });
      await cart.save({ session });
    }

    const normalizedItems = normalizeItems(cart.cartItems);
    const reservation = await createReservationInTx({
      session,
      userId: req.userId,
      items: normalizedItems,
      source: 'CART'
    });

    cart.cartItems = [];
    await cart.save({ session });

    await session.commitTransaction();
    await reservation.populate('items.product');
    return res.status(201).send(reservation);
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error);
  } finally {
    session.endSession();
  }
});

router.get('/', checkLogin, async function (req, res) {
  try {
    const reservations = await reservationModel
      .find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('items.product');
    return res.status(200).send(reservations);
  } catch (error) {
    return handleError(res, error);
  }
});

router.get('/:id', checkLogin, async function (req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).send({ message: 'reservation not found' });
    }

    const reservation = await reservationModel
      .findOne({ _id: req.params.id, user: req.userId })
      .populate('items.product');

    if (!reservation) {
      return res.status(404).send({ message: 'reservation not found' });
    }
    return res.status(200).send(reservation);
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
