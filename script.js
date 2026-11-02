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

// 1. Преобразование ссылок Google Drive
function getDirectDriveLink(url) {
    const match = url.match(/\/d\/(.+?)\//);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
}

// 2. Инициализация (загрузка JSON)
async function initPlayer() {
    try {
        // Загружаем данные плейлиста
        const response = await fetch('playlist.json');
        playlistData = await response.json();
        
        renderPlaylist();
        loadTrack(currentIndex);
    } catch (error) {
        console.error('Ошибка загрузки плейлиста:', error);
        trackTitle.textContent = 'Ошибка загрузки';
        trackArtist.textContent = 'Проверьте playlist.json';
    }
}

// 3. Отображение плейлиста
function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlistData.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = `${track.artist} — ${track.title}`;
        if (index === currentIndex) li.classList.add('active');
        
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
    const track = playlistData[index];
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // Применяем прямую ссылку
    audio.src = getDirectDriveLink(track.url);
    updatePlaylistUI();
}

function playTrack() {
    isPlaying = true;
    playBtn.textContent = '⏸';
    audio.play();
}

function pauseTrack() {
    isPlaying = false;
    playBtn.textContent = '▶';
    audio.pause();
}

function prevTrack() {
    currentIndex = (currentIndex - 1 + playlistData.length) % playlistData.length;
    loadTrack(currentIndex);
    playTrack();
}

function nextTrack() {
    currentIndex = (currentIndex + 1) % playlistData.length;
    loadTrack(currentIndex);
    playTrack();
}

// 5. Обработчики событий кнопок
playBtn.addEventListener('click', () => isPlaying ? pauseTrack() : playTrack());
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

// 6. Работа с таймером и прогресс-баром
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

audio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audio;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = formatTime(duration);
    }
});

// Перемотка при клике на прогресс-бар
progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
});

// Автоматическое переключение на следующий трек
audio.addEventListener('ended', nextTrack);

// Запуск инициализации
initPlayer();
