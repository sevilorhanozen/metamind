export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number[];
  topic: string;
}

export const quizQuestions: QuizQuestion[] = [
  // Dünya Coğrafyası
  {
    id: 1,
    question: "Dünyanın en kalabalık ülkesi hangisidir?",
    options: ["çin", "china", "cin"],
    correctAnswer: [0, 1, 2],
    topic: "Dünya Coğrafyası"
  },
  {
    id: 2,
    question: "Hangi ülke hem Avrupa hem de Asya kıtasında yer alır?",
    options: ["rusya", "türkiye", "russia", "turkey"],
    correctAnswer: [0, 1, 2, 3],
    topic: "Dünya Coğrafyası"
  },
  {
    id: 3,
    question: "Mona Lisa tablosu hangi müzede sergilenmektedir?",
    options: ["louvre", "louvre müzesi", "louvre museum"],
    correctAnswer: [0, 1, 2],
    topic: "Dünya Coğrafyası"
  },
 /* {
    id: 4,
    question: "Dünya üzerinde kaç kıta vardır? (Rakam veya yazı ile)",
    options: ["7", "yedi"],
    correctAnswer: [0, 1],
    topic: "Dünya Coğrafyası"
  },
  {
    id: 5,
    question: "Amazon yağmur ormanları hangi kıtada bulunur?",
    options: ["güney amerika", "amerika", "south america"],
    correctAnswer: [0, 1, 2],
    topic: "Dünya Coğrafyası"
  },

  // Tarih & Kültür
  {
    id: 6,
    question: "Ay'a ayak basan ilk insanın soyadı nedir?",
    options: ["armstrong", "neil armstrong"],
    correctAnswer: [0, 1],
    topic: "Tarih & Kültür"
  },
  {
    id: 7,
    question: "Osmanlı İmparatorluğu'nun başkenti hangi şehirdi?",
    options: ["istanbul", "konstantinopolis", "constantinople"],
    correctAnswer: [0, 1, 2],
    topic: "Tarih & Kültür"
  },
  {
    id: 8,
    question: "Hangi ünlü bilim insanı görelilik teorisini geliştirdi?",
    options: ["einstein", "albert einstein"],
    correctAnswer: [0, 1],
    topic: "Tarih & Kültür"
  },
  {
    id: 9,
    question: "Türkiye Cumhuriyeti hangi yıl kuruldu?",
    options: ["1923", "bin dokuz yüz yirmi üç"],
    correctAnswer: [0, 1],
    topic: "Tarih & Kültür"
  },
  {
    id: 10,
    question: "Hangi sanatçı 'Yıldızlı Gece' tablosunu yapmıştır?",
    options: ["van gogh", "vincent van gogh", "gogh"],
    correctAnswer: [0, 1, 2],
    topic: "Tarih & Kültür"
  },

  // Bilim & Doğa
  {
    id: 11,
    question: "İnsan vücudundaki en büyük organ hangisidir?",
    options: ["deri", "cilt", "skin"],
    correctAnswer: [0, 1, 2],
    topic: "Bilim & Doğa"
  },
  {
    id: 12,
    question: "Hangi gezegen 'Kızıl Gezegen' olarak bilinir?",
    options: ["mars", "merih"],
    correctAnswer: [0, 1],
    topic: "Bilim & Doğa"
  },
  {
    id: 13,
    question: "Ses hangi ortamda daha hızlı yayılır?",
    options: ["su", "sıvı", "water", "liquid"],
    correctAnswer: [0, 1, 2, 3],
    topic: "Bilim & Doğa"
  },
  {
    id: 14,
    question: "Filler hangi kıtada yaşar? (Afrika veya Asya)",
    options: ["afrika", "asya", "africa", "asia"],
    correctAnswer: [0, 1, 2, 3],
    topic: "Bilim & Doğa"
  },
  {
    id: 15,
    question: "Hangi vitamin güneş ışığından elde edilir?",
    options: ["d", "d vitamini", "vitamin d"],
    correctAnswer: [0, 1, 2],
    topic: "Bilim & Doğa"
  },
  {
    id: 16,
    question: "Bir yılda kaç mevsim vardır? (Rakam veya yazı ile)",
    options: ["4", "dört"],
    correctAnswer: [0, 1],
    topic: "Bilim & Doğa"
  }
    */
];
