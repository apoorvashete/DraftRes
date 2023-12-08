import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var league = localStorage.getItem("league");
var playersData = JSON.parse(localStorage.getItem("data"));
var assetTable = document.getElementById("assetTable").getElementsByTagName('tbody')[0];
let hasPlayerSelected = false; 
let selectedButtons = []; 
let maxMembers = 0;
let playerIDs = [];
var currentPageUrl = window.location.href;
var urlParams = new URLSearchParams(new URL(currentPageUrl).search);
var linkValue = urlParams.get('link');
var link2 = linkValue.split("?r=");
var recipientPublicKey = link2[0];
var myTeamName = localStorage.getItem("teamName");
localStorage.setItem("displayteamName",myTeamName);
var flag="account";
var currentPage = 1;
var rowsPerPage = 7;
const numberOfRounds = 12;
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

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

            if (asset.data && asset.data.function === 'create') {
                return parseInt(asset.data.members);
            }
            
            if (asset.data && asset.data.function === 'draft' && asset.data.playerId) {
                playerIDs.push(asset.data.playerId);
            }

            return null;
          })
          .filter(members => members !== null);

        maxMembers = memberValues.length > 0 ? memberValues[0] : 0;
        
        populateTable(playersData);
        displayPage(currentPage);
        initializeDraftPage();
        getTeamNames(transactions);
        
      })
      .catch(error => console.log('error', error));

playersData.sort((a, b) => {
    const overallA = getOverall(a.asset);
    const overallB = getOverall(b.asset);
    return overallB - overallA; // Sorts in descending order
});

function getOverall(assetString) {
    try {
        const assetData = JSON.parse(assetString.replace(/'/g, "\""));
        return assetData.data.Overall || 0; 
    } catch (error) {
        return 0; 
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
function populateTable(dataToDisplay) { 
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
                draftButton.style.backgroundColor = '#198754';
                draftButton.style.borderColor = 'rgb(25, 135, 84)'
                draftButton.id = index; 

                if (playerIDs.includes(index.toString())) {
                    draftButton.classList.remove('btn-success');
                    draftButton.classList.add('btn-danger');
                    draftButton.style.removeProperty("background-color");
                    draftButton.style.removeProperty("border-color");
                    draftButton.disabled = true;
                }
                
                if(playerIDs.length===maxMembers*numberOfRounds){
                    window.location.href = `display-results.html?link=${linkValue}`;
                }
                draftButton.onclick = function() {
                    if (!hasPlayerSelected) {
                        
                        commitDraft(assetData.data.Photo, assetData.data.Name, assetData.data.Overall, assetData.data.Club, index);
                        hasPlayerSelected = true;
                        selectedButtons.push(this.id);

                        //disable button if player is selected
                        this.style.backgroundColor = 'red';
                        this.disabled = true;
                    }
                    
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
            <div class="player-info">Pick ${i}</div>
            <div class="player-initials">XX</div>
            <div class="player-info2">Pending</div>
        `;
        roundContainer.appendChild(playerBlock);
    }

    return roundContainer;
}



const draftRoundsElement = document.getElementById('draftRounds');

function initializeDraftPage() {
    const playersButton = document.getElementById('playersBtn');
    const teamsButton = document.getElementById('myTeamBtn');
    const playersTable = document.getElementById('playersTable');
    const teamsTable = document.getElementById('teamsTable'); 

    playersTable.style.display = 'block'; 
    teamsTable.style.display = 'none';

    playersButton.addEventListener('click', function() {
        playersTable.style.display = 'block';
        teamsTable.style.display = 'none';
        playersButton.classList.add('btn-active');
        teamsButton.classList.remove('btn-active');
    });

    teamsButton.addEventListener('click', function() {
        playersTable.style.display = 'none';
        teamsTable.style.display = 'block';
        teamsButton.classList.add('btn-active');
        playersButton.classList.remove('btn-active');
    });

    document.getElementById('yourTeam').textContent = myTeamName;
    document.getElementById('leagueName').textContent = league;
    for (let roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        const roundBlock = createRoundBlock(roundNumber, maxMembers);
        draftRoundsElement.appendChild(roundBlock);
    }   
}

sdk.addMessageListener((event) => {
    const messages = event.data.data;
    if(flag==="drafted"){
        sdk.sendMessage({
            direction: "get-page-script",
            id: messages
        });
        flag = "disable";
    }else if(flag==="disable"){
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
            //Filter the data to include only those with function equal to 'create' or 'join'
            const filteredMessages = messages.filter(message => {
                const asset = JSON.parse(message.asset.replace(/'/g, '"'));
                const functionValue = asset.data.function;
                return functionValue === 'draft';
            });
            
            return filteredMessages.sort((a, b) => {
                const assetA = JSON.parse(a.asset.replace(/'/g, '"'));
                const assetB = JSON.parse(b.asset.replace(/'/g, '"'));
        
                const timestampA = parseInt(assetA.data.timeStamp, 10);
                const timestampB = parseInt(assetB.data.timeStamp, 10);
        
                return timestampA - timestampB; // Sorts in ascending order
            });
        }
        
        const sortedMessages = sortMessagesByTimestamp(messages);
        localStorage.setItem("teamData", sortedMessages);
        populateTableWithAssets(sortedMessages);
    }
});
function getInitials(name) {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
}
function commitDraft(photo, name, overall, club, id){

    var timeStamp = new Date().getTime();
    sdk.sendMessage({
        direction: "commit-page-script",
        message: `"function":"draft", "photo": "${photo}", "team": "${myTeamName}","playerName": "${name}", "overall": "${overall}", "club": "${club}", "playerId": "${id}", "timeStamp": "${timeStamp}"`,
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
    
    var assetTable = document.getElementById('myTeamTable');

    sortedMessages.forEach(function(assetData) {
        // Parse the asset data
        var parsedAssetData = JSON.parse(assetData.asset.replace(/'/g, '"'));
        // Create a new row in the table for each asset
        var row = assetTable.insertRow();
        var columns = ['Photo','Name', 'Overall','Club'];
        columns.forEach(function(column) {
            var cell = row.insertCell();

            if (column === 'Photo') {
                // If the column is 'Photo', create an img element
                var img = document.createElement('img');
                img.src = parsedAssetData.data.photo; 
                cell.appendChild(img);
              }
            if (column === 'Name') {
                cell.textContent = parsedAssetData.data.playerName;
            }
            if (column === 'Overall') {
                cell.textContent = parsedAssetData.data.overall; 
            }
            if (column === 'Club') {
                cell.textContent = parsedAssetData.data.club; 
            }
            
        });
    });
}

function getTeamNames(messages){
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
                const teamName = assetData.data.team;
                
                for (let roundNumber = 1; roundNumber <= 12; roundNumber++) {
                    let playerNumber;
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

                    const teamBlockSelector = `.round-container:nth-of-type(${roundNumber}) .player-block:nth-child(${playerNumber + 1}) .player-info`;
                    const teamBlock = document.querySelector(teamBlockSelector);

                    if (playerBlock && playerBlockInitials) {
                        playerBlock.textContent = teamName;
                        if(teamName===myTeamName){
                            teamBlock.style.backgroundColor = '#198754';
                            teamBlock.style.color = '#fff';
                        }
                        playerBlockInitials.textContent = getInitials(teamName);
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing message asset:", e);
        }
    });
}

