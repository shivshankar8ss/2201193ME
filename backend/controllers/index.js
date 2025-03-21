const axios = require("axios");

const AUTH_URL = "http://20.244.56.144/test/auth";
const USERS_URL = "http://20.244.56.144/test/users";

const credentials = {
  companyName: "abcde",
  clientID: "56b45e8c-044a-444a-a37a-23b33d67296b",
  clientSecret: "pDfPAyyYkQnanpTA",
  ownerName: "shivshankar",
  ownerEmail: "shivshankar.2201193me@iiitbh.ac.in",
  rollNo: "2202291me",
};

async function getAccessToken() {
  try {
    const response = await axios.post(AUTH_URL, credentials);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.response?.data || error.message
    );
    throw new Error("Failed to authenticate");
  }
}

async function getTopUsers(req, res) {
  try {
    const accessToken = await getAccessToken();

    const usersResponse = await axios.get(USERS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const usersData = usersResponse.data.users || usersResponse.data;
    if (!usersData || typeof usersData !== "object") {
      return res.status(500).json({ message: "Invalid users API response" });
    }

    const users = Object.entries(usersData)
      .map(([id, name]) => ({ id: Number(id), name }))
      .filter((user) => !isNaN(user.id));

    if (users.length === 0) {
      return res.status(404).json({ message: "No valid users found" });
    }

    const userPostCounts = await Promise.all(
      users.map(async (user) => {
        const postsResponse = await axios.get(`${USERS_URL}/${user.id}/posts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const postCount = postsResponse.data.posts
          ? postsResponse.data.posts.length
          : 0;

        return { id: user.id, name: user.name, postCount };
      })
    );

    userPostCounts.sort((a, b) => b.postCount - a.postCount);
    const topUsers = userPostCounts.slice(0, 5);

    res.json(topUsers);
  } catch (error) {
    console.error(
      "Error fetching users or posts:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const POSTS_URL = "http://20.244.56.144/test/posts";

async function getLatestPosts(req, res) {
  try {
    const accessToken = await getAccessToken();

    const usersResponse = await axios.get(USERS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const usersData = usersResponse.data.users || usersResponse.data;
    const users = Object.entries(usersData).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let allPosts = [];

    for (const user of users) {
      try {
        const postsResponse = await axios.get(`${USERS_URL}/${user.id}/posts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        allPosts.push(...(postsResponse.data.posts || []));
      } catch (error) {
        console.error(
          `Error fetching posts for user ${user.id}:`,
          error.message
        );
      }
    }

    if (allPosts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    const latestPosts = allPosts.sort((a, b) => b.id - a.id).slice(0, 5);

    res.json(latestPosts);
  } catch (error) {
    console.error("Error fetching latest posts:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getPopularPosts(req, res) {
  try {
    const accessToken = await getAccessToken();

    const usersResponse = await axios.get(USERS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const usersData = usersResponse.data.users || usersResponse.data;
    if (!usersData || typeof usersData !== "object") {
      return res.status(500).json({ message: "Invalid users API response" });
    }

    const users = Object.entries(usersData).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let allPosts = [];

    for (const user of users) {
      try {
        const postsResponse = await axios.get(`${USERS_URL}/${user.id}/posts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const userPosts = postsResponse.data.posts || [];
        allPosts.push(...userPosts);
      } catch (error) {
        console.error(
          `Error fetching posts for user ${user.id}:`,
          error.response?.data || error.message
        );
      }
    }

    if (allPosts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    const postCommentsCount = await Promise.all(
      allPosts.map(async (post) => {
        try {
          const commentsResponse = await axios.get(
            `${POSTS_URL}/${post.id}/comments`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          return {
            ...post,
            commentCount: commentsResponse.data.comments?.length || 0,
          };
        } catch (error) {
          console.error(
            `Error fetching comments for post ${post.id}:`,
            error.response?.data || error.message
          );
          return { ...post, commentCount: 0 };
        }
      })
    );

    const maxComments = Math.max(
      ...postCommentsCount.map((post) => post.commentCount),
      0
    );
    const popularPosts = postCommentsCount.filter(
      (post) => post.commentCount === maxComments
    );

    res.json(popularPosts);
  } catch (error) {
    console.error(
      "Error fetching popular posts:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { getTopUsers, getLatestPosts, getPopularPosts };
