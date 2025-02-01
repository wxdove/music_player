let currentSound = null;      // Howler音频实例
let currentTrackIndex = -1;   // 当前播放索引
let playlist = [];            // 播放列表
let isSeeking = false;        // 是否正在拖拽进度条
let lyrics = [];              // 歌词数组
let currentLyricIndex = -1;   // 当前显示的歌词索引

const SEARCH_DELAY = 1000;    // 搜索防抖延迟(毫秒)

const dom = {
    searchInput: document.getElementById('searchInput'),
    resultsContainer: document.getElementById('results'),
    playerContainer: document.getElementById('player'),
    trackTitle: document.getElementById('trackTitle'),
    trackArtist: document.getElementById('trackArtist'),
    currentArt: document.getElementById('currentArt'),
    progress: document.getElementById('progress'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeLabel: document.getElementById('volumeLabel'),
    progressContainer: document.querySelector('.progress-container'),
    lyricsText: document.getElementById('lyricsText')  // 歌词文本容器
};
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
const searchIcon = document.querySelector('.search-icon');
const searchInput = document.getElementById('searchInput');
searchIcon.addEventListener('click', () => {
    const query = searchInput.value.trim();
    searchIcon.classList.add('clicked'); // 添加点击效果类
    if (query) {
        searchHandler(query);
    } else {
        alert('Please enter your search!');
    }
    setTimeout(() => {
        searchIcon.classList.remove('clicked');
    }, 300);
});
// 显示加载状态
const showLoading = (show) => {
    dom.resultsContainer.innerHTML = show ?
        `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Xudong is working hard to search...</div>` :
        '';
};

// 显示错误提示
const showError = (message) => {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      ${message}
    </div>`;
};

// 防抖搜索函数
// 搜索功能（防抖处理）
// 搜索功能（防抖处理）
const searchHandler = _.debounce(async (query, api) => {
    if (!query.trim()) {
        dom.resultsContainer.innerHTML = `
      <div class="placeholder">
        <i class="fas fa-music"></i>
        <p>Enter keywords to search for music</p>
      </div>`;
        return;
    }
    showLoading(true);  // 显示加载动画
    try {
        let url = '';
        if (api === 'api1') {
            url = `http://127.0.0.1:5000/search1?q=${query}`;  // 网易云音乐的搜索接口
        } else if (api === 'api2') {
            url = `http://127.0.0.1:5000/search2?q=${query}`;  // 酷狗音乐的搜索接口
        } else if (api === 'api3') {
            url = `http://127.0.0.1:5000/search3?q=${query}`;  // 酷我音乐的搜索接口
        }

        const response = await fetch(url);
        const songs = await response.json();
        renderResults(songs);  // 渲染搜索结果
    } catch (error) {
        console.error('搜索失败:', error);
    }
}, SEARCH_DELAY);

// 监听搜索图标点击事件
document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value.trim();  // 获取输入框的内容
    const selectedAPI = document.getElementById('apiSelect').value;    // 获取选择的API

    // 调用搜索处理函数，传递查询内容和选择的API
    searchHandler(query, selectedAPI);
});

// 监听搜索图标点击事件
document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value.trim();  // 获取输入框的内容
    const selectedAPI = document.getElementById('apiSelect').value;    // 获取选择的API
    searchHandler(query, selectedAPI);
});

const renderResults = (songs) => {
    if (!songs || songs.length === 0) {
        dom.resultsContainer.innerHTML = `
      <div class="no-results">
        <p>没有找到相关结果。</p>
      </div>`;
        return;
    }
    updatePlaylist(songs);
    dom.resultsContainer.innerHTML = songs.map((song, index) => {
        return `
      <div class="song-card" 
           data-index="${index}"
           data-url="${song.play_url}"
           data-img="${song.img}">
        <div class="album-thumb">
          <img src="${song.img || 'static/images/pic_player.png'}" 
               alt="封面" 
               onerror="this.src='static/images/pic_player.png'">
        </div>
        <div class="song-info">
          <h4>${song.SongName}</h4>
          <p>${song.SingerName}</p>
        </div>
        <i class="fas fa-play play-icon"></i>
      </div>
    `;
    }).join('');
    document.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.song-card').forEach(card => card.classList.remove('highlight'));
            card.classList.add('highlight');
            const songData = {
                index: parseInt(card.dataset.index),
                url: card.dataset.url,
                img: card.dataset.img,
                title: card.querySelector('h4').textContent,
                artist: card.querySelector('p').textContent
            };
            playTrack(songData.index);
        });
    });
};
// 更新播放列表
const updatePlaylist = (songs) => {
    playlist = songs;
    currentTrackIndex = 0;
};
// 解析歌词
const parseLyrics = (lyricsText) => {
    const lines = lyricsText.split('\n');
    const lyrics = [];
    const metadata = []; // 存储作词、作曲等信息
    const regex = /^\[([0-9]{2}):([0-9]{2})\.(\d{2,3})\](.*)$/;
    const metaRegex = /^(作词|作曲|编曲|演唱|制作|歌手|专辑|编制)/;

    lines.forEach((line, index) => {
        line = line.trim().replace(/\ufeff/g, ''); // 去除 BOM 头

        if (!line) return; // 跳过空行

        // 处理作词、作曲、编曲等信息，并存入 metadata
        if (metaRegex.test(line)) {
            metadata.push({ time: 0, text: line });
            return;
        }

        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const text = match[4].trim();

            if (text) {
                const time = minutes * 60 + seconds + milliseconds / 1000;
                lyrics.push({ time, text });
            }
        } else {
            console.warn(`歌词解析失败: 第 ${index + 1} 行： ${line}`);
        }
    });

    // 如果没有有效歌词，返回“没有歌词”
    return lyrics.length > 0 ? [...metadata, ...lyrics] : [{ time: 0, text: '没有歌词' }];
};
// 显示歌词
const displayLyrics = () => {
    if (currentLyricIndex >= 0 && currentLyricIndex < lyrics.length) {
        const currentLyric = lyrics[currentLyricIndex];
        dom.lyricsText.textContent = currentLyric.text;

        const lineHeight = 30;  // 每行的高度（可以根据实际情况调整）
        const offset = currentLyricIndex * lineHeight;  // 计算歌词滚动的偏移量
        dom.lyricsText.scrollTop = offset;
    }
};
// 更新歌词
const updateLyrics = () => {
    if (!currentSound) return;
    const seek = currentSound.seek();
    for (let i = 0; i < lyrics.length; i++) {
        if (seek >= lyrics[i].time && currentLyricIndex !== i) {
            currentLyricIndex = i;
            displayLyrics(); // 显示当前歌词
        }
    }
};
// 更新进度条
const updateProgress = () => {
    if (!currentSound || isSeeking) return;
    const seek = currentSound.seek();
    const duration = currentSound.duration();
    dom.progress.style.width = (seek / duration) * 100 + '%';
    dom.currentTime.textContent = formatTime(seek);
    dom.duration.textContent = formatTime(duration);
    if (currentSound.playing()) {
        requestAnimationFrame(updateProgress);
        requestAnimationFrame(updateLyrics);  // 更新歌词
    }
};
// 播放控制
const playPause = () => {
    if (!currentSound) return;

    if (currentSound.playing()) {
        currentSound.pause();
        dom.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        currentSound.play();
        dom.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
};

const playNext = () => {
    if (currentTrackIndex < playlist.length - 1) {
        playTrack(currentTrackIndex + 1);
    }
};

const playPrev = () => {
    if (currentTrackIndex > 0) {
        playTrack(currentTrackIndex - 1);
    }
};

// 播放指定曲目
const playTrack = (index) => {
    if (currentSound) {
        currentSound.stop();
        currentSound.unload();
    }
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = ''; // 清除错误提示

    const track = playlist[index];
    if (!track?.play_url || !track.lyrics) return;
    currentTrackIndex = index;
    lyrics = parseLyrics(track.lyrics);
    if (lyrics.length === 0) {
        showError("歌词解析失败");
        return;
    }
    currentLyricIndex = -1;
    // 更新 UI
    document.getElementById("trackTitle").innerText = track.SongName || "未知歌曲";
    document.getElementById("trackArtist").innerText = track.SingerName || "未知歌手";
    document.getElementById("currentArt").src = track.img || "static/images/pic_player.png"; // 默认封面
    lyrics = parseLyrics(track.lyrics); //
    currentLyricIndex = -1;
    currentSound = new Howl({
        src: [track.play_url],
        html5: true,
        format: ['mp3'],
        onplay: () => {
            document.querySelector('.album-art').style.animationPlayState = 'running';
            document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
            requestAnimationFrame(updateProgress); // **启动进度条更新**
            requestAnimationFrame(updateLyrics);  // 启动歌词更新
        },
        onpause: () => {
            document.querySelector('.album-art').style.animationPlayState = 'paused';
            document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
        },
        onend: () => {
            playNext();
        }
    });
    const checkTimeout = setTimeout(() => {
        if (!currentSound.playing()) {
            showError("This music is paid music and cannot be played for the time being......");
        }
    }, 15000);
    if (!dom.playerContainer.classList.contains('active')) {
        dom.playerContainer.classList.add('active');
    }
    currentSound.play();
};

dom.progressContainer.addEventListener('click', (e) => {
    if (!currentSound) return;
    const rect = dom.progressContainer.getBoundingClientRect();
    const seekPos = (e.clientX - rect.left) / rect.width;
    const newSeek = currentSound.duration() * seekPos;
    currentSound.seek(newSeek);
    updateProgress();  // 更新进度条
    updateLyrics();    // 更新歌词
});
/* 音量控制 */
dom.volumeSlider.addEventListener('input', (e) => {
    if (currentSound) {
        const volume = e.target.value;  // 获取音量滑块的值 (0 到 1)
        currentSound.volume(volume);   // 设置 Howler 实例的音量
        dom.volumeLabel.textContent = Math.round(volume * 100) + '%';  // 显示当前音量百分比
    }
});
// 回车输入
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchHandler(query);
        }
    }
});
// 播放/暂停按钮
dom.playPauseBtn.addEventListener('click', playPause);
// 上一曲/下一曲
dom.prevBtn.addEventListener('click', playPrev);
dom.nextBtn.addEventListener('click', playNext);
// 初始化歌词容器设置
dom.lyricsText.style.lineHeight = '30px';
dom.lyricsText.style.maxHeight = '60px';
