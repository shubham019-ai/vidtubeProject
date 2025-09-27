import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType="desc", userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  //build the aggregatio pipeline

  const pipeline = [];

  // Match Stage: filter videos based on query and/or userId
  const matchStage = {};

  //if a user id is provided, filter for videos by that specific user
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId formate");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  // If a search query is provided, search in title and description
  // This uses a case-insensitive regex search
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // We will only get videos which are published
  matchStage.isPublished = true;

  // Add the match stage to the pipeline
  pipeline.push({
    $match: matchStage,
  });

  // --- Sort Stage: Sort the results ---
  const sortStage={};
  if (sortBy) {
    // If sortBy is provided, sort by that field and the specified sortType
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    // Default sort by createdAt in descending order (newest first)
    sortStage.createdAt = -1;
  }
   pipeline.push({
    $sort: sortStage
  });

  // ## 2. Execute the Aggregation with Pagination
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videoAggregate = Video.aggregate(pipeline);
  
  const videos = await Video.aggregatePaginate(videoAggregate, options);

  if (!videos || videos.docs.length === 0) {
    // You can either throw an error or return an empty array based on your API design
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No videos found"));
  }

  // ## 3. Return the Response
  
  return res
    .status(200)
    .json(
      new ApiResponse(200, videos, "Videos fetched successfully")
    );

});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // 1. Validate required fields (including file paths)
  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "Title and description are required");
  }

  // 2. Get local paths for video and thumbnail files
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing");
  }

  // Use a single try-catch block for a cleaner flow
  let uploadedVideo, uploadedThumbnail;
  try {
    // 3. Upload both video and thumbnail to Cloudinary
    uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo || !uploadedThumbnail) {
      throw new ApiError(
        500,
        "Failed to upload video or thumbnail to Cloudinary"
      );
    }

    // 4. Create the video document in the database
    const createdVideo = await Video.create({
      videoFile: uploadedVideo.url,
      thumbnail: uploadedThumbnail.url,
      title,
      description,
      duration: uploadedVideo.duration || 0,
      owner: req.user._id, // Placeholder for the authenticated user's ID
      // Add other relevant fields like views, isPublished, etc.
    });

    // 5. Check if the video was successfully created
    if (!createdVideo) {
      // Clean up uploaded files if DB creation fails
      await deleteFromCloudinary(uploadedVideo.public_id);
      await deleteFromCloudinary(uploadedThumbnail.public_id);
      throw new ApiError(500, "Something went wrong while uploading a video");
    }

    // 6. Return a successful response
    return res
      .status(200)
      .json(new ApiResponse(200, createdVideo, "Video uploaded successfully"));
  } catch (error) {
    console.error("Video upload failed:", error);
    // 7. A final cleanup for any uploaded files in case of failure
    if (uploadedVideo) {
      await deleteFromCloudinary(uploadedVideo.public_id);
    }
    if (uploadedThumbnail) {
      await deleteFromCloudinary(uploadedThumbnail.public_id);
    }
    // Re-throw the error to be handled by the asyncHandler
    throw error;
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if(!videoId){
    throw new ApiError(400,"videoId is required")
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId)
      },
    },
    {
      $lookup:{
        from: "User",
        localField: "owner",
        foreignField:"_id",
        as: "owner",
        pipeline:[
          {
            $project: {
              username:1,
              fullname:1,
              avatar:1,
            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
        $first: "$owner"
        }
      }
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1,
        isPublished:1
      },
    },
  ]);

  if(!video || video.length === 0){
      throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200,video,"video fetched successfully"));

});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const {title, description, thumbnail}=req.body
if(!videoId){
  throw new ApiError(400,"video id is required")
}
const video= await Video.findByIdAndUpdate(
 videoId,
  {
    $set:{
      title,
      thumbnail,
      description
    }
  },
  {new: true}
)
if(!video){
  throw new ApiError(404,"video not found")
}
  return res.status(200).json(new ApiResponse(200,video,"title,thumbnail and description updated successfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }
  const deletedVideo=await Video.findByIdAndDelete(videoId)

  if (!deletedVideo) {
    throw new ApiError(404, "video not found");
  }
  return res.status(200).json(new ApiResponse(200,deleteVideo,"video get deleted successfully"))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is required");
  }
  const toggleVideo = await Video.findByIdAndUpdate(
    videoId,
    [
      {
        $set: {
          isPublished: { $not: "$isPublished" },
        },
      },
    ],
    { new: true }
  );
  if (!toggleVideo) {
    throw new ApiError(404, "video not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200),
      toggleVideo,
      "Video publish status toggled successfully"
    );

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
