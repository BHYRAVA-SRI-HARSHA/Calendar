import React, { useState, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay
} from 'date-fns';
import Modal from 'react-modal';
import '../styles/calendar.css';

Modal.setAppElement('#root');

function checkConflicts(eventsForDay) {
  const timeCount = {};
  eventsForDay.forEach(event => {
    timeCount[event.time] = (timeCount[event.time] || 0) + 1;
  });
  const conflicts = new Set(
    Object.keys(timeCount).filter(time => timeCount[time] > 1)
  );
  return conflicts;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', duration: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('events')) || [];
    setEvents(storedEvents);
  }, []);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setNewEvent({ title: '', date: '', time: '', duration: '' });
  };

  const openNewEventModal = () => {
    setNewEvent({ title: '', date: '', time: '', duration: '' });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventUpdate = () => {
    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id ? { ...selectedEvent } : event
    );
    setEvents(updatedEvents);
    closeEventModal();
  };

  const handleNewEventCreation = () => {
    const newEventData = { ...newEvent, id: new Date().getTime() };
    setEvents([...events, newEventData]);
    closeEventModal();
  };

  const handleEventDelete = () => {
    if (!selectedEvent) return;
    const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
    setEvents(updatedEvents);
    closeEventModal();
  };

  const renderHeader = () => (
    <div className="calendar-header">
      <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>←</button>
      <h2>{format(currentDate, 'MMMM yyyy')}</h2>
      <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>→</button>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="calendar-days">
        {days.map((day) => (
          <div key={day} className="day-name">{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayString = format(day, 'yyyy-MM-dd');
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const dayEvents = events.filter(event => event.date === dayString);
        const conflicts = checkConflicts(dayEvents);

        days.push(
          <div
            className={`calendar-cell ${isCurrentMonth ? '' : 'disabled'} ${isToday ? 'today' : ''}`}
            key={dayString}
          >
            <div className="cell-date">{format(day, 'd')}</div>
            <div className="events">
              {dayEvents.map((event, idx) => {
                const isConflict = conflicts.has(event.time);
                return (
                  <div
                    key={`${dayString}-${idx}`}
                    className={`event${isConflict ? ' conflict' : ''}`}
                    onClick={() => openEventModal(event)}
                  >
                    {event.title}
                    <span className="event-time">{event.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className="calendar-row" key={format(addDays(day, -1), 'yyyy-MM-dd')}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="calendar">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeEventModal}
        contentLabel="Event Details"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>{selectedEvent ? 'Edit Event' : 'Create New Event'}</h2>
        <div>
          <input
            type="text"
            placeholder="Event Title"
            value={selectedEvent ? selectedEvent.title : newEvent.title}
            onChange={(e) =>
              selectedEvent
                ? setSelectedEvent({ ...selectedEvent, title: e.target.value })
                : setNewEvent({ ...newEvent, title: e.target.value })
            }
          />
        </div>
        <div>
          <input
            type="date"
            value={selectedEvent ? selectedEvent.date : newEvent.date}
            onChange={(e) =>
              selectedEvent
                ? setSelectedEvent({ ...selectedEvent, date: e.target.value })
                : setNewEvent({ ...newEvent, date: e.target.value })
            }
          />
        </div>
        <div>
          <input
            type="time"
            value={selectedEvent ? selectedEvent.time : newEvent.time}
            onChange={(e) =>
              selectedEvent
                ? setSelectedEvent({ ...selectedEvent, time: e.target.value })
                : setNewEvent({ ...newEvent, time: e.target.value })
            }
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Duration"
            value={selectedEvent ? selectedEvent.duration : newEvent.duration}
            onChange={(e) =>
              selectedEvent
                ? setSelectedEvent({ ...selectedEvent, duration: e.target.value })
                : setNewEvent({ ...newEvent, duration: e.target.value })
            }
          />
        </div>
        <div className="modal-buttons">
          {selectedEvent && (
            <button className="delete-event-btn" onClick={handleEventDelete}>Delete</button>
          )}
          <button onClick={selectedEvent ? handleEventUpdate : handleNewEventCreation}>
            {selectedEvent ? 'Update Event' : 'Create Event'}
          </button>
          <button onClick={closeEventModal}>Cancel</button>
        </div>
      </Modal>

      <button className="add-new-event-btn" onClick={openNewEventModal}>+ Add New Event</button>
    </div>
  );
};

export default Calendar;
