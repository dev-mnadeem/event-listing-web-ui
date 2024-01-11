import config from "../config";
import * as liveBackend from "./liveBackend";
import * as demoBackend from "./demoBackend";

/**
 * The one place the choice between the real API and the demo fixtures is made.
 *
 * Both modules export the same set of functions with the same signatures and
 * the same errors, so every component above this line is written against one
 * interface and never learns which it got.
 */
const backend = config.demoMode ? demoBackend : liveBackend;

export const {
  signUp,
  signIn,
  signOut,
  listOrganizedEvents,
  listJoinedEvents,
  listJoinableEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  health,
} = backend;

export const isDemoMode = config.demoMode;

/** Only demo mode can re-adopt a token locally. Against the API the server decides. */
export const adoptStoredToken = (token) =>
  config.demoMode ? demoBackend.adoptToken(token) : null;

/** Credentials to show on the sign-in form in demo mode, and nothing in live mode. */
export const demoCredentials = config.demoMode ? demoBackend.demoCredentials : null;

export const resetDemoData = config.demoMode ? demoBackend.resetDemoData : () => {};
