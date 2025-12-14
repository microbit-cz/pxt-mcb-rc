// Add your code here 
//% color="#FF6B35" weight=101 icon="\uf519"
namespace mcbRCrx {


    /*
     * Unpack button configuration from received buffer
     */
    function unpackButtonConfig(buffer: Buffer): string[] {
        const count = buffer.getNumber(NumberFormat.UInt8LE, 0)
        const keys: string[] = []

        for (let i = 0; i < count; i++) {
            const charCode = buffer.getNumber(NumberFormat.UInt8LE, i + 1)
            keys.push(String.fromCharCode(charCode))
        }

        return keys
    }

    let receivedButtonKeys: string[] = []
    radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
        receivedButtonKeys = unpackButtonConfig(receivedBuffer)
        
        basic.showString(receivedButtonKeys.join("")) //debug
    })

}