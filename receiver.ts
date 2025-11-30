/*

//nastavit stejný radiogrp a band na TX i RX
radio.setGroup(1)
radio.setFrequencyBand(40)
radio.setTransmitSerialNumber(true)

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

radio.onReceivedNumber(function (n: number) {
    let buttonsMask = n & 0b1111111      // bity 0–6
    let dir = (n >> 7) & 0b111           // bity 7–9
    let strength = (n >> 10) & 0b1111111 // bity 10–16
    let deg = (n >> 17) & 0b111111111    // bity 17–25

    for (let i = 0; i < btnState.length; i++) {
        btnState[i].value = (buttonsMask & (1 << i)) != 0
    }
    joyState.dirArrow = dir
    joyState.strength = strength
    joyState.deg = deg
})

*/