import { prefix, render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import AuthPage from "@/app/pages/auth";

import { PsignUp } from "@/routes/auth"

export type AppContext = {};

const authRoutes = [
  route("/signin", {
    get: AuthPage,
    post: () => { },
  }),

  route("/signup", {  // Create new user
    get: AuthPage,
    post: PsignUp,
  }),

  route("/signout", {
    post: () => { },
  }),
]
const chatRoutes = [
  route("/:id", {
    get: () => { },
  }),
  route("/:id/messages", {
    get: () => { },   // Get messages
    post: () => { },  // Send a message
    delete: () => { },// Delete a message
    put: () => { },   // Edit a message
  })
]
const attachmentRoutes = [
  route('/upload', {
    post: () => { },
  }),
  route('/:id', {
    get: () => { },
  }),
]
const profileRoutes = [
  route('/me', {
    get: () => { },
    patch: () => { },
  }),
  route('/:id', {
    get: ({ request, params, ctx}) => {
      return new Response(null, { status: 200 })
    },
  }),
]

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => { ctx; /* setup ctx here */ },
  render(Document, [
    route("/", Home),
    route("/favicon.svg", () => { // Logo at demand?? Maybe to add a dot if there is any message to read...
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="51.2" ry="51.2" fill="#4F46E5"/>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="281.6" fill="#FFFFFF">X</text></svg>`

      return new Response(svg, { status: 200, headers: {
        "Content-Type": "image/svg+xml"
      } })
    }),

    /*
    >>> AUTH <<<
    */
    prefix("/auth", authRoutes),

    /*
    >>> CHATS <<<
    */
    prefix("/chat", chatRoutes),

    /*
    >>> ATTACHMENTS <<<
    */
    prefix("/attachment", attachmentRoutes),

    /*
    >>> PROFILE <<<
    */
    prefix("/users", profileRoutes)
  ]),
]);
