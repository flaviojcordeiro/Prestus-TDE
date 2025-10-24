import { useEffect, useState } from 'react';
import api from './services/api.js';

const initialBookingForm = {
  job_id: '',
  worker_name: '',
  worker_contact: '',
  amount: '',
  method: 'pix'
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [form, setForm] = useState(initialBookingForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data } = await api.get('/dashboard');
      setError('');
      setJobs(data.jobs || []);
      setBookings(data.bookings || []);
      const normalizedNotifications = Array.isArray(data.notifications?.items)
        ? data.notifications.items
        : Array.isArray(data.notifications)
          ? data.notifications
          : [];
      setNotifications(normalizedNotifications);
    } catch (err) {
      setError('Falha ao carregar dados');
    }
  }

  function handleSelectJob(jobId) {
    setSelectedJob(jobId);
    setForm(prev => ({ ...prev, job_id: jobId }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.job_id) {
      setError('Selecione uma vaga');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', {
        ...form,
        amount: Number(form.amount) || 0
      });
      setError('');
      setForm(initialBookingForm);
      setSelectedJob('');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao criar reserva');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Prestus - Gestão de Vagas e Reservas</h1>
        <p>Visualize as vagas disponíveis e confirme reservas em um único painel.</p>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="grid">
        <div className="card">
          <h2>Vagas Disponíveis</h2>
          <ul className="list">
            {jobs.map(job => (
              <li key={job.id} className={selectedJob === job.id ? 'selected' : ''}>
                <button className="job-button" onClick={() => handleSelectJob(job.id)}>
                  <strong>{job.title}</strong>
                  <span>{job.location}</span>
                  <small>{new Date(job.date_time).toLocaleString('pt-BR')}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Criar Reserva</h2>
          <form onSubmit={handleSubmit} className="form">
            <div>
              <label htmlFor="worker_name">Nome do Trabalhador</label>
              <input
                id="worker_name"
                value={form.worker_name}
                onChange={e => setForm({ ...form, worker_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="worker_contact">Contato</label>
              <input
                id="worker_contact"
                value={form.worker_contact}
                onChange={e => setForm({ ...form, worker_contact: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="amount">Valor</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="method">Método de Pagamento</label>
              <select
                id="method"
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value })}
              >
                <option value="pix">Pix</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Processando...' : 'Confirmar Reserva'}</button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2>Reservas Recentes</h2>
        <ul className="list">
          {bookings.map(booking => (
            <li key={booking.id}>
              <strong>{booking.worker_name}</strong>
              <span>Contato: {booking.worker_contact}</span>
              <span>Status: {booking.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Notificações enviadas</h2>
        <ul className="list">
          {notifications.map(notification => (
            <li key={`${notification.bookingId}-${notification.createdAt || notification.recipient}`}>
              <strong>Reserva {notification.bookingId}</strong>
              <span>Destinatário: {notification.recipient}</span>
              <span>{notification.message}</span>
              <small>
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString('pt-BR')
                  : 'Registro não persistido'}
              </small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
