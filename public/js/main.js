// SPA scaffold

document.addEventListener('DOMContentLoaded', function () {
  initializeForm();
});

let submittedEmail = '';
let availableDates = [];
let selectedDates = [];
let pickerReady = false;

async function fetchAvailableDates() {
  try {
    const response = await fetch('/available-dates.json');
    if (!response.ok) throw new Error('File not found: ' + response.status);
    const data = await response.json();
    availableDates = data.map(d => d.trim());
  } catch (error) {
    console.error('Failed to load available dates:', error);
    availableDates = null;
  }
}

function createCustomDatePicker() {
  const dateInput = document.getElementById('date');
  if (!dateInput) return;

  dateInput.style.display = 'none';

  const datePicker = document.createElement('div');
  datePicker.className = 'custom-date-picker';

  const dateDisplay = document.createElement('input');
  dateDisplay.type = 'text';
  dateDisplay.readOnly = true;
  dateDisplay.placeholder = 'Select dates (click calendar days)';
  dateDisplay.className = 'date-display';

  const selectedDatesContainer = document.createElement('div');
  selectedDatesContainer.className = 'selected-dates';

  const calendar = document.createElement('div');
  calendar.className = 'calendar';
  calendar.style.display = 'none';

  dateInput.parentNode.insertBefore(datePicker, dateInput.nextSibling);
  datePicker.appendChild(dateDisplay);
  datePicker.appendChild(selectedDatesContainer);
  datePicker.appendChild(calendar);

  function updateSelectedDatesDisplay() {
    selectedDatesContainer.innerHTML = '';
    if (selectedDates.length === 0) {
      dateInput.value = '';
      dateDisplay.value = '';
      return;
    }

    const sortedDates = [...selectedDates].sort();
    const dateValue = JSON.stringify(sortedDates);
    dateInput.value = dateValue;
    dateDisplay.value = sortedDates.length === 1 
      ? formatDateDisplay(sortedDates[0])
      : `${sortedDates.length} dates selected`;

    sortedDates.forEach(dateStr => {
      const tag = document.createElement('span');
      tag.className = 'selected-date-tag';
      tag.innerHTML = `${formatDateDisplay(dateStr)} <span class="remove-date" data-date="${dateStr}">×</span>`;
      selectedDatesContainer.appendChild(tag);
    });

    selectedDatesContainer.querySelectorAll('.remove-date').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateToRemove = e.target.dataset.date;
        selectedDates = selectedDates.filter(d => d !== dateToRemove);
        updateSelectedDatesDisplay();
        generateCalendar(currentYear, currentMonth);
      });
    });
  }

  function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  let currentYear, currentMonth;

  function generateCalendar(year, month) {
    currentYear = year;
    currentMonth = month;
    calendar.innerHTML = '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

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

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysRow = document.createElement('div');
    daysRow.className = 'days-of-week';

    daysOfWeek.forEach(day => {
      const dayEl = document.createElement('div');
      dayEl.textContent = day;
      daysRow.appendChild(dayEl);
    });
    calendar.appendChild(daysRow);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      daysGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.textContent = day;

      const currentDate = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const isPast = currentDate < tomorrow;
      const isNotAvailable = availableDates === null || !availableDates.includes(dateStr);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 60);
      const isTooFar = currentDate > maxDate;
      const isSelected = selectedDates.includes(dateStr);

      if (isPast || isNotAvailable || isTooFar) {
        dayEl.className = 'disabled';
      } else if (isSelected) {
        dayEl.className = 'selected';
        dayEl.onclick = () => toggleDate(dateStr, currentDate);
      } else {
        dayEl.className = 'available';
        dayEl.onclick = () => toggleDate(dateStr, currentDate);
      }

      daysGrid.appendChild(dayEl);
    }

    calendar.appendChild(daysGrid);
  }

  function toggleDate(dateStr, date) {
    if (selectedDates.includes(dateStr)) {
      selectedDates = selectedDates.filter(d => d !== dateStr);
    } else {
      selectedDates.push(dateStr);
    }
    updateSelectedDatesDisplay();
    generateCalendar(currentYear, currentMonth);
  }

  dateDisplay.onclick = () => {
    calendar.style.display = calendar.style.display === 'none' ? 'block' : 'none';
    if (calendar.style.display === 'block') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      generateCalendar(tomorrow.getFullYear(), tomorrow.getMonth());
    }
  };

  document.addEventListener('click', (e) => {
    if (!datePicker.contains(e.target)) {
      calendar.style.display = 'none';
    }
  });

  pickerReady = true;
}

function initializeForm() {
  const form = document.querySelector('.consult-form');
  if (!form) return;

  const dateInput = document.getElementById('date');
  if (!dateInput) return;

  fetchAvailableDates().then(() => {
    createCustomDatePicker();
  });

  dateInput.addEventListener('change', function () {
    if (!pickerReady || !selectedDates.length) {
      this.setCustomValidity('Please select at least one date.');
      return;
    }
    this.setCustomValidity('');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!pickerReady || selectedDates.length === 0) {
      dateInput.setCustomValidity('Please select at least one date.');
      dateInput.reportValidity();
      return;
    }

    const sortedDates = [...selectedDates].sort();
    const dateValue = JSON.stringify(sortedDates);

    dateInput.setCustomValidity('');

    const name = form.querySelector('input[name="name"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const additional_info = form.querySelector('input[name="additional_info"]').value;

    const data = {
      name: name,
      email: email,
      date: dateValue,
      additional_info: additional_info
    };

    sendConsultationEmail(data);
  });
}

async function sendConsultationEmail(data) {
  const form = document.querySelector('.consult-form');
  const submitBtn = form.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/api/consultation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      submittedEmail = data.email;
      showVerificationForm();
    } else {
      alert('Error: ' + result.error);
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.textContent = 'Submit';
    }
  } catch (error) {
    alert('Failed to submit consultation. Please try again.');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.textContent = 'Submit';
  }
}

function showVerificationForm() {
  const consultSection = document.querySelector('#consult .section-content');

  consultSection.innerHTML = `
    <div class="verify-container">
      <h2>Check Your Email</h2>
      <p>We've sent a verification code to <strong>${submittedEmail}</strong></p>
      <p>Enter the 6-digit code below to verify your consultation request.</p>
      
      <form class="verify-form">
        <div class="field">
          <label for="verificationCode">Verification Code</label>
          <div class="verify-code-input">
            <input type="text" maxlength="1" class="code-input" data-index="0" />
            <input type="text" maxlength="1" class="code-input" data-index="1" />
            <input type="text" maxlength="1" class="code-input" data-index="2" />
            <input type="text" maxlength="1" class="code-input" data-index="3" />
            <input type="text" maxlength="1" class="code-input" data-index="4" />
            <input type="text" maxlength="1" class="code-input" data-index="5" />
          </div>
        </div>
        <button type="button" class="btn" onclick="verifyCode()">Verify</button>
      </form>
      <div class="verify-message" id="verifyMessage" style="display: none;"></div>
    </div>
  `;

  const inputs = document.querySelectorAll('.code-input');
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1) {
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '') {
        if (index > 0) {
          inputs[index - 1].focus();
        }
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').slice(0, 6);
      pasteData.split('').forEach((char, i) => {
        if (inputs[i]) {
          inputs[i].value = char;
          if (i < inputs.length - 1) {
            inputs[i + 1].focus();
          }
        }
      });
    });
  });

  inputs[0].focus();
}

async function verifyCode() {
  const inputs = document.querySelectorAll('.code-input');
  const code = Array.from(inputs).map(input => input.value).join('');
  const messageEl = document.getElementById('verifyMessage');
  const verifyBtn = document.querySelector('.verify-form .btn');
  
  console.log('Verifying code:', { email: submittedEmail, code: code, codeLength: code.length });

  if (code.length !== 6) {
    messageEl.textContent = 'Please enter the full 6-digit code.';
    messageEl.className = 'verify-message error';
    messageEl.style.display = 'block';
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying...';

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: submittedEmail, code: code })
    });

    const result = await response.json();
    console.log('Verify response:', result);

    if (result.success) {
      messageEl.textContent = result.message;
      messageEl.className = 'verify-message success';
      messageEl.style.display = 'block';
      verifyBtn.textContent = 'Verified!';
      verifyBtn.disabled = true;
    } else {
      messageEl.textContent = result.error || 'Invalid verification code.';
      messageEl.className = 'verify-message error';
      messageEl.style.display = 'block';
      inputs.forEach(input => {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 1000);
      });
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify';
    }
  } catch (error) {
    messageEl.textContent = 'Verification failed. Please try again.';
    messageEl.className = 'verify-message error';
    messageEl.style.display = 'block';
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify';
  }
}

function resetForm() {
  const resendBtn = document.querySelector('.verify-form button:last-child');
  resendBtn.disabled = true;
  resendBtn.textContent = 'Sending...';
  
  fetch('/api/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: submittedEmail })
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      resendBtn.textContent = 'Code Sent!';
      setTimeout(() => {
        resendBtn.textContent = 'Resend Code';
        resendBtn.disabled = false;
      }, 2000);
    } else {
      alert('Failed to resend code: ' + result.error);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  })
  .catch(err => {
    alert('Failed to resend code');
    resendBtn.disabled = false;
    resendBtn.textContent = 'Resend Code';
  });
}
