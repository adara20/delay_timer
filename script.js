// Timer state management
const TimerState = {
    mode: "",
    delay: 0,
    countdownTime: 0,
    startTime: 0,
    timerInterval: null,
    delayInterval: null,
    tickInterval: null,
    running: false
};

// DOM Elements
const elements = {
    modeSelection: document.getElementById("modeSelection"),
    countDownSettings: document.getElementById("countDownSettings"),
    delaySettings: document.getElementById("delaySettings"),
    timer: document.getElementById("timer"),
    startButton: document.getElementById("startButton"),
    stopButton: document.getElementById("stopButton"),
    resetButton: document.getElementById("resetButton"),
    minutesInput: document.getElementById("minutesInput"),
    secondsInput: document.getElementById("secondsInput"),
    delayInput: document.getElementById("delayInput"),
    audio: {
        beep: document.getElementById("beep"),
        startBeep: document.getElementById("startBeep"),
        tick: document.getElementById("tick"),
        bbc: document.getElementById("bbc")
    }
};

// Initialize audio elements
function initAudio() {
    Object.values(elements.audio).forEach(audio => {
        audio.load();
        audio.volume = 1.0;
    });
}

// Call initAudio when the page loads
window.addEventListener('load', initAudio);

// Utility Functions
function formatTime(elapsed) {
    const minutes = Math.floor(elapsed / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (elapsed % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
}

function stopAllBeeps() {
    Object.values(elements.audio).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

function playSound(sound) {
    // Reset the sound to the beginning
    sound.currentTime = 0;
    // Play the sound
    const playPromise = sound.play();
    
    // Handle any play() errors
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Audio playback failed:", error);
        });
    }
}

// Timer Control Functions
function selectMode(selectedMode) {
    TimerState.mode = selectedMode;
    resetPage();
    
    elements.modeSelection.classList.add("hidden");
    elements.delaySettings.classList.remove("hidden");
    elements.startButton.classList.remove("hidden");
    elements.resetButton.classList.remove("hidden");
    
    if (TimerState.mode === "countDown") {
        elements.countDownSettings.classList.remove("hidden");
    }
}

function resetPage() {
    // Hide settings and reset inputs
    elements.countDownSettings.classList.add("hidden");
    elements.delaySettings.classList.add("hidden");
    elements.modeSelection.classList.remove("hidden");
    
    // Reset inputs
    elements.minutesInput.value = 0;
    elements.secondsInput.value = 30;
    elements.delayInput.value = 5;
    elements.timer.textContent = "00:00:000";
    
    // Clear intervals and audio
    stopAllBeeps();
    clearInterval(TimerState.timerInterval);
    clearInterval(TimerState.delayInterval);
    clearInterval(TimerState.tickInterval);
    TimerState.running = false;
}

function startTimer() {
    if (TimerState.running) return;
    
    TimerState.running = true;
    TimerState.delay = parseInt(elements.delayInput.value) || 5;
    elements.timer.textContent = `Get Ready: ${TimerState.delay}`;
    
    TimerState.delayInterval = setInterval(() => {
        playSound(elements.audio.beep);
        TimerState.delay--;
        
        if (TimerState.delay > 0) {
            elements.timer.textContent = `Get Ready: ${TimerState.delay}`;
        } else {
            clearInterval(TimerState.delayInterval);
            playSound(elements.audio.startBeep);
            TimerState.mode === "countUp" ? beginCountUp() : beginCountDown();
        }
    }, 1000);
}

function beginCountUp() {
    TimerState.startTime = Date.now();
    
    TimerState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - TimerState.startTime;
        elements.timer.textContent = formatTime(elapsed);
    }, 10);
    
    TimerState.tickInterval = setInterval(() => {
        playSound(elements.audio.tick);
    }, 5000);
}

function beginCountDown() {
    const minutes = parseInt(elements.minutesInput.value) || 0;
    const seconds = parseInt(elements.secondsInput.value) || 0;
    TimerState.countdownTime = (minutes * 60 + seconds) * 1000;
    TimerState.startTime = Date.now();
    
    TimerState.timerInterval = setInterval(() => {
        const elapsed = TimerState.countdownTime - (Date.now() - TimerState.startTime);
        
        if (elapsed <= 0) {
            clearInterval(TimerState.timerInterval);
            elements.timer.textContent = "00:00:000";
        } else {
            elements.timer.textContent = formatTime(elapsed);
        }
    }, 10);
    
    if (TimerState.countdownTime <= 60000) {
        stopAllBeeps();
        elements.audio.bbc.currentTime = 60 - TimerState.countdownTime / 1000;
        playSound(elements.audio.bbc);
    } else {
        TimerState.tickInterval = setInterval(() => {
            playSound(elements.audio.tick);
        }, 5000);
        
        setTimeout(() => {
            clearInterval(TimerState.tickInterval);
            stopAllBeeps();
            playSound(elements.audio.bbc);
        }, TimerState.countdownTime - 60000);
    }
}

function stopTimer() {
    TimerState.running = false;
    clearInterval(TimerState.timerInterval);
    clearInterval(TimerState.delayInterval);
    clearInterval(TimerState.tickInterval);
    stopAllBeeps();
    playSound(elements.audio.startBeep);
}

function resetTimer() {
    resetPage();
} 