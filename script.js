// Элементы DOM
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const playlistEl = document.getElementById('playlist');

// Состояние плеера
let playlistData = [];
let currentIndex = 0;
let isPlaying = false;

function setButtonsState(enabled) {
    playBtn.disabled = !enabled;
    prevBtn.disabled = !enabled;
    nextBtn.disabled = !enabled;
}

function updatePlayButton() {
    playBtn.textContent = isPlaying ? '⏸' : '▶';
}

function getDriveIdFromUrl(url) {
    if (!url) return '';

    const directIdMatch = url.match(/^[A-Za-z0-9_-]{10,}$/);
    if (directIdMatch) {
        return directIdMatch[0];
    }

    try {
        const parsed = new URL(url, window.location.href);
        const idFromQuery = parsed.searchParams.get('id');
        if (idFromQuery) {
            return idFromQuery;
        }

        const pathMatch = parsed.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/);
        if (pathMatch && pathMatch[1]) {
            return pathMatch[1];
        }
    } catch (error) {
        // Игнорируем ошибки парсинга и продолжаем ниже
    }

    const fallbackMatch = url.match(/(?:\/file\/d\/|\/d\/)([A-Za-z0-9_-]{10,})(?:\/|$)/);
    if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1];
    }

    return '';
}

function buildDriveDownloadUrl(value) {
    const driveId = getDriveIdFromUrl(value);
    if (!driveId) return '';
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

function resolveTrackUrl(track) {
    if (!track) return '';

    if (track.url) {
        const directUrl = buildDriveDownloadUrl(track.url);
        if (directUrl) return directUrl;
        return track.url;
    }

    if (track.id) {
        return buildDriveDownloadUrl(track.id);
    }

    return '';
}

function setEmptyState(message = 'Плейлист пуст') {
    trackTitle.textContent = message;
    trackArtist.textContent = 'Добавьте треки в playlist.json';
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    audio.removeAttribute('src');
    audio.load();
    setButtonsState(false);
}

// 2. Инициализация (загрузка JSON)
async function initPlayer() {
    try {
        const response = await fetch('playlist.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        if (!Array.isArray(json)) {
            throw new Error('playlist.json должен содержать массив объектов');
        }

        playlistData = json;

        if (!playlistData.length) {
            setEmptyState();
            return;
        }

        setButtonsState(true);
        renderPlaylist();
        loadTrack(currentIndex);
    } catch (error) {
        console.error('Ошибка загрузки плейлиста:', error);
        setEmptyState('Ошибка загрузки');
        trackArtist.textContent = 'Проверьте playlist.json';
    }
}

// 3. Отображение плейлиста
function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlistData.forEach((track, index) => {
        const li = document.createElement('li');
        const title = track.title || 'Без названия';
        const artist = track.artist || 'Неизвестный исполнитель';
        li.textContent = `${artist} — ${title}`;

        if (index === currentIndex) {
            li.classList.add('active');
        }

        li.addEventListener('click', () => {
            currentIndex = index;
            loadTrack(currentIndex);
            playTrack();
        });

        playlistEl.appendChild(li);
    });
}

function updatePlaylistUI() {
    const items = playlistEl.querySelectorAll('li');
    items.forEach(item => item.classList.remove('active'));

    if (items[currentIndex]) {
        items[currentIndex].classList.add('active');
    }
}

// 4. Управление треком
function loadTrack(index) {
    if (!playlistData.length) {
        return;
    }

    const safeIndex = (index + playlistData.length) % playlistData.length;
    currentIndex = safeIndex;

    const track = playlistData[currentIndex];
    if (!track) {
        return;
    }

    trackTitle.textContent = track.title || 'Без названия';
    trackArtist.textContent = track.artist || 'Неизвестный исполнитель';

    const directLink = resolveTrackUrl(track);
    if (directLink) {
        audio.src = directLink;
        audio.load();
    } else {
        audio.removeAttribute('src');
        audio.load();
    }

    updatePlaylistUI();
}

function playTrack() {
    if (!playlistData.length) {
        return;
    }

    const directLink = resolveTrackUrl(playlistData[currentIndex]);
    if (!directLink) {
        console.error('Отсутствует рабочая ссылка для текущего трека');
        trackTitle.textContent = 'Ошибка трека';
        trackArtist.textContent = 'Проверьте id/ссылку в playlist.json';
        return;
    }

    if (audio.src !== directLink) {
        audio.src = directLink;
        audio.load();
    }

    isPlaying = true;
    updatePlayButton();
    audio.play().catch((error) => {
        console.error('Ошибка воспроизведения:', error);
        isPlaying = false;
        updatePlayButton();
        trackTitle.textContent = 'Ошибка воспроизведения';
        trackArtist.textContent = 'Проверьте доступ к файлу';
    });
}

function pauseTrack() {
    isPlaying = false;
    updatePlayButton();
    audio.pause();
}

function prevTrack() {
    if (!playlistData.length) {
        return;
    }

    currentIndex = (currentIndex - 1 + playlistData.length) % playlistData.length;
    loadTrack(currentIndex);
    playTrack();
}

function nextTrack() {
    if (!playlistData.length) {
        return;
    }

    currentIndex = (currentIndex + 1) % playlistData.length;
    loadTrack(currentIndex);
    playTrack();
}

// 5. Обработчики событий кнопок
playBtn.addEventListener('click', () => {
    if (!playlistData.length) {
        return;
    }

    isPlaying ? pauseTrack() : playTrack();
});
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

// 6. Работа с таймером и прогресс-баром
function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '0:00';
    }

    const safeSeconds = Math.floor(seconds);
    const min = Math.floor(safeSeconds / 60);
    const sec = safeSeconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

function updateProgressBar() {
    const { currentTime, duration } = audio;
    if (!Number.isFinite(duration) || duration <= 0) {
        progress.style.width = '0%';
        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = '0:00';
        return;
    }

    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${Math.min(progressPercent, 100)}%`;
    currentTimeEl.textContent = formatTime(currentTime);
    totalTimeEl.textContent = formatTime(duration);
}

audio.addEventListener('timeupdate', updateProgressBar);
audio.addEventListener('loadedmetadata', updateProgressBar);

audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton();
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton();
});

audio.addEventListener('error', () => {
    console.error('Ошибка загрузки аудиофайла:', audio.src);
    isPlaying = false;
    updatePlayButton();
    trackTitle.textContent = 'Ошибка воспроизведения';
    trackArtist.textContent = 'Проверьте id/ссылку в playlist.json';
});

// Перемотка при клике на прогресс-бар
progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = audio.duration;

    if (!Number.isFinite(duration) || duration <= 0 || width === 0) {
        return;
    }

    audio.currentTime = (clickX / width) * duration;
});

// Автоматическое переключение на следующий трек
audio.addEventListener('ended', () => {
    if (!playlistData.length) {
        return;
    }

    if (playlistData.length > 1) {
        nextTrack();
    } else {
        pauseTrack();
        audio.currentTime = 0;
        updateProgressBar();
    }
});

setButtonsState(false);
updatePlayButton();

// Запуск инициализации
initPlayer();
