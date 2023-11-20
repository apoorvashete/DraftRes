import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var league = localStorage.getItem("league");
var team = localStorage.getItem("team");
var timePerPick = localStorage.getItem("time");
var maxMembers = localStorage.getItem("members");

function initializeDraftPage() {
    const numberOfRounds = 12; // Set this to the desired number of rounds
    const draftRoundsElement = document.getElementById('draftRounds');
    let currentPlayer = 1; // Start with the first player
    let currentRound = 1; // Start with the first round

    // Create blocks for all rounds
    for (let roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        const roundBlock = createRoundBlock(roundNumber, maxMembers);
        draftRoundsElement.appendChild(roundBlock);
    }

    function highlightCurrentPlayer() {
        // Reset background color for all player-info elements
        document.querySelectorAll('.player-block .player-info').forEach(element => {
            element.style.backgroundColor = ''; // reset to default
        });
    
        // Calculate the index of the player block in the round container
        let playerBlockIndex = currentPlayer + 1; // +1 due to the round label being the first child
    
        // Highlight the current player
        const currentPlayerBlock = document.querySelector(`.round-container:nth-child(${currentRound}) .player-block:nth-child(${playerBlockIndex}) .player-info`);
        if (currentPlayerBlock) {
            currentPlayerBlock.style.backgroundColor = '#198754'; // green background for current player
        }
    }
    

    function startCountdownForPlayer() {
        // Highlight current player
        highlightCurrentPlayer();
        document.getElementById('currentRound').textContent = currentRound;
        document.getElementById('currentPick').textContent = currentPlayer;

        let countdownTimer = parseInt(timePerPick, 10); 
        const countdownElement = document.getElementById('countdown');
        updateCountdownDisplay(countdownTimer, countdownElement);

        const interval = setInterval(function() {
            countdownTimer -= 1;
            updateCountdownDisplay(countdownTimer, countdownElement);

            if (countdownTimer <= 0) {
                clearInterval(interval);
                currentPlayer++;
                if (currentPlayer <= maxMembers) {
                    startCountdownForPlayer(); // Start next player's countdown
                } else {
                    currentPlayer = 1; // Reset to first player for next round
                    currentRound++;
                    if (currentRound <= numberOfRounds) {
                        startCountdownForPlayer();
                    } else {
                        countdownElement.textContent = "DRAFT COMPLETED";
                    }
                }
            }
        }, 1000);
    }

    // Start the countdown for the first player in the first round
    startCountdownForPlayer();
}

function createRoundBlock(roundNumber, maxMembers) {
    // Function to get initials from a name
    function getInitials(name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase();
    }

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

        // Determine the initials for the first player
        let initials = i === 1 && team ? getInitials(team) : "XX";

        // Use teamName for the first player of each round
        if (i === 1 && team) {
            playerBlock.innerHTML = `
                <div class="player-info">${ordinalSuffixOf(i)}</div>
                <div class="player-initials">${initials}</div>
                <div class="player-info">${team}</div>
            `;
        } else {
            playerBlock.innerHTML = `
                <div class="player-info">${ordinalSuffixOf(i)}</div>
                <div class="player-initials">${initials}</div>
                <div class="player-info">Player ${i}</div>
            `;
        }
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
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    remainingSeconds = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;

    if (hours > 0) {
        countdownElement.textContent = `${hours}:${minutes}:${remainingSeconds}`;
    } else {
        countdownElement.textContent = `${minutes}:${remainingSeconds}`;
    }
}

document.addEventListener('DOMContentLoaded', initializeDraftPage);
