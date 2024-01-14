import React, { useCallback, useState } from "react";
import * as backend from "../api";
import useEventCollection from "../hooks/useEventCollection";
import { useEvent } from "../context/EventContext";
import { useSession } from "../context/SessionContext";
import { useToast } from "../context/ToastContext";
import EventSection from "../components/EventSection";
import Modal from "../components/Modal";
import EventForm from "../components/EventForm";
import ConfirmDialog from "../components/ConfirmDialog";
import heroImage from "../assets/images/event1.avif";

/**
 * The signed-in home page: the three lists the API exposes, side by side.
 *
 * Each list is one `useEventCollection` over one endpoint. Mutations do not
 * patch the lists in place — they call `refreshEvents`, because a booking
 * belongs in two lists at once and a delete belongs in none.
 */
const Home = () => {
  const { user } = useSession();
  const { refreshEvents } = useEvent();
  const { notifySuccess, notifyError } = useToast();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [joining, setJoining] = useState(null);
  const [busyEventId, setBusyEventId] = useState(null);

  const organized = useEventCollection(backend.listOrganizedEvents);
  const booked = useEventCollection(backend.listJoinedEvents);
  const joinable = useEventCollection(backend.listJoinableEvents);

  const handleCreate = useCallback(
    async (attributes) => {
      await backend.createEvent(attributes);
      setCreating(false);
      refreshEvents();
      notifySuccess("Event created.");
    },
    [refreshEvents, notifySuccess],
  );

  const handleUpdate = useCallback(
    async (attributes) => {
      await backend.updateEvent(editing.id, attributes);
      setEditing(null);
      refreshEvents();
      notifySuccess("Event updated.");
    },
    [editing, refreshEvents, notifySuccess],
  );

  const handleDelete = useCallback(async () => {
    try {
      await backend.deleteEvent(deleting.id);
      refreshEvents();
      notifySuccess(`"${deleting.name}" was deleted.`);
    } catch (error) {
      notifyError(error.message);
    } finally {
      setDeleting(null);
    }
  }, [deleting, refreshEvents, notifySuccess, notifyError]);

  const handleJoin = useCallback(async () => {
    setBusyEventId(joining.id);
    try {
      await backend.joinEvent(joining.id);
      refreshEvents();
      notifySuccess(`You have a place at "${joining.name}".`);
    } catch (error) {
      notifyError(error.message);
    } finally {
      setBusyEventId(null);
      setJoining(null);
    }
  }, [joining, refreshEvents, notifySuccess, notifyError]);

  const greeting = user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back.";

  return (
    <>
      <section className="hero">
        <img className="hero__image" src={heroImage} alt="" aria-hidden="true" />
        <div className="hero__scrim" aria-hidden="true" />
        <div className="shell hero__inner">
          <div>
            <p className="hero__eyebrow">{greeting}</p>
            <h1 className="hero__title">
              Everything you are running, and everything you can join
            </h1>
            <p className="hero__lede">
              Three lists, one page: the events you organize, the ones you have booked, and the
              upcoming events you are on neither side of.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              style={{ marginTop: 22 }}
              onClick={() => setCreating(true)}
            >
              Create an event
            </button>
          </div>

          <div className="hero__stats">
            <div>
              <div className="hero__stat-value">{organized.total}</div>
              <div className="hero__stat-label">Organizing</div>
            </div>
            <div>
              <div className="hero__stat-value">{booked.total}</div>
              <div className="hero__stat-label">Booked</div>
            </div>
            <div>
              <div className="hero__stat-value">{joinable.total}</div>
              <div className="hero__stat-label">Open to you</div>
            </div>
          </div>
        </div>
      </section>

      <EventSection
        id="organized"
        title="Events you organize"
        subtitle="Only you can edit or delete these."
        accent="mine"
        collection={organized}
        flag="Organizer"
        onEdit={setEditing}
        onDelete={setDeleting}
        emptyTitle="You have not created an event yet"
        emptyBody="Events you create appear here, and everyone else sees them in their upcoming list."
        emptyAction={
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setCreating(true)}
          >
            Create your first event
          </button>
        }
      />

      <EventSection
        id="booked"
        title="Events you have booked"
        subtitle="A place is held for you at each of these."
        accent="booked"
        collection={booked}
        flag="Booked"
        sunken
        emptyTitle="No bookings yet"
        emptyBody="Book a place from the upcoming list below and it will show up here."
      />

      <EventSection
        id="upcoming"
        title="Upcoming events open to you"
        subtitle="Future events you neither organize nor have booked."
        collection={joinable}
        onJoin={setJoining}
        busyEventId={busyEventId}
        emptyTitle="Nothing open at the moment"
        emptyBody="Every upcoming event is either yours or already booked. Check back later."
      />

      {creating ? (
        <Modal title="New event" onClose={() => setCreating(false)}>
          <EventForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            submitLabel="Create event"
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title="Edit event" onClose={() => setEditing(null)}>
          <EventForm
            event={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Save changes"
          />
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete this event?"
          body={`"${deleting.name}" and every booking against it will be removed. This cannot be undone.`}
          confirmLabel="Delete event"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}

      {joining ? (
        <ConfirmDialog
          title="Book a place?"
          body={`You will be added to the attendee list for "${joining.name}".`}
          confirmLabel="Book my place"
          onConfirm={handleJoin}
          onCancel={() => setJoining(null)}
        />
      ) : null}
    </>
  );
};

export default Home;
