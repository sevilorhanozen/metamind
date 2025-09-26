export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const quizQuestions: QuizQuestion[] = [
  // Dunya'nin Atmosferi
  {
    id: 1,
    question: "Atmosferde isi tutulmasina neden olan olaya ne ad verilir?",
    options: ["Sera etkisi", "Albedo", "Konveksiyon", "Ozonlama"],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "Dunya uzerinde basinc farklarinin ruzgari hizlandirma egilimindeki degisimine ne denir?",
    options: ["Koriolis", "Basinc gradyani kuvveti", "Termoklin", "Jet akimi"],
    correctAnswer: 1
  },
  // MRI
  {
    id: 3,
    question: "MRI cihazi temelde hangi paraciklardan yayilan sinyalleri olcer?",
    options: ["Elektron", "Notron", "Hidrojen protonu", "Alfa paracigi"],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "MRI'da kullanilan superiletken miknatis genellikle hangi ortamda tutulur?",
    options: ["Vakum firini", "Sivi helyumlu kriyostat", "Tuz banyosu", "Basincli hava kabini"],
    correctAnswer: 1
  },
  // Solunum
  {
    id: 5,
    question: "Solunumu otomatik olarak duzenleyen beyin bolgesi hangisidir?",
    options: ["Serebellum", "Medulla oblongata", "Hipotalamus", "Amigdala"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "Gaz degisiminin gerceklesen akciger yapilari hangileridir?",
    options: ["Bronslar", "Trakea", "Alveoller", "Plevra"],
    correctAnswer: 2
  },
  // Borsa
  {
    id: 7,
    question: "Bir sirketin halka yatirimcilara hisse satabilmesi icin yapmasi gereken islem nedir?",
    options: ["Temettu ilani", "Halka arz (IPO)", "Hisse geri alimi", "Borc yeniden yapilandirma"],
    correctAnswer: 1
  },
  {
    id: 8,
    question: "Yatirimcilarin bir sirketin degerlemesini kiyaslamak icin sik kullandigi metrik hangisidir?",
    options: ["Nakit donusum suresi", "Piyasa degeri/defter degeri", "Fiyat/Kazanc (F/K) orani", "Borc/Ozsermaye"],
    correctAnswer: 2
  },
  // Internet
  {
    id: 9,
    question: "Yonlendiriciler paketleri iletirken oncelikle hangi bilgiye bakar?",
    options: ["Kaynak MAC", "Hedef IP adresi", "Uygulama portu", "TTL degeri"],
    correctAnswer: 1
  },
  {
    id: 10,
    question: "Internet'in gelisiminde verilerin kucuk parcalara ayrilip tasinmasini saglayan temel teknoloji hangisidir?",
    options: ["Devre anahtarlama", "Paket anahtarlama", "Mors kodu", "Uydu ucgenleme"],
    correctAnswer: 1
  },
  // Tropikal Siklonlar
  {
    id: 11,
    question: "Tropikal siklonlarin olusumunda donmeyi baslatan ana etken nedir?",
    options: ["Albedo", "Koriolis etkisi", "Plaka tektonigi", "Sahil cizgisi"],
    correctAnswer: 1
  },
  {
    id: 12,
    question: "Gok gurultulu firtinalar, siklonun merkezinde hangi cepleri olusturarak gelisime katki saglar?",
    options: ["Yuksek basinc cebi", "Dusuk basinc cebi", "Kuru hava cebi", "Soguk hava golu"],
    correctAnswer: 1
  },
  // Asilar
  {
    id: 13,
    question: "Toplumun cogunlugunun asilanmasinin hastaligin yayilimini azaltacagi fikri hangi kavramdir?",
    options: ["Suru bagisikligi", "Antijen suruklenmesi", "Capraz reaksiyon", "Doz fazlaligi"],
    correctAnswer: 0
  },
  {
    id: 14,
    question: "Edward Jenner ve Louis Pasteur'un gelistirdigi yaklasim hangi asilama teknigine onculuk etmistir?",
    options: ["Canli zayiflatilmis asi", "DNA asisi", "Inaktif toksin", "mRNA asisi"],
    correctAnswer: 0
  },
  // Su Aritma
  {
    id: 15,
    question: "Suda asili taneciklerin yercekimiyle dibe cokmesine ne denir?",
    options: ["Filtrasyon", "Sedimentasyon (cokelme)", "Dezenfeksiyon", "Osmos"],
    correctAnswer: 1
  },
  {
    id: 16,
    question: "Kimyasal maddeler eklenerek kucuk taneciklerin birlestip topaklar olusturmasina ne ad verilir?",
    options: ["Koagulasyon/Flokulasyon", "Distilasyon", "Yumusatma", "Aerasyon"],
    correctAnswer: 0
  }
];