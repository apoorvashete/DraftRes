import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var teamName = document.getElementById('teamName');
var joinLeagueBtn = document.getElementById("joinLeagueBtn");
var leagueId = document.getElementById('leagueId');
var flag = "create";
sdk.addMessageListener((event) => {
    const messageData = event.data.data;

    if (flag === "create") {
        if (messageData.length > 0) {
            // Compare the publicKey of the first message with the leagueId.value
            if (messageData[0].publicKey === leagueId.value) {
                var timeStamp = new Date().getTime();
                sdk.sendMessage({      
                    direction: "commit-page-script",
                    message: `"team": "${teamName.value}","leagueId": "${leagueId.value}","timeStamp": "${timeStamp}"`,
                    amount: 100,
                    address: leagueId.value
                });
                flag = "redirect";
            } else {
                alert("League ID does not match.");
            }
        } else {
            alert("No data available to validate League ID.");
        }
    } else if (flag === "redirect") {
        window.location.href = `draft-page.html?link=${leagueId.value}`;
    }
});


joinLeagueBtn.addEventListener("click", filterContentScript);

function filterContentScript() {
    sdk.sendMessage({
      direction: "filter-page-script",
      owner: "E9i5MnApcy8nZ4JNkAghSBHSX7Kkv869dzf32q5hPoYB",
      recipient: leagueId.value,
    });
    
}
