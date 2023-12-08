import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();

var flag="account";
var currentPageUrl = window.location.href;
var urlParams = new URLSearchParams(new URL(currentPageUrl).search);
var linkValue = urlParams.get('link');
var link2 = linkValue.split("?r=");
var recipientPublicKey = link2[0];
var myTeamName = localStorage.getItem("displayteamName");
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
        
        populateTableWithAssets(transactions);
        
      })
      .catch(error => console.log('error', error));

function populateTableWithAssets(teamData) {
    var assetTable = document.getElementById('myTeamTable');
    console.log(sortAndFilterMessages(teamData));
    sortAndFilterMessages(teamData).forEach(function(assetData) {
        var parsedAssetData = JSON.parse(assetData.asset.replace(/'/g, '"'));
        var row = assetTable.insertRow();
        var columns = ['Photo','Name', 'Overall','Club'];
        columns.forEach(function(column) {
            var cell = row.insertCell();

            if (column === 'Photo') {
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
function sortAndFilterMessages(messages) {
    // Filter the data to include only those with function = 'draft' and teamname as specified
    const filteredMessages = messages.filter(message => {
        const asset = JSON.parse(message.asset.replace(/'/g, '"'));
        const teamValue = asset.data.team;
        const functionValue = asset.data.function;
        
        return functionValue === 'draft' && teamValue===myTeamName;
    });
    
    return filteredMessages.sort((a, b) => {
        const assetA = JSON.parse(a.asset.replace(/'/g, '"'));
        const assetB = JSON.parse(b.asset.replace(/'/g, '"'));

        const timestampA = parseInt(assetA.data.timeStamp, 10);
        const timestampB = parseInt(assetB.data.timeStamp, 10);

        return timestampA - timestampB; // Sorts in ascending order
    });
}
