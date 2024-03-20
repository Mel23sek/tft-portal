function getSubmitQuizUrl() {
    const devUrl = 'https://cuddly-xylophone-v6prg7qqvjv73pwj-5500.app.github.dev/submit-quiz';
    const prodUrl = 'https://tftportal.com/submit-quiz';
    return window.location.hostname.includes('localhost') ? devUrl : prodUrl;
}


function cleanUpLocalStorage(validQuestionNumbers) {
    let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};
    let gradeLevels = Object.keys(structuredAnswers);

    gradeLevels.forEach(gradeLevel => {
        Object.keys(structuredAnswers[gradeLevel]).forEach(question => {
            if (!validQuestionNumbers.includes(question)) {
                delete structuredAnswers[gradeLevel][question];
            }
        });
    });

    localStorage.setItem('structuredAnswers', JSON.stringify(structuredAnswers));
}

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

function nextButtonHandler(currentQuestion) {
    const gradeLevel = localStorage.getItem('gradeLevel');
    nextQuestion(currentQuestion, gradeLevel);
}

function nextQuestion(currentQuestion, gradeLevel) {
    let nextPage = '';
    if (gradeLevel === '5/6') {
        switch (currentQuestion) {
            case '1a': nextPage = 'question2a.html'; break;
            case '2a': nextPage = 'question6a.html'; break;
            case '6a': nextPage = 'sub.html'; break;
            // Add other cases as necessary
        }
    } else if (gradeLevel === '7plus') {
        switch (currentQuestion) {
            case '1b': nextPage = 'question2b.html'; break;
            case '2b': nextPage = 'question6b.html'; break;
            case '6b': nextPage = 'sub.html'; break;
            // Add other cases as necessary
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
}
function submitQuiz(gradeLevel, longAnswer) {
    const url = getSubmitQuizUrl(); // This function needs to define the URL
    const userName = localStorage.getItem('userName');
    if (!userName) {
        alert('User name is not set. Please make sure you have entered your name.');
        return;
    }

    let structuredAnswers = JSON.parse(localStorage.getItem('structuredAnswers')) || {};

    if (longAnswer.trim() !== '') {
        if (!structuredAnswers[gradeLevel]) {
            structuredAnswers[gradeLevel] = {};
        }
        const longAnswerKey = gradeLevel === '5/6' ? 'longAnswer5/6' : 'longAnswer7plus';
        structuredAnswers[gradeLevel][longAnswerKey] = longAnswer;
    }

    const answersForGrade = structuredAnswers[gradeLevel] || {};
    const answersArray = Object.keys(answersForGrade).map(questionNumber => {
        let formattedQuestionNumber = questionNumber.replace('longAnswer', '');
        return {
            questionNumber: formattedQuestionNumber,
            answer: answersForGrade[questionNumber]
        };
    });
    fetch(url, { // Use the url variable here
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, gradeLevel, answers: answersArray }),
    })
    .then(response => {
        // ... existing logic
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('There was a problem with your submission: ' + error.message);
    });


    fetch(getSubmitQuizUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, gradeLevel, answers: answersArray }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        window.location.href = 'sub.html';
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('There was a problem with your submission: ' + error.message);
    });
}