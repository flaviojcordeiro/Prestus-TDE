const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JOBS_SERVICE_URL = process.env.JOBS_SERVICE_URL || 'http://microservice-jobs:3001';
const BOOKINGS_SERVICE_URL = process.env.BOOKINGS_SERVICE_URL || 'http://microservice-bookings:3002';
const NOTIFICATION_FUNCTION_URL = process.env.NOTIFICATION_FUNCTION_URL || 'http://function-notification:7071/api/send-notification';
const PAYMENT_FUNCTION_URL = process.env.PAYMENT_FUNCTION_URL || 'http://function-payment:7071/api/process-payment';

async function forwardRequest(method, url, payload, res, req = null) {
  try {
    let headers;
    if (req) {
      headers = { ...req.headers };
      delete headers.host;
    }

    const response = await axios({
      method,
      url,
      data: payload,
      params: req?.query,
      headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: error.message };
    res.status(status).json(message);
  }
}

app.get('/api/jobs', async (req, res) => {
  await forwardRequest('get', `${JOBS_SERVICE_URL}/jobs`, null, res, req);
});

app.get('/api/jobs/:id', async (req, res) => {
  await forwardRequest('get', `${JOBS_SERVICE_URL}/jobs/${req.params.id}`, null, res, req);
});

app.post('/api/jobs', async (req, res) => {
  await forwardRequest('post', `${JOBS_SERVICE_URL}/jobs`, req.body, res);
});

app.put('/api/jobs/:id', async (req, res) => {
  await forwardRequest('put', `${JOBS_SERVICE_URL}/jobs/${req.params.id}`, req.body, res);
});

app.delete('/api/jobs/:id', async (req, res) => {
  await forwardRequest('delete', `${JOBS_SERVICE_URL}/jobs/${req.params.id}`, null, res, req);
});

app.get('/api/bookings', async (req, res) => {
  await forwardRequest('get', `${BOOKINGS_SERVICE_URL}/bookings`, null, res, req);
});

app.get('/api/bookings/:id', async (req, res) => {
  await forwardRequest('get', `${BOOKINGS_SERVICE_URL}/bookings/${req.params.id}`, null, res, req);
});

app.get('/api/bookings/job/:jobId', async (req, res) => {
  await forwardRequest('get', `${BOOKINGS_SERVICE_URL}/bookings/job/${req.params.jobId}`, null, res, req);
});

app.get('/api/notifications', async (req, res) => {
  await forwardRequest('get', NOTIFICATION_FUNCTION_URL, null, res, req);
});

app.post('/api/notifications', async (req, res) => {
  await forwardRequest('post', NOTIFICATION_FUNCTION_URL, req.body, res, req);
});

app.post('/api/bookings', async (req, res) => {
  try {
    const bookingResponse = await axios.post(`${BOOKINGS_SERVICE_URL}/bookings`, req.body);

    if (process.env.TRIGGER_PAYMENT === 'true') {
      await axios.post(PAYMENT_FUNCTION_URL, {
        bookingId: bookingResponse.data.id,
        amount: req.body.amount || 0,
        method: req.body.method || 'cash'
      });
    }

    await axios.post(NOTIFICATION_FUNCTION_URL, {
      bookingId: bookingResponse.data.id,
      recipient: req.body.worker_contact,
      message: `Reserva criada para o job ${bookingResponse.data.job_id}`
    });

    res.status(bookingResponse.status).json(bookingResponse.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: error.message };
    res.status(status).json(message);
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  await forwardRequest('put', `${BOOKINGS_SERVICE_URL}/bookings/${req.params.id}/status`, req.body, res);
});

app.delete('/api/bookings/:id', async (req, res) => {
  await forwardRequest('delete', `${BOOKINGS_SERVICE_URL}/bookings/${req.params.id}`, null, res, req);
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [jobsResponse, notificationsResponse] = await Promise.all([
      axios.get(`${JOBS_SERVICE_URL}/jobs`, { params: { status: req.query.status } }),
      axios.get(NOTIFICATION_FUNCTION_URL, { params: { limit: req.query.notificationsLimit || 20 } }).catch(() => ({ data: [] }))
    ]);

    const notificationsPayload = notificationsResponse?.data?.items || notificationsResponse?.data || [];

    res.json({
      jobs: jobsResponse.data,
      bookings: [],
      notifications: notificationsPayload
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: error.message };
    res.status(status).json({ error: 'Falha ao agregar dados', details: message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', services: ['jobs', 'bookings', 'notification-function', 'payment-function'] });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`✅ BFF Gateway rodando na porta ${PORT}`);
});
