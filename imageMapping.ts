namespace mcbRCtx {
    /**
    * Default image mapping function - copy and modify this for custom images
    * @param ch Character key for image selection
    */
    //% block="default image for key $ch"
    //% weight=78
    //% advanced=true 
    //% blockHidden=true
    export function defaultImageMapping(ch: string): Image {
        if (ch.charAt(0) == "A") {
            return images.createImage(`
            . # # # .
            # . . . #
            # # # # #
            # . . . #
            # . . . #
            `)
        } else if (ch.charAt(0) == "B") {
            return images.createImage(`
            # # # . .
            # . . # .
            # # # . .
            # . . # .
            # # # . .
            `)
        } else if (ch.charAt(0) == "C") {
            return images.createImage(`
            . # # # .
            # . . . .
            # . . . .
            # . . . .
            . # # # .
            `)
        } else if (ch.charAt(0) == "D") {
            return images.createImage(`
            # # # . .
            # . . # .
            # . . # .
            # . . # .
            # # # . .
            `)
        } else if (ch.charAt(0) == "E") {
            return images.createImage(`
            # # # # #
            # . . . .
            # # # # .
            # . . . .
            # # # # #
            `)
        } else if (ch.charAt(0) == "F") {
            return images.createImage(`
            # # # # #
            # . . . .
            # # # # .
            # . . . .
            # . . . .
            `)
        } else if (ch.charAt(0) == "L") {
            return images.createImage(`
            . . . . .
            . # # # .
            # . # . #
            . # # # .
            . . . . .
            `)
        } else if (ch.charAt(0) == "P") {
            return images.createImage(`
            # # # # .
            # . . . #
            # # # # .
            # . . . .
            # . . . .
            `)
        } else if (ch.charCodeAt(0) - 48 >= 0 && ch.charCodeAt(0) - 48 <= 7) {
            return images.arrowImage(ch.charCodeAt(0) - 48)
        } else {
            return images.createImage(`
            . . . . .
            . . . . .
            . # # # .
            . . . . .
            . . . . .
            `)
        }
    }
}