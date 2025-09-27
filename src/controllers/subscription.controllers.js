import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID format");
  }

  // Prevent user from subscribing to their own channel
  if (channelId.toString() === subscriberId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const subscriptionCriteria = {
    subscriber: subscriberId,
    channel: channelId,
  };

  const existingSubscription = await Subscription.findOne(subscriptionCriteria);

  let subscriptionStatus;

  if (existingSubscription) {
    // If subscription exists, remove it (unsubscribe)
    await Subscription.findByIdAndDelete(existingSubscription._id);
    subscriptionStatus = { isSubscribed: false };
  } else {
    // If subscription does not exist, create it (subscribe)
    await Subscription.create(subscriptionCriteria);
    subscriptionStatus = { isSubscribed: true };
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptionStatus,
        "Subscription status toggled successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID format");
  }

  const subscribers = await Subscription.aggregate([
    {
      // Stage 1: Find all subscriptions for the given channel
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      // Stage 2: Join with the 'users' collection to get subscriber details
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
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
      // Stage 3: Deconstruct the subscriberDetails array
      $unwind: "$subscriberDetails",
    },
    {
      // Stage 4: Replace the root to output only the subscriber details
      $replaceRoot: {
        newRoot: "$subscriberDetails",
      },
    },
  ]);

  if (subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Channel has no subscribers"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params; // This is the ID of the user whose subscriptions we want to see

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      // Stage 1: Find all subscriptions by the given user
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      // Stage 2: Join with the 'users' collection to get channel details
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
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
      // Stage 3: Deconstruct the channelDetails array
      $unwind: "$channelDetails",
    },
    {
      // Stage 4: Replace the root to output only the channel details
      $replaceRoot: {
        newRoot: "$channelDetails",
      },
    },
  ]);

  if (subscribedChannels.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "User is not subscribed to any channels"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
