// Timer state management
const TimerState = {
    mode: "",
    delay: 0,
    countdownTime: 0,
    startTime: 0,
    pausedTime: 0,
    timerInterval: null,
    delayInterval: null,
    tickInterval: null,
    running: false,
    paused: false
};

// DOM Elements
const elements = {
    modeSelection: document.getElementById("modeSelection"),
    countDownSettings: document.getElementById("countDownSettings"),
    delaySettings: document.getElementById("delaySettings"),
    timer: document.getElementById("timer"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resumeButton: document.getElementById("resumeButton"),
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
        audio.preload = 'auto';
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

function unlockAudio() {
    Object.values(elements.audio).forEach(audio => {
        audio.volume = 0;
        audio.play().then(() => {
            audio.pause();
            audio.volume = 1.0;
            audio.currentTime = 0;
        }).catch(e => {
            console.log("Unlock failed:", e);
        });
    });
}

function playSound(sound, startTime = 0, duration = null) {
    // Reset the sound to the beginning
    sound.currentTime = startTime;
    
    // If duration is specified, set up a timeout to stop the audio
    if (duration !== null) {
        setTimeout(() => {
            sound.pause();
            sound.currentTime = 0;
        }, duration);
    }
    
    // Play the sound with error handling and retry
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Audio playback failed:", error.message, sound.src);
            // Retry playing the sound once
            setTimeout(() => {
                sound.currentTime = startTime;
                sound.play().catch(e => console.log("Retry failed:", e.message, sound.src));
            }, 100);
        });
    }
}

function updateButtonStates(state) {
    // Hide all buttons first
    elements.startButton.classList.add("hidden");
    elements.pauseButton.classList.add("hidden");
    elements.resumeButton.classList.add("hidden");
    elements.resetButton.classList.add("hidden");
    
    // Show appropriate buttons based on state
    switch(state) {
        case 'initial':
            elements.startButton.classList.remove("hidden");
            elements.resetButton.classList.remove("hidden");
            break;
        case 'running':
            elements.pauseButton.classList.remove("hidden");
            elements.resetButton.classList.remove("hidden");
            break;
        case 'paused':
            elements.resumeButton.classList.remove("hidden");
            elements.resetButton.classList.remove("hidden");
            break;
    }
}

function resetToInitialState() {
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
    
    // Reset state
    TimerState.running = false;
    TimerState.paused = false;
    TimerState.pausedTime = 0;
    TimerState.startTime = 0;
    TimerState.countdownTime = 0;
    
    // Update button states
    updateButtonStates('initial');
}

// Timer Control Functions
function selectMode(selectedMode) {
    TimerState.mode = selectedMode;
    resetToInitialState();
    
    elements.modeSelection.classList.add("hidden");
    elements.delaySettings.classList.remove("hidden");
    
    if (TimerState.mode === "countDown") {
        elements.countDownSettings.classList.remove("hidden");
    }
}

function startTimer() {
    // Unlock all audio elements for mobile
    unlockAudio();
    
    if (TimerState.running) return;
    
    TimerState.running = true;
    TimerState.paused = false;
    updateButtonStates('running');
    
    TimerState.delay = parseInt(elements.delayInput.value) || 5;
    elements.timer.textContent = `Get Ready: ${TimerState.delay}`;
    
    // Start appropriate audio based on mode
    if (TimerState.mode === "countDown") {
        const minutes = parseInt(elements.minutesInput.value) || 0;
        const seconds = parseInt(elements.secondsInput.value) || 0;
        const totalDuration = (TimerState.delay + minutes * 60 + seconds) * 1000;
        
        // Start BBC audio for the total duration
        const bbcAudio = elements.audio.bbc;
        bbcAudio.load();
        bbcAudio.currentTime = 60 - (totalDuration / 1000);
        playSound(bbcAudio, 60 - (totalDuration / 1000), totalDuration);
    } else {
        // For count up, start tick sound immediately and continue every 5 seconds
        playSound(elements.audio.tick); // Play first tick immediately
        TimerState.tickInterval = setInterval(() => {
            playSound(elements.audio.tick);
        }, 5000);
    }
    
    TimerState.delayInterval = setInterval(() => {
        TimerState.delay--;
        
        if (TimerState.delay > 0) {
            elements.timer.textContent = `Get Ready: ${TimerState.delay}`;
        } else {
            clearInterval(TimerState.delayInterval);
            TimerState.startTime = Date.now();
            TimerState.mode === "countUp" ? beginCountUp() : beginCountDown();
        }
    }, 1000);
}

function pauseTimer() {
    if (!TimerState.running || TimerState.paused) return;
    
    TimerState.paused = true;
    TimerState.pausedTime = Date.now();
    updateButtonStates('paused');
    
    // Pause all intervals
    clearInterval(TimerState.timerInterval);
    clearInterval(TimerState.tickInterval);
    
    // Pause audio
    Object.values(elements.audio).forEach(audio => {
        audio.pause();
    });
}

function resumeTimer() {
    if (!TimerState.running || !TimerState.paused) return;
    
    TimerState.paused = false;
    updateButtonStates('running');
    
    // Adjust start time for the pause duration
    const pauseDuration = Date.now() - TimerState.pausedTime;
    TimerState.startTime += pauseDuration;
    
    // Resume timer
    if (TimerState.mode === "countUp") {
        beginCountUp();
    } else {
        beginCountDown();
    }
}

function beginCountUp() {
    TimerState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - TimerState.startTime;
        elements.timer.textContent = formatTime(elapsed);
    }, 10);
}

function beginCountDown() {
    const minutes = parseInt(elements.minutesInput.value) || 0;
    const seconds = parseInt(elements.secondsInput.value) || 0;
    TimerState.countdownTime = (minutes * 60 + seconds) * 1000;
    
    TimerState.timerInterval = setInterval(() => {
        const elapsed = TimerState.countdownTime - (Date.now() - TimerState.startTime);
        
        if (elapsed <= 0) {
            // Clear all intervals
            clearInterval(TimerState.timerInterval);
            clearInterval(TimerState.tickInterval);
            // Stop all sounds
            stopAllBeeps();
            elements.timer.textContent = "00:00:000";
            updateButtonStates('initial');
            TimerState.running = false;
        } else {
            elements.timer.textContent = formatTime(elapsed);
        }
    }, 10);
}

function resetTimer() {
    resetToInitialState();
} 