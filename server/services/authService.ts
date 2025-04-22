import axios from 'axios';

export const getGitHubAuthUrl = () => {
  const clientId = process.env.GITHUB_CLIENT_ID; // Get from .env
  const redirectUri = 'http://localhost:3000/auth/callback'; // Adjust accordingly
  const scope = 'repo'; // This allows full repo access (modify as needed)

  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
};

// Fetch the access token from GitHub using the code from the callback
export const getGitHubAccessToken = async (code: string) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    },
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  return response.data.access_token; // GitHub returns the token here
};
