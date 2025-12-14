//% color="#FF6B35" weight=100 icon="\uf11b"
namespace mcbRCtx {
    // Type definitions
    //type ButtonKey = "A" | "B" | "C" | "D" | "E" | "F" | "P"

    export type PinMapItem = {
        key: string
        pin: DigitalPin
    }

    type ButtonStateItem = {
        key: string
        value: boolean
    }

    type JoyStateItem = {
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
    let isInitialized = false
    let serialRX = -1
    let pinSrc: boolean = true
    let xPin: AnalogPin = AnalogPin.P2
    let yPin: AnalogPin = AnalogPin.P1
    let center: CenterPoint = { x: 0, y: 0 }
    let MAX_RADIUS = 512
    let getImage: (ch: string) => Image = defaultImageMapping;
    let pinsMap: Array<PinMapItem> = []
    //logo ID 121
    let btnState: Array<ButtonStateItem> = []

    const joyState: JoyStateItem = {
        dirArrow: 0,
        strength: 0,
        deg: 0
    }
    
    setPinsMap([
        { key: "A", pin: DigitalPin.P5 },
        { key: "B", pin: DigitalPin.P11 },
        { key: "C", pin: DigitalPin.P15 },
        { key: "D", pin: DigitalPin.P14 },
        { key: "E", pin: DigitalPin.P13 },
        { key: "F", pin: DigitalPin.P12 },
        { key: "P", pin: DigitalPin.P8 }
    ])

    /**
     * Set custom image mapping function for display feedback
     * @param customImageFunction Function that takes a string key and returns an Image
     */
    //% block="set custom image handler"
    //% draggableParameters="reporter"
    //% weight=80
    //% advanced=true
    //% blockHidden=true
    export function setGetImage(customImageFunction: (key: string) => Image): void {
        getImage = customImageFunction
    }

    /**
     * Configure button pins mapping
     * @param pinmap Array of button key to pin mappings
     */
    //% block="set pins map $pinmap"
    //% weight=75
    //% advanced=true
    //% blockHidden=true
    export function setPinsMap(pinmap: PinMapItem[]): void {
        pinsMap = pinmap;
        btnState = pinmap.map((v, i) => ({ key: v.key, value: false } as ButtonStateItem))
        if (paired) packButtonConfig(btnState)
    }

    /**
     * Get current joystick strength (0-100)
     */
    //% block="joystick strength"
    //% weight=70
    export function getStrength(): number {
        return joyState.strength
    }

    /**
     * Get current joystick direction in degrees (0-359)
     */
    //% block="joystick direction"
    //% weight=65
    export function getDirection(): number {
        return joyState.deg
    }

    /**
     * Check if RC transmitter is paired
     */
    //% block="is paired"
    //% weight=60
    export function isPaired(): boolean {
        return paired
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

        if (!isInitialized) {
            isInitialized = true
            startMainLoop()
        }
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
                const mapping = pinsMap.find(v => v.key === btn.key)
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
    
    /**
     * Pack button configuration into buffer for pairing
     * Format: [count: 1 byte][key1: 1 byte][key2: 1 byte]...[keyN: 1 byte]
     * Max 18 buttons (1 byte pro count + 18 bytes pro keys)
     */
    function packButtonConfig(btnState: Array<ButtonStateItem>): Buffer {
        const count = btnState.length
        const buffer = pins.createBuffer(count + 1)

        buffer.setNumber(NumberFormat.UInt8LE, 0, count)

        for (let i = 0; i < count; i++) {
            buffer.setNumber(NumberFormat.UInt8LE, i + 1, btnState[i].key.charCodeAt(0))
        }

        return buffer
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
                radio.sendBuffer(packButtonConfig(btnState))
                serialRX = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            }
            if (paired && value === 0 && radio.receivedPacket(RadioPacketProperty.SerialNumber) === serialRX) {
                submitPairCode()
                radio.sendBuffer(packButtonConfig(btnState))
            }
        }
    })
}
