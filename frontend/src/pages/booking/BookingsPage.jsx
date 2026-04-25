import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { bookingApi } from "../../api/booking/bookingApi";
import { resourceApi } from "../../api/resources/resourceApi";
import {
  confirmPopup,
  showErrorPopup,
  showSuccessPopup,
  showWarningPopup,
} from "../../utils/popup";
import { downloadBookingReportPdf } from "../../utils/bookingReportPdf";
import "./bookings.css";

const initialForm = {
  resourceId: "",
  date: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: "",
};

const statusClassMap = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

const chartColors = ["#7c3aed", "#3b82f6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

function formatTimeRange(startTime, endTime) {
  return `${String(startTime || "").slice(0, 5)} - ${String(endTime || "").slice(0, 5)}`;
}

function formatDateLabel(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getLocalIsoDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildWeek(selectedDate) {
  const anchor = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const day = anchor.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = getLocalIsoDate(date);
    return {
      iso,
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: "short" }),
    };
  });
}

function StatusBadge({ booking }) {
  const checkedIn = booking.checkedInAt ? "checkedin" : statusClassMap[booking.status] || "pending";
  const label = booking.checkedInAt ? "CHECKED IN" : booking.status;
  return <span className={`bookingBadge ${checkedIn}`}>{label}</span>;
}

function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    const values = Object.values(data).filter((value) => typeof value === "string" && value.trim());
    if (values.length > 0) return values.join("\n");
  }
  return (
    (typeof data === "string" ? data : "") ||
    fallback
  );
}

export default function BookingsPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const todayIso = useMemo(() => getLocalIsoDate(), []);
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [bookingForm, setBookingForm] = useState(initialForm);
  const [conflictState, setConflictState] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    resourceId: "",
    userId: "",
  });
  const [calendarDate, setCalendarDate] = useState(getLocalIsoDate());
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [reviewActionError, setReviewActionError] = useState("");
  const [qrModal, setQrModal] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportingBookingId, setReportingBookingId] = useState(null);

  const selectedResource = useMemo(
    () => resources.find((resource) => String(resource.id) === String(bookingForm.resourceId)),
    [resources, bookingForm.resourceId]
  );

  const visibleBookings = isAdmin ? adminBookings : myBookings;
  const weekDays = useMemo(() => buildWeek(calendarDate), [calendarDate]);

  const calendarBookings = useMemo(() => {
    const grouped = visibleBookings.reduce((acc, booking) => {
      const key = booking.date;
      acc[key] = acc[key] || [];
      acc[key].push(booking);
      return acc;
    }, {});

    Object.values(grouped).forEach((items) => items.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))));
    return grouped;
  }, [visibleBookings]);

  const selectedDayBookings = calendarBookings[calendarDate] || [];
  const analyticsCards = analytics
    ? [
        { label: "Total bookings", value: analytics.totalBookings, cls: "total" },
        { label: "Pending review", value: analytics.pendingBookings, cls: "pending" },
        { label: "Approved", value: analytics.approvedBookings, cls: "approved" },
        { label: "Checked in", value: analytics.checkedInBookings, cls: "checkedin" },
      ]
    : [];

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminBookings();
      loadAnalytics();
    } else {
      loadMyBookings();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminBookings();
  }, [filters.status, filters.startDate, filters.endDate, filters.resourceId, filters.userId]);

  useEffect(() => {
    const { resourceId, date, startTime, endTime, expectedAttendees } = bookingForm;
    if (!resourceId || !date || !startTime || !endTime) {
      setConflictState(null);
      return;
    }
    if (endTime <= startTime) {
      setConflictState({
        conflict: true,
        message: "End time must be after start time.",
        availableSlots: [],
      });
      return;
    }

    let cancelled = false;
    bookingApi
      .checkConflicts({ resourceId, date, startTime, endTime, expectedAttendees: Number(expectedAttendees || 0) || undefined })
      .then((data) => {
        if (!cancelled) {
          setConflictState(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setConflictState({
            conflict: true,
            message:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Could not validate the selected booking window.",
            availableSlots: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingForm.resourceId, bookingForm.date, bookingForm.startTime, bookingForm.endTime, bookingForm.expectedAttendees]);

  const downloadBookingReport = async (booking) => {
    setReportingBookingId(booking?.id || null);
    try {
      await downloadBookingReportPdf({ booking });
    } catch (error) {
      await showErrorPopup(
        "Report failed",
        getApiErrorMessage(error, "Could not generate the booking PDF report.")
      );
    } finally {
      setReportingBookingId(null);
    }
  };

  async function loadResources() {
    try {
      const response = await resourceApi.list({ size: 200 });
      const allResources = Array.isArray(response?.content) ? response.content : Array.isArray(response) ? response : [];
      setResources(allResources.filter((resource) => !resource.deleted));
    } catch (error) {
      setResources([]);
    }
  }

  async function loadMyBookings() {
    setLoading(true);
    try {
      const data = await bookingApi.getMine();
      setMyBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      setMyBookings([]);
      await showErrorPopup("Bookings unavailable", "Could not load your booking history.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminBookings() {
    setLoading(true);
    try {
      const data = await bookingApi.getAll(filters);
      setAdminBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      setAdminBookings([]);
      await showErrorPopup("Bookings unavailable", "Could not load booking review data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const data = await bookingApi.getPeakAnalytics();
      setAnalytics(data);
    } catch (error) {
      setAnalytics(null);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  }

  function applySuggestedSlot(slot) {
    setBookingForm((prev) => ({
      ...prev,
      startTime: String(slot.startTime || "").slice(0, 5),
      endTime: String(slot.endTime || "").slice(0, 5),
    }));
  }

  async function submitBooking(event) {
    event.preventDefault();

    if (!bookingForm.resourceId) {
      await showWarningPopup("Resource required", "Please select a resource.");
      return;
    }
    if (!bookingForm.date) {
      await showWarningPopup("Date required", "Please select a booking date.");
      return;
    }
    if (bookingForm.date < todayIso) {
      await showWarningPopup("Invalid date", "Booking date cannot be in the past.");
      return;
    }
    if (!bookingForm.startTime || !bookingForm.endTime) {
      await showWarningPopup("Time required", "Please select both start time and end time.");
      return;
    }
    if (bookingForm.endTime <= bookingForm.startTime) {
      await showWarningPopup("Invalid time range", "End time must be after start time.");
      return;
    }
    const attendees = Number(bookingForm.expectedAttendees);
    if (!Number.isFinite(attendees) || attendees < 1) {
      await showWarningPopup("Invalid attendees", "Expected attendees must be at least 1.");
      return;
    }
    if (selectedResource?.capacity && attendees > Number(selectedResource.capacity)) {
      await showWarningPopup("Capacity exceeded", `Expected attendees cannot exceed ${selectedResource.capacity}.`);
      return;
    }
    if (!bookingForm.purpose || !String(bookingForm.purpose).trim()) {
      await showWarningPopup("Purpose required", "Please enter a purpose.");
      return;
    }

    if (conflictState?.conflict) {
      await showWarningPopup("Conflicting time slot", conflictState.message || "Please choose another time.");
      return;
    }

    setSubmitting(true);
    try {
      await bookingApi.create({
        ...bookingForm,
        expectedAttendees: Number(bookingForm.expectedAttendees),
      });
      await showSuccessPopup("Booking requested", "Your booking request is now pending admin review.");
      setBookingForm(initialForm);
      setConflictState(null);
      await loadMyBookings();
      setCalendarDate(getLocalIsoDate());
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data : "") ||
        "Could not create the booking.";
      await showErrorPopup("Booking failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(id) {
    const confirmed = await confirmPopup({
      title: "Cancel booking?",
      text: "This will cancel the approved reservation.",
      confirmButtonText: "Cancel booking",
      cancelButtonText: "Keep booking",
      icon: "warning",
    });
    if (!confirmed) return;

    try {
      await bookingApi.cancel(id);
      await showSuccessPopup("Booking cancelled", "The reservation was cancelled successfully.");
      if (isAdmin) {
        await loadAdminBookings();
        await loadAnalytics();
      } else {
        await loadMyBookings();
      }
    } catch (error) {
      await showErrorPopup("Cancel failed", getApiErrorMessage(error, "Could not cancel this booking."));
    }
  }

  async function approveBooking(id) {
    setReviewActionLoading(true);
    setReviewActionError("");
    try {
      await bookingApi.approve(id);
      setReviewBooking(null);
      setRejectReason("");
      setReviewActionError("");
      await showSuccessPopup("Booking approved", "The request has been approved.");
      await loadAdminBookings();
      await loadAnalytics();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not approve this booking.");
      setReviewActionError(message);
      await showErrorPopup("Approve failed", message);
    } finally {
      setReviewActionLoading(false);
    }
  }

  async function rejectBooking() {
    if (!reviewBooking) return;
    if (!rejectReason.trim()) {
      await showWarningPopup("Reason required", "Please enter a rejection reason before continuing.");
      return;
    }
    setReviewActionLoading(true);
    setReviewActionError("");
    try {
      await bookingApi.reject(reviewBooking.id, { reason: rejectReason.trim() });
      setReviewBooking(null);
      setRejectReason("");
      setReviewActionError("");
      await showSuccessPopup("Booking rejected", "The request has been rejected.");
      await loadAdminBookings();
      await loadAnalytics();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not reject this booking.");
      setReviewActionError(message);
      await showErrorPopup("Reject failed", message);
    } finally {
      setReviewActionLoading(false);
    }
  }

  async function openQrModal(booking) {
    setQrLoading(true);
    try {
      const qr = await bookingApi.getQrCode(booking.id);
      setQrModal({ booking, qr });
    } catch (error) {
      await showErrorPopup("QR unavailable", getApiErrorMessage(error, "Could not generate the QR code."));
    } finally {
      setQrLoading(false);
    }
  }

  async function completeCheckIn() {
    if (!qrModal?.qr?.token) return;
    try {
      await bookingApi.checkIn({ token: qrModal.qr.token });
      await showSuccessPopup("Checked in", "The approved booking has been checked in.");
      setQrModal(null);
      if (isAdmin) {
        await loadAdminBookings();
        await loadAnalytics();
      } else {
        await loadMyBookings();
      }
    } catch (error) {
      await showErrorPopup("Check-in failed", getApiErrorMessage(error, "Could not complete check-in."));
    }
  }

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className="bookingPage">
        <section className="bookingHero">
          <div>
            <h1>{isAdmin ? "Booking Workflow Command Center" : "Booking Workspace"}</h1>
            <p>
              {isAdmin
                ? "Review requests, resolve conflicts, monitor booking pressure, and keep campus resource usage flowing cleanly."
                : "Request campus resources, spot conflicts before submission, and keep your upcoming reservations in one place."}
            </p>
          </div>
          <div className="bookingHeroMeta">
            <div className="bookingHeroChip">
              <strong>{visibleBookings.length}</strong>
              <span>{isAdmin ? "Visible bookings" : "My bookings"}</span>
            </div>
            <div className="bookingHeroChip">
              <strong>{resources.length}</strong>
              <span>Resources loaded</span>
            </div>
            
          </div>
        </section>

        {!isAdmin ? (
          <section className="bookingTwoCol">
            <div className="bookingPanel">
              <div className="bookingPanelHeader">
                <div>
                  <h2>Create Booking Request</h2>
                  <p>Choose a resource, validate the time window, and submit a request for approval.</p>
                </div>
              </div>

              <form className="bookingFormGrid" onSubmit={submitBooking}>
                <div className="bookingField">
                  <label>Resource</label>
                  <select className="bookingSelect" name="resourceId" value={bookingForm.resourceId} onChange={handleFormChange} required>
                    <option value="">Select a resource</option>
                    {resources
                      .filter((resource) => String(resource.status).toUpperCase() === "ACTIVE")
                      .map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} - {resource.location}
                        </option>
                      ))}
                  </select>
                  {selectedResource ? (
                    <div className="bookingHelp">
                      Capacity: {selectedResource.capacity} | Available: {String(selectedResource.availabilityStart || "").slice(0, 5)} -{" "}
                      {String(selectedResource.availabilityEnd || "").slice(0, 5)}
                    </div>
                  ) : null}
                </div>

                <div className="bookingField">
                  <label>Date</label>
                  <input className="bookingInput" type="date" name="date" min={todayIso} value={bookingForm.date} onChange={handleFormChange} required />
                </div>

                <div className="bookingField">
                  <label>Start Time</label>
                  <input className="bookingInput" type="time" name="startTime" value={bookingForm.startTime} onChange={handleFormChange} required />
                </div>

                <div className="bookingField">
                  <label>End Time</label>
                  <input className="bookingInput" type="time" name="endTime" value={bookingForm.endTime} onChange={handleFormChange} required />
                </div>

                <div className="bookingField">
                  <label>Expected Attendees</label>
                  <input
                    className="bookingInput"
                    type="number"
                    min="1"
                    max={selectedResource?.capacity || undefined}
                    name="expectedAttendees"
                    value={bookingForm.expectedAttendees}
                    onChange={handleFormChange}
                    placeholder="Example: 25"
                    required
                  />
                </div>

                <div className="bookingField bookingFieldFull">
                  <label>Purpose</label>
                  <textarea
                    className="bookingTextarea"
                    name="purpose"
                    value={bookingForm.purpose}
                    onChange={handleFormChange}
                    placeholder="Describe why the resource is needed and what activity will happen."
                    required
                  />
                </div>

                {conflictState ? (
                  <div className={`bookingConflictBox bookingFieldFull ${conflictState.conflict ? "conflict" : ""}`}>
                    <strong>{conflictState.message}</strong>
                    {typeof conflictState.remainingCapacity === "number" ? (
                      <div className="bookingHelp">Remaining capacity after this request: {conflictState.remainingCapacity}</div>
                    ) : null}
                    {Array.isArray(conflictState.availableSlots) && conflictState.availableSlots.length > 0 ? (
                      <>
                        <div className="bookingHelp">Suggested available slots</div>
                        <div className="bookingSuggestions">
                          {conflictState.availableSlots.map((slot) => (
                            <button key={`${slot.startTime}-${slot.endTime}`} type="button" className="bookingSuggestionBtn" onClick={() => applySuggestedSlot(slot)}>
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="bookingActions bookingFieldFull">
                  <button className="bookingPrimaryBtn" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Booking Request"}
                  </button>
                  <button className="bookingGhostBtn" type="button" onClick={() => setBookingForm(initialForm)}>
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="bookingPanel">
              <div className="bookingPanelHeader">
                <div>
                  <h2>My Booking History</h2>
                  <p>Track status changes, open QR check-in for approved requests, and manage upcoming reservations.</p>
                </div>
              </div>

              {loading ? (
                <div className="bookingMuted">Loading bookings...</div>
              ) : visibleBookings.length === 0 ? (
                <div className="bookingMuted">No bookings yet. Your requests will appear here.</div>
              ) : (
                <div className="bookingTableWrap">
                  
                  <table className="bookingTable">
                    <thead>
                      <tr>
                        
                        <th>Resource</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBookings.map((booking) => (
                        <tr key={booking.id}>
                          
                          <td>
                            <strong>{booking.resourceName}</strong>
                            <div className="bookingMuted">{booking.resourceLocation}</div>
                          </td>
                          <td>
                            <strong>{formatDateLabel(booking.date)}</strong>
                            <div className="bookingMuted">{formatTimeRange(booking.startTime, booking.endTime)}</div>
                          </td>
                          <td>
                            <StatusBadge booking={booking} />
                            {booking.rejectionReason ? <div className="bookingHelp">{booking.rejectionReason}</div> : null}
                          </td>
                          <td>
                            <div className="bookingActions bookingActionsStack">
                              {!isAdmin ? (
                                <button
                                  className="bookingDownloadBtn"
                                  type="button"
                                  onClick={() => downloadBookingReport(booking)}
                                  disabled={reportingBookingId === booking.id}
                                  title="Download your booking report (PDF)"
                                >
                                  {reportingBookingId === booking.id ? "Preparing..." : "Download Booking Report"}
                                </button> 
                              ) : null}
                              {booking.status === "APPROVED" ? (
                                <>
                                  <button className="bookingGhostBtn" type="button" onClick={() => openQrModal(booking)}>
                                    {qrLoading ? "Preparing..." : "QR Check-In"}
                                  </button>
                                  <button className="bookingDangerBtn" type="button" onClick={() => cancelBooking(booking.id)}>
                                    Cancel
                                  </button>
                                </> 
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {analytics ? (
              <section className="bookingAnalytics">
                <div className="bookingPanelHeader">
                  <div>
                    <h2>Peak Booking Hour Analytics</h2>
                    <p>Understand workload concentration, approval volume, and real check-ins across the booking pipeline.</p>
                  </div>
                </div>

                <div className="bookingAnalyticsGrid">
                  {analyticsCards.map((card) => (
                    <div key={card.label} className={`bookingMetric ${card.cls}`}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="bookingChartWrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.peakBookingHours || []}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="totalBookings" radius={[12, 12, 0, 0]}>
                        {(analytics.peakBookingHours || []).map((entry, index) => (
                          <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ) : null}

            <section className="bookingPanel">
              <div className="bookingPanelHeader">
                <div>
                  <h2>Admin Review Queue</h2>
                  </div>
              </div>

              <div className="bookingFilterGrid">
                <div className="bookingField">
                  <label>Status</label>
                  <select className="bookingSelect" name="status" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                <div className="bookingField">
                  <label>Resource</label>
                  <select className="bookingSelect" name="resourceId" value={filters.resourceId} onChange={(e) => setFilters((prev) => ({ ...prev, resourceId: e.target.value }))}>
                    <option value="">All resources</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bookingField">
                  <label>Start Date</label>
                  <input className="bookingInput" type="date" name="startDate" value={filters.startDate} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="bookingField">
                  <label>End Date</label>
                  <input className="bookingInput" type="date" name="endDate" value={filters.endDate} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))} />
                </div>
                
                <div className="bookingActions">
                  <button className="bookingGhostBtn" type="button" onClick={() => setFilters({ status: "", startDate: "", endDate: "", resourceId: "", userId: "" })}>
                    Clear filters
                  </button>
                </div>
              </div>

              <div className="bookingTableWrap">
                <table className="bookingTable">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>User</th>
                      <th>Resource</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>#{booking.id}</strong>
                          <div className="bookingMuted">{booking.purpose}</div>
                        </td>
                        <td>
                          <strong>{booking.userName || "Unknown user"}</strong>
                          <div className="bookingMuted">{booking.userEmail || `User #${booking.userId}`}</div>
                        </td>
                        <td>
                          <strong>{booking.resourceName}</strong>
                          <div className="bookingMuted">{booking.resourceLocation}</div>
                        </td>
                        <td>
                          <strong>{formatDateLabel(booking.date)}</strong>
                          <div className="bookingMuted">{formatTimeRange(booking.startTime, booking.endTime)}</div>
                        </td>
                        <td>
                          <StatusBadge booking={booking} />
                          {booking.rejectionReason ? <div className="bookingHelp">{booking.rejectionReason}</div> : null}
                        </td>
                        <td>
                          <div className="bookingActions">
                            {booking.status === "PENDING" ? (
                              <button className="bookingPrimaryBtn" type="button" onClick={() => { setReviewBooking(booking); setRejectReason(""); }}>
                                Review
                              </button>
                            ) : null}
                            {booking.status === "APPROVED" ? (
                              <>
                                <button className="bookingGhostBtn" type="button" onClick={() => openQrModal(booking)}>
                                  View QR
                                </button>
                                <button className="bookingDangerBtn" type="button" onClick={() => cancelBooking(booking.id)}>
                                  Cancel
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && visibleBookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="bookingMuted">
                          No bookings match the selected filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <section className="bookingCalendar">
          <div className="bookingCalendarHeader">
            <div>
              <h3 style={{ margin: 0 }}>Booking Calendar View</h3>
              
            </div>
            <input className="bookingInput" style={{ maxWidth: 220 }} type="date" value={calendarDate} onChange={(e) => setCalendarDate(e.target.value)} />
          </div>

          <div className="bookingCalendarStrip">
            {weekDays.map((day) => {
              const count = (calendarBookings[day.iso] || []).length;
              return (
                <button key={day.iso} type="button" className={`bookingDayCard ${calendarDate === day.iso ? "active" : ""}`} onClick={() => setCalendarDate(day.iso)}>
                  <span className="bookingDayLabel">{day.weekday}</span>
                  <span className="bookingDayValue">{day.day}</span>
                  <span className="bookingMuted">{day.month}</span>
                  <span className="bookingDayCount">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="bookingTimeline">
            {selectedDayBookings.length === 0 ? (
              <div className="bookingMuted">No bookings scheduled for {formatDateLabel(calendarDate)}.</div>
            ) : (
              selectedDayBookings.map((booking) => (
                <div key={booking.id} className={`bookingTimelineItem ${statusClassMap[booking.status] || "pending"}`}>
                  <div className="bookingPanelHeader">
                    <div>
                      <strong>{booking.resourceName}</strong>
                      <div className="bookingMuted">{booking.purpose}</div>
                    </div>
                    <StatusBadge booking={booking} />
                  </div>
                  <div className="bookingMuted">{formatTimeRange(booking.startTime, booking.endTime)}</div>
                  <div className="bookingHelp">
                    {isAdmin ? `Requested by ${booking.userName || booking.userEmail || `User #${booking.userId}`}` : booking.resourceLocation}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {reviewBooking ? (
          <div
            className="bookingModal"
            onClick={(e) => {
              if (e.target === e.currentTarget && !reviewActionLoading) {
                setReviewBooking(null);
                setRejectReason("");
                setReviewActionError("");
              }
            }}
          >
            <div className="bookingModalCard" onClick={(e) => e.stopPropagation()}>
              <div className="bookingPanelHeader">
                <div>
                  <h3>Review Booking #{reviewBooking.id}</h3>
                  <p>Approve immediately or reject with a clear reason for the requester.</p>
                </div>
                <button
                  className="bookingGhostBtn"
                  type="button"
                  disabled={reviewActionLoading}
                  onClick={() => {
                    setReviewBooking(null);
                    setRejectReason("");
                    setReviewActionError("");
                  }}
                >
                  Close
                </button>
              </div>

              <div className="bookingModalGrid">
                <div><strong>User</strong><div className="bookingMuted">{reviewBooking.userName || reviewBooking.userEmail}</div></div>
                <div><strong>Resource</strong><div className="bookingMuted">{reviewBooking.resourceName}</div></div>
                <div><strong>Date</strong><div className="bookingMuted">{formatDateLabel(reviewBooking.date)}</div></div>
                <div><strong>Time</strong><div className="bookingMuted">{formatTimeRange(reviewBooking.startTime, reviewBooking.endTime)}</div></div>
                <div className="bookingFieldFull"><strong>Purpose</strong><div className="bookingMuted">{reviewBooking.purpose}</div></div>
              </div>

              <div className="bookingField">
                <label>Rejection Reason</label>
                <textarea className="bookingTextarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why the request cannot be approved." />
              </div>

              {reviewActionError ? (
                <div className="bookingConflictBox conflict">
                  <strong>Action could not be completed</strong>
                  <div className="bookingHelp" style={{ whiteSpace: "pre-line" }}>{reviewActionError}</div>
                </div>
              ) : null}

              <div className="bookingActions">
                <button className="bookingPrimaryBtn" type="button" disabled={reviewActionLoading} onClick={() => approveBooking(reviewBooking.id)}>
                  {reviewActionLoading ? "Working..." : "Approve"}
                </button>
                <button className="bookingDangerBtn" type="button" disabled={reviewActionLoading} onClick={rejectBooking}>
                  {reviewActionLoading ? "Working..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {qrModal ? (
          <div className="bookingModal" onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
            <div className="bookingModalCard">
              <div className="bookingPanelHeader">
                <div>
                  <h3>QR Check-In</h3>
                  <p>Use the QR code for approved booking check-in. The same token can also be checked in directly from this screen.</p>
                </div>
                <button className="bookingGhostBtn" type="button" onClick={() => setQrModal(null)}>Close</button>
              </div>

              <div className="bookingModalGrid">
                <div>
                  <img className="bookingQrImage" src={qrModal.qr.qrCodeDataUrl} alt="Booking QR code" />
                </div>
                <div className="bookingField">
                  <div><strong>Booking</strong><div className="bookingMuted">#{qrModal.booking.id} - {qrModal.booking.resourceName}</div></div>
                  <div><strong>Token</strong><div className="bookingMuted" style={{ wordBreak: "break-all" }}>{qrModal.qr.token}</div></div>
                  <div><strong>Expires</strong><div className="bookingMuted">{new Date(qrModal.qr.tokenExpiresAt).toLocaleString()}</div></div>
                  <div className="bookingActions">
                    <button className="bookingPrimaryBtn" type="button" onClick={completeCheckIn}>Check In Now</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ResourceLayout>
  );
}
