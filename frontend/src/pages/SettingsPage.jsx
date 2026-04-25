import React, { useState } from 'react';
import ResourceLayout from '../components/resource/ResourceLayout.jsx';
import { apiClient } from '../api/apiClient';
import './settings.css';

export default function SettingsPage({ onLogout, user, onNavigate, onUpdateUser, theme, onToggleTheme }) {
    const [name, setName] = useState(user?.name || '');
    const [pictureUrl, setPictureUrl] = useState(user?.pictureUrl || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [notifications, setNotifications] = useState(true);
    const [security, setSecurity] = useState(true);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await apiClient.put('/auth/profile', {
                name,
                pictureUrl
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

    const preferenceItems = [
        {
            title: 'Email Notifications',
            desc: 'Receive alerts about resource requests.',
            checked: notifications,
            toggle: () => setNotifications(!notifications)
        },
        {
            title: 'Security Alerts',
            desc: 'Get notified of unusual login activity.',
            checked: security,
            toggle: () => setSecurity(!security)
        },
        {
            title: 'Dark Mode',
            desc: 'Enable dark interface theme.',
            checked: theme === 'dark',
            toggle: onToggleTheme
        }
    ];

    const alertStyle =
        message.type === 'success'
            ? {
                  background: 'linear-gradient(135deg, rgba(220,252,231,0.94), rgba(224,247,255,0.9))',
                  color: '#065f46',
                  border: '1px solid rgba(16,185,129,0.22)'
              }
            : {
                  background: 'linear-gradient(135deg, rgba(253,232,241,0.94), rgba(255,237,213,0.9))',
                  color: '#9f1239',
                  border: '1px solid rgba(219,39,119,0.2)'
              };

    return (
        <ResourceLayout onLogout={onLogout} user={user} onNavigate={onNavigate} currentPage="Settings" theme={theme} onToggleTheme={onToggleTheme}>
            <div className="settingsLuxuryWrap" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
                <header className="settingsLuxuryHeader">
                    <h1>Account Settings</h1>
                    <p>Manage your profile information and system preferences.</p>
                </header>

                {message.text ? (
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            fontWeight: '600',
                            boxShadow: '0 18px 32px rgba(51, 63, 118, 0.08)',
                            ...alertStyle
                        }}
                    >
                        {message.text}
                    </div>
                ) : null}

                <div style={{ display: 'grid', gap: '30px' }}>
                    <section className="settingsLuxuryCard">
                        <h2>Profile Information</h2>

                        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <div className="settingsLuxuryAvatar">
                                    {pictureUrl ? (
                                        <img
                                            src={pictureUrl}
                                            alt="Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="settingsLuxuryAvatarFallback">
                                            {name.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>Your Photo</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                                        This will be displayed in the sidebar.
                                    </p>
                                </div>
                            </div>

                            <div className="settingsLuxuryGrid">
                                <div>
                                    <label className="settingsLuxuryLabel">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="settingsLuxuryInput"
                                    />
                                </div>
                                <div>
                                    <label className="settingsLuxuryLabel">Email Address</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="settingsLuxuryInput settingsLuxuryInputDisabled"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="settingsLuxuryLabel">Profile Picture URL</label>
                                <input
                                    type="text"
                                    value={pictureUrl}
                                    onChange={(e) => setPictureUrl(e.target.value)}
                                    placeholder="Enter image URL"
                                    className="settingsLuxuryInput"
                                />
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <button type="submit" disabled={loading} className="settingsLuxuryButton">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="settingsLuxuryCard">
                        <h2>System Preferences</h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {preferenceItems.map((pref) => (
                                <div key={pref.title} className="settingsLuxuryToggleRow">
                                    <div>
                                        <div style={{ fontWeight: '700', marginBottom: '2px' }}>{pref.title}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{pref.desc}</div>
                                    </div>
                                    <div
                                        onClick={pref.toggle}
                                        className={`settingsLuxuryToggle ${pref.checked ? 'isOn' : ''}`}
                                    >
                                        <div className="settingsLuxuryToggleKnob" />
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
