import React, { useState, useEffect } from 'react';
import ResourceLayout from '../components/resource/ResourceLayout';
import { bookingService } from '../services/bookingService';
import { resourceService } from '../services/resourceService';
import {
  confirmPopup,
  showErrorPopup,
  showSuccessPopup,
  showWarningPopup,
} from '../utils/popup';
import '../components/resource/table.css';

export default function BookingsPage({ onLogout, user }) {
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [unavailableResourceIds, setUnavailableResourceIds] = useState([]);
  const [adminFilters, setAdminFilters] = useState({
    status: '',
    date: '',
    resourceId: '',
    userId: ''
  });
  const [formData, setFormData] = useState({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: ''
  });
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [adminLoadError, setAdminLoadError] = useState('');
  const selectedResource = resources.find((r) => String(r.id) === String(formData.resourceId));
  const selectedResourceCapacity = selectedResource?.capacity || '';
  const bookedResources = resources.filter((r) => unavailableResourceIds.includes(r.id));

  useEffect(() => {
    if (!isAdmin) {
      loadMyBookings();
      loadResources();
    } else {
      loadAllBookings();
    }
  }, [user, isAdmin]);

  const loadMyBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setMyBookings(data);
    } catch (error) {
      console.error("Error loading my bookings", error);
    }
  };

  const loadAllBookings = async () => {
    try {
      setAdminLoadError('');
      const data = await bookingService.getAllBookings(adminFilters);
      setAllBookings(data);
    } catch (error) {
      console.error("Error loading all bookings", error);
      setAllBookings([]);
      setAdminLoadError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        `Failed to load admin bookings (status ${error.response?.status || 'unknown'})`
      );
    }
  };

  const loadResources = async () => {
    try {
      const data = await resourceService.list({});
      const activeResources = Array.isArray(data)
        ? data.filter((r) => String(r?.status || '').toUpperCase() === 'ACTIVE')
        : [];
      setResources(activeResources);
    } catch (error) {
      console.error("Error loading resources", error);
      setResources([]);
    }
  };

  const handleAdminFilterChange = (e) => {
    setAdminFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyAdminFilters = async (e) => {
    e.preventDefault();
    await loadAllBookings();
  };

  const clearAdminFilters = async () => {
    const resetFilters = { status: '', date: '', resourceId: '', userId: '' };
    setAdminFilters(resetFilters);
    try {
      const data = await bookingService.getAllBookings(resetFilters);
      setAllBookings(data);
    } catch (error) {
      console.error("Error loading all bookings", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'attendees' && selectedResourceCapacity) {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && numericValue > selectedResourceCapacity) {
        setFormData({
          ...formData,
          attendees: String(selectedResourceCapacity)
        });
        return;
      }
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  useEffect(() => {
    if (!selectedResourceCapacity || !formData.attendees) return;
    const currentAttendees = Number(formData.attendees);
    if (!Number.isNaN(currentAttendees) && currentAttendees > selectedResourceCapacity) {
      setFormData((prev) => ({ ...prev, attendees: String(selectedResourceCapacity) }));
    }
  }, [selectedResourceCapacity, formData.attendees]);

  useEffect(() => {
    if (isAdmin) return;
    const { date, startTime, endTime } = formData;
    if (!date || !startTime || !endTime) {
      setUnavailableResourceIds([]);
      return;
    }
    if (endTime <= startTime) {
      setUnavailableResourceIds([]);
      return;
    }

    const loadUnavailableResources = async () => {
      try {
        const ids = await bookingService.getUnavailableResourceIds({ date, startTime, endTime });
        const normalizedIds = Array.isArray(ids) ? ids.map((id) => Number(id)) : [];
        setUnavailableResourceIds(normalizedIds);
      } catch (error) {
        console.error("Error loading unavailable resources", error);
        setUnavailableResourceIds([]);
      }
    };

    loadUnavailableResources();
  }, [formData.date, formData.startTime, formData.endTime, isAdmin]);

  useEffect(() => {
    if (!formData.resourceId) return;
    if (unavailableResourceIds.includes(Number(formData.resourceId))) {
      setFormData((prev) => ({ ...prev, resourceId: '' }));
      showWarningPopup(
        'Resource unavailable',
        'Selected resource is already booked for this time slot. Please choose another.'
      );
    }
  }, [unavailableResourceIds, formData.resourceId]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, attendees: Number(formData.attendees) };
      await bookingService.createBooking(payload);
      await showSuccessPopup('Booking created', 'Your booking request was submitted successfully.');
      setFormData({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: ''
      });
      loadMyBookings();
    } catch (error) {
      console.error(error);
      let errorMessage = 'Failed to create booking';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = JSON.stringify(error.response.data, null, 2);
        } else {
          errorMessage = String(error.response.data);
        }
      }
      await showErrorPopup('Booking failed', errorMessage);
    }
  };

  const handleCancelBooking = async (id) => {
    const confirmed = await confirmPopup({
      title: 'Cancel this booking?',
      text: 'This action will mark the booking as cancelled.',
      confirmButtonText: 'Yes, cancel booking',
      cancelButtonText: 'Keep booking',
      icon: 'warning',
    });
    if (!confirmed) return;

    try {
      await bookingService.cancelBooking(id);
      await showSuccessPopup('Booking cancelled', 'The booking was cancelled successfully.');
      loadMyBookings();
    } catch (error) {
      console.error(error);
      await showErrorPopup('Cancel failed', 'Failed to cancel booking.');
    }
  };

  const handleApproveBooking = async (id) => {
    try {
      await bookingService.approveBooking(id);
      await showSuccessPopup('Booking approved', 'The booking request was approved.');
      loadAllBookings();
    } catch (error) {
      console.error(error);
      await showErrorPopup('Approve failed', 'Failed to approve booking.');
    }
  };

  const handleRejectBooking = async (id) => {
    const reason = rejectionReasons[id];
    if (!reason) {
      await showWarningPopup('Reason required', 'Please provide a rejection reason.');
      return;
    }
    try {
      await bookingService.rejectBooking(id, reason);
      await showSuccessPopup('Booking rejected', 'The booking request was rejected.');
      setRejectionReasons(prev => ({ ...prev, [id]: '' }));
      loadAllBookings();
    } catch (error) {
      console.error(error);
      await showErrorPopup('Reject failed', 'Failed to reject booking.');
    }
  };

  const handleReasonChange = (id, val) => {
    setRejectionReasons(prev => ({ ...prev, [id]: val }));
  };

  const getStatusBadge = (status) => {
    if (status === 'APPROVED') return <span className="pill ok">APPROVED</span>;
    if (status === 'REJECTED') return <span className="pill bad">REJECTED</span>;
    if (status === 'CANCELLED') return <span className="pill">CANCELLED</span>;
    if (status === 'PENDING') return <span className="pill">PENDING</span>;
    return <span className="pill">{status}</span>;
  };

  const getResourceDisplayName = (booking) => {
    const directName = booking?.resource?.name || booking?.resourceName;
    if (directName) return directName;

    const bookingResourceId = booking?.resourceId || booking?.resource?.id;
    const matchedResource = resources.find((r) => Number(r.id) === Number(bookingResourceId));
    if (matchedResource?.name) return matchedResource.name;

    return bookingResourceId || '-';
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user}>

      <section className="card resourcePageHeader" style={{ width: '100%' }}>
        <div>
          <h1 className="resourcePageTitle">Bookings Management</h1>
          <p className="resourcePageSubtitle">Schedule and manage your campus resource reservations.</p>
        </div>
        <span className={user?.role === 'ADMIN' ? 'roleBadge manager' : 'roleBadge viewer'}>
          {isAdmin ? 'Admin Access' : 'User Access'}
        </span>
      </section>

      {!isAdmin ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card resourceSectionIntro">
              <h2 className="resourceSectionTitle">Create Booking</h2>
              <p className="resourceSectionText">Fill out the details to request a resource.</p>
            </div>

            <form className="card" onSubmit={handleCreateBooking} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="grid2" style={{ flex: 1 }}>
                <div>
                  <label className="label">Purpose</label>
                  <input className="input" type="text" name="purpose" value={formData.purpose} onChange={handleFormChange} required placeholder="e.g. Study Group" />
                </div>
                <div>
                  <label className="label">Resource</label>
                  <select
                    className="input"
                    name="resourceId"
                    value={formData.resourceId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a resource</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id} disabled={unavailableResourceIds.includes(Number(r.id))}>
                        {r.name} - {r.location} (Cap: {r.capacity})
                        {unavailableResourceIds.includes(Number(r.id)) ? ' - Already booked' : ''}
                      </option>
                    ))}
                  </select>
                  {bookedResources.length > 0 ? (
                    <small className="muted">
                      Already booked for selected time: {bookedResources.map((r) => r.name).join(', ')}
                    </small>
                  ) : null}
                </div>
                <div>
                  <label className="label">Attendees</label>
                  <input
                    className="input"
                    type="number"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max={selectedResourceCapacity || undefined}
                    placeholder="Estimated count"
                  />
                  {selectedResourceCapacity ? (
                    <small className="muted">Maximum attendees for selected resource: {selectedResourceCapacity}</small>
                  ) : null}
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" name="date" value={formData.date} onChange={handleFormChange} required />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input className="input" type="time" name="startTime" value={formData.startTime} onChange={handleFormChange} required />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input className="input" type="time" name="endTime" value={formData.endTime} onChange={handleFormChange} required />
                </div>
              </div>

              <div className="row" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button type="submit" className="btnPrimary" style={{ width: '100%', maxWidth: '350px', padding: '12px' }}>Submit Booking</button>
              </div>
            </form>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="resourceSectionIntro">
                <h2 className="resourceSectionTitle">My Bookings</h2>
                <p className="resourceSectionText">Your recent reservation requests and their statuses.</p>
              </div>

              {myBookings.length === 0 ? (
                <div className="muted" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  You haven't made any bookings yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table className="table" style={{ width: '100%', minWidth: '700px' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Resource</th>
                        <th>Date & Time</th>
                        <th>Purpose</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map(b => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{getResourceDisplayName(b)}</td>
                          <td>
                            <div>{b.date}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.startTime} - {b.endTime}</div>
                          </td>
                          <td>{b.purpose}</td>
                          <td>{getStatusBadge(b.status)}</td>
                          <td className="actions">
                            {b.status !== 'CANCELLED' && b.status !== 'REJECTED' && (
                              <button className="btnMini danger" onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="card" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div className="resourceSectionIntro">
            <h2 className="resourceSectionTitle">All Bookings (Admin)</h2>
            <p className="resourceSectionText">Review and manage campus-wide resource requests.</p>
          </div>
          {adminLoadError ? (
            <div className="card" style={{ marginBottom: '12px', border: '1px solid #f79b9bff', background: '#e6dfdfff' }}>
              <strong>Could not load admin bookings.</strong> {adminLoadError}
            </div>
          ) : null}

          <form onSubmit={applyAdminFilters} className="grid2" style={{ gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="label">Status</label>
              <select className="input" name="status" value={adminFilters.status} onChange={handleAdminFilterChange}>
                <option value="">All</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" name="date" value={adminFilters.date} onChange={handleAdminFilterChange} />
            </div>
            <div>
              <label className="label">Resource ID</label>
              <input className="input" type="number" min="1" name="resourceId" value={adminFilters.resourceId} onChange={handleAdminFilterChange} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="label">User ID</label>
              <input className="input" type="number" min="1" name="userId" value={adminFilters.userId} onChange={handleAdminFilterChange} placeholder="e.g. 2" />
            </div>
            <div className="row" style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
              <button type="submit" className="btnPrimary">Apply Filters</button>
              <button type="button" className="btnMini" onClick={clearAdminFilters}>Clear</button>
            </div>
          </form>

          {allBookings.length === 0 ? (
            <div className="muted" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No bookings found in the system.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table className="table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Resource</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Rejection Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map(b => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>{b.userId || b.user?.id || b.user?.email || 'Unknown'}</td>
                      <td>{b.resourceId || b.resource?.id}</td>
                      <td>
                        <div>{b.date}</div>
                        <div style={{ fontSize: '0.8rem', color: '#635f5fff' }}>{b.startTime} - {b.endTime}</div>
                      </td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td>
                        {b.status === 'PENDING' ? (
                          <input
                            type="text"
                            className="input"
                            style={{ minWidth: '160px' }}
                            placeholder="Reason..."
                            value={rejectionReasons[b.id] || ''}
                            onChange={(e) => handleReasonChange(b.id, e.target.value)}
                          />
                        ) : (
                          <span className="muted" style={{ padding: 0 }}>{b.rejectionReason || '-'}</span>
                        )}
                      </td>
                      <td className="actions">
                        {b.status === 'PENDING' && (
                          <>
                            <button className="btnMini ok" onClick={() => handleApproveBooking(b.id)}>Approve</button>
                            <button className="btnMini danger" onClick={() => handleRejectBooking(b.id)}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </ResourceLayout>
  );
}