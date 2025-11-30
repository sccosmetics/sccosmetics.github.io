// SPA scaffold

document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.consult-form');
  const dateInput = document.getElementById('date');

  // Define unavailable dates (YYYY-MM-DD format)
  const unavailableDates = [
    '2025-12-25', // Christmas
    '2025-01-01', // New Year's Day
    // Add more dates as needed
  ];

  // Hide the original date input
  dateInput.style.display = 'none';

  // Create custom date picker
  function createCustomDatePicker() {
    const datePicker = document.createElement('div');
    datePicker.className = 'custom-date-picker';

    const dateDisplay = document.createElement('input');
    dateDisplay.type = 'text';
    dateDisplay.readOnly = true;
    dateDisplay.placeholder = 'Select a date';
    dateDisplay.className = 'date-display';

    const calendar = document.createElement('div');
    calendar.className = 'calendar';
    calendar.style.display = 'none';

    // Insert custom date picker after original input
    dateInput.parentNode.insertBefore(datePicker, dateInput.nextSibling);
    datePicker.appendChild(dateDisplay);
    datePicker.appendChild(calendar);

    // Generate calendar
    function generateCalendar(year, month) {
      calendar.innerHTML = '';

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      // Header
      const header = document.createElement('div');
      header.className = 'calendar-header';

      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = '‹';
      prevBtn.type = 'button';
      prevBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 0) {
          newMonth = 11;
          newYear = year - 1;
        }

        // Don't allow going too far back
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1);
        if (newYear < minDate.getFullYear() ||
          (newYear === minDate.getFullYear() && newMonth < minDate.getMonth())) {
          return;
        }

        generateCalendar(newYear, newMonth);
      };

      const monthYear = document.createElement('div');
      monthYear.textContent = `${monthNames[month]} ${year}`;

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = '›';
      nextBtn.type = 'button';
      nextBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) {
          newMonth = 0;
          newYear = year + 1;
        }

        // Don't allow going too far forward (60 days max)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60);
        const firstDayOfMonth = new Date(newYear, newMonth, 1);
        if (firstDayOfMonth > maxDate) {
          return;
        }

        generateCalendar(newYear, newMonth);
      };

      header.appendChild(prevBtn);
      header.appendChild(monthYear);
      header.appendChild(nextBtn);
      calendar.appendChild(header);

      // Days of week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysRow = document.createElement('div');
      daysRow.className = 'days-of-week';

      daysOfWeek.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;
        daysRow.appendChild(dayEl);
      });
      calendar.appendChild(daysRow);

      // Calendar days
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'days-grid';

      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        daysGrid.appendChild(emptyDay);
      }

      // Days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;

        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Check if date is available
        const isPast = currentDate < tomorrow;
        const isUnavailable = unavailableDates.includes(dateStr);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60);
        const isTooFar = currentDate > maxDate;

        if (isPast || isUnavailable || isTooFar) {
          dayEl.className = 'disabled';
        } else {
          dayEl.className = 'available';
          dayEl.onclick = () => selectDate(dateStr, currentDate);
        }

        daysGrid.appendChild(dayEl);
      }

      calendar.appendChild(daysGrid);
    }

    function selectDate(dateStr, date) {
      dateInput.value = dateStr;
      dateDisplay.value = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      calendar.style.display = 'none';
    }

    // Show/hide calendar
    dateDisplay.onclick = () => {
      calendar.style.display = calendar.style.display === 'none' ? 'block' : 'none';

      if (calendar.style.display === 'block') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        generateCalendar(tomorrow.getFullYear(), tomorrow.getMonth());
      }
    };

    // Hide calendar when clicking outside
    document.addEventListener('click', (e) => {
      if (!datePicker.contains(e.target)) {
        calendar.style.display = 'none';
      }
    });

    // Don't set initial value - let user select
    dateDisplay.placeholder = 'Select a date';
  }

  createCustomDatePicker();

  // Add validation when date changes
  dateInput.addEventListener('change', function () {
    const selectedDate = new Date(this.value);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      this.value = minDate;
      this.setCustomValidity('Please select a date that is tomorrow or in the future.');
      return;
    }

    // Check if selected date is in unavailable dates array
    if (isDateDisabled(selectedDate)) {
      this.value = minDate;
      this.setCustomValidity('This date is not available for consultations. Please select another date.');
      return;
    }

    this.setCustomValidity('');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate date before submission
    const selectedDate = new Date(dateInput.value);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (dateInput.value && selectedDate < tomorrow) {
      dateInput.setCustomValidity('Please select a date that is tomorrow or in the future.');
      dateInput.reportValidity();
      return;
    }

    // Check if selected date is in unavailable dates array
    if (dateInput.value && isDateDisabled(selectedDate)) {
      dateInput.setCustomValidity('This date is not available for consultations. Please select another date.');
      dateInput.reportValidity();
      return;
    }

    dateInput.setCustomValidity('');

    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      date: formData.get('date'),
      additional_info: formData.get('additional_info')
    };

    sendConsultationEmail(data);
  });

  // Handle keyboard navigation
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollToSection(currentSection + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToSection(currentSection - 1);
    }
  });
});

function sendConsultationEmail(data) {
  // Create email content
  const emailContent = `
    New Consultation Request:
    
    Name: ${data.name}
    Email: ${data.email}
    Preferred Date: ${data.date || 'Not specified'}
    Additional Information: ${data.additional_info || 'None'}
  `;

  // Create mailto link
  const subject = encodeURIComponent('New Consultation Request - Shannon Cosmetics');
  const body = encodeURIComponent(emailContent);
  const mailtoLink = `mailto:consult@sccosmetics.com?subject=${subject}&body=${body}`;

  // Open email client
  window.location.href = mailtoLink;

  // Show confirmation message
  setTimeout(() => {
    alert('Thank you for your consultation request. Your email client should open with the details pre-filled.');
  }, 500);
}