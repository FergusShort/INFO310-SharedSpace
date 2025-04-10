const { createCalendar, createViewMonthGrid } = window.SXCalendar;
    
     
const calendar = createCalendar({
  views: [createViewMonthGrid()],
  events: [
    {
      id: '1',
      title: 'Event 1',
      start: '2024-08-23 09:00',
      end: '2024-08-23 10:00'
    },
  ],
})

calendar.render(document.getElementById("calendar"));