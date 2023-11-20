import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var leagueId = document.getElementById('leagueId');

sdk.addMessageListener((event) => {
    try {
        // Check if the message data is a string that needs parsing
        const messageData = (typeof event.data.data === 'string') ? JSON.parse(event.data.data) : event.data.data;
        let matchFound = false;

        messageData.forEach(message => {
            if (message.publicKey === leagueId.value) {
                // Redirect to draft page with the publicKey and mark match as found
                window.location.href = `draft-page.html?link=${leagueId.value}`;
                matchFound = true;
            }
        });

        // Show alert if no matching publicKey is found
        if (!matchFound) {
            alert("Invalid League Id");
        }
    } catch (error) {
        console.error("Error parsing message data:", error);
        alert("Invalid League Id");
    }
});

var teamName = document.getElementById('teamName');
var joinLeagueBtn = document.getElementById("joinLeagueBtn");

joinLeagueBtn.addEventListener("click", filterContentScript);

function filterContentScript() {
    sdk.sendMessage({
      direction: "filter-page-script",
      owner: "E9i5MnApcy8nZ4JNkAghSBHSX7Kkv869dzf32q5hPoYB",
      recipient: leagueId.value,
    });
}