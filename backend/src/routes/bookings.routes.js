// backend/src/routes/bookings.routes.js
import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createBooking,
  listBookings,
  updateBooking,
  deleteBooking,
  findConflicts,
  roomsAvailability,
  roomBusy,
} from "../controllers/bookings.controller.js";
import logger from "../utils/logger.js";

const router = Router();

router.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.originalUrl }, "[BOOKINGS ROUTER]");
  next();
});

router.get("/", authRequired, listBookings);
router.post("/", authRequired, createBooking);
router.put("/:id", authRequired, updateBooking);
router.delete("/:id", authRequired, deleteBooking);

router.get("/availability", authRequired, roomsAvailability);
router.get("/room/:id/busy", authRequired, roomBusy);

router.get("/debug/conflicts", authRequired, requireRole("Admin"), findConflicts);

export default router;
