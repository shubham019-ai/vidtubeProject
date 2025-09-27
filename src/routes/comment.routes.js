import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Routes for getting comments for a video and adding a new comment
router.route("/v/:videoId").get(getVideoComments).post(verifyJWT, addComment);

// Routes for updating and deleting a specific comment
router
  .route("/c/:commentId")
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

export default router;
