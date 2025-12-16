namespace imageMapping {
    // Cache for created images to avoid memory leaks
    let imageCache: { [key: string]: Image } = {};

    /**
    * Default image mapping function - copy and modify this for custom images
    * @param ch Character key for image selection
    */
    //% block="default image for key $ch"
    //% weight=78
    //% advanced=true 
    //% blockHidden=true
    export function defaultImageMapping(ch: string): Image {
        const key = ch.charAt(0);
        
        // Return cached image if available
        if (imageCache[key]) {
            return imageCache[key];
        }
        
        // Create and cache the image
        let img: Image;
        
        if (key == "A") {
            img = images.createImage(`
            . # # # .
            # . . . #
            # # # # #
            # . . . #
            # . . . #
            `)
        } else if (key == "B") {
            img = images.createImage(`
            # # # . .
            # . . # .
            # # # . .
            # . . # .
            # # # . .
            `)
        } else if (key == "C") {
            img = images.createImage(`
            . # # # .
            # . . . .
            # . . . .
            # . . . .
            . # # # .
            `)
        } else if (key == "D") {
            img = images.createImage(`
            # # # . .
            # . . # .
            # . . # .
            # . . # .
            # # # . .
            `)
        } else if (key == "E") {
            img = images.createImage(`
            # # # # #
            # . . . .
            # # # # .
            # . . . .
            # # # # #
            `)
        } else if (key == "F") {
            img = images.createImage(`
            # # # # #
            # . . . .
            # # # # .
            # . . . .
            # . . . .
            `)
        } else if (key == "L") {
            img = images.createImage(`
            . . . . .
            . # # # .
            # . # . #
            . # # # .
            . . . . .
            `)
        } else if (key == "P") {
            img = images.createImage(`
            # # # # .
            # . . . #
            # # # # .
            # . . . .
            # . . . .
            `)
        } else if (ch.charCodeAt(0) - 48 >= 0 && ch.charCodeAt(0) - 48 <= 7) {
            img = images.arrowImage(ch.charCodeAt(0) - 48)
        } else {
            img = images.createImage(`
            . . . . .
            . . . . .
            . . # . .
            . . . . .
            . . . . .
            `)
        }
        
        imageCache[key] = img;
        return img;
    }
}