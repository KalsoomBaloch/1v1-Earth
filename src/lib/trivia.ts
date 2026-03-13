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

export async function fetchQuestions(): Promise<TriviaQuestion[]> {
  try {
    const res = await fetch('https://opentdb.com/api.php?amount=5&type=multiple&difficulty=easy');
    const data = await res.json();
    if (data.response_code === 0 && data.results?.length) {
      return data.results.map((q: any) => {
        const correct = decodeHTML(q.correct_answer);
        const incorrect = q.incorrect_answers.map(decodeHTML);
        return {
          question: decodeHTML(q.question),
          correct_answer: correct,
          incorrect_answers: incorrect,
          all_answers: shuffleArray([correct, ...incorrect]),
        };
      });
    }
  } catch {}
  return getMockQuestions();
}

function getMockQuestions(): TriviaQuestion[] {
  const qs = [
    { question: "What is the capital of France?", correct_answer: "Paris", incorrect_answers: ["London", "Berlin", "Madrid"] },
    { question: "Which planet is known as the Red Planet?", correct_answer: "Mars", incorrect_answers: ["Venus", "Jupiter", "Saturn"] },
    { question: "What is the largest ocean on Earth?", correct_answer: "Pacific Ocean", incorrect_answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
    { question: "Who painted the Mona Lisa?", correct_answer: "Leonardo da Vinci", incorrect_answers: ["Michelangelo", "Raphael", "Donatello"] },
    { question: "What year did World War II end?", correct_answer: "1945", incorrect_answers: ["1944", "1946", "1943"] },
  ];
  return qs.map(q => ({
    ...q,
    all_answers: shuffleArray([q.correct_answer, ...q.incorrect_answers]),
  }));
}
