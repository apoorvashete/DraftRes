import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var league = localStorage.getItem("league");

var refreshLeagueBtn = document.getElementById("refreshLeagueBtn");
var playersData = JSON.parse(localStorage.getItem("data"));

var assetTable = document.getElementById("assetTable").getElementsByTagName('tbody')[0];

let hasPlayerSelected = false; //to track one chance in each round

let selectedButtons = []; //to keep track of drafted buttons
let maxMembers = 0;
let playerIDs = [];
var currentPageUrl = window.location.href;
var urlParams = new URLSearchParams(new URL(currentPageUrl).search);
var linkValue = urlParams.get('link');
var link2 = linkValue.split("?r=");
var recipientPublicKey = link2[0];
var ownerKey = link2[1];
var flag="account";
var currentPage = 1;
var rowsPerPage = 7;

var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

// Modify the query with a placeholder
var graphqlQuery = `
  query getFilteredTransactions($ownerPublicKey: String!, $recipientPublicKey: String!) {
    getFilteredTransactions(filter: {
      ownerPublicKey: $ownerPublicKey
      recipientPublicKey: $recipientPublicKey
    }) {
      id
      version
      amount
      metadata
      operation
      asset
      publicKey
      uri
      type
    }
  }
`;

// Replace the placeholder in the query with the actual variable
var graphql = JSON.stringify({
  query: graphqlQuery,
  variables: {
    ownerPublicKey: "",
    recipientPublicKey: recipientPublicKey
  }
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: graphql,
  redirect: 'follow'
};

fetch("http://cloud.draftres.pro/graphql", requestOptions)
      .then(response => response.json())
      .then(data => {
        let transactions = data.data.getFilteredTransactions;

        let memberValues = transactions
          .map(transaction => {
            let asset = JSON.parse(transaction.asset.replace(/'/g, "\""));

            // For maxMembers
            if (asset.data && asset.data.function === 'create') {
                return parseInt(asset.data.members);
            }

            // For playerIDs
            if (asset.data && asset.data.function === 'draft' && asset.data.playerId) {
                playerIDs.push(asset.data.playerId);
            }

            return null;
          })
          .filter(members => members !== null);

        // Update maxMembers
        maxMembers = memberValues.length > 0 ? memberValues[0] : 0;

        // Log or process maxMembers and playerIDs as needed
        console.log("Max Members: ", maxMembers);
        console.log("Player IDs: ", playerIDs);
        populateTable(playersData);
        displayPage(currentPage);
        initializeDraftPage();
        
      })
      .catch(error => console.log('error', error));

const numberOfRounds = 12; // Set this to the desired number of rounds
let currentPlayer = 1; // Start with the first player
let currentRound = 1;

playersData.sort((a, b) => {
    const overallA = getOverall(a.asset);
    const overallB = getOverall(b.asset);
    return overallB - overallA; // Sort in descending order
});

function getOverall(assetString) {
    try {
        const assetData = JSON.parse(assetString.replace(/'/g, "\""));
        return assetData.data.Overall || 0; // Return 0 if 'Overall' is not present in the asset data
    } catch (error) {
        return 0; // Return 0 in case of an error
    }
}



function displayPage(page) {
    var start = (page - 1) * rowsPerPage;
    var end = start + rowsPerPage;

    Array.from(assetTable.rows).forEach((row, index) => {
        row.style.display = (index >= start && index < end) ? '' : 'none';
    });

    currentPage = page;
    updatePageNumbers();
}

function updatePageNumbers() {
    var pageNumberContainer = document.getElementById('pageNumberContainer');
    pageNumberContainer.innerHTML = '';

    var totalRows = assetTable.rows.length;
    var maxPage = Math.ceil(totalRows / rowsPerPage);
    var pageRange = 5;
    var startPage, endPage;

    if (maxPage <= pageRange) {
        startPage = 1;
        endPage = maxPage;
    } else {
        var maxPivotPages = Math.floor(pageRange / 2);
        startPage = currentPage - maxPivotPages;
        endPage = currentPage + maxPivotPages;

        if (startPage < 1) {
            startPage = 1;
            endPage = pageRange;
        } else if (endPage > maxPage) {
            endPage = maxPage;
            startPage = maxPage - pageRange + 1;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        var pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-number');

        if (i === currentPage) {
            pageButton.classList.add('active');
        }

        pageButton.addEventListener('click', function() {
            displayPage(i);
        });

        pageNumberContainer.appendChild(pageButton);
    }
}
function populateTable(dataToDisplay) { // Assuming playerIDs is passed as an argument
    while (assetTable.rows.length > 0) {
        assetTable.deleteRow(0);
    }
    dataToDisplay.forEach(function(item, index) {
        if (item.asset && typeof item.asset === 'string') {
            try {
                var assetData = JSON.parse(item.asset.replace(/'/g, '"'));
                var row = assetTable.insertRow();
                var columns = ['Photo', 'Name', 'Age', 'Nationality', 'Overall', 'Potential', 'Club', 'Preferred Foot', 'Weak Foot', 'Skill Moves', 'Position'];

                columns.forEach(function(column) {
                    var cell = row.insertCell();
                    if (column === 'Photo') {
                        var img = document.createElement('img');
                        img.src = assetData.data[column];
                        cell.appendChild(img);
                    } else {
                        cell.textContent = assetData.data[column];
                    }
                });

                var draftCell = row.insertCell();
                var draftButton = document.createElement('button');
                draftButton.textContent = 'Draft';
                draftButton.classList.add('btn', 'btn-success');
                draftButton.id = index; // Set button ID to index

                if (playerIDs.includes(index.toString())) {
                    // If index is in the playerIDs array, disable the button and change its color
                    draftButton.style.backgroundColor = 'red';
                    draftButton.disabled = true;
                }

                draftButton.onclick = function() {
                    if (!hasPlayerSelected) {
                        
                        commitDraft(assetData.data.Photo, assetData.data.Name, index);
                        hasPlayerSelected = true; // Set flag to true as player has made a selection
                        selectedButtons.push(this.id); // Add the button's ID to the selected list

                        //change button color
                        this.style.backgroundColor = 'red';
                        this.disabled = true;
                    }
                    location.reload();
                };
                draftCell.appendChild(draftButton);
            } catch (error) {
               
            }
        }
    });

    updatePageNumbers();
}


var searchInput = document.getElementById('playerSearch'); 

function searchPlayers() {
    var searchText = searchInput.value.toLowerCase();
    var filteredData = searchText ? playersData.filter(item => {
        return item.asset && item.asset.toLowerCase().includes(searchText);
    }) : playersData;

    populateTable(filteredData);
    displayPage(1);
}

searchInput.addEventListener('input', searchPlayers);

// populateTable(playersData);
// displayPage(currentPage);

document.getElementById('prevButton').addEventListener('click', function() {
    if (currentPage > 1) {
        displayPage(currentPage - 1);
    }
});

document.getElementById('nextButton').addEventListener('click', function() {
    var totalRows = assetTable.rows.length;
    var maxPage = Math.ceil(totalRows / rowsPerPage);
    if (currentPage < maxPage) {
        displayPage(currentPage + 1);
    }
});

// Function to create the round blocks
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
            <div class="player-info2">Pending</div>
        `;
        roundContainer.appendChild(playerBlock);
    }

    return roundContainer;
}

// Function to add ordinal suffix to numbers
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

const draftRoundsElement = document.getElementById('draftRounds');

 // Start with the first round

function initializeDraftPage() {
    const playersButton = document.getElementById('playersBtn');
    const teamsButton = document.getElementById('myTeamBtn'); // assuming first button is for players
    const playersTable = document.getElementById('playersTable');
    const teamsTable = document.getElementById('teamsTable'); // assuming you have an element with this ID for teams

    // Set default visibility
    playersTable.style.display = 'block'; // show players table by default
    teamsTable.style.display = 'none'; // hide teams table by default

    playersButton.addEventListener('click', function() {
        playersTable.style.display = 'block';
        teamsTable.style.display = 'none';
    });

    teamsButton.addEventListener('click', function() {
        playersTable.style.display = 'none';
        teamsTable.style.display = 'block';
    });

    // Create blocks for all rounds
    for (let roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        const roundBlock = createRoundBlock(roundNumber, maxMembers);
        draftRoundsElement.appendChild(roundBlock);
    } 
}

// Add event listeners
//document.addEventListener('DOMContentLoaded', initializeDraftPage);
refreshLeagueBtn.addEventListener('click', accountContentScript);


function accountContentScript() {
    sdk.sendMessage({
      direction: "account-page-script",
    });
}


sdk.addMessageListener((event) => {
    const messages = event.data.data;
    console.log(messages);
    if(flag==="account"){
        sdk.sendMessage({
            direction: "filter-page-script",
            owner: "",
            recipient: recipientPublicKey,
        });
        flag="refresh";
    }else if(flag==="refresh"){
        function sortMessagesByTimestamp(messages) {
            // First filter the messages to include only those with function 'create' or 'join'
            const filteredMessages = messages.filter(message => {
                const asset = JSON.parse(message.asset.replace(/'/g, '"'));
                const functionValue = asset.data.function;
                return functionValue === 'create' || functionValue === 'join';
            });
            
            // Then sort the filtered messages
            return filteredMessages.sort((a, b) => {
                const assetA = JSON.parse(a.asset.replace(/'/g, '"'));
                const assetB = JSON.parse(b.asset.replace(/'/g, '"'));
        
                const timestampA = parseInt(assetA.data.timeStamp, 10);
                const timestampB = parseInt(assetB.data.timeStamp, 10);
        
                return timestampA - timestampB; // Sorts in ascending order
            });
        }
        
        const sortedMessages = sortMessagesByTimestamp(messages);
        sortedMessages.forEach((message, index) => {
            try {
                let correctedJson = message.asset.replace(/'/g, "\"").replace(/(\w+):/g, '"$1":');
                const assetData = JSON.parse(correctedJson);
                
                if (assetData.data.leagueId === linkValue) {
                    console.log(maxMembers);
                    const teamName = assetData.data.team;
                    //const playerNumber = (index % maxMembers) + 1; // Calculate player number
                    localStorage.setItem("teamName",teamName);
                    // Update this player in each round
                    for (let roundNumber = 1; roundNumber <= 12; roundNumber++) {
                        let playerNumber;
                        // Determine if the round is a normal (1, 2, 3, ...) or reverse round (..., 3, 2, 1)
                        const isReverseRound = roundNumber % 2 === 0;

                        if (!isReverseRound) {
                            // Normal round order
                            playerNumber = (index % maxMembers) + 1;
                        } else {
                            // Reversed round order
                            playerNumber = maxMembers - (index % maxMembers);
                        }
                        const playerBlockSelector = `.round-container:nth-of-type(${roundNumber}) .player-block:nth-child(${playerNumber + 1}) .player-info2`;
                        const playerBlock = document.querySelector(playerBlockSelector);

                        const playerBlockSelectorInitials = `.round-container:nth-of-type(${roundNumber}) .player-block:nth-child(${playerNumber + 1}) .player-initials`;
                        const playerBlockInitials = document.querySelector(playerBlockSelectorInitials);

                        if (playerBlock && playerBlockInitials) {
                            playerBlock.textContent = teamName;
                            playerBlockInitials.textContent = getInitials(teamName);
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing message asset:", e);
            }
        });
    }else if(flag==="drafted"){
        sdk.sendMessage({
            direction: "get-page-script",
            id: messages
        });
        
        flag = "disable";
        location.reload();
    }else if(flag==="disable"){
        console.log(messages);
        
        var disabledData = JSON.parse(messages.asset.replace(/'/g, '"'));
        var buttonId = disabledData.data.playerId;
        var btn = document.getElementById(buttonId);
        btn.disabled=true;
        location.reload();
    }else if(flag==="check"){
        sdk.sendMessage({
            direction: "filter-page-script",
            owner: messages,
            recipient: recipientPublicKey,
        });
        flag="display";
    }else if(flag==="display"){
        function sortMessagesByTimestamp(messages) {
            // First filter the messages to include only those with function 'create' or 'join'
            const filteredMessages = messages.filter(message => {
                const asset = JSON.parse(message.asset.replace(/'/g, '"'));
                const functionValue = asset.data.function;
                return functionValue === 'draft';
            });
            
            // Then sort the filtered messages
            return filteredMessages.sort((a, b) => {
                const assetA = JSON.parse(a.asset.replace(/'/g, '"'));
                const assetB = JSON.parse(b.asset.replace(/'/g, '"'));
        
                const timestampA = parseInt(assetA.data.timeStamp, 10);
                const timestampB = parseInt(assetB.data.timeStamp, 10);
        
                return timestampA - timestampB; // Sorts in ascending order
            });
        }
        
        const sortedMessages = sortMessagesByTimestamp(messages);
        
        populateTableWithAssets(sortedMessages);
    }
});
function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
}
function commitDraft(photo, name, id){
    var team = localStorage.getItem("teamName");
    var timeStamp = new Date().getTime();
    sdk.sendMessage({
        direction: "commit-page-script",
        message: `"function":"draft", "photo": "${photo}", "team": "${team}","playerName": "${name}","playerId": "${id}", "timeStamp": "${timeStamp}"`,
        amount: 100,
        address: recipientPublicKey
    });
    flag="drafted";
}

var teamBtn = document.getElementById("myTeamBtn");
teamBtn.addEventListener('click', displayMyTeam);

function displayMyTeam(){
    sdk.sendMessage({
        direction: "account-page-script",
    });
    flag="check";
}
function populateTableWithAssets(sortedMessages) {
    // Assuming assetTable is a predefined table element in your HTML
    var assetTable = document.getElementById('myTeamTable');

    sortedMessages.forEach(function(assetData) {
        // Parse the asset data
        var parsedAssetData = JSON.parse(assetData.asset.replace(/'/g, '"'));
        console.log(parsedAssetData);
        // Create a new row in the table for each asset
        var row = assetTable.insertRow();
        var columns = ['Photo','Name'];
        columns.forEach(function(column) {
            var cell = row.insertCell();

            if (column === 'Photo') {
                // If the column is 'Photo', create an img element
                var img = document.createElement('img');
                img.src = parsedAssetData.data.photo; // Set the src attribute to the image URL
                cell.appendChild(img); // Add the img element to the table cell
              }
            if (column === 'Name') {
                console.log(parsedAssetData.data.playerName);
                cell.textContent = parsedAssetData.data.playerName; // Access the playerName property
            }
            
        });
    });
}

