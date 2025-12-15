// Add your code here 
//% color="#FF6B35" weight=101 icon="\uf519"
namespace mcbRCrx {
    type ButtonStateItem = {
        key: string
        value: boolean
    }
    type JoyStateItem = {
        dirArrow: number,
        strength: number,
        deg: number
    }
    const joyState: JoyStateItem = {
        dirArrow: 0,
        strength: 0,
        deg: 0
    }
    let isInitialized = false
    let pairedSerialNo = -1
    let pairingMode = false
    let btnState: Array<ButtonStateItem> = []
    let getImage: (ch: string) => Image = imageMapping.defaultImageMapping;

    /**
     * Initialize RC receiver
     * @param radioGroup Radio group number (1-255), default 10
     * @param radioFreq Radio frequency band (0-83), default 66
     */
    //% block="init RC receiver | use radio group $radioGroup | frequency $radioFreq"
    //% radioGroup.defl=10
    //% radioFreq.defl=66
    //% weight=100
    export function init(
        radioGroup: number = 10,
        radioFreq: number = 66
    ): void {
        radio.setGroup(radioGroup)
        radio.setFrequencyBand(radioFreq)
        radio.setTransmitSerialNumber(true)

        if (!isInitialized) {
            isInitialized = true

            radio.onReceivedNumber(function (n: number) {
                if (pairedSerialNo !== radio.receivedPacket(RadioPacketProperty.SerialNumber)) return;

                unpackState(n, joyState, btnState)

                refreshDisplay();
            })

            radio.onReceivedValue(function (name: string, value: number) {
                if (name === "serial" && (pairingMode || pairedSerialNo === -1)) {
                    if (radio.receivedPacket(RadioPacketProperty.SerialNumber) === value) {
                        pairedSerialNo = value
                        radio.sendValue("pairing", 1)
                        basic.showIcon(IconNames.Happy, 0)
                        music.playTone(440, 300)
                        pairingMode = false
                    }
                }
                if (name === "serial" && pairedSerialNo === radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
                    radio.sendValue("pairing", 1)
                    basic.showIcon(IconNames.Pitchfork, 100)
                }
            })

            radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
                if (pairedSerialNo === radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
                    btnState = rebuiltBtnState(unpackButtonConfig(receivedBuffer))
                }
            })
        }
    }

    /**
     * Start pairing process with transmitter
     */
    //% block="pair RC receiver"
    //% weight=90
    export function doPairing() {
        pairingMode = true
        pairedSerialNo = -1;
        const start = control.millis();
        control.inBackground(() => {
            while (pairingMode) {
                radio.sendValue("pairing", 0)
                basic.showIcon(IconNames.Pitchfork, 100)
                basic.clearScreen();
                if ((start + 10000) < control.millis())
                    pairingMode = false;
                else
                    basic.pause(300)
            }
        })
    }

    function refreshDisplay() {
        let imageToShow: Image = getImage("-");
        if (joyState.strength > 5) {
            imageToShow = getImage(joyState.dirArrow.toString())
        } else {
            joyState.dirArrow = 0
            joyState.deg = 0
        }
        for (let btn of btnState) {
            if (btn.value) {
                imageToShow = getImage(btn.key)
                break;
            }
        }
        imageToShow.showImage(0, 0);
    }

    function rebuiltBtnState(receivedButtonKeys: Array<string>): Array<ButtonStateItem> {
        return receivedButtonKeys.map((v, i) => ({ key: v, value: false }))
    }

    function unpackButtonConfig(buffer: Buffer): Array<string> {
        const count = buffer.getNumber(NumberFormat.UInt8LE, 0)
        const keys: string[] = []

        for (let i = 0; i < count; i++) {
            const charCode = buffer.getNumber(NumberFormat.UInt8LE, i + 1)
            keys.push(String.fromCharCode(charCode))
        }

        return keys
    }

    function unpackState(n: number, joy: JoyStateItem, btns: Array<ButtonStateItem>): void {
        joy.dirArrow = n & 0b111 // bity 0–2
        joy.strength = (n >> 3) & 0b1111111 // bity 3–9
        joy.deg = (n >> 10) & 0b111111111 // bity 10–18
        let buttonsMask = (n >> 19) // bity 19+

        for (let i = 0; i < btns.length; i++) {
            btns[i].value = (buttonsMask & (1 << i)) !== 0
        }
    }

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
}