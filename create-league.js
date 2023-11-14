import ResilientSDK from 'https://cdn.resilientdb.com/resilient-sdk.js';

const sdk = new ResilientSDK();
var flag = "create"
sdk.addMessageListener((event) => {
    const message = event.data.data;
    alert(JSON.stringify(message));
    const uniqueLink = generateUniqueLink();
    window.location.href = `draft-page.html?link=${uniqueLink}`;
    sdk.sendMessage({
      direction: "get-page-script",
      id: JSON.stringify(message)
    });
});

var teamName = document.getElementById('teamName');
var timePerPick = document.getElementById('timePerPick');
var maxMembers = document.getElementById('maxMembers'); 
var leagueName = document.getElementById('leagueName');
var createLeagueBtn = document.getElementById("createLeagueBtn");
createLeagueBtn.addEventListener("click", commitContentScript);

function commitContentScript() {
  localStorage.setItem("league", leagueName.value);
  localStorage.setItem("team", teamName.value);
  localStorage.setItem("time", timePerPick.value);
  localStorage.setItem("members", maxMembers.value);
  sdk.sendMessage({
    direction: "commit-page-script",
    message: `"league": "${leagueName.value}","team": "${teamName.value}","time": "${timePerPick.value}","members": "${maxMembers.value}"`,
    amount: 3287349,
    address: "2T2G1ssKkcbQgNbHH8V8DcxW2jooa94inEhvo9dbZG1L"
  });
}

function generateUniqueLink() {
  return Math.random().toString(36).substring(2, 15);
}