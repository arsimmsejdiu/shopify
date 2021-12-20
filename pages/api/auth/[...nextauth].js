import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import spotifyApi, { LOGIN_URL } from "../../../lib/spotify";

async function refreshAccessToken(token) {
  try {
    spotifyApi.setAccessToken(token.accessToken);
    spotifyApi.setRefreshToken(token.refreshToken);

    const { body: refreshedToken } = await spotifyApi.refreshAccessToken();
    console.log("Refreshed token is: ", refreshedToken);

    return {
      ...token, // keep the old token
      accessToken: refreshedToken.access_token,
      accessTokenExpiresAt: Date.now() + refreshedToken.expires_in * 1000, // = 1h as 3600 returns from spotifyApi.refreshAccessToken()
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken, // if refresh_token is not returned, keep the old one, if yes use it
    };
  } catch (error) {
    console.error(error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // initial sign in, where we can create a new token
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000, //we are handling the expiry times in milliseconds hence the *1000
        };
      }
      // Return the previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        console.log("token not expired yet");
        return token;
      }

      // Access token has expired, so we need to refresh it ...
      console.log("token expired, refreshing ... ");
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.accessToken = token.accessToken; // add the access token to the session
      session.user.refreshToken = token.refreshToken; // add the refresh token to the session
      session.user.username = token.username; // add the username to the session

      return session;
    },
  },
});
