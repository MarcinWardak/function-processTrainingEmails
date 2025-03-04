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
      
      // Wyodrębnienie daty i godziny wydarzenia
      var dateTimeMatch = body.match(/(\d{4}-\d{2}-\d{2}) od (\d{2}:\d{2}) do (\d{2}:\d{2})/);
      if (!dateTimeMatch) continue;
      
      var eventDate = dateTimeMatch[1]; // Data wydarzenia (YYYY-MM-DD)
      var startTime = dateTimeMatch[2]; // Czas rozpoczęcia (HH:MM)
      var endTime = dateTimeMatch[3];   // Czas zakończenia (HH:MM)
      
      // Konwersja daty i czasu na obiekty Date
      var startDateTime = new Date(eventDate + "T" + startTime + ":00");
      var endDateTime = new Date(eventDate + "T" + endTime + ":00");
      
      // Znalezienie linku do wydarzenia
      var linkMatch = body.match(/https:\/\/portal\.piib\.org\.pl\/a\/[a-zA-Z0-9]+/);
      var eventLink = linkMatch ? linkMatch[0] : "Brak linku";

      // Obliczenie różnicy dni między datą rozpoczęcia a zakończenia
      var timeDiff = endDateTime.getTime() - startDateTime.getTime();
      var dayDiff = timeDiff / (1000 * 3600 * 24);

      var calendar = CalendarApp.getCalendarsByName(calendarName)[0];
      if (!calendar) {
        calendar = CalendarApp.createCalendar(calendarName);
      }
      
      // Sprawdzenie, czy wydarzenie trwa więcej niż 1 dzień
      if (dayDiff >= 1) {
        // Utworzenie wydarzenia na pierwszy dzień
        var firstDayEnd = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 godziny po starcie
        calendar.createEvent(eventName + " (Dzień 1)", startDateTime, firstDayEnd, {
          description: "Link do wydarzenia: " + eventLink,
          reminders: [{method: "popup", minutes: 30}]
        });

        // Utworzenie wydarzenia na drugi dzień
        var secondDayStart = new Date(endDateTime.getTime() - 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000); // 2 godziny przed końcem ostatniego dnia
        calendar.createEvent(eventName + " (Dzień 2)", secondDayStart, endDateTime, {
          description: "Link do wydarzenia: " + eventLink,
          reminders: [{method: "popup", minutes: 30}]
        });
      } else {
        // Utworzenie pojedynczego wydarzenia
        calendar.createEvent(eventName, startDateTime, endDateTime, {
          description: "Link do wydarzenia: " + eventLink,
          reminders: [{method: "popup", minutes: 30}]
        });
      }

      // Oznaczenie wiadomości jako przeczytanej, dodanie kategorii i archiwizacja
      message.markRead(); // Oznacz jako przeczytaną
      threads[i].addLabel(GmailApp.getUserLabelByName("szkolenia")); // Dodaj kategorię szkolenia
      threads[i].moveToArchive(); // Archiwizuj wiadomość
    }
  }
}
