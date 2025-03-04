function processTrainingEmails() {
  var calendarName = "Szkolenia Izba"; // Nazwa kalendarza
  var searchQuery = 'subject:"Zapis na szkolenie ONLINE - " is:unread'; // Wyszukiwanie nieprzeczytanych maili o szkoleniach
  
  // Pobranie wiadomości e-mail pasujących do zapytania
  var threads = GmailApp.search(searchQuery);
  
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var subject = message.getSubject();
      var body = message.getBody();
      
      // Wyodrębnienie nazwy wydarzenia z tematu wiadomości
      var eventNameMatch = subject.match(/Zapis na szkolenie ONLINE - (.+)/);
      if (!eventNameMatch) continue;
      var eventName = eventNameMatch[1].trim();
      
      var startDateTime, endDateTime;
      var startDate, endDate;
      
      // Sprawdzenie, czy jest to wydarzenie jednodniowe w formacie "wt. 2025-03-18 od 16:00 do 19:30"
      var singleDayMatch = body.match(/[^\s]+ (\d{4}-\d{2}-\d{2}) od (\d{2}:\d{2}) do (\d{2}:\d{2})/);
      if (singleDayMatch) {
        startDate = endDate = singleDayMatch[1];
        startDateTime = new Date(startDate + "T" + singleDayMatch[2] + ":00");
        endDateTime = new Date(endDate + "T" + singleDayMatch[3] + ":00");
      } else {
        // Sprawdzenie, czy jest to wydarzenie wielodniowe w formacie "sob. 2025-02-22 od 08:00" i "czw. 2025-02-27 do 23:50"
        var startDateMatch = body.match(/[^\s]+ (\d{4}-\d{2}-\d{2}) od (\d{2}:\d{2})/);
        var endDateMatch = body.match(/[^\s]+ (\d{4}-\d{2}-\d{2}) do (\d{2}:\d{2})/);
        
        if (!startDateMatch || !endDateMatch) continue;
        
        startDate = startDateMatch[1];
        endDate = endDateMatch[1];
        startDateTime = new Date(startDate + "T" + startDateMatch[2] + ":00");
        endDateTime = new Date(endDate + "T" + endDateMatch[2] + ":00");
      }
      
      // Znalezienie linku do wydarzenia
      var linkMatch = body.match(/https:\/\/portal\.piib\.org\.pl\/a\/[a-zA-Z0-9]+/);
      var eventLink = linkMatch ? linkMatch[0] : "Brak linku";
      
      var calendar = CalendarApp.getCalendarsByName(calendarName)[0];
      if (!calendar) {
        calendar = CalendarApp.createCalendar(calendarName);
      }
      
      // Sprawdzenie, czy data rozpoczęcia i zakończenia są różne
      if (startDate !== endDate) {
        // Utwórz wydarzenie na dzień początkowy (od czasu rozpoczęcia, trwające dokładnie 2 godziny)
        var firstDayEndTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 godziny po starcie
        calendar.createEvent(eventName + " (Dzień pierwszy)", startDateTime, firstDayEndTime, {
          description: "Link do wydarzenia: " + eventLink + "\nSzkolenie trwa od " + startDate + " do " + endDate,
          reminders: [{method: "popup", minutes: 30}]
        });
        
        // Utwórz wydarzenie na dzień końcowy (wydarzenie trwające 2 godziny, kończące się o godzinie zakończenia)
        var lastDayStartTime = new Date(endDateTime.getTime() - 2 * 60 * 60 * 1000); // 2 godziny przed końcem
        calendar.createEvent(eventName + " (Dzień ostatni)", lastDayStartTime, endDateTime, {
          description: "Link do wydarzenia: " + eventLink + "\nSzkolenie trwa od " + startDate + " do " + endDate,
          reminders: [{method: "popup", minutes: 30}]
        });
      } else {
        // Jeśli to wydarzenie jednodniowe, utwórz pojedyncze wydarzenie
        calendar.createEvent(eventName, startDateTime, endDateTime, {
          description: "Link do wydarzenia: " + eventLink,
          reminders: [{method: "popup", minutes: 30}]
        });
      }
      
      // Sprawdzenie i ewentualne utworzenie etykiety "szkolenia"
      var labelName = "szkolenia";
      var label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        label = GmailApp.createLabel(labelName);
      }
      
      // Oznaczenie wiadomości jako przeczytanej, dodanie kategorii i archiwizacja
      message.markRead(); // Oznacz jako przeczytaną
      threads[i].addLabel(label); // Dodaj kategorię szkolenia
      threads[i].moveToArchive(); // Archiwizuj wiadomość
    }
  }
}
