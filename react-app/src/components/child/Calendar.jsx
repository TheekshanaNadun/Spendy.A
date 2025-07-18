import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    fetch('/api/calendar-daily-summary', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const evts = [];
        if (data && Array.isArray(data)) {
          data.forEach(day => {
            if (day.total_expense > 0) {
              evts.push({
                title: 'Expense',
                amount: day.total_expense,
                date: day.date,
                color: '#ef4444',
                display: 'block',
                type: 'expense',
              });
            }
            if (day.total_income > 0) {
              evts.push({
                title: 'Income',
                amount: day.total_income,
                date: day.date,
                color: '#22c55e',
                display: 'block',
                type: 'income',
              });
            }
          });
          if (data.length > 0) setStartDate(data[0].date);
        }
        setEvents(evts);
      });
  }, []);

  return (
    <div className='demo-app'>
      <div className='demo-app-main'>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'title',
            center: 'dayGridMonth',
            right: 'prev,next today'
          }}
          initialView='dayGridMonth'
          editable={false}
          selectable={false}
          selectMirror={false}
          dayMaxEvents={2}
          weekends={true}
          events={events}
          initialDate={startDate}
          eventContent={renderEventContent}
        />
      </div>
    </div>
  );
}

function renderEventContent(eventInfo) {
  // Format number with thousands separator
  const formatAmount = (n) => n.toLocaleString();
  const isExpense = eventInfo.event.extendedProps.type === 'expense';
  const isIncome = eventInfo.event.extendedProps.type === 'income';
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      fontSize: 13,
      fontWeight: 600,
      color: eventInfo.event.color,
      marginBottom: 2,
      gap: 4
    }}>
      <span style={{ minWidth: 54, fontWeight: 500 }}>{eventInfo.event.title}:</span>
      <span style={{
        fontFamily: 'monospace',
        fontWeight: 700,
        marginLeft: 6,
        color: isExpense ? '#ef4444' : isIncome ? '#22c55e' : '#222',
        letterSpacing: 1
      }}>
        {isExpense ? '-' : '+'}{formatAmount(eventInfo.event.extendedProps.amount)}
      </span>
    </div>
  );
}


