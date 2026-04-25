import "./table.css";

export default function ResourceForm({ form, setForm, onSubmit, editingId, onCancelEdit }) {
  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="grid2">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Lab A / Projector 01"
            required
          />
        </div>

        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="LECTURE_HALL">LECTURE_HALL</option>
            <option value="LAB">LAB</option>
            <option value="MEETING_ROOM">MEETING_ROOM</option>
            <option value="EQUIPMENT">EQUIPMENT</option>
          </select>
        </div>

        <div>
          <label className="label">Capacity</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g., Building A"
            required
          />
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>
        </div>

        <div>
          <label className="label">Availability</label>
          <select
            className="input"
            value={form.availabilityWindows}
            onChange={(e) =>
              setForm({ ...form, availabilityWindows: e.target.value })
            }
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
          </select>
        </div>
      </div>

      {form.availabilityWindows !== "AVAILABLE" && (
        <p style={{ color: "orange", fontWeight: "600" }}>
          ⚠️ Resource is not available for booking
        </p>
      )}

      <div className="row">
        <button className="btnPrimary" type="submit">
          {editingId ? "Update Resource" : "Add Resource"}
        </button>

        {editingId && (
          <button className="btnGhost" type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}