import React, { useEffect, useState } from 'react';
import ResourceLayout from '../components/resource/ResourceLayout.jsx';
import { apiClient } from '../api/apiClient';
import { confirmPopup, showErrorPopup } from '../utils/popup';

export default function AdminPage({ onLogout, user, onNavigate }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            setError('Error fetching users. Are you an admin?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const changeRole = async (userId, newRole) => {
        try {
            await apiClient.put(`/admin/users/${userId}/role`, newRole, {
                headers: { 'Content-Type': 'text/plain' }
            });
            fetchUsers();
        } catch (err) {
            console.error('Error changing role:', err);
            await showErrorPopup('Role update failed', 'Failed to change role.');
        }
    };

    const deleteUser = async (userId) => {
        const confirmed = await confirmPopup({
            title: 'Delete this user?',
            text: 'This action cannot be undone.',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            icon: 'warning',
        });
        if (!confirmed) return;

        try {
            await apiClient.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            await showErrorPopup('Delete failed', 'Failed to delete user.');
        }
    };

    return (
        <ResourceLayout onLogout={onLogout} user={user} onNavigate={onNavigate} currentPage="Admin">
            <div style={{ padding: '20px' }}>
                <header style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text)' }}>Admin Panel</h1>
                    <p style={{ color: 'var(--muted)' }}>Manage university users and system settings.</p>
                </header>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                        <button
                            onClick={() => onNavigate('Home')}
                            style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#b91c1c', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Back to Home
                        </button>
                    </div>
                )}

                <div style={{ background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: 'var(--text)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>System Users</h2>
                        <span style={{ background: 'var(--bg)', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                            Total: {users.length}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading system data...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--muted)' }}>USER</th>
                                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--muted)' }}>EMAIL</th>
                                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--muted)' }}>ROLE</th>
                                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--muted)', textAlign: 'right' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', color: 'var(--sidebar)' }}>
                                                        {u.pictureUrl ? (
                                                            <img src={u.pictureUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                                        ) : (u.name?.charAt(0) || 'U')}
                                                    </div>
                                                    <span style={{ fontWeight: '600' }}>{u.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '14px' }}>{u.email}</td>
                                            <td style={{ padding: '16px' }}>
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', background: 'var(--input-bg)', color: 'var(--text)' }}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    disabled={u.id === user.id}
                                                    style={{
                                                        color: '#dc2626',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: u.id === user.id ? 'not-allowed' : 'pointer',
                                                        opacity: u.id === user.id ? 0.4 : 1,
                                                        fontSize: '14px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ResourceLayout>
    );
}
