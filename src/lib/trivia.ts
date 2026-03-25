export interface TriviaQuestion {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  all_answers: string[];
}

function decodeHTML(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allQuestions = [
  { question: "What is the capital of Germany?", correct_answer: "Berlin", incorrect_answers: ["Munich", "Frankfurt", "Hamburg"] },
  { question: "Who painted the Mona Lisa?", correct_answer: "Leonardo da Vinci", incorrect_answers: ["Vincent van Gogh", "Pablo Picasso", "Michelangelo"] },
  { question: "What is the chemical symbol for sodium?", correct_answer: "Na", incorrect_answers: ["S", "So", "Sn"] },
  { question: "Who wrote To Kill a Mockingbird?", correct_answer: "Harper Lee", incorrect_answers: ["Mark Twain", "J.K. Rowling", "Jane Austen"] },
  { question: "What is the largest organ in the human body?", correct_answer: "Skin", incorrect_answers: ["Heart", "Liver", "Brain"] },
  { question: "Which planet is closest to the sun?", correct_answer: "Mercury", incorrect_answers: ["Venus", "Earth", "Mars"] },
  { question: "What is the square root of 144?", correct_answer: "12", incorrect_answers: ["10", "14", "16"] },
  { question: "Who discovered penicillin?", correct_answer: "Alexander Fleming", incorrect_answers: ["Marie Curie", "Isaac Newton", "Louis Pasteur"] },
  { question: "What is the currency of the United Kingdom?", correct_answer: "Pound sterling", incorrect_answers: ["Euro", "Dollar", "Yen"] },
  { question: "What is the tallest building in the world?", correct_answer: "Burj Khalifa", incorrect_answers: ["Shanghai Tower", "Empire State Building", "Petronas Towers"] },
  { question: "Which element has the atomic number 1?", correct_answer: "Hydrogen", incorrect_answers: ["Oxygen", "Helium", "Carbon"] },
  { question: "Who directed Avatar (2009)?", correct_answer: "James Cameron", incorrect_answers: ["Steven Spielberg", "Christopher Nolan", "Ridley Scott"] },
  { question: "What is the longest river in Africa?", correct_answer: "Nile", incorrect_answers: ["Congo", "Niger", "Zambezi"] },
  { question: "Which country is known as the Land of the Rising Sun?", correct_answer: "Japan", incorrect_answers: ["China", "Thailand", "South Korea"] },
  { question: "What is the freezing point of water in Fahrenheit?", correct_answer: "32", incorrect_answers: ["0", "100", "50"] },
  { question: "Who wrote Pride and Prejudice?", correct_answer: "Jane Austen", incorrect_answers: ["Charlotte Brontë", "Emily Brontë", "Virginia Woolf"] },
  { question: "What gas do humans need to breathe?", correct_answer: "Oxygen", incorrect_answers: ["Carbon Dioxide", "Nitrogen", "Hydrogen"] },
  { question: "What is the capital of Italy?", correct_answer: "Rome", incorrect_answers: ["Milan", "Naples", "Venice"] },
  { question: "Who was the first President of the United States?", correct_answer: "George Washington", incorrect_answers: ["Abraham Lincoln", "Thomas Jefferson", "John Adams"] },
  { question: "What is the hardest natural substance on Earth?", correct_answer: "Diamond", incorrect_answers: ["Gold", "Iron", "Quartz"] },
];

export async function fetchQuestions(): Promise<TriviaQuestion[]> {
  const picked = shuffleArray(allQuestions).slice(0, 5);
  return picked.map(q => ({
    ...q,
    all_answers: shuffleArray([q.correct_answer, ...q.incorrect_answers]),
  }));
}
