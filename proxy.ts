import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhook(.*)",
]);

// Auth route — redirect signed-in users away. SSO callback NOT included
// supaya Clerk bisa selesaikan OAuth flow tanpa terjebak redirect loop.
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect signed-in users away from auth pages
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Public routes pass through without auth check
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);

    // Open-redirect hardening: hanya forward path + search yang same-origin.
    // Pakai pathname mentah dari req.nextUrl (tidak boleh terima full URL dari
    // user). Tambah whitelist: harus diawali "/" dan TIDAK "//" (protocol-relative
    // URL bisa redirect ke domain lain).
    const path = req.nextUrl.pathname;
    const search = req.nextUrl.search;
    const isSafePath =
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.startsWith("/\\");
    if (isSafePath) {
      signInUrl.searchParams.set("redirect_url", path + search);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
