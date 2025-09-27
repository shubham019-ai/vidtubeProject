# **VidTube \- A Backend for a Video Sharing Platform**

VidTube is a robust and feature-rich backend service for a modern video sharing platform, inspired by YouTube. It handles everything from user authentication and video uploads to complex features like subscriptions, likes, comments, and playlists. The entire API is built with a focus on security, efficiency, and scalability.

## **✨ Key Features**

* **JWT Authentication:** Secure user registration and login with access and refresh tokens.  
* **Video Management:** Full CRUD (Create, Read, Update, Delete) operations for videos.  
* **Cloudinary Integration:** Seamless video and image file uploads to the cloud.  
* **Social Interactions:** Liking videos, comments, and tweets.  
* **Subscription System:** Users can subscribe to channels and view subscriber/subscribed lists.  
* **Playlist Management:** Users can create, update, and delete playlists, adding or removing videos.  
* **Advanced Aggregation Pipelines:** Efficient database queries for fetching complex data like user dashboards, comments with author details, and subscription lists.  
* **And much more:** Commenting, tweeting, user profiles, and channel dashboards.

## **🛠️ Tech Stack**

* **Runtime:** [Node.js](https://nodejs.org/)  
* **Framework:** [Express.js](https://expressjs.com/)  
* **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM  
* **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/)  
* **File Handling:** [Multer](https://github.com/expressjs/multer) for local storage and [Cloudinary](https://cloudinary.com/) for cloud uploads  
* **Password Hashing:** [bcrypt](https://www.npmjs.com/package/bcrypt)  
* **Environment Variables:** [dotenv](https://www.npmjs.com/package/dotenv)

## **⚙️ Setup and Installation**

Follow these steps to get the project running on your local machine.

### **Prerequisites**

* [Node.js](https://nodejs.org/) (v18.x or higher recommended)  
* [MongoDB](https://www.mongodb.com/try/download/community)  
* A [Cloudinary](https://cloudinary.com/) account for file uploads

### **Installation**

1. **Clone the repository:**  
   git clone \[https://github.com/shubham019-ai/vidtubeProject.git\](https://github.com/shubham019-ai/vidtubeProject.git)  
   cd vidtubeProject

2. **Install the dependencies:**  
   npm install

3. Set up Environment Variables:  
   Create a file named .env in the root of the project and add the following variables. Replace the placeholder values with your actual credentials.  
   PORT=8000  
   MONGODB\_URI=your\_mongodb\_connection\_string  
   CORS\_ORIGIN=\*

   \# Cloudinary Credentials  
   CLOUDINARY\_CLOUD\_NAME=your\_cloud\_name  
   CLOUDINARY\_API\_KEY=your\_api\_key  
   CLOUDINARY\_API\_SECRET=your\_api\_secret

   \# JWT Secrets  
   ACCESS\_TOKEN\_SECRET=your\_access\_token\_secret  
   ACCESS\_TOKEN\_EXPIRY=1d  
   REFRESH\_TOKEN\_SECRET=your\_refresh\_token\_secret  
   REFRESH\_TOKEN\_EXPIRY=10d

4. **Start the server:**  
   npm run dev

   The server will start on the port you defined in your .env file (e.g., http://localhost:8000).

## **🚀 API Endpoints**

Here is a summary of the available API routes. All protected routes require a valid JWT access token in the Authorization header (Bearer \<token\>).

### **Users & Authentication**

* POST /api/v1/users/register: Register a new user.  
* POST /api/v1/users/login: Log in a user.  
* POST /api/v1/users/logout: Log out a user (protected).  
* GET /api/v1/users/current-user: Get details of the logged-in user (protected).  
* GET /api/v1/users/channel/:username: Get a user's channel profile.

### **Videos**

* POST /api/v1/videos: Upload a new video (protected).  
* GET /api/v1/videos: Get all videos (with pagination, search, and sort).  
* GET /api/v1/videos/:videoId: Get details of a specific video.  
* PATCH /api/v1/videos/:videoId: Update a video's details (protected).  
* DELETE /api/v1/videos/:videoId: Delete a video (protected).  
* PATCH /api/v1/videos/toggle/publish/:videoId: Toggle a video's publish status (protected).

### **Subscriptions**

* POST /api/v1/subscriptions/c/:channelId: Toggle subscription to a channel (protected).  
* GET /api/v1/subscriptions/c/:channelId: Get all subscribers of a channel.  
* GET /api/v1/subscriptions/u/:subscriberId: Get all channels a user is subscribed to.

### **Likes**

* POST /api/v1/likes/toggle/v/:videoId: Toggle a like on a video (protected).  
* POST /api/v1/likes/toggle/c/:commentId: Toggle a like on a comment (protected).  
* GET /api/v1/likes/videos: Get all videos liked by the user (protected).

### **Playlists**

* POST /api/v1/playlists: Create a new playlist (protected).  
* GET /api/v1/playlists/user/:userId: Get all playlists of a specific user.  
* GET /api/v1/playlists/:playlistId: Get a single playlist with its videos.  
* PATCH /api/v1/playlists/:playlistId: Update a playlist's details (protected).  
* DELETE /api/v1/playlists/:playlistId: Delete a playlist (protected).  
* PATCH /api/v1/playlists/add/:videoId/:playlistId: Add a video to a playlist (protected).  
  \-- PATCH /api/v1/playlists/remove/:videoId/:playlistId: Remove a video from a playlist (protected).

## **🧑‍💻 Author**

* **Shubham Maurya**  
* GitHub: [@shubham019-ai](https://www.google.com/search?q=https://github.com/shubham019-ai)