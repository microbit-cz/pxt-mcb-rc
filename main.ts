//% color="#FF6B35" weight=100 icon="\uf11b"
namespace mcbRC {
    // Type definitions
    type ButtonKey = "A" | "B" | "C" | "D" | "E" | "F" | "P"

    declare type PinMapItem = {
        key: ButtonKey
        pin: DigitalPin
    }

    declare type ButtonStateItem = {
        key: ButtonKey
        value: boolean
    }

    declare type JoyStateItem = {
        dirArrow: number,
        strength: number,
        deg: number
    }

    type CenterPoint = {
        x: number
        y: number
    }

    // Variables
    let lastPacked = -1
    let paired = false
    let serialRX = -1
    let pinSrc: boolean = true
    let xPin: AnalogPin = AnalogPin.P2
    let yPin: AnalogPin = AnalogPin.P1
    let center: CenterPoint = { x: 0, y: 0 }
    let MAX_RADIUS = 512

    const PINSmap: Array<PinMapItem> = [
        { key: "A", pin: DigitalPin.P5 },
        { key: "B", pin: DigitalPin.P11 },
        { key: "C", pin: DigitalPin.P15 },
        { key: "D", pin: DigitalPin.P14 },
        { key: "E", pin: DigitalPin.P13 },
        { key: "F", pin: DigitalPin.P12 },
        { key: "P", pin: DigitalPin.P8 }
    ]

    const btnState: Array<ButtonStateItem> = [
        { key: "A", value: false },
        { key: "B", value: false },
        { key: "C", value: false },
        { key: "D", value: false },
        { key: "E", value: false },
        { key: "F", value: false },
        { key: "P", value: false }
    ]

    const joyState: JoyStateItem = {
        dirArrow: 0,
        strength: 0,
        deg: 0
    }

    /**
     * Initialize RC transmitter with input source configuration
     * @param usePinInput Use analog pins for joystick input (true) or accelerometer (false)
     * @param pinX Analog pin for X axis (steering), default P2
     * @param pinY Analog pin for Y axis (throttle), default P1
     * @param radioGroup Radio group number (1-255), default 10
     * @param radioFreq Radio frequency band (0-83), default 66
     */
    //% block="init RC transmitter | use pins $usePinInput | X pin $pinX | Y pin $pinY | radio group $radioGroup | frequency $radioFreq"
    //% usePinInput.defl=true
    //% pinX.defl=AnalogPin.P2
    //% pinY.defl=AnalogPin.P1
    //% radioGroup.defl=10
    //% radioFreq.defl=66
    //% weight=100
    export function init(
        usePinInput: boolean = true,
        pinX: AnalogPin = AnalogPin.P2,
        pinY: AnalogPin = AnalogPin.P1,
        radioGroup: number = 10,
        radioFreq: number = 66
    ): void {
        pinSrc = usePinInput
        xPin = pinX
        yPin = pinY

        // Radio setup
        radio.setGroup(radioGroup)
        radio.setFrequencyBand(radioFreq)
        radio.setTransmitSerialNumber(true)

        // Calculate center and max radius based on input source
        if (pinSrc) {
            center = {
                x: pins.analogReadPin(xPin),
                y: pins.analogReadPin(yPin)
            }
            MAX_RADIUS = 512
        } else {
            center = {
                x: input.acceleration(Dimension.X),
                y: input.acceleration(Dimension.Y)
            }
            MAX_RADIUS = 1024
        }

        // Start main loop
        startMainLoop()
    }

    /**
     * Start pairing process with receiver
     */
    //% block="pair RC transmitter"
    //% weight=90
    export function doPair(): void {
        paired = false
        serialRX = -1
        control.inBackground(() => {
            while (!paired && control.millis() < 10000) {
                submitPairCode()
                basic.pause(300)
            }
            if (paired) basic.showIcon(IconNames.Happy)
        })
    }

    function startMainLoop(): void {
        basic.forever(() => {
            // Read joystick position based on input source
            let x: number, y: number

            if (pinSrc) {
                x = pins.analogReadPin(xPin)
                y = pins.analogReadPin(yPin)
            } else {
                x = input.acceleration(Dimension.X)
                y = input.acceleration(Dimension.Y)
            }

            // Read button states
            for (let btn of btnState) {
                const mapping = PINSmap.find(v => v.key === btn.key)
                if (mapping) {
                    btn.value = pins.digitalReadPin(mapping.pin) === 0
                }
            }

            // Calculate joystick direction and strength
            let dx = center.x - x
            let dy = center.y - y

            let rad = Math.atan2(dy, dx)
            if (rad < 0) rad += 2 * Math.PI

            let dir = Math.round(rad * 180 / Math.PI / 45)
            if (dir >= 8) dir -= 8

            let squareMag = Math.max(Math.abs(dx), Math.abs(dy))
            joyState.strength = Math.round(
                pins.map(
                    squareMag > MAX_RADIUS ? MAX_RADIUS : squareMag,
                    0,
                    MAX_RADIUS,
                    0,
                    100
                )
            )
            joyState.dirArrow = [2, 1, 0, 7, 6, 5, 4, 3][dir]
            let deg = Math.round(rad * 180 / Math.PI)
            joyState.deg = deg < 0 ? (450 - (deg + 360)) % 360 : (450 - deg) % 360

            // Display feedback
            let imageToShow: Image = getImage("-")
            if (joyState.strength > 5) {
                imageToShow = getImage(joyState.dirArrow.toString())
            } else {
                joyState.dirArrow = 0
                joyState.deg = 0
            }

            for (let btn of btnState) {
                if (btn.value) {
                    imageToShow = getImage(btn.key)
                    break
                }
            }
            imageToShow.showImage(0, 0)

            // Send data if paired
            if (paired) {
                let packed = packState(joyState, btnState)
                if (packed != lastPacked) {
                    radio.sendNumber(packed)
                    lastPacked = packed
                }
            }

            basic.pause(20)
        })
    }

    function submitPairCode(): void {
        radio.sendValue("serial", control.deviceSerialNumber())
        basic.showIcon(IconNames.Pitchfork)
        basic.clearScreen()
    }

    function packState(joy: JoyStateItem, btns: Array<ButtonStateItem>): number {
        let buttonsMask = 0
        for (let i = 0; i < btns.length; i++) {
            if (btns[i].value) {
                buttonsMask |= (1 << i)
            }
        }

        const dir = joy.dirArrow & 0b111
        const strength = joy.strength & 0b1111111
        const deg = joy.deg & 0b111111111

        return (
            buttonsMask |
            (dir << btns.length) |
            (strength << (btns.length + 3)) |
            (deg << (btns.length + 3 + 7))
        )
    }

    // Radio receiver for pairing
    radio.onReceivedValue(function (name: string, value: number) {
        if (name === "pairing") {
            if (!paired && value === 1) {
                paired = true
                serialRX = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            }
            if (paired && value === 0 && radio.receivedPacket(RadioPacketProperty.SerialNumber) === serialRX) {
                submitPairCode()
            }
        }
    })


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
}
