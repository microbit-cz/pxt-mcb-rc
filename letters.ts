
function getImage(ch: string): Image {
    let result: Image = images.createImage(`
        . . . . .
        . . . . .
        . # # # .
        . . . . .
        . . . . .
        `)

    switch (ch.charAt(0).toUpperCase()) {
        case "A":
            result = images.createImage(`
                . # # # .
                # . . . #
                # # # # #
                # . . . #
                # . . . #
                `)
            break;
        case "B":
            result = images.createImage(`
                # # # . .
                # . . # .
                # # # . .
                # . . # .
                # # # . .
                `)
            break;
        case "C":
            result = images.createImage(`
                . # # # .
                # . . . .
                # . . . .
                # . . . .
                . # # # .
                `)
            break;
        case "D":
            result = images.createImage(`
                # # # . .
                # . . # .
                # . . # .
                # . . # .
                # # # . .
                `)
            break;
        case "E":
            result = images.createImage(`
                # # # # #
                # . . . .
                # # # # .
                # . . . .
                # # # # #
                `)
            break;
        case "F":
            result = images.createImage(`
                # # # # #
                # . . . .
                # # # # .
                # . . . .
                # . . . .
                `)
            break;
        case "P":
            result = images.createImage(`
                # # # # .
                # . . . #
                # # # # .
                # . . . .
                # . . . .
                `)
            break;
    }

    const arrNo: number = ch.charCodeAt(0) - 48
    if (arrNo >= 0 && arrNo <= 7) result = images.arrowImage(arrNo);
    
    return result;
}