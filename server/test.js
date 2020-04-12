var Ojyks = require('./ojyks');

let game = new Ojyks([ "player1", "player2", "player3"]);

console.log(game.currentPlayer)
console.log(game.nextPlayer())

game.turn("player2", "board", 2)
game.turn("player2", "board", 3)

game.turn("player1", "board", 1)
game.turn("player1", "board", 10)

game.turn("player3", "board", 7)
game.turn("player3", "board", 8)

console.log(game.currentPlayer)
console.log(game.nextPlayer())
console.log(game.nextPlayer())

console.log(game.nextPlayer())

console.log(game.nextPlayer())

