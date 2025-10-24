require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

let notificationsCollection;
let mongoClient;

async function getCollection(context) {
  if (notificationsCollection) return notificationsCollection;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    context.log('MONGODB_URI não configurado, fallback para log em memória.');
    return null;
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
    await mongoClient.connect();
  }

  const dbName = process.env.MONGODB_DB_NAME || 'prestus';
  const collectionName = process.env.MONGODB_COLLECTION || 'notifications';
  notificationsCollection = mongoClient.db(dbName).collection(collectionName);
  await notificationsCollection.createIndex({ bookingId: 1, createdAt: -1 });
  return notificationsCollection;
}

module.exports = async function (context, req) {
  const method = req.method || 'GET';

  if (method === 'GET') {
    try {
      const collection = await getCollection(context);
      if (!collection) {
        context.res = {
          status: 200,
          body: {
            items: [],
            warning: 'MongoDB não configurado, retornando lista vazia.'
          }
        };
        return;
      }

      const limit = Math.min(Number(req.query?.limit || 50), 200);
      const items = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      context.res = {
        status: 200,
        body: {
          items,
          count: items.length
        }
      };
    } catch (error) {
      context.log.error('Erro ao listar notificações', error);
      context.res = {
        status: 500,
        body: { error: error.message }
      };
    }
    return;
  }

  const { bookingId, recipient, message } = req.body || {};

  if (!bookingId || !recipient) {
    context.res = {
      status: 400,
      body: { error: 'Campos obrigatórios: bookingId, recipient' }
    };
    return;
  }

  const provider = process.env.NOTIFICATION_PROVIDER || 'console';
  const outputMessage = message || `Notificação para a reserva ${bookingId}`;
  const timestamp = new Date().toISOString();

  try {
    const collection = await getCollection(context);
    let persisted = false;
    if (collection) {
      await collection.insertOne({
        bookingId,
        recipient,
        message: outputMessage,
        provider,
        status: 'sent',
        createdAt: timestamp
      });
      persisted = true;
    }

    context.log(`Sending notification via ${provider} to ${recipient}: ${outputMessage}`);

    context.res = {
      status: 200,
      body: {
        bookingId,
        recipient,
        message: outputMessage,
        provider,
        status: 'sent',
        createdAt: persisted ? timestamp : null
      }
    };
  } catch (error) {
    context.log.error('Erro ao persistir notificação', error);
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};
