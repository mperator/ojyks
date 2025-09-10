# Featurelist

## Bugs
- Der draw pile hat manchmal eine aufgedeckte Karte
- Karten werden beim initialen nutzen nicht geladen.

## Refactor
Rename and reafactor code to be more consistent and easier to understand, create components where necessary.
- Lobby: show all open game rooms.
- GameRoom: prepare a game and start if all players are ready.
- Rename MyRoom to OjyksRoom
- ...

## Style components
Use TailwindCSS to style components and make them responsive.
- Create a new better style for all components according to the card

## Chat
Extend the chat for the game room and the lobby.
- Save messages on the server to restore history on reconnect.
- Show timestamps for messages.
- Show who is typing.
- Show how send the message

## Mobile Optimization
Make the app responsive and usable on mobile devices.

## Network optimization
Optimize protocoll to reduce false behavior when joining and leaving rooms.
