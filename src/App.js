import React from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useSession } from "./context/SessionContext";
import { isDemoMode } from "./api";
import Home from "./layouts/Home";
import EventDetails from "./components/EventDetails";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import SignOut from "./components/SignOut";
import NotFound from "./components/NotFound";
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth";
import ToastViewport from "./components/ToastViewport";
import "./App.css";

const App = () => {
  const { isAuthenticated, user } = useSession();

  return (
    <>
      <header className="topbar">
        <div className="shell topbar__inner">
          <Link to="/" className="topbar__brand">
            <span className="topbar__mark" aria-hidden="true">
              E
            </span>
            Events
          </Link>

          <nav className="topbar__nav">
            {isDemoMode ? (
              <span className="demo-badge" title="Running against local fixtures, not the API">
                <span className="demo-badge__dot" aria-hidden="true" />
                Demo data
              </span>
            ) : null}

            {isAuthenticated ? (
              <>
                {user?.email ? <span className="topbar__user">{user.email}</span> : null}
                <SignOut />
              </>
            ) : (
              <>
                <NavLink to="/login" className="topbar__link">
                  Sign in
                </NavLink>
                <NavLink to="/signup" className="topbar__link topbar__link--primary">
                  Create account
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id"
            element={
              <RequireAuth>
                <EventDetails />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <ToastViewport />
      <Footer />
    </>
  );
};

export default App;
