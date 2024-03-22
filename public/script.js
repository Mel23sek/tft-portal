// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Save the user's name upon form submission in index.html
    const startForm = document.getElementById('startQuizForm');
    if (startForm) {
      startForm.addEventListener('submit', event => {
        event.preventDefault();
        const userName = document.getElementById('userName').value;
        localStorage.setItem('userName', userName);
        window.location.href = 'teachers.html';
      });
    }
  
    // Handle grade selection in teachers.html
    const gradeButtons = document.querySelectorAll('.teacherButton');
    gradeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const grade = button.dataset.grade;
        localStorage.setItem('selectedGrade', grade);
        const firstQuestion = grade === '5/6' ? 'question1a.html' : 'question1b.html';
        window.location.href = firstQuestion;
      });
    });
  
    // Save answers to local storage and determine the next question
    const nextButtons = document.querySelectorAll('.nextButton');
    nextButtons.forEach(button => {
      button.addEventListener('click', () => {
        const questionId = button.dataset.currentQuestion;
        const selectedAnswer = document.querySelector(`input[name="${questionId}"]:checked`).value;
        localStorage.setItem(questionId, selectedAnswer);
        const nextQuestion = determineNextQuestion(questionId);
        if (nextQuestion) {
          window.location.href = nextQuestion;
        }
      });
    });
  
    // Submit the quiz and send data to the serverless API
    const submitButtons = document.querySelectorAll('#submitQuiz5/6, #submitQuiz7plus');
    submitButtons.forEach(button => {
      button.addEventListener('click', () => {
        const finalAnswerId = button.id === 'submitQuiz5/6' ? 'longAnswer5/6' : 'longAnswer7plus';
        const finalAnswer = document.getElementById(finalAnswerId).value;
        localStorage.setItem(finalAnswerId, finalAnswer);
        submitQuiz();
      });
    });
  
    function determineNextQuestion(currentQuestionId) {
      // Logic to determine the next question based on the current one and selected grade
      const grade = localStorage.getItem('selectedGrade');
      if (grade === '5/6' && currentQuestionId === 'question1a') {
        return 'question2a.html';
      } else if (grade === '5/6' && currentQuestionId === 'question2a') {
        return 'question6a.html';
      } else if (grade === '7plus' && currentQuestionId === 'question1b') {
        return 'question2b.html';
      } else if (grade === '7plus' && currentQuestionId === 'question2b') {
        return 'question6b.html';
      }
      return 'sub.html'; // Default redirection if the flow reaches an end
    }
  
    function submitQuiz() {
      const userName = localStorage.getItem('userName');
      const grade = localStorage.getItem('selectedGrade');
      const answers = collectAllAnswers();
  
      fetch('/api/submit_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, grade, answers })
      })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.json();
      })
      .then(data => {
        window.location.href = 'sub.html'; // Redirect to submission page
        // Consider clearing localStorage here if the data is no longer needed
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
    }
  
    function collectAllAnswers() {
      // Collect all answers for either 5/6 or 7plus based on selected grade
      const answers = {};
      const grade = localStorage.getItem('selectedGrade');
      const questions = grade === '5/6' ? ['1a', '2a', '6a'] : ['1b', '2b', '6b'];
      questions.forEach(questionId => {
        answers[questionId] = localStorage.getItem(questionId) || '';
      });
      // Include long answers
      const longAnswerId = grade === '5/6' ? 'longAnswer5/6' : 'longAnswer7plus';
      answers[longAnswerId] = localStorage.getItem(longAnswerId) || '';
      return answers;
    }
  });
  