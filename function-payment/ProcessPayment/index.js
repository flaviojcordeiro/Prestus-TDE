const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

module.exports = async function (context, req) {
  const { bookingId, amount, method } = req.body || {};

  if (!bookingId) {
    context.res = {
      status: 400,
      body: { error: 'Campo obrigatório: bookingId' }
    };
    return;
  }

  const paymentId = uuidv4();
  const paymentMethod = method || 'cash';
  const paymentAmount = Number(amount || 0);
  const provider = process.env.PAYMENT_PROVIDER || 'sandbox';

  context.log(`Processing payment ${paymentId} for booking ${bookingId} using ${provider}`);

  context.res = {
    status: 200,
    body: {
      paymentId,
      bookingId,
      amount: paymentAmount,
      method: paymentMethod,
      provider,
      status: 'approved'
    }
  };
};
