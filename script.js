function romanFor(number) {
  const values = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let remainder = number;
  let roman = '';
  values.forEach(([value, symbol]) => {
    while (remainder >= value) {
      roman += symbol;
      remainder -= value;
    }
  });
  return roman;
}

function describeNumber(number) {
  const roman = romanFor(number);
  const descriptions = {
    1: ['I is the first Roman symbol. It means one.', 'I = 1'],
    2: ['Two is written with two I symbols. Repeating I adds ones.', 'I + I = 1 + 1'],
    3: ['Three is written with three I symbols. Each I adds one.', 'I + I + I = 1 + 1 + 1'],
    4: ['You have met V for five. Put I before V to take one away and make four.', 'IV = 5 − 1'],
    5: ['V is the Roman symbol for five.', 'V = 5'],
    6: ['V means five and I adds one more.', 'VI = 5 + 1'],
    7: ['V means five. The two I symbols add two more.', 'VII = 5 + 1 + 1'],
    8: ['V means five. The three I symbols add three more.', 'VIII = 5 + 1 + 1 + 1'],
    9: ['You have met X for ten. Put I before X to take one away and make nine.', 'IX = 10 − 1'],
    10: ['X is the Roman symbol for ten.', 'X = 10'],
    20: ['XX is twenty. Repeat X to add another ten.', 'X + X = 10 + 10'],
    30: ['XXX is thirty. Three X symbols make three tens.', 'X + X + X = 10 + 10 + 10'],
    40: ['L means fifty. Put X before L to take ten away and make forty.', 'XL = 50 − 10'],
    50: ['L is the Roman symbol for fifty.', 'L = 50'],
  };
  if (descriptions[number]) return { number, roman, explanation: descriptions[number][0], breakdown: descriptions[number][1] };
  const tens = Math.floor(number / 10) * 10;
  const ones = number % 10;
  const tensRoman = romanFor(tens);
  const onesRoman = romanFor(ones);
  if (ones === 0) {
    return { number, roman, explanation: `${tensRoman} is ${tens}. Add another X for each extra ten.`, breakdown: `${tensRoman} = ${tens}` };
  }
  return {
    number,
    roman,
    explanation: `${tensRoman} means ${tens} and ${onesRoman} means ${ones}; put the parts together from largest to smallest.`,
    breakdown: `${tensRoman} + ${onesRoman} = ${tens} + ${ones}`,
  };
}

const numerals = Array.from({ length: 50 }, (_, index) => describeNumber(index + 1));
const numberFor = (roman) => numerals.find((entry) => entry.roman === roman)?.number;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const screens = [...document.querySelectorAll('.screen')];
let selectedNumber = 1;
let activeRangeStart = 1;
let practiceIndex = 0;
let quizIndex = 0;
let quizScore = 0;
let quizNumbers = [];
let quickQuizMode = false;
let starCount = 0;
let builderValue = '';

function addStar() {
  starCount += 1;
  document.querySelector('#star-count').textContent = starCount;
  const badge = document.querySelector('.star-badge');
  badge.classList.remove('bump');
  requestAnimationFrame(() => badge.classList.add('bump'));
  badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once: true });
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('hidden', screen.id !== id));
  const heading = document.querySelector(`#${id} h1`);
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLesson() {
  const grid = document.querySelector('#number-grid');
  const range = Array.from({ length: 10 }, (_, index) => activeRangeStart + index);
  grid.innerHTML = range.map((number) => {
    const roman = numerals[number - 1].roman;
    return `<button class="number-tile ${number === selectedNumber ? 'active' : ''}" type="button" data-number="${number}" aria-pressed="${number === selectedNumber}" aria-label="Explore ${number}, written ${roman}"><span class="tile-number">${number}</span><span class="tile-roman">${roman}</span></button>`;
  }).join('');

  const entry = numerals[selectedNumber - 1];
  document.querySelector('#lesson-detail').innerHTML = `
    <div class="detail-numeral" aria-hidden="true">${entry.roman}</div>
    <div class="detail-copy"><strong>${entry.number} is written ${entry.roman}</strong><p>${entry.explanation}<span class="detail-breakdown">${entry.breakdown}.</span></p></div>`;

  document.querySelector('#range-title').textContent = `EXPLORE · ${activeRangeStart}—${activeRangeStart + 9}`;
  document.querySelectorAll('.range-tab').forEach((tab) => {
    const active = Number(tab.dataset.rangeStart) === activeRangeStart;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
}

function selectLessonNumber(number) {
  selectedNumber = number;
  renderLesson();
}

const practiceQuestions = [
  { direction: 'NUMBER → NUMERAL', prompt: 'What is the Roman numeral for 3?', answer: 'III', choices: ['III', 'IV', 'II', 'VI'], explain: numerals[2].explanation },
  { direction: 'NUMERAL → NUMBER', prompt: 'What number does VII represent?', answer: '7', choices: ['7', '6', '8', '5'], explain: numerals[6].explanation },
  { direction: 'NUMBER → NUMERAL', prompt: 'How do you write 9 in Roman numerals?', answer: 'IX', choices: ['IX', 'XI', 'IV', 'X'], explain: numerals[8].explanation },
  { direction: 'NUMERAL → NUMBER', prompt: 'What does IV mean?', answer: '4', choices: ['4', '6', '5', '9'], explain: numerals[3].explanation },
  { direction: 'NUMERAL → NUMBER', prompt: 'What number does XL represent?', answer: '40', choices: ['40', '50', '30', '49'], explain: numerals[39].explanation },
  { direction: 'NUMBER → NUMERAL', prompt: 'How do you write 50 in Roman numerals?', answer: 'L', choices: ['L', 'XL', 'X', 'XLIX'], explain: numerals[49].explanation },
];

function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function renderOptions(container, choices, answer, onAnswer) {
  container.innerHTML = shuffled(choices).map((choice, index) => `
    <button class="answer-option" type="button" data-answer="${escapeHtml(choice)}">
      <span class="option-key">${String.fromCharCode(65 + index)}</span><span class="option-value">${escapeHtml(choice)}</span>
    </button>`).join('');
  container.querySelectorAll('.answer-option').forEach((button) => {
    button.addEventListener('click', () => onAnswer(button, answer, container));
  });
}

function setFeedback(element, correct, title, explanation) {
  element.className = `feedback-box${correct ? '' : ' is-wrong'}`;
  element.innerHTML = `<span class="feedback-emblem" aria-hidden="true">${correct ? '★' : '↺'}</span><div class="feedback-copy"><strong>${title}</strong>${explanation}</div>`;
}

function answerMultipleChoice(button, answer, container, feedback, continueButton, explanation, onContinue) {
  const correct = button.dataset.answer === answer;
  if (correct) addStar();
  container.querySelectorAll('.answer-option').forEach((option) => {
    option.disabled = true;
    if (option.dataset.answer === answer) option.classList.add('correct');
  });
  if (!correct) button.classList.add('incorrect');
  setFeedback(feedback, correct, correct ? 'That’s right!' : `Not quite. The answer is ${answer}.`, explanation);
  continueButton.classList.remove('hidden');
  continueButton.onclick = onContinue;
}

function beginPractice() {
  practiceIndex = 0;
  renderPracticeQuestion();
  showScreen('practice');
}

function renderPracticeQuestion() {
  const question = practiceQuestions[practiceIndex];
  document.querySelector('#practice-progress').textContent = `QUESTION ${practiceIndex + 1} OF ${practiceQuestions.length}`;
  document.querySelector('#practice-progress-fill').style.width = `${((practiceIndex + 1) / practiceQuestions.length) * 100}%`;
  document.querySelector('#practice-direction').textContent = question.direction;
  document.querySelector('#practice-title').textContent = question.prompt;
  const feedback = document.querySelector('#practice-feedback');
  const continueButton = document.querySelector('#practice-continue');
  feedback.className = 'feedback-box hidden';
  continueButton.classList.add('hidden');
  renderOptions(document.querySelector('#practice-options'), question.choices, question.answer, (button, answer, container) => {
    const correctNumber = /[IVXL]/.test(question.answer) ? numberFor(question.answer) : Number(question.answer);
    const explanation = `${romanFor(correctNumber)} means ${correctNumber}. ${question.explain}`;
    answerMultipleChoice(button, answer, container, feedback, continueButton, explanation, () => {
      practiceIndex += 1;
      if (practiceIndex < practiceQuestions.length) renderPracticeQuestion();
      else { resetBuilder(); showScreen('builder'); }
    });
  });
}

function resetBuilder() {
  builderValue = '';
  renderBuilder();
  document.querySelector('#builder-feedback').className = 'feedback-box hidden';
  document.querySelector('#builder-check').classList.remove('hidden');
  document.querySelector('#builder-continue').classList.add('hidden');
}

function renderBuilder() {
  const answer = document.querySelector('#builder-answer');
  if (builderValue.length === 0) answer.innerHTML = '<span class="answer-placeholder">Tap a symbol below</span>';
  else answer.innerHTML = [...builderValue].map((symbol, index) => `<button type="button" class="built-symbol" data-remove-index="${index}" aria-label="Remove ${symbol}">${symbol}</button>`).join('');
  document.querySelector('#builder-length').textContent = `${builderValue.length} ${builderValue.length === 1 ? 'symbol' : 'symbols'}`;
  document.querySelector('#builder-undo').disabled = builderValue.length === 0;
  document.querySelectorAll('.built-symbol').forEach((button) => button.addEventListener('click', () => {
    builderValue = [...builderValue].filter((_, index) => index !== Number(button.dataset.removeIndex)).join('');
    clearBuilderFeedback();
    renderBuilder();
  }));
}

function clearBuilderFeedback() {
  document.querySelector('#builder-feedback').className = 'feedback-box hidden';
  document.querySelector('#builder-check').classList.remove('hidden');
  document.querySelector('#builder-continue').classList.add('hidden');
}

function checkBuilder() {
  const correct = builderValue === 'XL';
  const feedback = document.querySelector('#builder-feedback');
  if (correct) {
    addStar();
    setFeedback(feedback, true, 'You built it!', 'XL means take X (10) away from L (50), which makes 40. Nicely done!');
    document.querySelector('#builder-check').classList.add('hidden');
    document.querySelector('#builder-continue').classList.remove('hidden');
  } else {
    setFeedback(feedback, false, 'Not quite yet.', 'To make 40, put X (10) before L (50) to take it away: XL. Clear your answer and give it another try.');
  }
}

function createQuizSet() {
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
  quizNumbers = [
    ...shuffled(range(1, 10)).slice(0, 4),
    ...shuffled(range(11, 19)).slice(0, 2),
    ...shuffled(range(20, 29)).slice(0, 1),
    ...shuffled(range(30, 39)).slice(0, 1),
    ...shuffled(range(40, 49)).slice(0, 1),
    50,
  ];
  quizNumbers = shuffled(quizNumbers);
}

function quizQuestion(index) {
  const entry = numerals[quizNumbers[index] - 1];
  const numericToRoman = index % 2 === 0;
  const answer = numericToRoman ? entry.roman : String(entry.number);
  const nearbyNumbers = [entry.number - 1, entry.number + 1, entry.number - 10, entry.number + 10, entry.number - 5, entry.number + 5, 1, 5, 10, 20, 30, 40, 49, 50];
  const distractors = [...new Set(nearbyNumbers.filter((number) => number >= 1 && number <= 50 && number !== entry.number))].slice(0, 3);
  const values = [entry.number, ...distractors];
  const choices = numericToRoman ? values.map(romanFor) : values.map(String);
  return { entry, numericToRoman, answer, choices };
}

function beginQuiz(quickCheck = false) {
  quizIndex = 0;
  quizScore = 0;
  quickQuizMode = quickCheck;
  document.querySelector('#quiz-back-button').textContent = quickQuizMode ? '← Back to home' : '← Back to writing practice';
  createQuizSet();
  renderQuizQuestion();
  showScreen('quiz');
}

function renderQuizQuestion() {
  const { entry, numericToRoman, answer, choices } = quizQuestion(quizIndex);
  document.querySelector('#quiz-progress').textContent = `QUESTION ${quizIndex + 1} OF 10`;
  document.querySelector('#quiz-progress-fill').style.width = `${((quizIndex + 1) / 10) * 100}%`;
  document.querySelector('#quiz-direction').textContent = numericToRoman ? 'NUMBER → NUMERAL' : 'NUMERAL → NUMBER';
  document.querySelector('#quiz-title').textContent = numericToRoman
    ? `How do you write ${entry.number} in Roman numerals?`
    : `What number does ${entry.roman} represent?`;
  document.querySelector('#quiz-score-live').textContent = `Score: ${quizScore}`;
  const feedback = document.querySelector('#quiz-feedback');
  const continueButton = document.querySelector('#quiz-continue');
  feedback.className = 'feedback-box hidden';
  continueButton.classList.add('hidden');
  renderOptions(document.querySelector('#quiz-options'), choices, answer, (button, correctAnswer, container) => {
    const explanation = `${entry.roman} means ${entry.number}. ${entry.explanation} ${entry.breakdown}.`;
    const correct = button.dataset.answer === correctAnswer;
    if (correct) quizScore += 1;
    document.querySelector('#quiz-score-live').textContent = `Score: ${quizScore}`;
    answerMultipleChoice(button, correctAnswer, container, feedback, continueButton, explanation, () => {
      quizIndex += 1;
      if (quizIndex < 10) renderQuizQuestion();
      else showResults();
    });
  });
}

function showResults() {
  document.querySelector('#final-score').textContent = quizScore;
  document.querySelector('#correct-count').textContent = `${quizScore} ${quizScore === 1 ? 'correct answer' : 'correct answers'}`;
  const message = quizScore === 10
    ? 'Perfect score! You’ve mastered Roman numerals from 1 to 50.'
    : quizScore >= 7
      ? 'Wonderful work! You’re reading Roman numerals with confidence.'
      : 'Lovely effort! Every answer helped you learn. Review and try again.';
  document.querySelector('#result-message').textContent = message;
  showScreen('results');
}

document.querySelector('#start-learning').addEventListener('click', () => {
  selectedNumber = 1;
  activeRangeStart = 1;
  renderLesson();
  showScreen('lesson');
});
document.querySelector('#start-quiz').addEventListener('click', () => beginQuiz(true));
document.querySelector('#quiz-back-button').addEventListener('click', () => showScreen(quickQuizMode ? 'welcome' : 'builder'));
document.querySelectorAll('.range-tab').forEach((tab) => tab.addEventListener('click', () => {
  activeRangeStart = Number(tab.dataset.rangeStart);
  selectedNumber = activeRangeStart;
  renderLesson();
}));
document.querySelectorAll('.symbol-card').forEach((card) => card.addEventListener('click', () => {
  selectedNumber = Number(card.dataset.symbolNumber);
  activeRangeStart = Math.floor((selectedNumber - 1) / 10) * 10 + 1;
  renderLesson();
}));
document.querySelector('#number-grid').addEventListener('click', (event) => {
  const tile = event.target.closest('[data-number]');
  if (tile) selectLessonNumber(Number(tile.dataset.number));
});
document.querySelector('#start-practice').addEventListener('click', beginPractice);
document.querySelector('#builder-check').addEventListener('click', checkBuilder);
document.querySelector('#builder-continue').addEventListener('click', () => beginQuiz(false));
document.querySelector('#builder-undo').addEventListener('click', () => {
  builderValue = builderValue.slice(0, -1);
  clearBuilderFeedback();
  renderBuilder();
});
document.querySelector('#builder-clear').addEventListener('click', () => {
  builderValue = '';
  clearBuilderFeedback();
  renderBuilder();
});
document.querySelectorAll('.symbol-button').forEach((button) => button.addEventListener('click', () => {
  if (builderValue.length >= 10) return;
  builderValue += button.dataset.symbol;
  clearBuilderFeedback();
  renderBuilder();
}));
document.querySelector('#play-again').addEventListener('click', () => {
  selectedNumber = 1;
  activeRangeStart = 1;
  practiceIndex = 0;
  quizIndex = 0;
  quizScore = 0;
  starCount = 0;
  document.querySelector('#star-count').textContent = '0';
  resetBuilder();
  showScreen('welcome');
});
document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => {
  const destination = button.dataset.go;
  if (destination === 'practice' && practiceIndex >= practiceQuestions.length) beginPractice();
  else if (destination === 'builder') showScreen('builder');
  else if (destination === 'lesson') { renderLesson(); showScreen('lesson'); }
  else showScreen(destination);
}));

renderLesson();
renderBuilder();
