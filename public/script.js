console.log(clearQuizDataFromLocalStorage());

// Valid question numbers are pre-defined to be used across the script
const validQuestionNumbers = ['1a', '1b', '2a', '2b', '6a', '6b', 'longAnswer5/6', 'longAnswer7plus'];

// Cleans up local storage based on valid question numbers
function cleanUpLocalStorage(validQuestionNumbers) {
    let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
    Object.keys(structuredAnswers).forEach(gradeLevel => {
        Object.keys(structuredAnswers[gradeLevel]).forEach(question => {
            if (!validQuestionNumbers.includes(question)) {
                delete structuredAnswers[gradeLevel][question];
            }
        });
    });
    localStorage.setItem('structuredAnswers', JSON.stringify(structuredAnswers));
}


// Starts the quiz and navigates to the next page
function startQuiz() {
    const userName = document.getElementById('userName').value.trim();
    if (userName) {
        localStorage.setItem('userName', userName);
        window.location.href = 'teachers.html';
    } else {
        alert('Please enter your name to start the quiz.');
    }
}

// Selects a teacher and navigates to the corresponding quiz page
function selectTeacher(gradeLevel) {
    localStorage.setItem('gradeLevel', gradeLevel);
    window.location.href = gradeLevel === '5/6' ? 'question1a.html' : 'question1b.html';
}

// Handles the action when the next button is clicked
function nextButtonHandler(currentQuestion) {
    const gradeLevel = localStorage.getItem('gradeLevel');
    let nextPage = getNextPage(currentQuestion, gradeLevel);
    if (nextPage) {
        window.location.href = nextPage;
    }
}

// Determines the next page based on the current question and grade level
function getNextPage(currentQuestion, gradeLevel) {
    const pageMap = {
        '5/6': { '1a': 'question2a.html', '2a': 'question6a.html', '6a': 'sub.html' },
        '7plus': { '1b': 'question2b.html', '2b': 'question6b.html', '6b': 'sub.html' }
    };
    return pageMap[gradeLevel]?.[currentQuestion] || '';
}

// Saves an answer to a question in local storage
function saveAnswer(questionNumber, answer) {
    let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
    const gradeLevel = localStorage.getItem('gradeLevel');
    if (!structuredAnswers[gradeLevel]) {
        structuredAnswers[gradeLevel] = {};
    }
    structuredAnswers[gradeLevel][questionNumber] = answer;
    localStorage.setItem('structuredAnswers', JSON.stringify(structuredAnswers));
}
function clearQuizDataFromLocalStorage() {
    localStorage.removeItem('userName');
    localStorage.removeItem('gradeLevel');
    localStorage.removeItem('structuredAnswers');
    localStorage.removeItem('validQuestionNumbers')
}

// Submits the quiz, including any long answers, to a serverless endpoint

function submitQuiz(gradeLevel, longAnswer) {
    let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
    if (longAnswer.trim() !== '') {
        structuredAnswers[gradeLevel] = structuredAnswers[gradeLevel] || {};
        structuredAnswers[gradeLevel]['longAnswer'] = longAnswer;
    }

    const submissionData = {
        userName: localStorage.getItem('userName'),
        gradeLevel,
        answers: structuredAnswers[gradeLevel]
    };

    fetch('/api/submit_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    })
    .then(response => response.json())
    .then(() => {
        window.location.href = 'sub.html';
        clearQuizDataFromLocalStorage(); // Clear data after successful submission
    })
    .catch(error => alert('There was a problem with your submission: ' + error.message));
}
// Event listeners for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    cleanUpLocalStorage(validQuestionNumbers);

    const startForm = document.getElementById('startQuizForm');
    const gradeButtons = document.querySelectorAll('.teacherButton');
    const nextButtons = document.querySelectorAll('.nextButton');
    const submitButton56 = document.getElementById('submitQuiz5/6');
    const submitButton7plus = document.getElementById('submitQuiz7plus');

    if (startForm) {
        startForm.addEventListener('submit', function(event) {
            event.preventDefault();
            startQuiz();
        });
    }

    gradeButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectTeacher(this.dataset.grade);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
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
