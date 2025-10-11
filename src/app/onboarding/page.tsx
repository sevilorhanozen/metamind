"use client";

import { useRouter } from "next/navigation";

const OnboardingPage = () => {
  const router = useRouter();

  const handleStartQuiz = () => {
    router.push("/camera"); // navigates to the quiz page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">📷</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            MetaMind Nasıl Çalışır?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            MetaMind, öğrenme farkındalığınızı artırır. Aşağıdaki adımları izleyip kendini hazır hissettiğinde başlayabilirsin.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700 space-y-4">
          <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <span>⚡</span> Adım Adım Süreç
          </h3>

          <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="text-2xl">📍</span>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Soruyu dikkatlice okuyunuz ve cevabınızı yazınız.
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="text-2xl">📷</span>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Cevaptan sonra kamerayı başlatarak güven pozunuzu veriniz.
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="text-2xl">😀</span>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Fotoğrafını çekerken yüz ifadeniz cevabınıza ne kadar güvendiğinizi göstersin.
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="text-2xl">⏱</span>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Kamera 3 saniye sonra otomatik olarak kapanır.
            </span>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-700 mt-6 space-y-2">
          <h3 className="font-bold text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
            <span>📋</span> Çalışma Bilgileri
          </h3>
          <p className="text-green-700 dark:text-green-300 font-medium">• Kısa cevaplı sorulara çalışın</p>
          <p className="text-green-700 dark:text-green-300 font-medium">• Her sorudan sonra güven kaydınızı fotoğraf çekerek belirtiniz</p>
        </div>

      
          {/* Footer */}
          <div className="text-center mt-10">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Önce kısa bir deneme yapalım. Güven skorunu nasıl göstereceğini öğren!
          </p>
          <button
            onClick={handleStartQuiz}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Demo Başlat 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
