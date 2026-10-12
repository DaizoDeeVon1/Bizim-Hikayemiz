# Bizim Hikâyemiz — Canlı Sürüm 💌

Herkes Google ile giriş yapıp **kendi hikâyesini** oluşturabilir, fotoğraflarını ve yazılarını ekler.
Her hikâyenin tahmin edilemeyen özel bir linki olur:

`https://KULLANICI.github.io/DEPO/?h=3k9x0a...`

- **Ana adres** (`?h=` olmadan) herkese temiz örnek sayfayı gösterir.
- **Linki bilen** hikâyeyi görür, ama değiştiremez.
- **Sadece sahibi** (Google ile girişli) düzenler.

Kurulum 4 adım, toplam ~15 dakika. Kart bilgisi gerekmez.

---

## 1) Firebase projesi aç

1. <https://console.firebase.google.com> adresine Google hesabınla gir.
2. **Proje ekle (Add project)** → bir isim ver → Google Analytics'i **kapat** → **Proje oluştur**.

## 2) Giriş yöntemini aç (Google)

1. Sol menüde **Build → Authentication → Get started**.
2. **Sign-in method** sekmesinde **Google**'ı seç → **Enable** → destek e-postası olarak kendi e-postanı seç → **Save**.
3. **Settings → Authorized domains** bölümüne **Add domain** ile GitHub adresini ekle:
   `KULLANICI.github.io` (https:// ve sonundaki yol olmadan).

## 3) Veritabanını aç ve kuralları yapıştır

1. Sol menüde **Build → Firestore Database → Create database**.
2. Konum olarak sana yakın birini seç (örn. `eur3`), **Start in production mode** → **Create**.
3. **Rules** sekmesini aç, içindekileri sil, bu klasördeki **`firestore.rules`** dosyasının içeriğini yapıştır → **Publish**.

> ⚠️ Bu kurallar gizliliği sağlar: kodu bilen okuyabilir, kimse tüm hikâyelerin listesini göremez,
> sadece sahibi yazabilir. Kuralları değiştirirsen herkesin fotoğrafı herkese açılabilir.

## 4) Ayarı siteye bağla

1. Firebase'de sol üstte ⚙️ **Project settings** → aşağıda **Your apps** → **`</>` (Web)** → bir takma ad ver → **Register app**.
2. Karşına çıkan `firebaseConfig` içindeki bilgileri (`apiKey`, `authDomain`, `projectId`, `appId`) kopyala.
3. **`ayarlar.js`** dosyasının en altındaki satırı şöyle değiştir:

```js
const FIREBASE_CONFIG = {
  apiKey: '...',
  authDomain: '...firebaseapp.com',
  projectId: '...',
  appId: '...',
};
```

> `apiKey` gizli bir şifre değildir, sitede görünmesi normaldir. Güvenliği 3. adımdaki kurallar sağlar.

## GitHub'a yükle

1. GitHub'da yeni bir depo aç, bu klasördeki tüm dosyaları yükle (`.nojekyll` dahil).
2. **Settings → Pages → Deploy from a branch → main → /(root)** → Save.
3. 1-2 dakika sonra `https://KULLANICI.github.io/DEPO/` açılır.

## Deneme

1. Siteyi aç, sağ üstteki **✨ Kendi hikâyeni oluştur**'a bas, Google ile gir.
2. Hikâyen açılır. Girişten sonra sol alttaki **✎ Düzenle** ile fotoğraf ekle, yazıları değiştir.
3. Panelde **Paylaşım linki** çıkar. Linki başka bir tarayıcıda (veya gizli pencerede) aç: hikâyeyi görürsün, düzenleyemezsin.

---

## Sınırlar ve sorumluluk ⚠️

- **Fotoğraflar veritabanında saklanır** (Firebase Storage ücretli plan istediği için). Bu yüzden her fotoğraf küçültülür
  ve hikâye başına **en fazla 30 fotoğraf** konur (`script.js` içinde `MAX_PHOTOS`).
- **Ücretsiz plan sınırları:** Firestore'da günde 50.000 okuma, 1 GB depolama var. Bir hikâye açılınca
  tüm fotoğrafları okunur; çok ziyaretçi gelirse sınır dolabilir. Kullanıcı çoğalırsa Firebase'in ücretli planına geçmen
  ya da fotoğrafları Firebase Storage / Cloudflare R2 gibi bir dosya depolamasına taşıman gerekir.
- **Link gizliliği tam gizlilik değildir.** Linki alan herkes hikâyeyi görür. Şifre koruması istersen eklenebilir.
- **Başkalarının fotoğraflarını saklıyorsun.** Fotoğraflar kişisel veridir (Türkiye'de KVKK). Yayına açmadan önce
  bir gizlilik metni, uygunsuz içerik bildirme yolu ve (çok kullanıcı gelirse) içerik denetimi planla.
  "Hikâyemi sil" butonu sahibin panelinde var.
- Google ile giriş, **açılır pencere** kullanır. Bazı telefon tarayıcıları pencereyi engelleyebilir,
  o durumda "pencerelere izin ver" demek gerekir.
- Bu sürümü gerçek Firebase ile deneyemedim; akışı sahte bir Firebase ile doğruladım. İlk kurulumda hata alırsan,
  tarayıcıda F12 → Console'daki kırmızı mesajı bana gönder.
