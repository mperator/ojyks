const cardTypes = [
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

function createDeck(cardTypes) {
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

    return shuffle(cards);
}

function shuffle(array) {
    return [...array.sort(() => Math.random() - 0.5)];
}

export { createDeck as default, cardTypes };