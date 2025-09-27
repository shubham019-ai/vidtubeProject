import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  let { name, description } = req.body;

  //TODO: create playlist
  // Check if the name is missing or just empty space
  if (!name || name.trim() === "") {
    // Create a default name using the current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    name = `My Playlist ${formattedDate}`; // Example: "My Playlist 06 Sep 2025"
  }

  const playlist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating the playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  // 1. Validate the incoming userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  // 2. Perform the aggregation with the corrected $match stage
  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        // Convert the userId string to a MongoDB ObjectId
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // Optional but good practice: select only the fields you need
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
      },
    },
  ]);

  // 3. Handle the case where no playlists are found
  // The query will return an empty array, not null, so check the length
  if (userPlaylists.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "User has no playlists"));
  }

  // 4. Return the successful response
  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  // 1. Validate the incoming playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }

  // 2. Build and execute the aggregation pipeline
  const playlist = await Playlist.aggregate([
    {
      // Stage 1: Find the specific playlist by its ID
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      // Stage 2: Look up the videos associated with this playlist
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
        // Add a nested pipeline to get owner details for each video
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$ownerDetails",
              },
            },
          },
        ],
      },
    },
    {
      // Stage 3: Look up the details of the playlist's owner
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
      // Stage 4: Clean up the response fields
      $addFields: {
        owner: {
          $first: "$ownerInfo",
        },
        videos: "$playlistVideos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // 3. Handle the case where the playlist is not found
  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  // 4. Return the successful response
  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if(!mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(400,"Playlist id is required")
  }
   if (!mongoose.Types.ObjectId.isValid(videoId)) {
     throw new ApiError(400, "video id is required");
   }
   const playlist = await Playlist.findById(playlistId)
   const video = await Video.findById(videoId);

   if(!playlist){
    throw new ApiError(404,"Playlist not found")
   }
   if (!video) {
     throw new ApiError(404, "video not found");
   }
   // check the user and owner of playlist is same or not
   if(playlist.owner.toString()!==req.user?._id.toString()){
    throw new ApiError(403,"You are not authorized to add video to playlist")
   }
   if(playlist.videos.includes(videoId)){
     return res
       .status(200)
       .json(
         new ApiResponse(200, playlist, "Video is already in the playlist")
       );
   }
   const updatedPlaylist = await Playlist.findByIdAndUpdate(
     playlistId,
     {
       $addToSet: {
         videos: videoId,
       },
     },
     { new: true }
   );
   if (!updatedPlaylist) {
     throw new ApiError(500, "Failed to add video to the playlist");
   }

   // 6. Return the successful response
   return res
     .status(200)
     .json(
       new ApiResponse(
         200,
         updatedPlaylist,
         "Video added to playlist successfully"
       )
     );
}); 

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  // 1. Validate the incoming ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid Playlist or Video ID format");
  }

  // 2. Find the playlist
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 3. (Crucial) Check if the user owns the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to remove videos from this playlist"
    );
  }

  // 4. Remove the video from the playlist using $pull
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to remove video from the playlist");
  }

  // 5. Return the successful response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  // 1. Validate the incoming playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }

  // 2. Find the playlist to be deleted
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 3. (Crucial) Verify that the user owns the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  // 4. Delete the playlist from the database
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(500, "Failed to delete the playlist");
  }

  // 5. Return a successful response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  // 1. Validate the incoming data
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }

  // 2. Find the playlist
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 3. (Crucial) Verify that the user owns the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  // 4. Update the playlist with the new details
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true } // This option returns the updated document
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to update the playlist");
  }

  // 5. Return a successful response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
