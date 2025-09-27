import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
// This is a clean way to protect all video-related actions
router.use(verifyJWT);

// Routes for getting all videos and publishing a new one
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

// Routes for a specific video by its ID
router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.single("thumbnail"), updateVideo) // Handles thumbnail updates
  .delete(deleteVideo);

// Route for toggling the publish status of a specific video
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
