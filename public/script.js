function cleanUpLocalStorage(validQuestionNumbers) {
  let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
  let gradeLevels = Object.keys(structuredAnswers);
  
  gradeLevels.forEach(gradeLevel => {
      Object.keys(structuredAnswers[gradeLevel]).forEach(question => {
          if (!validQuestionNumbers.includes(question)) {
              // If the key is not a valid question number, delete it
              delete structuredAnswers[gradeLevel][question];
          }
      });
  });
  
  // Update local storage
  localStorage.setItem('structuredAnswers', JSON.stringify(structuredAnswers));
}

// Add the list of valid question numbers
const validQuestionNumbers = ['1a', '1b', '2a', '2b', '6a', '6b', 'longAnswer5/6', 'longAnswer7plus'];

document.addEventListener('DOMContentLoaded', function() {
  const startForm = document.getElementById('startQuizForm');
  const gradeButtons = document.querySelectorAll('.teacherButton');
  const nextButtons = document.querySelectorAll('.nextButton');
  const submitButton56 = document.getElementById('submitQuiz5/6');
  const submitButton7plus = document.getElementById('submitQuiz7plus');
  
  cleanUpLocalStorage(validQuestionNumbers);
  
  if (startForm) {
    startForm.addEventListener('submit', function(event) {
        event.preventDefault();
        startQuiz();
    });
}

gradeButtons.forEach(button => {
    button.addEventListener('click', function() {
        const gradeLevel = this.dataset.grade;
        selectTeacher(gradeLevel);
    });
});

nextButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent any form submission
        const currentQuestion = this.getAttribute('data-current-question');
        nextButtonHandler(currentQuestion);
    });
});
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

function startQuiz() {
  const userName = document.getElementById('userName').value.trim();
  if (userName) {
      localStorage.setItem('userName', userName);
      window.location.href = 'teachers.html';
  } else {
      alert('Please enter your name to start the quiz.');
  }
}

function selectTeacher(gradeLevel) {
  localStorage.setItem('gradeLevel', gradeLevel);
  if (gradeLevel === '5/6') {
      window.location.href = 'question1a.html';
  } else if (gradeLevel === '7plus') {
      window.location.href = 'question1b.html';
  }
}

function selectRadio(questionNumber, answer) {
  saveAnswer(questionNumber, answer);
  // Update localStorage with the new answers right after saving
  updateLocalStorage();
}
      
function nextButtonHandler(currentQuestion) {
  const gradeLevel = localStorage.getItem('gradeLevel');
  // No need to save the answer here; it's already done by selectRadio
  nextQuestion(currentQuestion, gradeLevel);
}
function nextQuestion(currentQuestion, gradeLevel) {
  let nextPage = '';
  if (gradeLevel === '5/6') {
      switch (currentQuestion) {
          case '1a': nextPage = 'question2a.html'; break;
          case '2a': nextPage = 'question6a.html'; break;
          case '6a': nextPage = 'sub.html'; break;

      }
  } else if (gradeLevel === '7plus') {
      switch (currentQuestion) {
          case '1b': nextPage = 'question2b.html'; break;
          case '2b': nextPage = 'question6b.html'; break;
          case '6b': nextPage = 'sub.html'; break;

      }
  }

  if (nextPage) {
      window.location.href = nextPage;
  }
}

function saveAnswer(questionNumber, answer) {
  let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
  let gradeLevel = localStorage.getItem('gradeLevel');

  if (!structuredAnswers[gradeLevel]) {
      structuredAnswers[gradeLevel] = {};
  }

  structuredAnswers[gradeLevel][questionNumber] = answer;

  // Save the updated structuredAnswers in the global scope to be used by updateLocalStorage
  window.structuredAnswers = structuredAnswers;
}

function updateLocalStorage() {
  // Check if structuredAnswers has been set by saveAnswer
  if (window.structuredAnswers) {
      localStorage.setItem('structuredAnswers', JSON.stringify(window.structuredAnswers));
      // Clear the global structuredAnswers to prevent stale data
      delete window.structuredAnswers;
  }
}// Generate PDF Base64
function generatePDFBase64(answers) {
  const { jsPDF } = window.jspdf; // Make sure jsPDF is in the global scope
  const doc = new jsPDF();
  doc.text(`Quiz Results for ${localStorage.getItem('userName')}`, 10, 10);
  answers.forEach((answer, index) => {
    doc.text(`${index + 1}. ${answer.questionNumber}: ${answer.answer}`, 10, 20 + (index * 10));
  });
  return doc.output('datauristring');
}

// Submit Quiz Function
function submitQuiz(gradeLevel, longAnswer) {
  // Retrieve user's name and the structured answers from localStorage
  const userName = localStorage.getItem('userName');
  let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};

  // If there is a long answer, add it to the structured answers
  if (longAnswer.trim() !== '') {
    structuredAnswers[gradeLevel] = structuredAnswers[gradeLevel] || {};
    structuredAnswers[gradeLevel]['longAnswer'] = longAnswer;
  }

  // Create the submission data structure
  const submissionData = {
    userName,
    gradeLevel,
    answers: Object.entries(structuredAnswers[gradeLevel] || {}).map(([questionNumber, answer]) => ({
      questionNumber,
      answer
    }))
  };

  // Generate the base64 PDF
  const pdfBase64 = generatePDFBase64(submissionData.answers);

  // Send the submission data and PDF to the serverless endpoint
  fetch('/api/submit_quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...submissionData, pdfBase64 })
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
  })
  .then(data => {
    window.location.href = 'sub.html'; // Redirect to submission confirmation page
  })
  .catch(error => {
    alert('There was a problem with your submission: ' + error.message);
  });
}