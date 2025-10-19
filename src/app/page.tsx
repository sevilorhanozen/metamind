"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const router = useRouter();

  const register = async () => {
    if (!fullName.trim()) {
      alert("Lütfen ad soyad giriniz.");
      return;
    }
    if (!kvkkConsent) {
      alert("Lütfen KVKK onayını veriniz.");
      return;
    }

    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        alert("Supabase yapılandırması eksik. Lütfen .env dosyasını kontrol edin.");
        console.error("Supabase environment variables missing:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗"
        });
        return;
      }

      // Prepare user data - only include email if it's not empty
      const userData: any = { full_name: fullName.trim() };
      if (email && email.trim()) {
        userData.email = email.trim();
      }

      console.log("Attempting to insert user:", userData);

      const { data, error } = await supabase
        .from("app_users")
        .insert([userData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        alert(`Kayıt oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
        return;
      }

      console.log("User created successfully:", data);
      const created = data?.[0] || null;
      if (created?.id) {
        (window as any).__APP_USER_ID__ = created.id;
      }
      router.push("/onboarding");
    } catch (err) {
      console.error("Registration error:", err);
      alert("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">MetaMind'a Hoşgeldiniz </h1>
          <p className="text-gray-600 dark:text-gray-400">Öğrenme sürecinize olan güven seviyenizi keşfedin</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Kayıt Ol</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ad Soyad *
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınızı ve soyadınızı girin"
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-posta
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="kvkk"
                  checked={kvkkConsent}
                  onChange={(e) => setKvkkConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="kvkk" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Kişisel verilerimin işlenmesi ve analitik amaçlarla kullanılması için{" "}
                  <a href="#" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                    KVKK Aydınlatma Metni
                  </a>
                  'ni okudum ve onaylıyorum.
                </label>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  Kamera Kullanımı Hakkında
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Çalışma sırasında kamera kullanılacaktır. Görüntüler yalnızca analitik amaçlı saklanır ve talebiniz halinde silinebilir.
                </p>
              </div>
            </div>

            <button
              onClick={register}
              disabled={!fullName.trim() || !kvkkConsent}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              🚀 Giriş
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yaklaşık 10-15 dakika sürecek
          </p>
        </div>
      </div>
    </div>
  );
}