import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();

function initializeDraftPage() {
    var league = localStorage.getItem("league");
    var team = localStorage.getItem("team");
    var timePerPick = localStorage.getItem("time");
    var maxMembers = localStorage.getItem("members");

    
    const numberOfRounds = 12; // Set this to the desired number of rounds
    const draftRoundsElement = document.getElementById('draftRounds');

    // Create blocks for all rounds
    for (let roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        const roundBlock = createRoundBlock(roundNumber, maxMembers);
        draftRoundsElement.appendChild(roundBlock);
    }

    // Set up the timer
    let countdownTimer = parseInt(timePerPick, 10); 
    const countdownElement = document.getElementById('countdown');
    updateCountdownDisplay(countdownTimer, countdownElement); // Initial display update

    const interval = setInterval(function() {
        countdownTimer -= 1; // Decrement the timer by 1 second
        updateCountdownDisplay(countdownTimer, countdownElement);

        if (countdownTimer <= 0) {
            clearInterval(interval);
            countdownElement.textContent = "DRAFT STARTED";
            // Add any additional logic for when the draft starts
        }
    }, 1000);
}

function createRoundBlock(roundNumber, maxMembers) {
    // Round container
    const roundContainer = document.createElement('div');
    roundContainer.className = 'round-container';

    // Round label
    const roundLabel = document.createElement('div');
    roundLabel.className = 'round-label';
    roundLabel.innerHTML = `<div class="rotate90">Round ${roundNumber}</div>`;
    roundContainer.appendChild(roundLabel);

    // Create player blocks for the round
    for (let i = 1; i <= maxMembers; i++) {
        const playerBlock = document.createElement('div');
        playerBlock.className = 'player-block';
        playerBlock.innerHTML = `
            <div class="player-info">${ordinalSuffixOf(i)}</div>
            <div class="player-initials">XX</div>
            <div class="player-info">Player ${i}</div>
        `;
        roundContainer.appendChild(playerBlock);
    }

    return roundContainer;
}

function ordinalSuffixOf(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}
function updateCountdownDisplay(seconds, countdownElement) {
    // Calculate hours, minutes, and seconds
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;

    // Pad the numbers with leading zeros if necessary
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    remainingSeconds = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;

    // Update the display based on the total seconds
    if (hours > 0) {
        countdownElement.textContent = `${hours}:${minutes}:${remainingSeconds}`;
    } else {
        countdownElement.textContent = `${minutes}:${remainingSeconds}`;
    }
}
document.addEventListener('DOMContentLoaded', initializeDraftPage);