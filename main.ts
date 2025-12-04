//nastavit stejný radiogrp a band na TX i RX
radio.setGroup(10)
radio.setFrequencyBand(66)
radio.setTransmitSerialNumber(true)
let lastPacked = -1
let paired = false;
let serialRX = -1;

const center = { x: pins.analogReadPin(AnalogPin.P2), y: pins.analogReadPin(AnalogPin.P1) } //{ x: 502, y: 512 }

control.inBackground(()=>{
    while (!paired && control.millis() < 10000) {
        submitPairCode()
        basic.pause(300)
    }
    if (paired) basic.showIcon(IconNames.Happy)
})

const MAX_RADIUS = 512
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

basic.forever(() => {
    let x = pins.analogReadPin(AnalogPin.P2)
    let y = pins.analogReadPin(AnalogPin.P1)

    for (let i = 0; i < PINSmap.length; i++) {
        const m = PINSmap[i]
        const pressed = pins.digitalReadPin(m.pin) === 0

        for (let j = 0; j < btnState.length; j++) {
            if (btnState[j].key == m.key) {
                btnState[j].value = pressed
                break
            }
        }
    }

    for (let btn of btnState) {
        const mapping = PINSmap.find(v => v.key === btn.key)
        if (mapping) {
            btn.value = pins.digitalReadPin(mapping.pin) === 0
        }
    }

    let dx = center.x - x
    let dy = center.y - y
    let r2 = dx * dx + dy * dy

    let rad = Math.atan2(dy, dx)
    if (rad < 0) rad += 2 * Math.PI

    let dir = Math.round(rad * 180 / Math.PI / 45)
    if (dir >= 8) dir -= 8
 
    let squareMag = Math.max(Math.abs(dx), Math.abs(dy))
    joyState.strength = Math.round(pins.map(squareMag > MAX_RADIUS ? MAX_RADIUS : squareMag, 0, MAX_RADIUS, 0, 100));
    joyState.dirArrow = [2, 1, 0, 7, 6, 5, 4, 3][dir]; //remap to ArrowNames;
    let deg = Math.round(rad * 180 / Math.PI)
    joyState.deg = deg < 0 ? (450 - (deg + 360)) % 360 : (450 - deg) % 360

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

    if (paired) 
    {
        let packed = packState(joyState, btnState)
        if (packed != lastPacked) {
            radio.sendNumber(packed)
            lastPacked = packed
        }
    }

    basic.pause(20)
})

function submitPairCode() {
    radio.sendValue("serial", control.deviceSerialNumber())
    basic.showIcon(IconNames.Pitchfork)
    basic.clearScreen()
}
input.onLogoEvent(TouchButtonEvent.Pressed, submitPairCode)

radio.onReceivedValue(function(name: string, value: number) {
    if (name === "pairing") {
        if (!paired && value === 1) {
            serialRX = radio.receivedPacket(RadioPacketProperty.SerialNumber);
            paired = true
        }
        if (paired && value === 0 && radio.receivedPacket(RadioPacketProperty.SerialNumber) === serialRX)
        {
            submitPairCode()
        }
    }
})

function packState(joy: JoyStateItem, btns: Array<ButtonStateItem>): number {
    let buttonsMask = 0
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].value) {
            buttonsMask |= (1 << i) // A=bit0, B=bit1, ...
        }
    }

    const dir = joy.dirArrow & 0b111          // 3 bity
    const strength = joy.strength & 0b1111111 // 7 bitů
    const deg = joy.deg & 0b111111111         // 9 bitů

    return (
        (buttonsMask) |    // bity 0–6
        (dir << 7) |       // bity 7–9
        (strength << 10) | // bity 10–16
        (deg << 17)        // bity 17–25
    )
}
