const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  port: Number(process.env.SQL_PORT || 1433),
  options: {
    encrypt: process.env.SQL_ENCRYPT !== 'false',
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERT === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

async function connectSql() {
  if (!sqlConfig.server || !sqlConfig.database || !sqlConfig.user || !sqlConfig.password) {
    console.error('❌ Variáveis SQL_* não configuradas.');
    process.exit(1);
  }

  pool = await sql.connect(sqlConfig);

  const createTableQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Bookings' AND xtype='U')
    CREATE TABLE Bookings (
      Id UNIQUEIDENTIFIER PRIMARY KEY,
      JobId NVARCHAR(64) NOT NULL,
      WorkerName NVARCHAR(120) NOT NULL,
      WorkerContact NVARCHAR(120) NOT NULL,
      PaymentStatus NVARCHAR(40) DEFAULT 'pending',
      BookingStatus NVARCHAR(40) DEFAULT 'pending',
      Amount DECIMAL(10,2) DEFAULT 0.00,
      PaymentMethod NVARCHAR(40) DEFAULT 'pix',
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
      UpdatedAt DATETIME2,
      PaymentId UNIQUEIDENTIFIER,
      NotificationId UNIQUEIDENTIFIER
    )`;

  await pool.request().query(createTableQuery);
  console.log('✅ Conexão com Azure SQL estabelecida');
}

function mapBooking(record) {
  return {
    id: record.Id,
    job_id: record.JobId,
    worker_name: record.WorkerName,
    worker_contact: record.WorkerContact,
    status: record.BookingStatus,
    created_at: record.CreatedAt
  };
}

app.get('/bookings', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Bookings ORDER BY CreatedAt DESC');
    res.json(result.recordset.map(mapBooking));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/bookings/:id', async (req, res) => {
  try {
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM Bookings WHERE Id = @Id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json(mapBooking(result.recordset[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/bookings/job/:jobId', async (req, res) => {
  try {
    const result = await pool
      .request()
      .input('JobId', sql.NVarChar(64), req.params.jobId)
      .query('SELECT * FROM Bookings WHERE JobId = @JobId ORDER BY CreatedAt DESC');
    res.json(result.recordset.map(mapBooking));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/bookings', async (req, res) => {
  try {
    const { job_id, worker_name, worker_contact, status } = req.body;

    if (!job_id || !worker_name || !worker_contact) {
      return res.status(400).json({ error: 'Campos obrigatórios: job_id, worker_name, worker_contact' });
    }

    const id = uuidv4();

    const insertQuery = `INSERT INTO Bookings (Id, JobId, WorkerName, WorkerContact, BookingStatus)
      OUTPUT INSERTED.*
      VALUES (@Id, @JobId, @WorkerName, @WorkerContact, @Status)`;

    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('JobId', sql.NVarChar(64), job_id)
      .input('WorkerName', sql.NVarChar(120), worker_name)
      .input('WorkerContact', sql.NVarChar(120), worker_contact)
      .input('Status', sql.NVarChar(40), status || 'pending')
      .query(insertQuery);

    res.status(201).json(mapBooking(result.recordset[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Campo obrigatório: status' });

    const updateQuery = `UPDATE Bookings SET BookingStatus = @Status, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id`;
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, req.params.id)
      .input('Status', sql.NVarChar(40), status)
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json({ updated: result.rowsAffected[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/bookings/:id', async (req, res) => {
  try {
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM Bookings WHERE Id = @Id');
    res.json({ deleted: result.rowsAffected[0] || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = Number(process.env.PORT || 3002);

async function start() {
  try {
    await connectSql();
    app.listen(PORT, () => {
      console.log(`✅ Microservice-Bookings rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar microservice-bookings', error);
    process.exit(1);
  }
}

start();
