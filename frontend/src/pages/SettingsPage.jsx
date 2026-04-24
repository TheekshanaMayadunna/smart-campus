import React, { useState } from 'react';
import ResourceLayout from '../components/resource/ResourceLayout.jsx';
import { apiClient } from '../api/apiClient';

export default function SettingsPage({ onLogout, user, onNavigate, onUpdateUser, theme, onToggleTheme }) {
    const [name, setName] = useState(user?.name || '');
    const [pictureUrl, setPictureUrl] = useState(user?.pictureUrl || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // State for mock toggles
    const [notifications, setNotifications] = useState(true);
    const [security, setSecurity] = useState(true);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await apiClient.put('/auth/profile', {
                name: name,
                pictureUrl: pictureUrl
            });

            setMessage({ text: 'Profile updated successfully!', type: 'success' });

            if (onUpdateUser) {
                onUpdateUser(response.data);
            }
        } catch (err) {
            console.error('Update failed:', err);
            setMessage({
                text: err.response?.data || 'Failed to update profile. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResourceLayout onLogout={onLogout} user={user} onNavigate={onNavigate} currentPage="Settings">
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)' }}>Account Settings</h1>
                    <p style={{ color: 'var(--muted)' }}>Manage your profile information and system preferences.</p>
                </header>

                {message.text && (
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                        fontWeight: '600'
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '30px' }}>

                    {/* Profile Section */}
                    <section style={{
                        background: 'var(--panel)',
                        borderRadius: '24px',
                        padding: '32px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        color: 'var(--text)'
                    }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            👤 Profile Information
                        </h2>

                        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg)', overflow: 'hidden', border: '4px solid var(--panel)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                    {pictureUrl ? (
                                        <img src={pictureUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', color: 'var(--sidebar)' }}>
                                            {name.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>Your Photo</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>This will be displayed in the sidebar.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', opacity: 0.6, color: 'var(--text)', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Profile Picture URL</label>
                                <input
                                    type="text"
                                    value={pictureUrl}
                                    onChange={(e) => setPictureUrl(e.target.value)}
                                    placeholder="Enter image URL"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                                />
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        background: 'var(--sidebar)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '12px 32px',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 12px rgba(29, 79, 92, 0.25)'
                                    }}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Preferences Section */}
                    <section style={{
                        background: 'var(--panel)',
                        borderRadius: '24px',
                        padding: '32px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        color: 'var(--text)'
                    }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            🛠️ System Preferences
                        </h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[
                                { title: 'Email Notifications', desc: 'Receive alerts about resource requests.', checked: notifications, toggle: () => setNotifications(!notifications) },
                                { title: 'Security Alerts', desc: 'Get notified of unusual login activity.', checked: security, toggle: () => setSecurity(!security) },
                                { title: 'Dark Mode', desc: 'Enable dark interface theme.', checked: theme === 'dark', toggle: onToggleTheme }
                            ].map((pref, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', marginBottom: '2px' }}>{pref.title}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{pref.desc}</div>
                                    </div>
                                    <div
                                        onClick={pref.toggle}
                                        style={{
                                            width: '46px',
                                            height: '24px',
                                            borderRadius: '12px',
                                            background: pref.checked ? 'var(--sidebar)' : 'var(--toggle-bg)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background 0.3s ease',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                        <div style={{
                                            position: 'absolute',
                                            right: pref.checked ? '4px' : '26px',
                                            top: '4px',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </ResourceLayout>
    );
}
