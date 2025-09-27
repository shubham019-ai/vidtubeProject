import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file.
// A user must be logged in to see their dashboard.
router.use(verifyJWT);

// Route to get the channel statistics (views, likes, subscribers, etc.)
router.route("/stats").get(getChannelStats);

// Route to get all videos uploaded by the channel
router.route("/videos").get(getChannelVideos);

export default router;
