import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [
    route("/", Home),

    // Auth
    route("/auth/signin", {
      get: () => { },
    }),
    route("/auth/signout", {
      post: () => { },
    }),

    // Chats
    route("/chat/:id", {
      get: () => { },
    }),
    route("/chat/:id/messages", {
      get: () => { },   // Get messages
      post: () => { },  // Send a message
      delete: () => { },// Delete a message
      put: () => { },   // Edit a message
    }),

    // Attachment
    route("/attachment/upload", {
      post: () => { },
    }),
    route("/attachment/:id", {
      get: () => { },
    }),

    // Profile
    route("/users/me", {
      get: () => { },
      patch: () => { },
    }),
    route("/users/:id", {
      get: () => { },
    }),
  ]),
]);
