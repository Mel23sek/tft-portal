document.addEventListener('DOMContentLoaded', function() {
  const startForm = document.getElementById('startQuizForm');
  const gradeButtons = document.querySelectorAll('.teacherButton');
  const nextButtons = document.querySelectorAll('.nextButton');
  const submitButton56 = document.getElementById('submitQuiz5/6');
  const submitButton7plus = document.getElementById('submitQuiz7plus');
  
  // Event listener for the start form
  if (startForm) {
      startForm.addEventListener('submit', function(event) {
          event.preventDefault();
          const userName = document.getElementById('userName').value.trim();
          if (userName) {
              localStorage.setItem('userName', userName);
              window.location.href = 'teachers.html';
          } else {
              alert('Please enter your name to start the quiz.');
          }
      });
  }

  // Event listeners for grade selection buttons
  gradeButtons.forEach(button => {
      button.addEventListener('click', function() {
          const gradeLevel = this.dataset.grade;
          localStorage.setItem('gradeLevel', gradeLevel);
          const firstQuestion = gradeLevel === '5/6' ? 'question1a.html' : 'question1b.html';
          window.location.href = firstQuestion;
      });
  });

  // Event listeners for next buttons
  nextButtons.forEach(button => {
      button.addEventListener('click', function(event) {
          event.preventDefault();
          const currentQuestion = this.dataset.currentQuestion;
          const selectedAnswer = document.querySelector(`input[name='${currentQuestion}']:checked`).value;
          localStorage.setItem(currentQuestion, selectedAnswer);
          const nextPage = getNextPage(currentQuestion);
          window.location.href = nextPage;
      });
  });

  // Event listeners for submit buttons
  if (submitButton56) {
      submitButton56.addEventListener('click', function() {
          const longAnswer = document.getElementById('longAnswer5/6').value;
          submitQuiz('5/6', longAnswer);
      });
  }

  if (submitButton7plus) {
      submitButton7plus.addEventListener('click', function() {
          const longAnswer = document.getElementById('longAnswer7plus').value;
          submitQuiz('7plus', longAnswer);
      });
  }
});

function getNextPage(currentQuestion) {
  const gradeLevel = localStorage.getItem('gradeLevel');
  if (gradeLevel === '5/6') {
      if (currentQuestion === 'question1a') {
          return 'question2a.html';
      } else if (currentQuestion === 'question2a') {
          return 'question6a.html';
      }
  } else if (gradeLevel === '7plus') {
      if (currentQuestion === 'question1b') {
          return 'question2b.html';
      } else if (currentQuestion === 'question2b') {
          return 'question6b.html';
      }
  }
  return 'sub.html';
}

function submitQuiz(gradeLevel, longAnswer) {
  const userName = localStorage.getItem('userName');
  const answers = {
      gradeLevel,
      longAnswer,
      userName,
      answers: {}
  };

  // Collect all stored answers based on the grade level
  for (let i = 1; i <= 6; i++) {
      const questionId = `question${i}${gradeLevel === '5/6' ? 'a' : 'b'}`;
      const answer = localStorage.getItem(questionId);
      if (answer) {
          answers.answers[questionId] = answer;
      }
  }

  // Post the data to the serverless endpoint
  fetch('/api/submit_quiz', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(answers)
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      console.log(data);
      window.location.href = 'sub.html';
      localStorage.clear(); // Clear data after successful submission
  })
  .catch(error => {
      console.error('Submit Quiz Error:', error);
      alert('An error occurred while submitting the quiz. Please try again.');
  });
}
