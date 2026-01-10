import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRScanner from '../components/QRScanner';
import API_URL from '../config';

const Dashboard = () => {
    const { user, logout, authFetch } = useAuth();

    // Organizer State
    const [myGroups, setMyGroups] = useState([]);
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });
    const [newEvents, setNewEvents] = useState([{ title: '', startTime: '', endTime: '' }]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedEventQR, setSelectedEventQR] = useState(null);
    const [selectedEventAttendance, setSelectedEventAttendance] = useState(null);

    // Participant State
    const [accessCode, setAccessCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [joinMessage, setJoinMessage] = useState({ type: '', text: '' });
    const [joinedEvents, setJoinedEvents] = useState([]);

    useEffect(() => {
        if (user.role === 'ORGANIZER') {
            fetchMyEvents();
        } else if (user.role === 'PARTICIPANT') {
            fetchJoinedEvents();
        }
    }, [user.role]);

    const fetchMyEvents = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/events/my-events`);
            if (res.ok) {
                const data = await res.json();
                setMyGroups(data);
            }
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    };

    const fetchJoinedEvents = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/attend/history`);
            if (res.ok) {
                const data = await res.json();
                setJoinedEvents(data);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleLogout = () => {
        logout();
    };

    // --- ORGANIZER LOGIC ---

    const handleAddEventField = () => {
        setNewEvents([...newEvents, { title: '', startTime: '', endTime: '' }]);
    };

    const handleEventChange = (index, field, value) => {
        const updated = [...newEvents];
        updated[index][field] = value;
        setNewEvents(updated);
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            // Client-side Validation Checks
            for (let evt of newEvents) {
                if (new Date(evt.startTime) >= new Date(evt.endTime)) {
                    alert(`Eroare: Evenimentul "${evt.title}" are Ora Start >= Ora Sfarsit. Te rog corecteaza.`);
                    return;
                }
            }

            const formattedEvents = newEvents.map(ev => ({
                ...ev,
                startTime: new Date(ev.startTime).toISOString(),
                endTime: new Date(ev.endTime).toISOString()
            }));

            const res = await authFetch(`${API_URL}/api/events/groups`, {
                method: 'POST',
                body: JSON.stringify({
                    ...newGroup,
                    events: formattedEvents
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Grup de evenimente creat cu succes!');
            setShowCreateForm(false);
            setNewGroup({ name: '', description: '' });
            setNewEvents([{ title: '', startTime: '', endTime: '' }]);
            fetchMyEvents(); // Refresh list
        } catch (err) {
            alert('Eroare: ' + err.message);
        }
    };

    const handleExportEvent = async (eventId, format) => {
        try {
            const res = await authFetch(`${API_URL}/api/events/${eventId}/export?format=${format}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Prezenta_Eveniment_${eventId}.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Eroare la export');
            }
        } catch (e) {
            console.error(e);
            alert('Eroare la download');
        }
    };

    const handleExportGroup = async (groupId, format) => {
        try {
            const res = await authFetch(`${API_URL}/api/events/groups/${groupId}/export?format=${format}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Raport_Grup_${groupId}.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const data = await res.json();
                alert('Eroare: ' + (data.error || 'Necunoscuta'));
            }
        } catch (e) {
            console.error(e);
            alert('Eroare la download');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi acest grup? Toate evenimentele si prezenta vor fi sterse.')) return;

        try {
            const res = await authFetch(`${API_URL}/api/events/groups/${groupId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchMyEvents();
            } else {
                const d = await res.json();
                alert('Eroare: ' + d.error);
            }
        } catch (e) { alert('Eroare'); }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi acest eveniment?')) return;

        try {
            const res = await authFetch(`${API_URL}/api/events/${eventId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchMyEvents();
            } else {
                const d = await res.json();
                alert('Eroare: ' + d.error);
            }
        } catch (e) { alert('Eroare'); }
    };

    const handleToggleStatus = async (eventId, currentStatus) => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSE' : 'OPEN';
        try {
            const res = await authFetch(`${API_URL}/api/events/${eventId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchMyEvents();
            } else {
                alert('Eroare la actualizare status');
            }
        } catch (e) {
            alert('Eroare server');
        }
    };


    // --- PARTICIPANT LOGIC ---

    const handleJoin = async (code) => {
        try {
            const res = await authFetch(`${API_URL}/api/attend/join`, {
                method: 'POST',
                body: JSON.stringify({ accessCode: code })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Eroare la check-in');
            }

            setJoinMessage({ type: 'success', text: `Succes! Te-ai inscris la eveniment.` });
            setIsScanning(false);
            fetchJoinedEvents(); // Update history
        } catch (err) {
            setJoinMessage({ type: 'error', text: err.message });
        }
    };

    const onScan = (decodedText) => {
        if (decodedText) {
            handleJoin(decodedText);
        }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="container">
                    <span className="brand">Proiect TW GGG</span>
                    <div className="nav-links">
                        <span>Buna, {user.name} ({user.role})</span>
                        <button className="btn btn-secondary" onClick={handleLogout}>Iesi din cont</button>
                    </div>
                </div>
            </nav>

            <div className="container">

                {/* ORGANIZER VIEW */}
                {user.role === 'ORGANIZER' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Gestionare Evenimente</h2>
                            <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                                {showCreateForm ? 'Anuleaza' : 'Creeaza Grup Nou'}
                            </button>
                        </div>

                        {showCreateForm && (
                            <div className="card">
                                <h3>Creare Grup Evenimente</h3>
                                <form onSubmit={handleCreateGroup}>
                                    <div className="input-group">
                                        <label>Nume Grup</label>
                                        <input
                                            required
                                            value={newGroup.name}
                                            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Descriere</label>
                                        <textarea
                                            value={newGroup.description}
                                            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                        />
                                    </div>

                                    <h4>Evenimente in acest grup</h4>
                                    {newEvents.map((evt, idx) => (
                                        <div key={idx} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                                            <div className="input-group">
                                                <label>Titlu Eveniment</label>
                                                <input
                                                    required
                                                    value={evt.title}
                                                    onChange={e => handleEventChange(idx, 'title', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label>Start</label>
                                                    <input
                                                        type="datetime-local"
                                                        required
                                                        value={evt.startTime}
                                                        onChange={e => handleEventChange(idx, 'startTime', e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <label>End</label>
                                                    <input
                                                        type="datetime-local"
                                                        required
                                                        value={evt.endTime}
                                                        onChange={e => handleEventChange(idx, 'endTime', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-secondary" onClick={handleAddEventField} style={{ marginRight: '10px' }}>
                                        + Adauga inca un eveniment
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Salveaza Grup
                                    </button>
                                </form>
                            </div>
                        )}

                        <h3>Evenimentele Mele</h3>
                        {myGroups.length === 0 ? <p>Nu ai creat niciun grup de evenimente.</p> : (
                            <div>
                                {myGroups.map(group => (
                                    <div key={group.id} className="card" style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <h3 style={{ marginBottom: '5px' }}>{group.name}</h3>
                                                <p style={{ color: '#666', margin: 0 }}>{group.description}</p>
                                            </div>
                                            <div>
                                                <span style={{ marginRight: '10px' }}>Export Grup:</span>
                                                <button className="btn btn-secondary" style={{ marginRight: '5px', fontSize: '0.8rem' }} onClick={() => handleExportGroup(group.id, 'csv')}>CSV</button>
                                                <button className="btn btn-secondary" style={{ marginRight: '15px', fontSize: '0.8rem' }} onClick={() => handleExportGroup(group.id, 'xlsx')}>XLSX</button>
                                                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', background: '#fee2e2', color: 'red', borderColor: '#fecaca' }} onClick={() => handleDeleteGroup(group.id)}>Sterge Grup</button>
                                            </div>
                                        </div>
                                        <hr style={{ borderColor: '#eee', margin: '15px 0' }} />

                                        <div className="dashboard-grid">
                                            {group.events.map(ev => (
                                                <div key={ev.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
                                                    <h4 style={{ marginTop: 0 }}>{ev.title}</h4>
                                                    <p style={{ fontSize: '0.9rem' }}>
                                                        <strong>Start:</strong> {new Date(ev.startTime).toLocaleString('ro-RO')} <br />
                                                        <strong>End:</strong> {new Date(ev.endTime).toLocaleString('ro-RO')} <br />
                                                        <strong>Status:</strong> <span style={{ color: ev.status === 'OPEN' ? 'green' : 'red', fontWeight: 'bold' }}>{ev.status}</span>
                                                        <button
                                                            onClick={() => handleToggleStatus(ev.id, ev.status)}
                                                            style={{
                                                                marginLeft: '10px',
                                                                padding: '2px 8px',
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer',
                                                                backgroundColor: ev.status === 'OPEN' ? '#fecaca' : '#bbf7d0',
                                                                border: '1px solid',
                                                                borderColor: ev.status === 'OPEN' ? 'red' : 'green',
                                                                borderRadius: '4px'
                                                            }}
                                                        >
                                                            {ev.status === 'OPEN' ? 'Inchide' : 'Deschide'}
                                                        </button>
                                                    </p>
                                                    <p><strong>Cod:</strong> {ev.accessCode}</p>

                                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                        <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedEventQR(ev)}>
                                                            Vezi QR
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedEventAttendance(ev)}>
                                                            Vezi Participanti
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleExportEvent(ev.id, 'csv')}>
                                                            Export CSV
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleExportEvent(ev.id, 'xlsx')}>
                                                            Export XLSX
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem', background: '#fee2e2', color: 'red', borderColor: '#fecaca' }} onClick={() => handleDeleteEvent(ev.id)}>
                                                            Sterge
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedEventQR && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                            }}>
                                <div className="card" style={{ textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                                    <h3>QR Code: {selectedEventQR.title}</h3>
                                    <p style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedEventQR.accessCode}</p>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                        <QRCodeDisplay value={selectedEventQR.accessCode} />
                                    </div>
                                    <button className="btn btn-secondary" onClick={() => setSelectedEventQR(null)}>Inchide</button>
                                </div>
                            </div>
                        )}

                        {selectedEventAttendance && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                            }}>
                                <div className="card" style={{ maxWidth: '600px', width: '95%', maxHeight: '80vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3>Participanti: {selectedEventAttendance.title}</h3>
                                        <button onClick={() => setSelectedEventAttendance(null)} style={{ background: 'transparent', border: 0, fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                                    </div>

                                    {(!selectedEventAttendance.attendances || selectedEventAttendance.attendances.length === 0) ? (
                                        <p>Niciun participant momentan.</p>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                            <thead>
                                                <tr style={{ background: '#f3f3f3', textAlign: 'left' }}>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Nume</th>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Email</th>
                                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Data/Ora</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedEventAttendance.attendances.map(att => (
                                                    <tr key={att.id}>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{att.user.name}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{att.user.email}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{new Date(att.joinedAt).toLocaleString('ro-RO')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button className="btn btn-secondary" onClick={() => setSelectedEventAttendance(null)}>Inchide</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* PARTICIPANT VIEW */}
                {user.role === 'PARTICIPANT' && (
                    <div>
                        <h2>Participare Eveniment</h2>
                        {joinMessage.text && (
                            <div className={joinMessage.type === 'error' ? 'error-msg' : 'success-msg'}>
                                {joinMessage.text}
                            </div>
                        )}

                        <div className="dashboard-grid">
                            <div className="card">
                                <h3>Varianta 1: Introducere Cod</h3>
                                <div className="input-group">
                                    <label>Cod Acces</label>
                                    <input
                                        value={accessCode}
                                        onChange={e => setAccessCode(e.target.value)}
                                        placeholder="Ex: A1B2C3"
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={() => handleJoin(accessCode)}>
                                    Join
                                </button>
                            </div>

                            <div className="card">
                                <h3>Varianta 2: Scanare QR</h3>
                                {!isScanning ? (
                                    <button className="btn btn-primary" onClick={() => setIsScanning(true)}>
                                        Deschide Camera
                                    </button>
                                ) : (
                                    <QRScanner onScan={onScan} onClose={() => setIsScanning(false)} />
                                )}
                            </div>
                        </div>

                        {/* HISTORY SECTION */}
                        <div style={{ marginTop: '40px' }}>
                            <h3>Istoric Participari</h3>
                            {joinedEvents.length === 0 ? <p>Nu ai participat inca la niciun eveniment.</p> : (
                                <div className="dashboard-grid">
                                    {joinedEvents.map((record, idx) => (
                                        <div key={idx} className="card">
                                            <h4>{record.eventName}</h4>
                                            <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                                Inscris la: {new Date(record.joinedAt).toLocaleString('ro-RO')}
                                            </p>
                                            <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                                            <p><strong>Total Participanti:</strong> {record.totalParticipants}</p>
                                            <div>
                                                <strong>Alti participanti:</strong>
                                                <p style={{ fontSize: '0.85rem', margin: '5px 0', color: '#555' }}>
                                                    {record.participantNames.slice(0, 10).join(', ')}
                                                    {record.participantNames.length > 10 && ' ...'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
