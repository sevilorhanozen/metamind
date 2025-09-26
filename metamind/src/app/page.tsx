"use client";

import Quiz from "./components/Quiz";
import { useState } from "react";
import Webcam from "react-webcam";
import { supabase, AppUser } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isAligned, setIsAligned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [kvkkConsent, setKvkkConsent] = useState(false);

  const register = async () => {
    if (!fullName.trim()) {
      alert("Lütfen ad soyad giriniz.");
      return;
    }
    if (!kvkkConsent) {
      alert("Lütfen KVKK onayını veriniz.");
      return;
    }
    const { data, error } = await supabase.from("app_users").insert([{ full_name: fullName.trim(), email: email || null }]).select();
    if (error) {
      console.error(error);
      alert("Kayıt oluşturulamadı.");
      return;
    }
    const created = data?.[0] || null;
    setUser(created);
    if (created?.id) {
      (window as any).__APP_USER_ID__ = created.id;
    }
    setShowCamera(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Kayıt</h1>
          <div className="space-y-3">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" className="w-full border rounded p-2 bg-white dark:bg-gray-900" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta (opsiyonel)" className="w-full border rounded p-2 bg-white dark:bg-gray-900" />
            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                id="kvkk" 
                checked={kvkkConsent} 
                onChange={(e) => setKvkkConsent(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="kvkk" className="text-sm text-gray-700 dark:text-gray-300">
                Kişisel verilerimin işlenmesi ve analitik amaçlarla kullanılması için <a href="#" className="text-blue-600 underline">KVKK Aydınlatma Metni</a>'ni okudum ve onaylıyorum.
              </label>
            </div>
            <button onClick={register} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Devam Et</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAligned) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-3">Kadro Ayarı</h2>
          <p className="text-sm mb-3">Yüzünü ortadaki siluete hizala. Hazır olduğunda başlat.</p>
          {showCamera && (
            <div className="relative rounded overflow-hidden mb-3">
              <Webcam audio={false} screenshotFormat="image/jpeg" className="w-full object-cover" videoConstraints={{ facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }} mirrored />
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-6 border-2 border-white/60 rounded-lg" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-52 rounded-full border-2 border-white/50" />
              </div>
            </div>
          )}
          {!showCamera && (
            <button onClick={() => setShowCamera(true)} className="w-full bg-blue-600 text-white py-2 rounded mb-3">Kamerayı Aç</button>
          )}
          <button onClick={() => setIsAligned(true)} className="w-full bg-green-600 text-white py-2 rounded">Hazırım, Başlayalım</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Quiz />
    </div>
  );
}
