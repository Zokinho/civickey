import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { municipality } = useAuth();
  const [stats, setStats] = useState({
    announcements: 0,
    activeAnnouncements: 0,
    events: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    if (municipality) {
      loadStats();
    }
  }, [municipality]);

  const loadStats = async () => {
    try {
      // Get announcements count
      const announcementsSnap = await getDocs(collection(db, 'municipalities', municipality, 'alerts'));
      const announcements = announcementsSnap.docs.map(doc => doc.data());
      const activeAnnouncements = announcements.filter(a => a.active).length;

      // Get events count
      const eventsSnap = await getDocs(collection(db, 'municipalities', municipality, 'events'));
      const events = eventsSnap.docs.map(doc => doc.data());
      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = events.filter(e => e.date >= today).length;

      setStats({
        announcements: announcements.length,
        activeAnnouncements,
        events: events.length,
        upcomingEvents,
      });
    } catch (error) {
      console.log('Firebase not configured yet or error loading stats:', error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome to the CivicKey Admin Console</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">📢</div>
          <div className="value">{stats.activeAnnouncements}</div>
          <div className="label">Active Announcements</div>
        </div>
        <div className="stat-card">
          <div className="icon">📅</div>
          <div className="value">{stats.upcomingEvents}</div>
          <div className="label">Upcoming Events</div>
        </div>
        <div className="stat-card">
          <div className="icon">📝</div>
          <div className="value">{stats.announcements}</div>
          <div className="label">Total Announcements</div>
        </div>
        <div className="stat-card">
          <div className="icon">🗓️</div>
          <div className="value">{stats.events}</div>
          <div className="label">Total Events</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Quick Start Guide</h3>
        </div>
        <div>
          <p style={{ marginBottom: '16px', color: '#5a6c7d' }}>
            Use this admin console to manage your CivicKey mobile app content.
          </p>
          <ul style={{ marginLeft: '20px', color: '#5a6c7d', lineHeight: '2' }}>
            <li><strong>Collection Schedule</strong> - Set up collection types, zones, and schedules for waste collection</li>
            <li><strong>Announcements</strong> - Create messages that appear on the Home screen of the mobile app</li>
            <li><strong>Events</strong> - Manage community events with categories and bilingual content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
