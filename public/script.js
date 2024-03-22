// Assuming the user's grade selection and answers to each question are stored in localStorage
document.addEventListener('DOMContentLoaded', () => {

    // Function to handle the grade selection
    const selectGrade = (grade) => {
      localStorage.setItem('selectedGrade', grade);
      window.location.href = grade === '5/6' ? 'question1a.html' : 'question1b.html';
    };
  
    // Event listeners for grade selection buttons
    const gradeButtons = document.querySelectorAll('.teacherButton');
    gradeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const grade = button.getAttribute('data-grade');
        selectGrade(grade);
      });
    });
  
    // Function to save answer and navigate to the next question
    const saveAnswerAndNavigate = (questionId, answerValue) => {
      localStorage.setItem(questionId, answerValue);
      const currentQuestionNumber = parseInt(questionId.match(/\d+/)[0], 10);
      const questionLetter = questionId.match(/[ab]$/)[0];
      const nextQuestionNumber = currentQuestionNumber + 1;
      const nextQuestionId = `question${nextQuestionNumber}${questionLetter}`;
      const nextQuestionFileName = `${nextQuestionId}.html`;
      window.location.href = nextQuestionFileName;
    };
  
    // Event listeners for answer selection and the next button
    document.querySelectorAll('.nextButton').forEach(button => {
      button.addEventListener('click', () => {
        const currentQuestionId = button.getAttribute('data-current-question');
        const selectedAnswer = document.querySelector(`input[name="${currentQuestionId}"]:checked`).value;
        saveAnswerAndNavigate(currentQuestionId, selectedAnswer);
      });
    });
  
    // Event listener for the final submit button
    const submitButton = document.getElementById('submitQuiz');
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        const grade = localStorage.getItem('selectedGrade');
        const answers = {};
        for (let i = 1; i <= 6; i++) {
          const questionIdA = `question${i}a`;
          const questionIdB = `question${i}b`;
          const answerA = localStorage.getItem(questionIdA);
          const answerB = localStorage.getItem(questionIdB);
          if (answerA) answers[questionIdA] = answerA;
          if (answerB) answers[questionIdB] = answerB;
        }
        const finalAnswerId = grade === '5/6' ? 'question6a' : 'question6b';
        const finalAnswer = document.getElementById(finalAnswerId).value;
        if (finalAnswer) answers[finalAnswerId] = finalAnswer;
        
        // Replace with your actual API endpoint
        fetch('/api/submit_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: localStorage.getItem('userName'), grade, answers })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok.');
          }
          return response.json();
        })
        .then(() => {
          window.location.href = 'sub.html'; // Redirect to the submission page
        })
        .catch((error) => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    }
  
    // Function to create bubbles (from your provided HTML templates)
    const createBubble = () => {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');
      bubble.style.width = bubble.style.height = `${Math.random() * 60 + 10}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.animationDuration = `${Math.random() * 3 + 5}s`;
      bubble.style.animationName = 'floatBubble, sideWays';
      document.body.appendChild(bubble);
      setTimeout(() => {
        bubble.remove();
      }, (Math.random() * 3 + 5) * 1000);
    };
  
    // Create a bubble every 300 milliseconds
    setInterval(createBubble, 300);
  });
  