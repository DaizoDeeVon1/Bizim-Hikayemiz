/* =========================================================
   BİZİM HİKÂYEMİZ — JAVASCRIPT
   1) AYARLAR (ayarlar.js dosyasında)
   2) Yardımcılar
   3) Giriş ekranı, sayaç, kalpler
   4) Kalıcı depolama (IndexedDB)
   5) Albümler
   6) Galeri + lightbox
   7) Mektuplar
   8) Kaydırma animasyonları ve menü
   9) Müzik
   10) Başlatma
   ========================================================= */


/* =========================================================
   1) AYARLAR — kişiselleştirme ayarlar.js dosyasında yapılır
   ========================================================= */

// CONFIG, PHOTOS, LETTERS, SITE_TEXTS ve SITE_COLORS artık ayarlar.js dosyasında.

// Boş çerçevelerde görünen örnek notlar ve tarihler
const SAMPLE_NOTES = [
  'O günün ne kadar güzel olduğunu hâlâ hatırlıyorum. ❤️',
  'Seninle her yer güzel.',
  'Bu kareye bayılıyorum.',
  'Hiç bitmesin isterdim.',
  'Gülüşün hâlâ aklımda.',
  'İyi ki o gün oradaydık.',
  'Sıradan bir gün, en özel anım.',
  'Birlikte her şey kolay.',
];
const SAMPLE_DATES = [
  '12 Mart 2023', '5 Mayıs 2023', '20 Temmuz 2023', '1 Eylül 2023',
  '14 Şubat 2024', '3 Nisan 2024', '9 Haziran 2024', '1 Ağustos 2024',
];

// Boş çerçevelerin renk geçişleri
const GRADIENTS = [
  '#8E263F,#2a1830', '#3b2a5c,#8E263F', '#15264a,#F26B8A',
  '#5a1a30,#0f1a33', '#F26B8A,#2a1830', '#2a1830,#15264a',
];
const FRAME_HEIGHTS = [260, 340, 300, 380, 280, 320, 360, 290];


/* =========================================================
   2) YARDIMCILAR
   ========================================================= */

const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Bugünün tarihini "9 Ekim 2026" biçiminde verir
function formatToday() {
  return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Uygulamanın tüm durumu burada tutulur
const state = {
  configPhotos: [],      // PHOTOS listesinden gelenler
  uploadedPhotos: [],    // kullanıcının eklediği (IndexedDB'den) fotoğraflar
  favorites: new Set(),  // favori fotoğraf id'leri
  albumFilter: -1,       // -1 = tüm albümler
  visiblePhotos: [],     // şu an galeride gösterilenler
  currentIndex: -1,      // lightbox'ta açık olan fotoğraf
};


/* =========================================================
   3) GİRİŞ EKRANI, SAYAÇ, KALPLER
   ========================================================= */

function updateCounter() {
  const diff    = Date.now() - getStartDate();
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  $('#counter').textContent = `${days} gün ${hours} saat ${minutes} dakikadır birlikteyiz`;
}

// Ekrana tek bir kalp ekler; animasyon bitince kendini siler
function spawnHeart() {
  const heart = document.createElement('span');
  const duration = 7 + Math.random() * 7;

  heart.className = 'heart';
  heart.textContent = '♥';
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.fontSize = 10 + Math.random() * 18 + 'px';
  heart.style.animationDuration = duration + 's';

  $('#hearts').appendChild(heart);
  setTimeout(() => heart.remove(), duration * 1000);
}

function createSparks() {
  for (let i = 0; i < 30; i++) {
    const spark = document.createElement('i');
    spark.className = 'spark';
    spark.style.left = Math.random() * 100 + '%';
    spark.style.top = Math.random() * 100 + '%';
    spark.style.animationDelay = Math.random() * 4 + 's';
    $('#intro').appendChild(spark);
  }
}

function setupIntro() {
  updateCounter();
  setInterval(updateCounter, 30000);
  setInterval(spawnHeart, 900);
  createSparks();

  updateFinaleDate();

  $('#enter-btn').addEventListener('click', () => {
    $('#intro').classList.add('gone');
    for (let i = 0; i < 25; i++) setTimeout(spawnHeart, i * 80);   // kalp yağmuru
  });
}


/* =========================================================
   4) KALICI DEPOLAMA (IndexedDB)
   Eklenen fotoğraflar tarayıcıda saklanır; F5 atınca kaybolmaz.
   Favoriler de localStorage'da tutulur.
   ========================================================= */

const DB_NAME = 'bizim-hikayemiz';
const STORE   = 'photos';

const IMAGE_STORE = 'images';   // hikâye fotoğrafı ve albüm kapakları

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE))       db.createObjectStore(STORE,       { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// Tek bir işlemi (getAll / put / delete / clear) Promise olarak çalıştırır
async function runStoreRequest(storeName, mode, makeRequest) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = makeRequest(db.transaction(storeName, mode).objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// Galeri fotoğrafları
const dbGetAll = ()       => runStoreRequest(STORE, 'readonly',  (s) => s.getAll());
const dbSave   = (record) => runStoreRequest(STORE, 'readwrite', (s) => s.put(record));
const dbDelete = (id)     => runStoreRequest(STORE, 'readwrite', (s) => s.delete(id));

// Hikâye fotoğrafı ve albüm kapakları
const imageGetAll = ()       => runStoreRequest(IMAGE_STORE, 'readonly',  (s) => s.getAll());
const imageSave   = (record) => runStoreRequest(IMAGE_STORE, 'readwrite', (s) => s.put(record));
const imageClear  = ()       => runStoreRequest(IMAGE_STORE, 'readwrite', (s) => s.clear());

// Favoriler (depolama engelliyse sessizce atlanır)
function loadFavorites() {
  try {
    state.favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
  } catch (error) { /* önemli değil */ }
}
function saveFavorites() {
  try {
    localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  } catch (error) { /* önemli değil */ }
}

// Veritabanındaki kaydı ekranda kullanılan fotoğraf nesnesine çevirir
function recordToPhoto(record) {
  return {
    id: record.id,
    src: URL.createObjectURL(record.blob),
    album: record.album,
    date: record.date,
    note: record.note,
    height: record.height,
    userAdded: true,
    blob: record.blob,              // düzenleyip tekrar kaydederken lazım
    createdAt: record.createdAt,
  };
}

async function loadSavedPhotos() {
  try {
    const records = await dbGetAll();
    records.sort((a, b) => a.createdAt - b.createdAt);
    state.uploadedPhotos = records.map(recordToPhoto);
  } catch (error) {
    console.warn('Kayıtlı fotoğraflar okunamadı:', error);
  }
}

// Küçültme ayarı (canlı sürümde daha küçük: fotoğraflar veritabanında saklanır)
const SHRINK = { size: 1600, quality: 0.85 };

// Büyük fotoğrafı küçültür → depolama dolmasın
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, SHRINK.size / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('Küçültülemedi'));
      }, 'image/jpeg', SHRINK.quality);
    };
    image.onerror = reject;
    image.src = url;
  });
}

async function handleUpload(event) {
  const files = [...event.target.files];
  event.target.value = '';                       // aynı dosya tekrar seçilebilsin

  for (const file of files) {
    // Canlı sürümde kişi başı fotoğraf sınırı var
    if (shared.limit && state.uploadedPhotos.length >= shared.limit) {
      $('#hint').textContent = `En fazla ${shared.limit} fotoğraf ekleyebilirsin.`;
      break;
    }
    try {
      const blob = await shrinkImage(file);
      const record = {
        id: 'u' + Date.now() + Math.random().toString(36).slice(2, 6),
        blob,
        album: Math.max(0, state.albumFilter),   // albüm seçiliyse oraya, değilse ilkine
        date: formatToday(),
        note: 'Yeni bir anı ♡',
        height: FRAME_HEIGHTS[Math.floor(Math.random() * FRAME_HEIGHTS.length)],
        createdAt: Date.now(),
      };
      if (shared.active) {
        await sharedAddPhoto(blob, record);      // ortak albüme yükle (galeri kendiliğinden güncellenir)
      } else {
        await dbSave(record);                    // yerel mod: bu tarayıcıda sakla
        state.uploadedPhotos.push(recordToPhoto(record));
      }
    } catch (error) {
      console.warn('Fotoğraf eklenemedi:', error);
    }
  }
  renderGallery();
}


/* =========================================================
   5) ALBÜMLER
   ========================================================= */

function renderAlbums() {
  $('#album-list').innerHTML = getAlbums().map((name, index) => {
    const customCover = state.images['album' + index] || (CONFIG.albumCovers || [])[index];
    const cover = customCover
      ? `url('${customCover}')`
      : `linear-gradient(160deg,${GRADIENTS[index % GRADIENTS.length]})`;

    return `
      <div class="album reveal${state.albumFilter === index ? ' selected' : ''}"
           data-index="${index}" style="transition-delay:${index * 0.12}s">
        <div class="cover" style="background-image:${cover}"></div>
        <button class="mini-btn edit-only" data-image="album${index}">🖼 Kapak</button>
        <div class="name" data-album-name="${index}"
             ${state.editMode ? 'contenteditable="true"' : ''}>${escapeHtml(name)}</div>
      </div>`;
  }).join('');

  $$('.album').forEach((card) => {
    card.addEventListener('click', () => {
      if (state.editMode) return;               // düzenlerken albüm açılmasın
      selectAlbum(Number(card.dataset.index));
    });
    revealObserver.observe(card);
  });
}

// Aynı albüme tekrar basınca filtre kalkar
function selectAlbum(index) {
  const isSame = state.albumFilter === index;
  state.albumFilter = isSame ? -1 : index;

  $$('.album').forEach((card) => {
    card.classList.toggle('selected', !isSame && Number(card.dataset.index) === index);
  });
  $('#gallery-title').textContent = isSame ? 'Tüm Anılar' : getAlbums()[index];

  renderGallery();
  $('#gallery').scrollIntoView({ behavior: 'smooth' });
}


/* =========================================================
   6) GALERİ + LIGHTBOX
   ========================================================= */

// Gerçek fotoğraf azsa boş çerçeveler ile tamamlanır
function createPlaceholders() {
  return SAMPLE_NOTES.map((note, i) => ({
    id: 'ph' + i,
    src: null,
    album: i % 4,
    date: SAMPLE_DATES[i],
    note,
    height: FRAME_HEIGHTS[i],
    gradient: GRADIENTS[i % GRADIENTS.length],
  }));
}
const placeholders = createPlaceholders();

function getAllPhotos() {
  const real = [...state.configPhotos, ...state.uploadedPhotos];
  const missing = Math.max(0, CONFIG.minFrames - real.length);
  return [...real, ...placeholders.slice(0, missing)];
}

// Fotoğrafın arka planı: gerçek resim ya da renk geçişi
function backgroundOf(photo) {
  // Not: style="..." içinde çift tırnak kullanılamaz, bu yüzden tek tırnak kullanıyoruz
  if (!photo.src) return `linear-gradient(135deg, ${photo.gradient})`;
  return `url('${photo.src.replace(/'/g, '%27')}')`;
}

function renderGallery() {
  const filter = state.albumFilter;
  state.visiblePhotos = getAllPhotos().filter((p) => filter < 0 || p.album === filter);

  if (!state.visiblePhotos.length) {
    $('#grid').innerHTML = '<p class="hint">Henüz fotoğraf yok.</p>';
    return;
  }

  $('#grid').innerHTML = state.visiblePhotos.map((photo, index) => `
    <figure class="polaroid reveal" data-index="${index}">
      <div class="photo" style="height:${photo.height}px; background-image:${backgroundOf(photo)}">
        ${photo.src ? '' : '♡'}
      </div>
      <div class="caption">
        ${state.favorites.has(photo.id) ? '♥ ' : ''}${escapeHtml(photo.note)}
        <small>${escapeHtml(photo.date)}</small>
      </div>
    </figure>
  `).join('');

  $$('.polaroid').forEach((card) => {
    card.addEventListener('click', () => openLightbox(Number(card.dataset.index)));
    revealObserver.observe(card);
  });
}

function openLightbox(index) {
  const photo = state.visiblePhotos[index];
  const isFavorite = state.favorites.has(photo.id);
  state.currentIndex = index;

  $('#lb-photo').style.backgroundImage = backgroundOf(photo);
  $('#lb-photo').textContent = photo.src ? '' : '♡';
  $('#lb-caption').innerHTML =
    `${escapeHtml(photo.note)}<br><small style="font-family:var(--font-serif);opacity:.6">${escapeHtml(photo.date)}</small>`;

  $('#lb-fav').textContent = isFavorite ? '♥' : '♡';
  $('#lb-fav').classList.toggle('on', isFavorite);
  $('#lb-delete').hidden = !photo.userAdded;     // sadece eklediklerin silinebilir
  $('#lb-edit-btn').hidden = !photo.userAdded;   // sadece eklediklerin düzenlenebilir
  $('#lb-edit-box').hidden = true;

  $('#lightbox').classList.add('open');
}

function closeLightbox() {
  $('#lightbox').classList.remove('open');
  renderGallery();                               // favori işaretleri yenilensin
}

function showNeighbor(step) {
  const total = state.visiblePhotos.length;
  openLightbox((state.currentIndex + step + total) % total);
}

function toggleFavorite() {
  const photo = state.visiblePhotos[state.currentIndex];
  if (state.favorites.has(photo.id)) state.favorites.delete(photo.id);
  else state.favorites.add(photo.id);
  saveFavorites();
  openLightbox(state.currentIndex);
}

async function deleteCurrentPhoto() {
  const photo = state.visiblePhotos[state.currentIndex];
  if (!photo.userAdded) return;

  if (shared.active) {
    await shared.db.collection('photos').doc(photo.id).delete();
    try { await shared.assets.delete(photo.assetId); } catch (error) { /* önemli değil */ }
  } else {
    await dbDelete(photo.id);
    state.uploadedPhotos = state.uploadedPhotos.filter((p) => p.id !== photo.id);
  }
  $('#lightbox').classList.remove('open');
  renderGallery();
}

// Alt yazı ve tarihi düzenleme (sadece senin eklediğin fotoğraflar)
function startEditing() {
  const photo = state.visiblePhotos[state.currentIndex];
  $('#edit-note').value = photo.note;
  $('#edit-date').value = photo.date;
  $('#lb-edit-box').hidden = false;
  $('#edit-note').focus();
}

async function saveEditing() {
  const photo = state.visiblePhotos[state.currentIndex];
  photo.note = $('#edit-note').value.trim() || photo.note;
  photo.date = $('#edit-date').value.trim();

  if (shared.active) {
    await shared.db.collection('photos').doc(photo.id).update({ note: photo.note, date: photo.date });
  } else {
    await dbSave({
      id: photo.id,
      blob: photo.blob,
      album: photo.album,
      date: photo.date,
      note: photo.note,
      height: photo.height,
      createdAt: photo.createdAt,
    });
  }
  openLightbox(state.currentIndex);              // yeni yazıyı göster
}

function setupGallery() {
  $('#upload-input').addEventListener('change', handleUpload);
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => showNeighbor(-1));
  $('#lb-next').addEventListener('click', () => showNeighbor(1));
  $('#lb-fav').addEventListener('click', toggleFavorite);
  $('#lb-delete').addEventListener('click', deleteCurrentPhoto);
  $('#lb-edit-btn').addEventListener('click', startEditing);
  $('#edit-save').addEventListener('click', saveEditing);

  // Klavye: ← → ve Esc
  document.addEventListener('keydown', (event) => {
    if (!$('#lightbox').classList.contains('open')) return;
    if (event.target.tagName === 'INPUT') return;   // yazı yazarken kısayolları kapat
    if (event.key === 'ArrowRight') showNeighbor(1);
    if (event.key === 'ArrowLeft')  showNeighbor(-1);
    if (event.key === 'Escape')     closeLightbox();
  });
}


/* =========================================================
   7) MEKTUPLAR
   ========================================================= */

function renderLetters() {
  const letters = getLetters();
  const list = $('#letter-list');

  // Düzenleme modu: her mektup için tarih kutusu + yazı alanı
  if (state.editMode) {
    list.innerHTML = letters.map((letter, i) => `
      <div class="envelope editor" data-letter="${i}">
        <input class="l-date" type="text" value="${escapeHtml(letter.date)}" placeholder="Tarih">
        <textarea class="l-text" rows="6" placeholder="Her satır, mektupta ayrı bir satır olur">${escapeHtml(letter.lines.join('\n'))}</textarea>
        <button class="btn small l-del">Sil</button>
      </div>`).join('') + '<div><button class="btn" id="add-letter">+ Mektup ekle</button></div>';
    return;
  }

  list.innerHTML = letters.map((letter) => `
    <div class="envelope reveal">
      <div class="flap"></div>
      <div class="letter-date">${escapeHtml(letter.date)}</div>
      <div class="letter-body">
        ${letter.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      </div>
    </div>
  `).join('');

  $$('.envelope', list).forEach((envelope) => {
    revealObserver.observe(envelope);
    envelope.addEventListener('click', () => {
      const isOpen = envelope.classList.toggle('open');

      // Satırları sırayla göster
      $$('.letter-body p', envelope).forEach((line, i) => {
        line.classList.remove('shown');
        if (isOpen) setTimeout(() => line.classList.add('shown'), 500 + i * 700);
      });
    });
  });
}


/* =========================================================
   8) KAYDIRMA ANİMASYONLARI VE MENÜ
   ========================================================= */

// Ekrana girince ".reveal" öğelerini görünür yapar
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function setupScrollEffects() {
  $$('.reveal').forEach((element) => revealObserver.observe(element));

  // Menüde görünen bölümü pembe çizgiyle işaretle
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$('nav a').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { threshold: 0.4 });

  $$('section').forEach((section) => sectionObserver.observe(section));
}


/* =========================================================
   9) MÜZİK (harici dosya gerekmez, yumuşak bir ses üretir)
   Kendi şarkını eklemek istersen: <audio src="muzik.mp3" loop> kullan.
   ========================================================= */

function setupMusic() {
  let audio = null;
  let playing = false;

  $('#music-btn').addEventListener('click', () => {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const volume = audio.createGain();
      volume.gain.value = 0.04;
      volume.connect(audio.destination);

      [220, 277.2, 329.6, 440].forEach((frequency) => {
        const oscillator = audio.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(volume);
        oscillator.start();
      });
    }

    playing = !playing;
    playing ? audio.resume() : audio.suspend();
    $('#music-btn').textContent = playing ? '♪ Durdur' : '♪ Müzik';
  });
}


/* =========================================================
   9b) ÖZELLEŞTİRME (✎ Düzenle modu)
   Yazılar, albüm adları/kapakları, mektuplar, tarih ve renkler
   tarayıcıda kaydedilir.
   ========================================================= */

const settings = {
  texts: {},          // data-edit="anahtar" olan yazıların yeni halleri
  albums: null,       // değiştirilmiş albüm adları
  letters: null,      // değiştirilmiş mektuplar
  startDate: null,    // 'YYYY-MM-DD'
  pink: null,         // vurgu rengi
  wine: null,         // bordo rengi
};
state.editMode = false;
state.images = {};    // 'story', 'album0'... → resim adresi
let pendingImageKey = null;

function loadSettings() {
  try {
    if (!FIREBASE_CONFIG) Object.assign(settings, JSON.parse(localStorage.getItem('settings') || '{}'));
  } catch (error) { /* önemli değil */ }

  // ayarlar.js'teki (GitHub'a yüklenen) değerler temel alınır,
  // bu tarayıcıda yapılan değişiklikler üstüne biner
  settings.texts = Object.assign({}, SITE_TEXTS, settings.texts);
  settings.pink  = settings.pink || SITE_COLORS.pink;
  settings.wine  = settings.wine || SITE_COLORS.wine;
}
let settingsTimer = null;
function saveSettings() {
  // Ortak mod: ayarlar herkesle paylaşılan veritabanına yazılır (yazarken yavaşça, 0.5 sn bekleyerek)
  if (shared.active) {
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
      shared.db.doc('site/settings').set(JSON.parse(JSON.stringify(settings))).catch(() => {});
    }, 500);
    return;
  }
  // Yerel mod: sadece bu tarayıcıda
  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) { /* önemli değil */ }
}

// Ayar varsa onu, yoksa dosyanın başındaki varsayılanı kullanır
const getAlbums    = () => settings.albums  || CONFIG.albums;
const getLetters   = () => settings.letters || LETTERS;
const getStartDate = () =>
  settings.startDate ? new Date(settings.startDate + 'T00:00:00') : CONFIG.startDate;

// Mektupları ilk düzenlemede ayarlara kopyalar
function editableLetters() {
  if (!settings.letters) settings.letters = JSON.parse(JSON.stringify(LETTERS));
  return settings.letters;
}

// Kullanıcının yazdığı metni güvenle HTML'e koyar
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function applyTheme() {
  const root = document.documentElement;
  if (settings.pink) root.style.setProperty('--pink', settings.pink);
  if (settings.wine) root.style.setProperty('--wine', settings.wine);
}

function applySavedTexts() {
  $$('[data-edit]').forEach((element) => {
    const saved = settings.texts[element.dataset.edit];
    if (saved && element !== document.activeElement) element.textContent = saved;
  });
}

function updateFinaleDate() {
  $('#finale-date').textContent = getStartDate().toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Kayıtlı hikâye fotoğrafı ve albüm kapaklarını yükler
async function loadSavedImages() {
  try {
    const records = await imageGetAll();
    records.forEach((r) => { state.images[r.id] = URL.createObjectURL(r.blob); });
  } catch (error) {
    console.warn('Resimler okunamadı:', error);
  }
}

function applyImages() {
  const storyPhoto = state.images.story || CONFIG.storyPhoto;
  if (storyPhoto) {
    $('#story-photo').style.backgroundImage = `url('${storyPhoto}')`;
  }
}

async function handleImageChange(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file || !pendingImageKey) return;

  try {
    const blob = await shrinkImage(file);
    if (shared.active) {
      await sharedSaveImage(pendingImageKey, blob);   // resim kendiliğinden güncellenir
    } else {
      await imageSave({ id: pendingImageKey, blob });
      state.images[pendingImageKey] = URL.createObjectURL(blob);
      applyImages();
      renderAlbums();
    }
  } catch (error) {
    console.warn('Resim değiştirilemedi:', error);
  }
}

// Düzenleme modunu açar / kapatır
function setEditMode(on) {
  state.editMode = on;
  document.body.classList.toggle('editing', on);

  $$('[data-edit]').forEach((element) => {
    if (!element.closest('#intro')) element.contentEditable = on ? 'true' : 'false';
  });

  $('#edit-toggle').textContent = on ? '✔ Bitti' : '✎ Düzenle';
  $('#settings-panel').hidden = !on;
  if (on) fillSettingsPanel();

  renderAlbums();
  renderLetters();
}

function fillSettingsPanel() {
  const date = getStartDate();
  const pad = (n) => String(n).padStart(2, '0');
  $('#set-date').value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  $('#set-pink').value = settings.pink || '#f26b8a';
  $('#set-wine').value = settings.wine || '#8e263f';

  $$('[data-text-key]').forEach((input) => {
    input.value = $(`[data-edit="${input.dataset.textKey}"]`).textContent;
  });
}

// Mevcut ayarları ayarlar.js dosyası olarak oluşturur (GitHub'a yüklemek için)
function buildSettingsFile() {
  const date = getStartDate();
  const pad = (n) => String(n).padStart(2, '0');
  const dateText = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00`;

  return [
    '/* BİZİM HİKÂYEMİZ — AYARLAR (düzenleme modundan dışa aktarıldı) */',
    '',
    'const CONFIG = {',
    `  startDate: new Date('${dateText}'),`,
    `  albums: ${JSON.stringify(getAlbums())},`,
    `  storyPhoto: ${JSON.stringify(CONFIG.storyPhoto || null)},`,
    `  albumCovers: ${JSON.stringify(CONFIG.albumCovers || [null, null, null, null])},`,
    `  minFrames: ${CONFIG.minFrames},`,
    '};',
    '',
    `const PHOTOS = ${JSON.stringify(PHOTOS, null, 2)};`,
    '',
    `const LETTERS = ${JSON.stringify(getLetters(), null, 2)};`,
    '',
    `const SITE_TEXTS = ${JSON.stringify(settings.texts, null, 2)};`,
    '',
    `const SITE_COLORS = ${JSON.stringify({ pink: settings.pink || null, wine: settings.wine || null })};`,
    '',
  ].join('\n');
}

function downloadSettingsFile() {
  const blob = new Blob([buildSettingsFile()], { type: 'text/javascript' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ayarlar.js';
  link.click();
}

function setupEditMode() {
  $('#edit-toggle').addEventListener('click', () => setEditMode(!state.editMode));
  $('#image-input').addEventListener('change', handleImageChange);
  $('#export-btn').addEventListener('click', downloadSettingsFile);

  // Yazıdan çıkınca (odak kaybında) kaydet
  document.addEventListener('focusout', (event) => {
    const element = event.target;
    if (!element.dataset) return;

    if (element.dataset.edit) {
      settings.texts[element.dataset.edit] = element.textContent.trim();
      saveSettings();
    }
    if (element.dataset.albumName !== undefined) {
      const names = [...getAlbums()];
      const index = Number(element.dataset.albumName);
      names[index] = element.textContent.trim() || names[index];
      settings.albums = names;
      saveSettings();
    }
  });

  // Enter yazıyı bitirir, yapıştırırken düz metin alınır
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.isContentEditable) {
      event.preventDefault();
      event.target.blur();
    }
  });
  document.addEventListener('paste', (event) => {
    if (!event.target.isContentEditable) return;
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
  });

  // 🖼 butonları: hangi resim değişecek?
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image]');
    if (!button) return;
    pendingImageKey = button.dataset.image;
    $('#image-input').click();
  });

  // Ayar paneli
  $('#set-date').addEventListener('change', (event) => {
    settings.startDate = event.target.value || null;
    saveSettings();
    updateCounter();
    updateFinaleDate();
  });
  $('#set-pink').addEventListener('input', (event) => {
    settings.pink = event.target.value; saveSettings(); applyTheme();
  });
  $('#set-wine').addEventListener('input', (event) => {
    settings.wine = event.target.value; saveSettings(); applyTheme();
  });
  $$('[data-text-key]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.textKey;
      settings.texts[key] = input.value;
      saveSettings();
      $(`[data-edit="${key}"]`).textContent = input.value;
    });
  });

  // Sıfırla (yanlışlıkla basılmasın diye iki aşamalı)
  let resetArmed = false;
  $('#reset-all').addEventListener('click', async (event) => {
    if (!resetArmed) {
      resetArmed = true;
      event.target.textContent = 'Emin misin? Tekrar bas';
      return;
    }
    try { localStorage.removeItem('settings'); } catch (error) { /* önemli değil */ }
    try { await imageClear(); } catch (error) { /* önemli değil */ }
    if (shared.active) {
      try {
        await shared.db.doc('site/settings').delete();
        for (const key of ['story', 'album0', 'album1', 'album2', 'album3']) {
          await shared.db.doc('images/' + key).delete();
        }
      } catch (error) { /* önemli değil */ }
    }
    location.reload();
  });

  // Mektup düzenleyici (yazı yazma, silme, ekleme)
  const list = $('#letter-list');
  list.addEventListener('input', (event) => {
    const card = event.target.closest('[data-letter]');
    if (!card) return;
    const letter = editableLetters()[card.dataset.letter];

    if (event.target.classList.contains('l-date')) letter.date = event.target.value;
    if (event.target.classList.contains('l-text')) {
      letter.lines = event.target.value.split('\n').filter((line) => line.trim());
    }
    saveSettings();
  });
  list.addEventListener('click', (event) => {
    const card = event.target.closest('[data-letter]');

    if (event.target.id === 'add-letter') {
      editableLetters().push({ date: 'Yeni mektup', lines: ['Merhaba…'] });
      saveSettings();
      renderLetters();
    } else if (card && event.target.classList.contains('l-del')) {
      editableLetters().splice(Number(card.dataset.letter), 1);
      saveSettings();
      renderLetters();
    }
  });
}


/* =========================================================
   9c) ORTAK DEPOLAMA (ikiniz aynı siteyi düzenlersiniz)
   Sayfa yayında ve düzenleme yetkisi verilen herkesin değişiklikleri
   ortak veritabanına yazılır, herkes anında görür.
   Klasör olarak açılırsa (claude yok) otomatik olarak yerel moda döner.

   Veritabanı yapısı:
     site/settings   → yazılar, albüm adları, mektuplar, tarih, renkler
     photos/<id>     → galeri fotoğrafları (resim dosyası "assets"te durur)
     images/<anahtar>→ hikâye fotoğrafı ve albüm kapakları
   ========================================================= */

const shared = { db: null, assets: null, active: false };

// Resmi ortak depoya yükler ve galeri kaydını yazar
async function sharedAddPhoto(blob, meta) {
  const asset = await shared.assets.upload(blob);
  await shared.db.collection('photos').doc(meta.id).set({
    a: asset.id,
    album: meta.album,
    date: meta.date,
    note: meta.note,
    height: meta.height,
    createdAt: meta.createdAt,
  });
}

async function sharedSaveImage(key, blob) {
  const asset = await shared.assets.upload(blob);
  await shared.db.collection('images').doc(key).set({ a: asset.id });
}

// Bu tarayıcıda önceden eklenmiş içerik varsa bir kereliğine ortağa taşır
async function migrateLocalToShared() {
  try { if (localStorage.getItem('migrated')) return; } catch (error) { return; }

  try {
    const hasLocalSettings = Object.keys(settings.texts).length || settings.albums ||
      settings.letters || settings.startDate || settings.pink || settings.wine;
    const existing = await shared.db.doc('site/settings').get();
    if (hasLocalSettings && !existing.exists) {
      await shared.db.doc('site/settings').set(JSON.parse(JSON.stringify(settings)));
    }
    for (const record of await dbGetAll())    await sharedAddPhoto(record.blob, record);
    for (const record of await imageGetAll()) await sharedSaveImage(record.id, record.blob);
    localStorage.setItem('migrated', '1');
  } catch (error) {
    console.warn('Yerel içerik taşınamadı:', error);
  }
}

// Ortak ayarlar değişince ekranı yenile
function applyRemoteSettings(data) {
  Object.assign(settings, { texts: {}, albums: null, letters: null, startDate: null, pink: null, wine: null }, data);
  applyTheme();
  applySavedTexts();
  updateCounter();
  updateFinaleDate();

  // Birisi yazı yazarken o alanı yeniden çizip imleci kaybettirme
  const active = document.activeElement;
  if (!(active && active.closest('#album-list'))) renderAlbums();
  if (!(active && active.closest('#letter-list'))) renderLetters();
}

// Canlı dinleme: diğer kişi bir şey değiştirince burası tetiklenir
function subscribeShared() {
  shared.db.collection('photos').onSnapshot((snapshot) => {
    state.uploadedPhotos = snapshot.docs.map((doc) => {
      const x = doc.data();
      return {
        id: doc.id,
        assetId: x.a,
        src: assetUrl(x.a),
        album: x.album || 0,
        date: x.date || '',
        note: x.note || '',
        height: x.height || 300,
        createdAt: x.createdAt || 0,
        userAdded: true,
      };
    }).sort((a, b) => a.createdAt - b.createdAt);
    renderGallery();
  }, () => {});

  shared.db.collection('images').onSnapshot((snapshot) => {
    snapshot.docs.forEach((doc) => { state.images[doc.id] = assetUrl(doc.data().a); });
    applyImages();
    renderAlbums();
  }, () => {});

  shared.db.doc('site/settings').onSnapshot((snapshot) => {
    if (snapshot.exists) applyRemoteSettings(snapshot.data());
  }, () => {});
}

async function connectShared() {
  if (!window.claude) return;                          // klasör sürümü: yerel mod

  try { shared.db     = await claude.use('db');     } catch (error) { /* yerel mod */ }
  try { shared.assets = await claude.use('assets'); } catch (error) { /* sadece okuma */ }
  if (!shared.db) return;

  shared.active = true;
  state.uploadedPhotos = [];                           // yerel içeriği bırak, ortağı göster
  state.images = {};
  document.body.classList.toggle('readonly', !shared.assets);   // yetkisiz kişi sadece görür
  $('#hint').textContent = 'Fotoğraflar ortak albümde saklanır; ikiniz de görürsünüz.';

  if (shared.assets && !shared.noMigrate) await migrateLocalToShared();
  subscribeShared();
}


/* =========================================================
   9d) CANLI SÜRÜM (Firebase) — herkes kendi hikâyesini oluşturur
   ayarlar.js'e FIREBASE_CONFIG yazılırsa devreye girer.

   Mantık:
   • Ana adres (?h= yok)  → temiz örnek sayfa, düzenleme yok.
   • ?h=KOD                → o hikâyeyi herkes görür (kodu bilen).
   • Hikâyeyi sadece sahibi (Google ile girişli) düzenler.
   Veritabanı (Firestore):
     stories/<kod>                  → sahibi (ownerUid) + ayarlar (settings)
     stories/<kod>/photos/<id>      → galeri fotoğrafları (küçültülmüş resim metni)
     stories/<kod>/images/<anahtar> → hikâye fotoğrafı ve albüm kapakları
   Güvenlik kuralları firestore.rules dosyasındadır.
   ========================================================= */

const MAX_PHOTOS = 30;   // hikâye başına en fazla fotoğraf

// Resim adresi: veritabanında saklananlar "data:" ile başlar
const assetUrl = (a) => (String(a).startsWith('data:') ? a : '/_blob/' + a);

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Tahmin edilemeyen uzun rastgele hikâye kodu
function randomStoryId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('');
}

// Mevcut kodun beklediği "db" arayüzünü Firestore üzerinde sağlar
function makeFirestoreFacade(storyRef) {
  const settingsDoc = {
    set: (data) => storyRef.update({ settings: data }),
    delete: () => storyRef.update({ settings: firebase.firestore.FieldValue.delete() }),
    get: async () => {
      const snapshot = await storyRef.get();
      return { exists: !!(snapshot.data() && snapshot.data().settings) };
    },
    onSnapshot: (next, onError) => storyRef.onSnapshot((snapshot) => {
      const data = snapshot.data() || {};
      next({ exists: !!data.settings, data: () => data.settings });
    }, onError),
  };

  return {
    collection: (name) => storyRef.collection(name),
    doc: (path) => {
      if (path === 'site/settings') return settingsDoc;
      const [collection, id] = path.split('/');
      return storyRef.collection(collection).doc(id);
    },
  };
}

async function findMyStory(firestore, user) {
  try {
    const result = await firestore.collection('stories')
      .where('ownerUid', '==', user.uid).limit(1).get();
    return result.docs.length ? result.docs[0].id : null;
  } catch (error) {
    return null;
  }
}

// Sağ üstteki "Kendi hikâyeni oluştur / Hikâyem / Çıkış" butonları
function renderAccountBar(auth, firestore, user, myStoryId) {
  const bar = $('#account-bar');
  const label = !user ? '✨ Kendi hikâyeni oluştur' : myStoryId ? '💌 Hikâyem' : '✨ Hikâyemi oluştur';

  bar.innerHTML = `<button class="btn small" id="acc-main">${label}</button>` +
    (user ? '<button class="btn small" id="acc-out">Çıkış</button>' : '');
  bar.hidden = false;

  $('#acc-main').addEventListener('click', async () => {
    try {
      let current = user;
      if (!current) {
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        current = result.user;
      }

      // Varsa mevcut hikâyeni aç, yoksa yenisini oluştur
      let id = myStoryId || await findMyStory(firestore, current);
      if (!id) {
        id = randomStoryId();
        await firestore.collection('stories').doc(id).set({
          ownerUid: current.uid,
          createdAt: Date.now(),
        });
      }
      location.href = location.pathname + '?h=' + id;
    } catch (error) {
      console.warn('Giriş/oluşturma hatası:', error);
      $('#acc-main').textContent = 'Bir hata oldu, tekrar dene';
    }
  });

  const logout = $('#acc-out');
  if (logout) {
    logout.addEventListener('click', async () => {
      await auth.signOut();
      location.href = location.pathname;
    });
  }
}

// Sahibe özel: paylaşım linki ve hikâyeyi silme
function setupOwnerTools(storyRef) {
  const link = location.origin + location.pathname + '?h=' + storyRef.id;
  $('#share-link').value = link;

  $('#copy-link').addEventListener('click', async (event) => {
    try {
      await navigator.clipboard.writeText(link);
      event.target.textContent = 'Kopyalandı ✓';
    } catch (error) {
      $('#share-link').select();
    }
  });

  let armed = false;
  $('#delete-story').addEventListener('click', async (event) => {
    if (!armed) {
      armed = true;
      event.target.textContent = 'Emin misin? Her şey silinir, tekrar bas';
      return;
    }
    for (const name of ['photos', 'images']) {
      const snapshot = await storyRef.collection(name).get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    }
    await storyRef.delete();
    location.href = location.pathname;
  });
}

async function connectFirebase() {
  if (!FIREBASE_CONFIG || typeof firebase === 'undefined') return;   // ayarlanmamış: tek kişilik mod

  firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  const firestore = firebase.firestore();
  const storyId = new URLSearchParams(location.search).get('h');

  // Giriş durumunu öğren
  const user = await new Promise((resolve) => auth.onAuthStateChanged(resolve));
  const myStoryId = user ? await findMyStory(firestore, user) : null;
  renderAccountBar(auth, firestore, user, myStoryId);

  // Varsayılan: sadece görüntüleme (düzenleme araçları gizli)
  document.body.classList.add('readonly');
  if (!storyId) return;                      // ana adres: temiz örnek sayfa

  const storyRef = firestore.collection('stories').doc(storyId);
  let snapshot = null;
  try { snapshot = await storyRef.get(); } catch (error) { /* bulunamadı say */ }
  if (!snapshot || !snapshot.exists) {
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="notfound">Bu hikâye bulunamadı ya da silinmiş.</div>');
    return;
  }

  // Bu bir hikâye: ortak depolama arayüzünü Firestore'a bağla
  const isOwner = !!user && snapshot.data().ownerUid === user.uid;
  shared.db = makeFirestoreFacade(storyRef);
  shared.assets = isOwner
    ? { upload: async (blob) => ({ id: await blobToDataUrl(blob) }), delete: async () => {} }
    : null;
  shared.active = true;
  shared.noMigrate = true;
  shared.limit = MAX_PHOTOS;

  CONFIG.minFrames = 0;                      // gerçek hikâyede boş çerçeve gösterme
  SHRINK.size = 1100;                        // veritabanına sığması için daha küçük
  SHRINK.quality = 0.72;
  state.uploadedPhotos = [];
  state.images = {};

  document.body.classList.toggle('readonly', !isOwner);
  document.body.classList.toggle('is-owner', isOwner);
  $('#hint').textContent = `Fotoğraflar bu hikâyede saklanır (en fazla ${MAX_PHOTOS}).`;
  if (isOwner) setupOwnerTools(storyRef);

  renderGallery();
  subscribeShared();
}


/* =========================================================
   10) BAŞLATMA
   ========================================================= */

async function init() {
  // PHOTOS listesindeki dosyaları fotoğraf nesnelerine çevir
  state.configPhotos = PHOTOS.map((item, i) => ({
    id: 'c' + i,
    src: item.file,
    album: item.album || 0,
    date: item.date || '',
    note: item.note || '',
    height: FRAME_HEIGHTS[i % FRAME_HEIGHTS.length],
  }));

  loadFavorites();
  loadSettings();
  applyTheme();
  applySavedTexts();
  if (!FIREBASE_CONFIG) await loadSavedImages();
  applyImages();
  setupIntro();
  renderAlbums();
  renderLetters();
  setupGallery();
  setupScrollEffects();
  setupMusic();
  setupEditMode();

  renderGallery();                 // önce boş çerçevelerle göster…
  if (!FIREBASE_CONFIG) await loadSavedPhotos();         // …sonra kayıtlı fotoğrafları yükle
  renderGallery();

  await connectShared();           // Claude'da yayındaysa ortak depolamaya geç
  if (!shared.active) await connectFirebase();   // GitHub'da: Firebase canlı sürümü
}

init();
