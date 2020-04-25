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
    constructor() {
        this.players = [];

        this.state = "init";
        this.drawPile = [];
        this.discardPile = [];

        this.currentPlayer = null;
        this.playerInitLastRound = null;
    }

    tryInit(initPlayers) {
        if (this.state === "init") {
            console.log("Ojyks: ", "Initialize game ...");
            // initialize players
            for (const { name, uuid } of initPlayers) {
                this.players.push({
                    name: name,
                    uuid: uuid,
                    online: true,
                    cards: [],  // this is an list of 12 objects,
                    state: "init",
                    scores: []
                });
            }

            this.state = "initialized";
        }
    }

    // reset the game and deal cards.
    start() {
        console.log("Ojyks: ", "Start new game ...");

        this.state = "active";
        this.drawPile = [];
        this.discardPile = [];
        this.currentPlayer = null;
        this.playerInitLastRound = null;

        for (const player of this.players) {
            player.cards = [],
            player.state = "init"
        }

        this.drawPile = this.initialize(deckRules);
        this.deal(this.drawPile, this.players);
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
        if (player) {
            const index = this.players.indexOf(player);
            const nextIndex = (index + 1) % count;

            this.currentPlayer = this.players[nextIndex].name;
        }

        return this.currentPlayer;
    }

    completeTurn() {
        const count = this.players.filter(p => p.state === "end").length;

        let player = this.players.find(p => p.name === this.currentPlayer);
        if (count > 0) {
            player.state = "end"
        } else {
            player.state = 'ready';
        }

        // safty mechanism if only on player plays
        if (this.players.filter(p => p.online).length > 0) {
            let player = null;
            do {
                this.nextPlayer();

                player = this.players.find(p => p.name === this.currentPlayer);
            } while (!player.online)

            if (player.state === "ready")
                player.state = 'play';
        };
    }

    getCardFromDrawPile() {
        if (this.drawPile.length === 0) {
            // Shuffle cards from discard and add them to this
            const pile = this.discardPile;

            const firstCard = pile.splice(0, 1);
            this.discardPile = [firstCard];

            this.drawPile = this.shuffle(pile);
            return;
        }

        return this.drawPile[0];
    }

    cleanUpBoard(boardCards) {
        if (boardCards[0] && boardCards[0].value === boardCards[4].value && boardCards[0].value === boardCards[8].value &&
            !boardCards[0].faceDown && !boardCards[4].faceDown && !boardCards[8].faceDown) {
            this.discardPile = [boardCards[0], boardCards[4], boardCards[8], ...this.discardPile];
            boardCards[0] = null;
            boardCards[4] = null;
            boardCards[8] = null;
        }
        if (boardCards[1] && boardCards[1].value === boardCards[5].value && boardCards[1].value === boardCards[9].value &&
            !boardCards[1].faceDown && !boardCards[5].faceDown && !boardCards[9].faceDown) {
            this.discardPile = [boardCards[1], boardCards[5], boardCards[9], ...this.discardPile];
            boardCards[1] = null;
            boardCards[5] = null;
            boardCards[9] = null;
        }
        if (boardCards[2] &&
            boardCards[2].value === boardCards[6].value &&
            boardCards[2].value === boardCards[10].value &&
            !boardCards[2].faceDown && !boardCards[6].faceDown && !boardCards[10].faceDown) {
            this.discardPile = [boardCards[2], boardCards[6], boardCards[10], ...this.discardPile];
            boardCards[2] = null;
            boardCards[6] = null;
            boardCards[10] = null;
        }
        if (boardCards[3] &&
            boardCards[3].value === boardCards[7].value &&
            boardCards[3].value === boardCards[11].value &&
            !boardCards[3].faceDown && !boardCards[7].faceDown && !boardCards[11].faceDown) {
            this.discardPile = [boardCards[3], boardCards[7], boardCards[11], ...this.discardPile];
            boardCards[3] = null;
            boardCards[7] = null;
            boardCards[11] = null;
        }
    }

    detectLastRound(player) {
        const cardsNotNull = player.cards.filter(c => c !== null);
        const cardsOpened = cardsNotNull.filter(c => !c.faceDown);

        if (cardsOpened.length === cardsNotNull.length) {
            player.state = "end";

            // set player who initialized last round
            if (!this.playerInitLastRound)
                this.playerInitLastRound = player;
        }
    }

    detectGameEnd() {
        // if all player have state end then open all cards
        // also enable score state
        const count = this.players.length;
        const onlineCount = this.players.filter(p => p.online === true).length;
        const countEnd = this.players.filter(p => p.state === "end").length;

        console.log("onlinecount", onlineCount);
        console.log("count end", countEnd);

        if (countEnd < onlineCount) return;

        // TODO if end initializer has more points than any count his points twice
        // also save if has smalles score who wons multiply twice
        // create scores
        for (const player of this.players) {
            player.state = "score";
            let score = {
                value: 0,
                end: player.uuid === this.playerInitLastRound.uuid,
                doubled: false
            };

            for (const card of player.cards) {
                if (card) {
                    card.faceDown = false;
                    score.value = score.value + card.value;
                }
            }
            player.scores.push(score);
        }


        const challengerScore = this.playerInitLastRound.scores.slice(-1)[0];
        console.log("challanger score: ", this.playerInitLastRound.scores);
        console.log("challanger score: ", challengerScore);
        
        // get all player whos last score is better than challanger score
        const betterPlayers = this.players.filter(p => 
            p !== this.playerInitLastRound &&
            p.scores.slice(-1)[0].value <= challengerScore.value);
        console.log("better players: ", betterPlayers);
        console.log("better players scores: ", betterPlayers.map(b => { b.scores }));

        if(betterPlayers.length > 0) {
            challengerScore.value *= 2;
            challengerScore.doubled = true;

            console.log(betterPlayers.map(p => p.name), ` are better than ${this.playerInitLastRound.name}`);

            console.log("challanger score after loosing:", challengerScore)
        }
        
     
        this.state = "score";
    }

    // returns score table 
    getScores() {
        return this.players && this.players.map(p => ({
            name: p.name,
            uuid: p.uuid,
            scores: p.scores
        }));
    }

    turn(playerName, source, cardIndex) {
        console.log(playerName, source, cardIndex);

        const player = this.players.find(p => p.name === playerName);
        if (!player) return;

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

            case 'play':
                switch (source) {
                    case 'board': {
                        const card = player.cards[cardIndex];
                        if (!card) return;
                        if (!card.faceDown) return;

                        // turn card
                        card.faceDown = false;

                        this.completeTurn();
                    } break;
                    case 'draw': {
                        const card = this.getCardFromDrawPile();
                        if (!card) return;

                        card.faceDown = false;
                        player.state = "draw";

                    } break;
                    case 'discard':
                        if (this.discardPile.length > 0) {
                            player.state = "discard";
                        }
                        break;
                }

                break;

            case 'draw':
                switch (source) {
                    case 'board': {
                        // swap with card from board
                        const boardCard = player.cards[cardIndex];
                        boardCard.faceDown = false;

                        this.discardPile = [boardCard, ...this.discardPile];

                        const drawCard = this.drawPile.splice(0, 1)[0];
                        player.cards[cardIndex] = drawCard;

                        this.completeTurn();
                    } break;
                    case 'draw':
                        break;
                    case 'discard':
                        const drawCard = this.drawPile.splice(0, 1)[0];
                        this.discardPile = [drawCard, ...this.discardPile]

                        player.state = "draw.open";
                        break;
                }
                break;

            case 'draw.open':
                switch (source) {
                    case 'board': {
                        // open card on board
                        const boardCard = player.cards[cardIndex];
                        if (!boardCard.faceDown) return;

                        boardCard.faceDown = false;

                        this.completeTurn();
                    } break;
                    case 'draw':
                        break;
                    case 'discard':
                        break;
                }
                break;

            case 'discard':
                switch (source) {
                    case 'board': {
                        // swap with card from board
                        const boardCard = player.cards[cardIndex];
                        boardCard.faceDown = false;

                        const discardCard = this.discardPile.splice(0, 1)[0];
                        player.cards[cardIndex] = discardCard;

                        this.discardPile = [boardCard, ...this.discardPile];
                        this.completeTurn();
                    } break;
                    case 'draw':
                        break;
                    case 'discard':
                        break;
                }
                break;

            case "ready":
            default:
                return;
        }

        // remove cards if three in one column
        this.cleanUpBoard(player.cards);

        // check for last round
        this.detectLastRound(player);

        this.detectGameEnd();
    }

    // check if all players are ready
    // get player with highest open cards.
    findAndSetBeginningPlayer() {
        const playerInitCount = this.players.filter(p => p.state === "init").length;
        if (playerInitCount > 0) return;

        let beginner = "";
        let beginnerSum = -99;

        // find player with highest score
        for (const player of this.players) {
            const playerSum = player.cards.filter(c => !c.faceDown)
                .map(c => c.value)
                .reduce((a, b) => a + b);

            if (playerSum > beginnerSum) {
                beginner = player.name;
                beginnerSum = playerSum;
            }
        }

        // select player with highest value to begin
        const player = this.players.find(p => p.name === beginner);
        player.state = "play";

        this.currentPlayer = player.name;
    }

    setPlayerNetworkState(uuid, isOnline) {
        const player = this.players.find(p => p.uuid === uuid);
        player.online = isOnline;
        player.state = "ready";

        if (this.currentPlayer === player.name) {
            const card = this.drawPile.splice(0, 1)[0];

            if (card && card.faceDown) {
                this.drawPile = [card, ...this.drawPile];
            } else {
                card.faceDown = false;
                this.discardPile = [card, ...this.discardPile];
            }

            this.completeTurn();
        }
    }
}