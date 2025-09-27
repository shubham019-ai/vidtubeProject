import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // Using Promise.all for concurrent database queries for better performance
  const [totalSubscribers, videoStats] = await Promise.all([
    // Query 1: Get the total number of subscribers for the channel
    Subscription.countDocuments({ channel: channelId }),

    // Query 2: Use an aggregation pipeline to get video-related stats
    Video.aggregate([
      {
        // Stage 1: Match all videos uploaded by the channel owner
        $match: {
          owner: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        // Stage 2: Look up all the likes for each of the channel's videos
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        // Stage 3: Group all documents to calculate the final stats
        $group: {
          _id: null, // Group all matched videos into a single result
          totalVideos: { $sum: 1 }, // Count the number of videos
          totalViews: { $sum: "$views" }, // Sum up the views of all videos
          totalLikes: { $sum: { $size: "$likes" } }, // Sum up the size of the likes array for all videos
        },
      },
      {
        // Stage 4: Project to format the output
        $project: {
          _id: 0, // Exclude the default _id field
          totalVideos: 1,
          totalViews: 1,
          totalLikes: 1,
        },
      },
    ]),
  ]);

  const stats = {
    totalSubscribers,
    totalVideos: videoStats[0]?.totalVideos || 0,
    totalViews: videoStats[0]?.totalViews || 0,
    totalLikes: videoStats[0]?.totalLikes || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const videos = await Video.find({ owner: channelId }).sort({ createdAt: -1 });

  if (!videos || videos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No videos found for this channel"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
