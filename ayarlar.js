/* =========================================================
   BİZİM HİKÂYEMİZ — AYARLAR
   Siteyi özelleştirmek için sadece bu dosyayı düzenlemen yeterli.
   GitHub'da bu dosyayı açıp ✏️ (Edit) ile de değiştirebilirsin.
   Değişikliği kaydedince (Commit) site birkaç dakika içinde güncellenir.
   ========================================================= */

const CONFIG = {
  // Birlikte olduğunuz tarih (sayaç ve final için)
  startDate: new Date('2023-02-14T00:00:00'),

  // Albüm adları (sırası önemli: 0, 1, 2, 3)
  albums: ['Birlikte', 'Gezilerimiz', 'En Tatlı Anlar', 'Özel Günler'],

  // Hikâye bölümündeki büyük polaroid fotoğrafı (örn. 'foto/hikaye.jpg'), yoksa null
  storyPhoto: null,

  // Albüm kapak fotoğrafları (sırayla 4 tane), yoksa null
  // örn. ['foto/kapak1.jpg', null, null, null]
  albumCovers: [null, null, null, null],

  // Hiç fotoğraf yokken gösterilecek boş çerçeve sayısı
  minFrames: 8,
};

/*
  FOTOĞRAFLAR
  1) Fotoğraflarını GitHub'daki "foto" klasörüne yükle.
     Dosya adlarında Türkçe karakter, boşluk ve büyük harf KULLANMA
     (örn. ilk-bulusma.jpg). GitHub büyük/küçük harfe duyarlıdır.
  2) Aşağıya şöyle ekle (her satırın sonunda virgül olsun).
  album: 0 = Birlikte, 1 = Gezilerimiz, 2 = En Tatlı Anlar, 3 = Özel Günler

  Örnek:
  { file: 'foto/ilk-bulusma.jpg', album: 0, date: '12 Mart 2023', note: 'O gün çok güzeldi ❤️' },
*/
const PHOTOS = [
  // buraya ekle
];

// Mektuplar
const LETTERS = [
  {
    date: '14 Şubat 2024',
    lines: ['Sevgilim,', 'Bu satırları sana yazmak bile içimi ısıtıyor.', 'İyi ki varsın.'],
  },
  {
    date: 'Sürpriz mektup',
    lines: ['Bunu bulduğuna göre,', 'biraz gülümseme vaktin geldi.', 'Seni seviyorum.'],
  },
];

/*
  SİTE YAZILARI VE RENKLER
  Bunları elle yazmana gerek yok: sitede ✎ Düzenle moduna girip
  yazıları değiştir, sonra panelden "ayarlar.js olarak indir" butonuna bas
  ve inen dosyayı GitHub'daki bu dosyanın yerine yükle.
*/
const SITE_TEXTS = {};
const SITE_COLORS = { pink: null, wine: null };

/*
  CANLI SÜRÜM (kullanıcılar kendi hikâyesini oluşturur) — FIREBASE AYARI
  Firebase'de proje açtıktan sonra aldığın "firebaseConfig" bilgisini buraya yapıştır.
  Adımlar için README.md dosyasına bak.
  Boş (null) bırakırsan site, eskisi gibi tek kişilik çalışır.

  Örnek:
  const FIREBASE_CONFIG = {
    apiKey: '...',
    authDomain: '...firebaseapp.com',
    projectId: '...',
    appId: '...',
  };
*/
const FIREBASE_CONFIG = {

  apiKey: "AIzaSyAJfXKmJV4Xnz9lsrS8YLlFzdLomEzTy20",
  authDomain: "bizim-hikayemiz-a9202.firebaseapp.com",
  projectId: "bizim-hikayemiz-a9202",
  appId: "1:548892750476:web:6cc366d0ff6b5b73f981a9",
}
