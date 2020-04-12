const deckRules = [
    { value: -2, count: 5 },
    { value: -1, count: 10 },
    { value: 0, count: 15 },
    { value: 1, count: 10 },
    { value: 2, count: 10 },
    { value: 3, count: 10 },
    { value: 4, count: 10 },
    { value: 5, count: 10 },
    { value: 6, count: 10 },
    { value: 7, count: 10 },
    { value: 8, count: 10 },
    { value: 9, count: 10 },
    { value: 10, count: 10 },
    { value: 11, count: 10 },
    { value: 12, count: 10 }
];

module.exports = class Ojyks {
    constructor(playerNames) {
        console.log(playerNames)

        this.players = [];
        this.drawPile = [];
        this.discardPile = [];

        // initialize players
        for (const name of playerNames) {
            this.players.push({
                name: name,
                online: true,
                cards: [],  // this is an list of 12 objects,
                state: "init"
            });
        }

        this.drawPile = this.initialize(deckRules);
        this.deal(this.drawPile, this.players);

        this.currentPlayer = null;
        this.currentState = "init";

        this.gameState = "init"

        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());
        // console.log(this.nextPlayer());


    }

    // creates cards and add it to the drawPile.
    initialize(cardTypes) {
        let cards = [];

        for (let template of cardTypes) {
            // https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
            //var x = Array.apply(null, { length: card.count }).map(c => card.value);
            cards = [...cards, ...Array.from(Array(template.count), (_, i) => ({
                id: cards.length + i,
                value: template.value,
                faceDown: true
            }))];
        }

        return this.shuffle(cards);
    }

    // shuffle an array
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array#6274398
    shuffle(array) {
        let counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    }

    deal(drawPile, players) {
        for (const player of players) {
            const cards = drawPile.splice(0, 12);
            player.cards = cards;
        }
    }

    nextPlayer() {
        const count = this.players.length;

        const player = this.players.find(p => p.name === this.currentPlayer)
        if(player) {
            const index = this.players.indexOf(player);
            const nextIndex = (index + 1) % count;

            this.currentPlayer = this.players[nextIndex].name;
        }

        return this.currentPlayer;
    }

    turn(playerName, source, cardIndex) {
        const player = this.players.find(p => p.name === playerName);

        // validate cardIndex depending on source
        if (source === "board" && cardIndex < 0 || cardIndex >= 12) return;

        // check if player is allowed to play. A player is allowed to play if either his state is init
        // or its the players turn.
        if (player.state !== "init" &&
            this.currentPlayer !== player.name) return;

        switch (player.state) {
            case "init":
                // player needs to open two cards from the board
                if (source !== "board") return;

                const card = player.cards[cardIndex];
                if (!card.faceDown) return;
                card.faceDown = false;

                const faceDownCount = player.cards.filter(c => !c.faceDown).length;
                if (faceDownCount === 2) {
                    // set player state to ready for playing. In this state the player
                    // has to wait until game allows him to play.
                    player.state = "ready";
                }

                // enable ready player
                this.findAndSetBeginningPlayer();
                break;
        }
    }

    // check if all players are ready
    // get player with highest open cards.
    findAndSetBeginningPlayer() {
        const playerInitCount = this.players.filter(p => p.state === "init").length;
        if(playerInitCount > 0) return;

        let beginner = "";
        let beginnerSum = -99;

        // find player with highest score
        for (const player of this.players) {
            const playerSum = player.cards.filter(c => !c.faceDown)
                                            .map(c => c.value)
                                            .reduce((a, b) => a + b);

            if(playerSum > beginnerSum) {
                beginner = player.name;
                beginnerSum = playerSum;
            }
        }

        // select player with highest value to begin
        const player = this.players.find(p => p.name === beginner);
        player.state = "play";

        this.currentPlayer = player.name;
    }

}