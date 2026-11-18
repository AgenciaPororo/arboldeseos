// =========================================================================
// REPRODUCTOR DE MÚSICA DE FONDO CON YOUTUBE IFRAME API
// =========================================================================
const WINTER_VIDEO_ID = 'yXQViqx6GMY';
const SUMMER_VIDEO_ID = 'phC1sGpEeg4';

let ytPlayer = null;
let isPlayerReady = false;
let isMusicMuted = false;
let hasStartedPlayback = false;
let currentModeSummer = false;

// Cargar el script oficial de YouTube IFrame API
(function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('ytBackgroundPlayer', {
    height: '1',
    width: '1',
    videoId: WINTER_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      loop: 1,
      playlist: WINTER_VIDEO_ID,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: (event) => {
        isPlayerReady = true;
        event.target.setVolume(45);
        if (!isMusicMuted) {
          event.target.playVideo();
        }
      },
      onStateChange: (event) => {
        // Asegurar bucle continuo
        if (event.data === YT.PlayerState.ENDED && !isMusicMuted) {
          event.target.playVideo();
        }
        if (event.data === YT.PlayerState.PLAYING) {
          hasStartedPlayback = true;
        }
      }
    }
  });
};

function ensureAudioStartsOnFirstInteraction() {
  if (hasStartedPlayback || isMusicMuted || !isPlayerReady || !ytPlayer) return;
  try {
    ytPlayer.unMute();
    ytPlayer.setVolume(45);
    ytPlayer.playVideo();
    hasStartedPlayback = true;
  } catch (e) {}
}

function switchBackgroundMusic(summer) {
  currentModeSummer = summer;
  if (!isPlayerReady || !ytPlayer) return;

  const targetVideoId = summer ? SUMMER_VIDEO_ID : WINTER_VIDEO_ID;
  ytPlayer.loadPlaylist({
    playlist: [targetVideoId],
    index: 0,
    startSeconds: 0
  });

  if (isMusicMuted) {
    ytPlayer.mute();
  } else {
    ytPlayer.unMute();
    ytPlayer.setVolume(45);
    ytPlayer.playVideo();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. CONFIGURACIÓN FIREBASE REALTIME DATABASE + GOOGLE APPS SCRIPT
  // =========================================================================
  const FIREBASE_DB_URL = 'https://deseosarbol-default-rtdb.firebaseio.com';
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAlDD-x5lcx5_fxA1uORG2qKCAaAWTi7eRazaXEyM1g62QJonAXqMQruT1FyAh0WG0/exec';
  const ADMIN_PASS = 'deseospororo';

  // Capas del árbol
  const wishesLayer = document.getElementById('wishesLayer');
  const giftsPileLayer = document.getElementById('giftsPileLayer');
  const starSparklesLayer = document.getElementById('starSparklesLayer');
  const toastNotification = document.getElementById('toastNotification');

  // Estrella, clima y botón de silenciar
  const treeStarBtn = document.getElementById('treeStarBtn');
  const btnWeatherMeme = document.getElementById('btnWeatherMeme');
  const weatherIcon = document.getElementById('weatherIcon');
  const weatherText = document.getElementById('weatherText');
  const snowContainer = document.getElementById('snowContainer');

  const btnMuteMusic = document.getElementById('btnMuteMusic');
  const iconSoundOn = document.getElementById('iconSoundOn');
  const iconSoundOff = document.getElementById('iconSoundOff');
  const muteLabel = document.getElementById('muteLabel');

  // Modales
  const writeModal = document.getElementById('writeModal');
  const paperSheet = document.getElementById('paperSheet');
  const wishForm = document.getElementById('wishForm');
  const btnSubmitWish = document.getElementById('btnSubmitWish');

  const someoneModal = document.getElementById('someoneModal');
  const someonePaperSheet = document.getElementById('someonePaperSheet');
  const someoneWishForm = document.getElementById('someoneWishForm');
  const btnSubmitSomeone = document.getElementById('btnSubmitSomeone');

  const giftModal = document.getElementById('giftModal');
  const giftPaperSheet = document.getElementById('giftPaperSheet');
  const giftForm = document.getElementById('giftForm');
  const btnSubmitGift = document.getElementById('btnSubmitGift');

  const viewModal = document.getElementById('viewModal');
  const viewGiftModal = document.getElementById('viewGiftModal');
  const celebrationModal = document.getElementById('celebrationModal');

  // Campos de imagen en regalo
  const giftImageInput = document.getElementById('giftImageInput');
  const giftImageLabel = document.getElementById('giftImageLabel');
  const giftImagePreviewWrap = document.getElementById('giftImagePreviewWrap');
  const giftImagePreview = document.getElementById('giftImagePreview');
  const btnRemoveGiftImage = document.getElementById('btnRemoveGiftImage');

  // Administración
  const btnAdminGear = document.getElementById('btnAdminGear');
  const adminModal = document.getElementById('adminModal');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminErrorMsg = document.getElementById('adminErrorMsg');
  const adminPanelContent = document.getElementById('adminPanelContent');
  const adminWishesList = document.getElementById('adminWishesList');

  // Botones del Dock
  const btnOpenModal = document.getElementById('btnOpenModal');
  const btnOpenSomeoneModal = document.getElementById('btnOpenSomeoneModal');
  const btnOpenGiftModal = document.getElementById('btnOpenGiftModal');

  // Botones de cierre
  const closeWriteModal = document.getElementById('closeWriteModal');
  const closeSomeoneModal = document.getElementById('closeSomeoneModal');
  const closeGiftModal = document.getElementById('closeGiftModal');
  const closeViewModal = document.getElementById('closeViewModal');
  const closeViewGiftModal = document.getElementById('closeViewGiftModal');
  const closeCelebrationModal = document.getElementById('closeCelebrationModal');
  const btnCloseCelebration = document.getElementById('btnCloseCelebration');

  // Estado
  let wishesCache = [];
  let giftsCache = [];
  let selectedWrapColor = '#be123c';
  let selectedRibbonColor = '#fbbf24';
  let uploadedGiftImageBase64 = '';
  let isSummerMode = false;

  // Iniciar música con la primera interacción en cualquier parte de la pantalla
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, ensureAudioStartsOnFirstInteraction, { once: true });
  });

  // Botón de silenciar / activar música
  btnMuteMusic.addEventListener('click', (e) => {
    e.stopPropagation();
    isMusicMuted = !isMusicMuted;
    btnMuteMusic.classList.toggle('muted', isMusicMuted);

    if (isMusicMuted) {
      iconSoundOn.style.display = 'none';
      iconSoundOff.style.display = 'block';
      muteLabel.textContent = 'Silenciado';
      if (isPlayerReady && ytPlayer) {
        ytPlayer.mute();
      }
    } else {
      iconSoundOn.style.display = 'block';
      iconSoundOff.style.display = 'none';
      muteLabel.textContent = 'Sonido';
      if (isPlayerReady && ytPlayer) {
        ytPlayer.unMute();
        ytPlayer.setVolume(45);
        ytPlayer.playVideo();
        hasStartedPlayback = true;
      }
    }
  });

  function showToast(message, duration = 4500) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => toastNotification.classList.remove('show'), duration);
  }

  function generateSecretToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function getFormattedToday() {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // =========================================================================
  // 2. CONEXIÓN A FIREBASE REALTIME DATABASE (wishes y gifts)
  // =========================================================================
  async function syncFromFirebase() {
    try {
      const [wishesRes, giftsRes] = await Promise.all([
        fetch(`${FIREBASE_DB_URL}/wishes.json`),
        fetch(`${FIREBASE_DB_URL}/gifts.json`)
      ]);

      const wishesData = await wishesRes.json();
      const giftsData = await giftsRes.json();

      wishesCache = wishesData
        ? Object.entries(wishesData)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        : [];

      giftsCache = giftsData
        ? Object.entries(giftsData)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        : [];

      renderTree();
      renderGiftsPile();

      if (adminModal.classList.contains('active') && adminPanelContent.style.display === 'block') {
        renderAdminList();
      }
    } catch (error) {
      console.error('Error sincronizando con Firebase:', error);
    }
  }

  // =========================================================================
  // 3. ÚNICA FORMA DE MARCAR COMO CUMPLIDO: CLIC EN EL ENLACE DEL CORREO
  // =========================================================================
  async function checkEmailFulfillLink() {
    const params = new URLSearchParams(window.location.search);
    const wishId = params.get('cumplir');
    const token = params.get('token');

    if (!wishId || !token) return;

    try {
      const res = await fetch(`${FIREBASE_DB_URL}/wishes/${encodeURIComponent(wishId)}.json`);
      const data = await res.json();

      if (!data) {
        showToast('No encontramos ese deseo en el árbol.');
        return;
      }

      if (data.token !== token) {
        showToast('El enlace de confirmación no es válido.');
        return;
      }

      const fulfilledDate = data.fulfilledDate || getFormattedToday();

      if (!data.fulfilled) {
        const patchRes = await fetch(`${FIREBASE_DB_URL}/wishes/${encodeURIComponent(wishId)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fulfilled: true,
            fulfilledDate: fulfilledDate
          })
        });

        if (!patchRes.ok) {
          throw new Error('No se pudo actualizar en Firebase');
        }
      }

      window.history.replaceState({}, document.title, window.location.pathname);

      await syncFromFirebase();

      document.getElementById('celebrationTitle').textContent = `¡Felicitaciones, ${data.name}!`;
      document.getElementById('celebrationWishText').textContent = data.wish;
      document.getElementById('celebrationDatesInfo').textContent = `Colgado el ${data.date} • Cumplido el ${fulfilledDate}`;
      celebrationModal.classList.add('active');
      treeStarBtn.dispatchEvent(new Event('click'));

    } catch (err) {
      console.error(err);
      showToast('Ocurrió un error al marcar tu deseo como cumplido.');
    }
  }

  // --- INTERACCIÓN CARTELITO ARGENTINA (Cambia tema visual + música) ---
  btnWeatherMeme.addEventListener('click', () => {
    isSummerMode = !isSummerMode;
    document.body.classList.toggle('summer-mode', isSummerMode);
    switchBackgroundMusic(isSummerMode);

    if (isSummerMode) {
      weatherIcon.textContent = '☀️';
      weatherText.textContent = 'Modo 47°C activado (igual la nieve quedaba más chill, tocá para volver)';
      snowContainer.style.opacity = '0.08';
    } else {
      weatherIcon.textContent = '❄️';
      weatherText.textContent = 'En Argentina tenemos 47 grados a la sombra pero la nieve quedaba más chill';
      snowContainer.style.opacity = '1';
    }
  });

  // --- INTERACCIÓN ESTRELLA DE LA PUNTA ---
  treeStarBtn.addEventListener('click', () => {
    treeStarBtn.classList.remove('spin-magic');
    void treeStarBtn.offsetWidth;
    treeStarBtn.classList.add('spin-magic');

    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'magic-sparkle';
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.3);
      const distance = 45 + Math.random() * 75;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      sparkle.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      sparkle.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      sparkle.style.background = i % 2 === 0 ? '#fde047' : '#ffffff';

      starSparklesLayer.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1000);
    }
  });

  // Coordenadas dentro del follaje del árbol
  function getRandomTreeCoordinates() {
    const y = Math.floor(Math.random() * (75 - 18 + 1)) + 18;
    const progress = (y - 14) / 64;
    const halfWidth = 8 + progress * 31;
    const minX = 50 - halfWidth;
    const maxX = 50 + halfWidth;
    const x = Math.random() * (maxX - minX) + minX;
    return { x: Number(x.toFixed(1)), y };
  }

  // Renderizar etiquetas en las ramas
  function renderTree() {
    wishesLayer.innerHTML = '';

    wishesCache.forEach((item, index) => {
      const tag = document.createElement('div');
      const isDedicated = item.type === 'dedicated';
      tag.className = `hanging-tag ${isDedicated ? 'dedicated' : ''} ${item.fulfilled ? 'fulfilled' : ''}`;
      tag.style.left = `${item.x}%`;
      tag.style.top = `${item.y}%`;
      tag.style.animationDelay = `${(index % 5) * 0.4}s, 0s`;
      tag.title = isDedicated ? `Deseo para ${item.to} (de ${item.from})` : `Deseo de ${item.name}`;

      const label = document.createElement('span');
      label.textContent = isDedicated ? `Para ${item.to}` : item.name;
      tag.appendChild(label);

      tag.addEventListener('click', () => openWishDetail(item.id));
      wishesLayer.appendChild(tag);
    });
  }

  // Renderizar pila de regalos debajo del árbol
  function renderGiftsPile() {
    giftsPileLayer.innerHTML = '';

    const slots = [
      { left: 26, bottom: 2, w: 46, h: 36, z: 2 },
      { left: 62, bottom: 2, w: 50, h: 38, z: 2 },
      { left: 14, bottom: 0, w: 42, h: 32, z: 3 },
      { left: 44, bottom: 0, w: 48, h: 34, z: 4 },
      { left: 76, bottom: 0, w: 40, h: 30, z: 3 },
      { left: 32, bottom: 35, w: 40, h: 30, z: 5 },
      { left: 56, bottom: 37, w: 42, h: 31, z: 5 },
      { left: 20, bottom: 30, w: 36, h: 28, z: 6 },
      { left: 70, bottom: 29, w: 36, h: 28, z: 6 },
      { left: 44, bottom: 63, w: 36, h: 27, z: 7 },
      { left: 36, bottom: 60, w: 34, h: 26, z: 8 },
      { left: 54, bottom: 61, w: 34, h: 26, z: 8 }
    ];

    giftsCache.forEach((gift, index) => {
      const slot = slots[index % slots.length];
      const cycle = Math.floor(index / slots.length);
      const extraBottom = cycle * 22;
      const jitterX = cycle > 0 ? ((index % 3) - 1) * 4 : 0;

      const box = document.createElement('div');
      box.className = 'gift-package';
      box.style.left = `calc(${slot.left + jitterX}% - ${slot.w / 2}px)`;
      box.style.bottom = `${slot.bottom + extraBottom}px`;
      box.style.width = `${slot.w}px`;
      box.style.height = `${slot.h}px`;
      box.style.background = gift.wrapColor;
      box.style.zIndex = slot.z + cycle * 4;
      box.title = `Regalo de ${gift.from} para ${gift.to} — Haz clic para abrir`;

      box.innerHTML = `
        <div class="gift-package-lid" style="background:${gift.wrapColor}"></div>
        <div class="gift-package-ribbon-v" style="background:${gift.ribbonColor}"></div>
        <div class="gift-package-ribbon-h" style="background:${gift.ribbonColor}"></div>
        <div class="gift-package-bow" style="background:${gift.ribbonColor}"></div>
      `;

      box.addEventListener('click', () => openGiftDetail(gift.id));
      giftsPileLayer.appendChild(box);
    });
  }

  // =========================================================================
  // 4. MODAL 1: Escribí tu deseo (Firebase + Google Apps Script + Cierre)
  // =========================================================================
  btnOpenModal.addEventListener('click', () => {
    paperSheet.classList.remove('folding');
    wishForm.reset();
    writeModal.classList.add('active');
    setTimeout(() => document.getElementById('userName').focus(), 100);
  });

  closeWriteModal.addEventListener('click', () => writeModal.classList.remove('active'));

  wishForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const wishText = document.getElementById('userWish').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    if (!name || !wishText || !email) return;

    const coords = getRandomTreeCoordinates();
    const token = generateSecretToken();
    const formattedDate = getFormattedToday();

    btnSubmitWish.disabled = true;
    btnSubmitWish.textContent = 'Colgando deseo en el árbol...';

    try {
      const newWishPayload = {
        type: 'personal',
        name,
        wish: wishText,
        email,
        date: formattedDate,
        fulfilled: false,
        fulfilledDate: '',
        token,
        x: coords.x,
        y: coords.y,
        createdAt: Date.now()
      };

      const fbResponse = await fetch(`${FIREBASE_DB_URL}/wishes.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWishPayload)
      });

      const fbResult = await fbResponse.json();
      const wishId = fbResult.name;

      const currentUrl = window.location.href.split('?')[0].split('#')[0];
      const fulfillLink = `${currentUrl}?cumplir=${encodeURIComponent(wishId)}&token=${encodeURIComponent(token)}`;

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          wishId: wishId,
          nombre: name,
          email: email,
          deseo: wishText,
          fecha: formattedDate,
          recordatorio_programado: '23/12/2027',
          enlace_deseo_cumplido: fulfillLink
        })
      });

      wishesCache.push({ id: wishId, ...newWishPayload });
      renderTree();

      paperSheet.classList.add('folding');
      setTimeout(() => {
        writeModal.classList.remove('active');
        paperSheet.classList.remove('folding');
        showToast('¡Tu deseo ya está colgado y te enviamos un correo de confirmación!');
      }, 420);

    } catch (err) {
      console.error(err);
      showToast('Hubo un problema al colgar tu deseo. Intentá de nuevo.');
    } finally {
      btnSubmitWish.disabled = false;
      btnSubmitWish.textContent = 'Doblar papel y colgar en el árbol';
    }
  });

  // =========================================================================
  // 5. MODAL 2: Dejale un deseo a alguien (Firebase + Cierre automático)
  // =========================================================================
  btnOpenSomeoneModal.addEventListener('click', () => {
    someonePaperSheet.classList.remove('folding');
    someoneWishForm.reset();
    someoneModal.classList.add('active');
    setTimeout(() => document.getElementById('wishFrom').focus(), 100);
  });

  closeSomeoneModal.addEventListener('click', () => someoneModal.classList.remove('active'));

  someoneWishForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('wishFrom').value.trim();
    const to = document.getElementById('wishTo').value.trim();
    const wishText = document.getElementById('someoneWishText').value.trim();
    if (!from || !to || !wishText) return;

    const coords = getRandomTreeCoordinates();
    const formattedDate = getFormattedToday();

    btnSubmitSomeone.disabled = true;
    btnSubmitSomeone.textContent = 'Colgando deseo...';

    try {
      const payload = {
        type: 'dedicated',
        from,
        to,
        name: `Para ${to}`,
        wish: wishText,
        date: formattedDate,
        fulfilled: false,
        x: coords.x,
        y: coords.y,
        createdAt: Date.now()
      };

      const fbRes = await fetch(`${FIREBASE_DB_URL}/wishes.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const fbData = await fbRes.json();

      wishesCache.push({ id: fbData.name, ...payload });
      renderTree();

      someonePaperSheet.classList.add('folding');
      setTimeout(() => {
        someoneModal.classList.remove('active');
        someonePaperSheet.classList.remove('folding');
        showToast(`¡Deseo para ${to} colgado en el árbol!`);
      }, 420);
    } catch (err) {
      showToast('No se pudo colgar el deseo dedicado.');
    } finally {
      btnSubmitSomeone.disabled = false;
      btnSubmitSomeone.textContent = 'Doblar y colgar deseo en el árbol';
    }
  });

  // =========================================================================
  // 6. MODAL 3: Dejá un regalito en el árbol (Firebase + Cierre automático)
  // =========================================================================
  function updateGiftPreview() {
    document.getElementById('giftBoxPreview').style.background = selectedWrapColor;
    document.getElementById('giftLidPreview').style.background = selectedWrapColor;
    document.getElementById('giftRibbonVPreview').style.background = selectedRibbonColor;
    document.getElementById('giftRibbonHPreview').style.background = selectedRibbonColor;
    document.getElementById('giftBowPreview').style.background = selectedRibbonColor;
  }

  document.querySelectorAll('#wrapColorSwatches .swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wrapColorSwatches .swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      selectedWrapColor = btn.dataset.color;
      updateGiftPreview();
    });
  });

  document.querySelectorAll('#ribbonColorSwatches .swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ribbonColorSwatches .swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      selectedRibbonColor = btn.dataset.color;
      updateGiftPreview();
    });
  });

  function resetUploadedImage() {
    uploadedGiftImageBase64 = '';
    giftImageInput.value = '';
    giftImageLabel.textContent = 'Subir una foto desde tu dispositivo';
    giftImagePreviewWrap.style.display = 'none';
    giftImagePreview.src = '';
  }

  giftImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        uploadedGiftImageBase64 = canvas.toDataURL('image/jpeg', 0.78);
        giftImagePreview.src = uploadedGiftImageBase64;
        giftImagePreviewWrap.style.display = 'flex';
        giftImageLabel.textContent = file.name;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  btnRemoveGiftImage.addEventListener('click', resetUploadedImage);

  function getYoutubeEmbedId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  btnOpenGiftModal.addEventListener('click', () => {
    giftPaperSheet.classList.remove('folding');
    giftForm.reset();
    resetUploadedImage();
    updateGiftPreview();
    giftModal.classList.add('active');
    setTimeout(() => document.getElementById('giftFrom').focus(), 100);
  });

  closeGiftModal.addEventListener('click', () => giftModal.classList.remove('active'));

  giftForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('giftFrom').value.trim();
    const to = document.getElementById('giftTo').value.trim();
    const content = document.getElementById('giftContent').value.trim();
    const youtubeUrl = document.getElementById('giftYoutube').value.trim();
    if (!from || !to || !content) return;

    btnSubmitGift.disabled = true;
    btnSubmitGift.textContent = 'Dejando regalo al pie del árbol...';

    try {
      const payload = {
        from,
        to,
        content,
        image: uploadedGiftImageBase64,
        youtubeUrl,
        wrapColor: selectedWrapColor,
        ribbonColor: selectedRibbonColor,
        date: getFormattedToday(),
        createdAt: Date.now()
      };

      const fbRes = await fetch(`${FIREBASE_DB_URL}/gifts.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const fbData = await fbRes.json();

      giftsCache.push({ id: fbData.name, ...payload });
      renderGiftsPile();

      giftPaperSheet.classList.add('folding');
      setTimeout(() => {
        giftModal.classList.remove('active');
        giftPaperSheet.classList.remove('folding');
        showToast(`¡Regalo para ${to} dejado al pie del árbol!`);
      }, 420);
    } catch (err) {
      showToast('No se pudo guardar el regalo.');
    } finally {
      btnSubmitGift.disabled = false;
      btnSubmitGift.textContent = 'Dejar en el árbol';
    }
  });

  // Cerrar modales al hacer clic fuera
  [writeModal, someoneModal, giftModal, viewModal, viewGiftModal, adminModal, celebrationModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (modal === viewGiftModal) {
          document.getElementById('viewGiftMedia').innerHTML = '';
        }
      }
    });
  });

  closeCelebrationModal.addEventListener('click', () => celebrationModal.classList.remove('active'));
  btnCloseCelebration.addEventListener('click', () => celebrationModal.classList.remove('active'));

  // --- MODAL 4: Ver detalle de deseo (solo lectura, con ambas fechas si está cumplido) ---
  function openWishDetail(id) {
    const wish = wishesCache.find(w => w.id === id);
    if (!wish) return;

    const authorLine = document.getElementById('viewAuthorLine');
    const badge = document.getElementById('viewStatus');
    const fulfilledDateEl = document.getElementById('viewFulfilledDate');

    if (wish.type === 'dedicated') {
      authorLine.innerHTML = `De <strong>${wish.from}</strong> para <strong>${wish.to}</strong>`;
    } else {
      authorLine.innerHTML = `Deseo de <strong>${wish.name}</strong>`;
    }

    document.getElementById('viewText').textContent = wish.wish;
    document.getElementById('viewDate').textContent = `Colgado el ${wish.date}`;

    if (wish.fulfilled) {
      badge.textContent = '✨ Deseo cumplido';
      badge.className = 'status-badge fulfilled';
      fulfilledDateEl.style.display = 'block';
      fulfilledDateEl.textContent = wish.fulfilledDate
        ? `🎉 Cumplido el ${wish.fulfilledDate}`
        : '🎉 Marcado como cumplido';
    } else {
      badge.textContent = wish.type === 'dedicated' ? 'Deseo dedicado' : 'Esperando hacerse realidad';
      badge.className = `status-badge ${wish.type === 'dedicated' ? 'dedicated' : ''}`;
      fulfilledDateEl.style.display = 'none';
      fulfilledDateEl.textContent = '';
    }

    viewModal.classList.add('active');
  }

  closeViewModal.addEventListener('click', () => viewModal.classList.remove('active'));

  // --- MODAL 5: Ver detalle de regalo (con Foto y/o YouTube) ---
  function openGiftDetail(id) {
    const gift = giftsCache.find(g => g.id === id);
    if (!gift) return;

    document.getElementById('viewGiftFrom').textContent = gift.from;
    document.getElementById('viewGiftTo').textContent = gift.to;
    document.getElementById('viewGiftText').textContent = gift.content;
    document.getElementById('viewGiftDate').textContent = `Dejado al pie del árbol el ${gift.date}`;

    const mediaContainer = document.getElementById('viewGiftMedia');
    mediaContainer.innerHTML = '';

    if (gift.image) {
      const img = document.createElement('img');
      img.src = gift.image;
      img.alt = `Regalo de ${gift.from}`;
      img.className = 'gift-opened-img';
      mediaContainer.appendChild(img);
    }

    if (gift.youtubeUrl) {
      const videoId = getYoutubeEmbedId(gift.youtubeUrl);
      if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.className = 'gift-youtube-frame';
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.title = 'Canción de regalo';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        mediaContainer.appendChild(iframe);
      } else {
        const link = document.createElement('a');
        link.href = gift.youtubeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'gift-youtube-link';
        link.textContent = '🎵 Escuchar canción en YouTube';
        mediaContainer.appendChild(link);
      }
    }

    viewGiftModal.classList.add('active');
  }

  closeViewGiftModal.addEventListener('click', () => {
    viewGiftModal.classList.remove('active');
    document.getElementById('viewGiftMedia').innerHTML = '';
  });

  // =========================================================================
  // 7. MODAL 6: Administración (Eliminación en Firebase + Cierre automático)
  // =========================================================================
  btnAdminGear.addEventListener('click', () => {
    adminLoginForm.reset();
    adminErrorMsg.style.display = 'none';
    adminLoginForm.style.display = 'block';
    adminPanelContent.style.display = 'none';
    adminModal.classList.add('active');
    setTimeout(() => adminPassInput.focus(), 100);
  });

  closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));

  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPassInput.value === ADMIN_PASS) {
      adminErrorMsg.style.display = 'none';
      adminLoginForm.style.display = 'none';
      adminPanelContent.style.display = 'block';
      renderAdminList();
    } else {
      adminErrorMsg.style.display = 'block';
      adminPassInput.value = '';
      adminPassInput.focus();
    }
  });

  async function deleteWish(id, btnElement) {
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.textContent = 'Eliminando...';
    }
    try {
      await fetch(`${FIREBASE_DB_URL}/wishes/${id}.json`, {
        method: 'DELETE'
      });

      wishesCache = wishesCache.filter(w => w.id !== id);
      renderTree();
      adminModal.classList.remove('active');
      showToast('Deseo eliminado del árbol.');
    } catch (err) {
      showToast('Error al eliminar el deseo.');
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = 'Eliminar';
      }
    }
  }

  async function deleteGift(id, btnElement) {
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.textContent = 'Eliminando...';
    }
    try {
      await fetch(`${FIREBASE_DB_URL}/gifts/${id}.json`, {
        method: 'DELETE'
      });

      giftsCache = giftsCache.filter(g => g.id !== id);
      renderGiftsPile();
      adminModal.classList.remove('active');
      showToast('Regalo eliminado del árbol.');
    } catch (err) {
      showToast('Error al eliminar el regalo.');
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = 'Eliminar';
      }
    }
  }

  function renderAdminList() {
    adminWishesList.innerHTML = '';

    if (wishesCache.length === 0 && giftsCache.length === 0) {
      adminWishesList.innerHTML = '<p style="font-size:0.88rem; color:#64748b; padding: 0.75rem 0;">No hay deseos ni regalos en el árbol.</p>';
      return;
    }

    wishesCache.forEach(w => {
      const title = w.type === 'dedicated' ? `Deseo de ${w.from} para ${w.to}` : `Deseo de ${w.name}`;
      const item = document.createElement('div');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-item-info">
          <strong>${title}</strong>
          <p>${w.wish}</p>
        </div>
        <button type="button" class="btn-delete-wish">Eliminar</button>
      `;
      const btn = item.querySelector('button');
      btn.addEventListener('click', () => deleteWish(w.id, btn));
      adminWishesList.appendChild(item);
    });

    giftsCache.forEach(g => {
      const item = document.createElement('div');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-item-info">
          <strong>🎁 Regalo de ${g.from} para ${g.to}</strong>
          <p>${g.content}</p>
        </div>
        <button type="button" class="btn-delete-wish">Eliminar</button>
      `;
      const btn = item.querySelector('button');
      btn.addEventListener('click', () => deleteGift(g.id, btn));
      adminWishesList.appendChild(item);
    });
  }

  // Nieve atmosférica
  function createSnow() {
    const flakes = 45;
    for (let i = 0; i < flakes; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      const size = Math.random() * 4 + 2;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.left = `${Math.random() * 100}vw`;
      flake.style.opacity = (Math.random() * 0.45 + 0.15).toFixed(2);
      if (size > 4.5) flake.style.filter = 'blur(1px)';
      flake.style.animationDuration = `${Math.random() * 8 + 7}s`;
      flake.style.animationDelay = `${Math.random() * 6}s`;
      snowContainer.appendChild(flake);
    }
  }

  // Arranque inicial y actualización en vivo cada 3.5 segundos
  createSnow();
  syncFromFirebase().then(() => {
    checkEmailFulfillLink();
  });
  setInterval(syncFromFirebase, 3500);
});