// backend/src/routes/rooms.routes.js
import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createRoom,
  listRooms,
  updateRoom,
  deleteRoom,
} from "../controllers/rooms.controller.js";
import logger from "../utils/logger.js";

const router = Router();

router.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.originalUrl }, "[ROOMS ROUTER]");
  next();
});

router.get("/", listRooms);
router.post("/", authRequired, requireRole("Admin"), createRoom);
router.put("/:id", authRequired, requireRole("Admin"), updateRoom);
router.delete("/:id", authRequired, requireRole("Admin"), deleteRoom);

export default router;
