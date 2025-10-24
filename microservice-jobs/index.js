// microservice-jobs/index.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || 'prestus';
const mongoCollection = process.env.MONGODB_COLLECTION || 'jobs';

let jobsCollection;

async function connectMongo() {
  if (!mongoUri) {
    console.error('❌ MONGODB_URI não configurado. Defina a variável de ambiente.');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  await client.connect();
  const db = client.db(mongoDbName);
  jobsCollection = db.collection(mongoCollection);
  await jobsCollection.createIndex({ status: 1 });
  console.log('✅ Conexão com MongoDB estabelecida');
}

function mapJob(doc) {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    establishment_id: doc.establishment_id,
    location: doc.location,
    date_time: doc.date_time,
    workers_needed: doc.workers_needed,
    hourly_rate: doc.hourly_rate,
    status: doc.status || 'open',
    created_at: doc.created_at
  };
}

app.get('/jobs', async (req, res) => {
  try {
    const statusFilter = req.query.status || 'open';
    const jobs = await jobsCollection
      .find({ status: statusFilter })
      .sort({ created_at: -1 })
      .toArray();
    res.json(jobs.map(mapJob));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/jobs/:id', async (req, res) => {
  try {
    const job = await jobsCollection.findOne({ id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(mapJob(job));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/jobs', async (req, res) => {
  try {
  const { title, description, establishment_id, location, date_time, workers_needed, hourly_rate } = req.body;

    if (!title || !establishment_id || !location || !date_time) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, establishment_id, location, date_time' });
    }

    const now = new Date().toISOString();
    const job = {
      id: uuidv4(),
      title,
      description: description || '',
      establishment_id,
      location,
      date_time,
  workers_needed: Number(workers_needed) || 0,
  hourly_rate: Number(hourly_rate) || 0,
      status: 'open',
      created_at: now
    };

    await jobsCollection.insertOne(job);
    res.status(201).json(mapJob(job));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/jobs/:id', async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'location', 'date_time', 'workers_needed', 'hourly_rate', 'status'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.workers_needed !== undefined) updates.workers_needed = Number(updates.workers_needed) || 0;
    if (updates.hourly_rate !== undefined) updates.hourly_rate = Number(updates.hourly_rate) || 0;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhuma alteração informada' });
    }

    const result = await jobsCollection.updateOne({ id: req.params.id }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/jobs/:id', async (req, res) => {
  try {
    const result = await jobsCollection.deleteOne({ id: req.params.id });
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3001);

async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`✅ Microservice-Jobs rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar microservice-jobs', error);
    process.exit(1);
  }
}

start();
