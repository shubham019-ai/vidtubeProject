import mongoose from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  // Check if the user has already liked this video
  const likeCriteria = { video: videoId, likedBy: userId };
  const existingLike = await Like.findOne(likeCriteria);

  let likeStatus;

  if (existingLike) {
    // If like exists, remove it
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = { isLiked: false };
  } else {
    // If like does not exist, create it
    await Like.create(likeCriteria);
    likeStatus = { isLiked: true };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeStatus, "Like status toggled successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID format");
  }

  const likeCriteria = { comment: commentId, likedBy: userId };
  const existingLike = await Like.findOne(likeCriteria);

  let likeStatus;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = { isLiked: false };
  } else {
    await Like.create(likeCriteria);
    likeStatus = { isLiked: true };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeStatus, "Like status toggled successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID format");
  }

  const likeCriteria = { tweet: tweetId, likedBy: userId };
  const existingLike = await Like.findOne(likeCriteria);

  let likeStatus;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = { isLiked: false };
  } else {
    await Like.create(likeCriteria);
    likeStatus = { isLiked: true };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likeStatus, "Like status toggled successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likedVideos = await Like.aggregate([
    {
      // Stage 1: Find all 'like' documents by the current user for videos
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true }, // Ensure we only get likes for videos
      },
    },
    {
      // Stage 2: Join with the 'videos' collection to get video details
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        // Nested pipeline to also get the video owner's details
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerInfo",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$ownerInfo" },
            },
          },
        ],
      },
    },
    {
      // Stage 3: Deconstruct the videoDetails array
      $unwind: "$videoDetails",
    },
    {
      // Stage 4: Replace the root to output only the video details
      $replaceRoot: {
        newRoot: "$videoDetails",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
