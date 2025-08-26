function goToStep2() {
  const rollno = document.getElementById('rollno').value;
  const name = document.getElementById('name').value;

  if (!rollno || !name) {
    alert("Please fill all fields");
    return;
  }

  localStorage.setItem('rollno', rollno);
  localStorage.setItem('name', name);

  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
}

function goToFeedback() {
  const branch = document.getElementById('branch').value;
  const year = document.getElementById('year').value;
  const semester = document.getElementById('semester').value;

  if (!branch || !year || !semester) {
    alert("Please fill all fields");
    return;
  }

  localStorage.setItem('branch', branch);
  localStorage.setItem('year', year);
  localStorage.setItem('semester', semester);

  fetch('http://localhost:3000/api/student/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rollno: localStorage.getItem('rollno'),
      name: localStorage.getItem('name'),
      branch,
      year,
      semester
    })
  })
  .then(res => res.json())
  .then(data => console.log(data));

  // Fetch latest feedback form from backend
  fetch('http://localhost:3000/api/feedbackform/latest')
    .then(res => res.json())
    .then(data => {
      if (!data.subject || !data.outcomes || data.outcomes.length !== 5) {
        alert('Course Outcomes not configured by admin.');
        return;
      }
      document.getElementById('subjectTitle').innerText = `Course Outcomes Feedback for ${data.subject}`;
      const container = document.getElementById('outcomes');
      container.innerHTML = "";
      data.outcomes.forEach((text, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
          <p>${text}</p>
          <label><input type="radio" name="co${index+1}" value="Excellent" required> Excellent</label>
          <label><input type="radio" name="co${index+1}" value="Good"> Good</label>
          <label><input type="radio" name="co${index+1}" value="Bad"> Bad</label>
        `;
        container.appendChild(div);
      });
      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.remove('hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('feedbackForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const feedback = [];
    for (let i = 1; i <= 5; i++) {
      const val = document.querySelector(`input[name=co${i}]:checked`);
      if (!val) {
        alert('Please provide feedback for all outcomes.');
        return;
      }
      feedback.push(val.value);
    }
    fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollno: localStorage.getItem('rollno'),
        feedback
      })
    })
    .then(res => res.json())
    .then(data => console.log(data));
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('thankyou').classList.remove('hidden');
  });
});

function adminRegister(username, password) {
  fetch('http://localhost:3000/api/admin/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => alert(data.message));
}

function adminLogin(username, password) {
  fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message === 'Login successful') {
      alert('Admin logged in!');
      // Show feedback form creation
      document.querySelector('.container').classList.add('hidden');
      document.getElementById('feedbackFormCreation').classList.remove('hidden');
    } else {
      alert('Invalid credentials');
    }
  });
}

function saveCOs() {
  const subject = document.getElementById('subject').value.trim();
  const co1 = document.getElementById('co1').value.trim();
  const co2 = document.getElementById('co2').value.trim();
  const co3 = document.getElementById('co3').value.trim();
  const co4 = document.getElementById('co4').value.trim();
  const co5 = document.getElementById('co5').value.trim();
  const outcomes = [co1, co2, co3, co4, co5];
  if (!subject || outcomes.some(co => !co)) {
    alert('Please fill all fields');
    return;
  }
  fetch('http://localhost:3000/api/feedbackform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, outcomes })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}


