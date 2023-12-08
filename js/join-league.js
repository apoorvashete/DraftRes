import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var teamName = document.getElementById('teamName');
var joinLeagueBtn = document.getElementById("joinLeagueBtn");
var flag = "create";

sdk.addMessageListener((event) => {
    const messageData = event.data.data;
    console.log(messageData);
    var leagueId = document.getElementById('leagueId');
    var id = leagueId.value;
    var idArr = id.split("?r=");
    var recipientPublicKey = idArr[0];
    if (flag === "create") {
        if (messageData.length > 0) {
            const messages = sortMessagesAndFilterMessages(messageData);
            if (messages[0].publicKey === recipientPublicKey) {
                const messagesAsset =  JSON.parse(messages[0].asset.replace(/'/g, '"'));
                console.log(messageData.length);
                console.log(messagesAsset.data.members);
                if(messageData.length<messagesAsset.data.members){
                    localStorage.setItem("teamName", teamName.value);
                    var league = messagesAsset.data.league;
                    var timeStamp = new Date().getTime();
                    sdk.sendMessage({      
                        direction: "commit-page-script",
                        message: `"function": "join","leagueName": "${league}","team": "${teamName.value}","leagueId": "${id}","timeStamp": "${timeStamp}"`,
                        amount: 100,
                        address: recipientPublicKey
                    });
                    flag = "redirect";
                    localStorage.setItem("league",league);
                }else{
                    alert("Room is full!");
                }
            } else {
                alert("Invalid League ID or League does not exist");
            }
        } else {
            alert("League does not exist");
        }
    } else if (flag === "redirect") {
        window.location.href = `draft-page.html?link=${id}`;
    }
});

joinLeagueBtn.addEventListener("click", filterContentScript);

function filterContentScript() {
    
    var leagueId = document.getElementById('leagueId');
    var id = leagueId.value;
    var idArr = id.split("?r=");
    var recipientPublicKey = idArr[0];
    var ownerKey = idArr[1];
        sdk.sendMessage({
            direction: "filter-page-script",
            owner: "",
            recipient: recipientPublicKey,
        });
    }

function sortMessagesAndFilterMessages(messages) {
    const filteredMessages = messages.filter(message => {
        const asset = JSON.parse(message.asset.replace(/'/g, '"'));
        const functionValue = asset.data.function;
        return functionValue === 'create';
    });
    
    return filteredMessages.sort((a, b) => {
        const assetA = JSON.parse(a.asset.replace(/'/g, '"'));
        const assetB = JSON.parse(b.asset.replace(/'/g, '"'));

        const timestampA = parseInt(assetA.data.timeStamp, 10);
        const timestampB = parseInt(assetB.data.timeStamp, 10);

        return timestampA - timestampB; // Sorts in ascending order
    });
}