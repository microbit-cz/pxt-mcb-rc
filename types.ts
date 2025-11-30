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