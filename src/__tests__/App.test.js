import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { SessionProvider } from "../context/SessionContext";
import { EventProvider } from "../context/EventContext";
import { ToastProvider } from "../context/ToastContext";
import { resetDemoData } from "../api";

/**
 * These run in demo mode, which is the default when REACT_APP_API_BASE_URL is
 * unset — the same mode a fresh clone starts in, so the tests exercise the path
 * a reviewer will see.
 */

const renderApp = (route = "/") =>
  render(
    <ToastProvider>
      <SessionProvider>
        <EventProvider>
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        </EventProvider>
      </SessionProvider>
    </ToastProvider>,
  );

/**
 * Click a control and let every promise the demo backend queued settle before
 * asserting. Without the explicit act, the fixture latency resolves after the
 * click returns and React reports an unwrapped update.
 */
const click = async (user, element) => {
  await act(async () => {
    await user.click(element);
  });
};

/** Each list is an accessible landmark, so tests address one by name. */
const ORGANIZED = /events you organize/i;
const BOOKED = /events you have booked/i;
const UPCOMING = /upcoming events open to you/i;

const section = (name) => screen.getByRole("region", { name });

const cardsIn = (name) => within(section(name)).queryAllByRole("article");

const signIn = async (user) => {
  await click(user, screen.getByRole("button", { name: /^sign in$/i }));
  await screen.findByRole("heading", { name: ORGANIZED });
};

beforeEach(() => {
  window.localStorage.clear();
  resetDemoData();
});

describe("routing and the auth gate", () => {
  it("sends an unauthenticated visitor to the sign-in page", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows a 404 page for an unknown route", async () => {
    renderApp("/nowhere");
    expect(await screen.findByText("404")).toBeInTheDocument();
  });

  it("marks demo mode in the header", async () => {
    renderApp("/login");
    expect(await screen.findByText(/demo data/i)).toBeInTheDocument();
  });

  it("prefills the demo credentials so the form can be submitted", async () => {
    renderApp("/login");
    expect(await screen.findByLabelText(/email/i)).toHaveValue("ada@example.com");
  });
});

describe("the signed-in home page", () => {
  it("renders the organized list with rows", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(ORGANIZED).length).toBeGreaterThan(0));
  });

  it("renders the booked list with rows", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(BOOKED).length).toBeGreaterThan(0));
  });

  it("renders the upcoming list with rows", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(UPCOMING).length).toBeGreaterThan(0));
  });

  it("offers Delete on the events the user organizes", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(ORGANIZED).length).toBeGreaterThan(0));
    expect(
      within(section(ORGANIZED)).getAllByRole("button", { name: /delete/i }).length,
    ).toBeGreaterThan(0);
  });

  it("offers neither Delete nor Book on an event already booked", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(BOOKED).length).toBeGreaterThan(0));
    expect(within(section(BOOKED)).queryByRole("button", { name: /delete/i })).toBeNull();
    expect(within(section(BOOKED)).queryByRole("button", { name: /book a place/i })).toBeNull();
  });

  it("paginates the upcoming list rather than rendering every row", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    const pager = await within(section(UPCOMING)).findByRole("navigation");
    expect(within(pager).getByText(/page 1 of \d+/i)).toBeInTheDocument();
  });

  it("disables Previous on the first page", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    const pager = await within(section(UPCOMING)).findByRole("navigation");
    expect(within(pager).getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("moves an event to the booked list when it is booked", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(UPCOMING).length).toBeGreaterThan(0));
    const firstCard = cardsIn(UPCOMING)[0];
    const title = within(firstCard).getByRole("link").textContent;

    await click(user, within(firstCard).getByRole("button", { name: /book a place/i }));
    await click(user, await screen.findByRole("button", { name: /book my place/i }));

    await waitFor(() => expect(within(section(BOOKED)).getByText(title)).toBeInTheDocument());
  });

  it("signs the user out and returns them to the sign-in page", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await click(user, screen.getByRole("button", { name: /sign out/i }));
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("event details", () => {
  it("opens an event from its card", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await signIn(user);

    await waitFor(() => expect(cardsIn(ORGANIZED).length).toBeGreaterThan(0));
    const link = within(cardsIn(ORGANIZED)[0]).getByRole("link");
    const title = link.textContent;

    await click(user, link);
    expect(await screen.findByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  });
});
