import { bookingApi } from "../api/booking/bookingApi";

export const bookingService = {
  createBooking: bookingApi.create,
  getMyBookings: bookingApi.getMine,
  getAllBookings: bookingApi.getAll,
  getUnavailableResourceIds: bookingApi.getUnavailableResourceIds,
  approveBooking: bookingApi.approve,
  rejectBooking: (id, reason) => bookingApi.reject(id, { reason }),
  cancelBooking: bookingApi.cancel,
};
