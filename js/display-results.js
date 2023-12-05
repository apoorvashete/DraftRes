import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();

// var teamData = JSON.parse(localStorage.getItem("teamData"));
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
        
        populateTableWithAssets(transactions);
        
      })
      .catch(error => console.log('error', error));
// window.onload = function() {
//     accountContentScript();
// };


// function accountContentScript() {
//     sdk.sendMessage({
//       direction: "account-page-script",
//     });
//     flag="account";
// }

// sdk.addMessageListener((event) => {
//     const messages = event.data.data;
//     if(flag==="account"){
//         sdk.sendMessage({
//             direction: "filter-page-script",
//             owner: messages,
//             recipient: recipientPublicKey,
//         });
//         flag="display";
//     }else if(flag==="display"){
//         populateTableWithAssets(messages);
//     }
// });

function populateTableWithAssets(teamData) {
    // Assuming assetTable is a predefined table element in your HTML
    var assetTable = document.getElementById('myTeamTable');
    console.log(sortAndFilterMessages(teamData));
    sortAndFilterMessages(teamData).forEach(function(assetData) {
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
                img.src = parsedAssetData.data.photo; // Set the src attribute to the image URL
                cell.appendChild(img); // Add the img element to the table cell
              }
            if (column === 'Name') {
                cell.textContent = parsedAssetData.data.playerName; // Access the playerName property
            }
            if (column === 'Overall') {
                cell.textContent = parsedAssetData.data.overall; // Access the playerName property
            }
            if (column === 'Club') {
                cell.textContent = parsedAssetData.data.club; // Access the playerName property
            }
            
        });
    });
}
function sortAndFilterMessages(messages) {
    // First filter the messages to include only those with function 'create' or 'join'
    const filteredMessages = messages.filter(message => {
        const asset = JSON.parse(message.asset.replace(/'/g, '"'));
        const teamValue = asset.data.team;
        const functionValue = asset.data.function;
        
        
        return functionValue === 'draft' && teamValue===myTeamName;
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
