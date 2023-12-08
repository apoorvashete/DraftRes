# DraftRes
DraftRes is a Draft Fantasy Soccer that uses ResilientDB for storing and retrieving data. DraftRes' draft room offers a unique and engaging team selection experience. Accessed with valid credentials, teams follow a serpentine draft sequence (A-B-C-D-D-C-B-A) ensuring a balanced and dynamic selection process. Selections are broadcasted in real-time, keeping all teams informed about player affiliations. This continues until all selections are complete, creating an exciting and efficient drafting environment.

The site is live at http://draftres.resilientdb.com/

## Prerequisites (also available on https://blog.resilientdb.com/2023/09/21/ResVault.html)

### Setup ResVault
To download the wallet build:
- Download NodeJS and ensure that it’s added to PATH.
- Clone the ResVault repo to get started:
```shell
git clone https://github.com/ResilientApp/ResVault.git
```
- Then navigate inside the ResVault directory:
```shell
cd ResVault
```
- Install the dependencies.
```shell
npm install
```
- Build the wallet.
```shell
npm run build
```
- The build will now be available in build directory inside the ResVault directory.
- Open chrome and navigate to `chrome://extensions/`
- Make sure developer mode is enabled using the toggle button.
- Finally, load the extension by clicking on load unpacked button and then select the build folder that was created in the previous step.
- Now you can open the wallet from the extension button and start using it. Make sure to keep the wallet persistent when sending transactions (by keeping opening inspect element)
