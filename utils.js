function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Function generates and returns a new Flat_ID
 * Note: need to check whether new ID exists in DB
 *       before inserting.
 * @returns A randomly generated 4 letter ID
 */
function generateFlatID() {
    const alphabet = [
        'a', 'b', 'c', 'd', 'e',
        'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o',
        'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y',
        'z'
    ];

    let FlatID = "";

    for(let i = 0; i < 4; i++){
        FlatID += alphabet[getRandomInt(26)];
    }

    return FlatID;
}

module.exports = {
    generateFlatID
}