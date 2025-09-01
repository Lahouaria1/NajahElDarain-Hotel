import { useState, useEffect } from "react";
import api from "../lib/api";
import { toUtcIso, toLocalInputValue } from "../utils/datetime";

export default function BookingForm({ selectedRoomId, booking }) {
  const [form, setForm] = useState({
    startTime: booking ? toLocalInputValue(booking.startTime) : "",
    endTime:   booking ? toLocalInputValue(booking.endTime)   : "",
  });
  const [minLocal, setMinLocal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMinLocal(toLocalInputValue(new Date()));
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        roomId: selectedRoomId,
        startTime: toUtcIso(form.startTime), // -> "...Z"
        endTime:   toUtcIso(form.endTime),
      };

      if (booking?.id) {
        await api.put(`/api/bookings/${booking.id}`, payload);
      } else {
        await api.post(`/api/bookings`, payload);
      }
      // TODO: refresh list / close modal here
    } catch (err) {
      // surface server message like "Room is not available in that time window"
      const msg = err?.response?.data?.error || err.message || "Request failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block mb-1">Start</label>
        <input
          className="input w-full"
          type="datetime-local"
          name="startTime"
          value={form.startTime}
          onChange={onChange}
          min={minLocal}
          required
        />
      </div>

      <div>
        <label className="block mb-1">End</label>
        <input
          className="input w-full"
          type="datetime-local"
          name="endTime"
          value={form.endTime}
          onChange={onChange}
          min={form.startTime || minLocal}
          required
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : booking ? "Update booking" : "Create booking"}
      </button>
    </form>
  );
}
