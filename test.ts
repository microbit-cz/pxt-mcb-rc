//tests go here; this will not be compiled when this package is used as an extension.
mcbRCtx.setPinsMap([
    { key: "A", pin: DigitalPin.P5 },
    { key: "B", pin: DigitalPin.P11 }
])
mcbRCtx.init(false);
mcbRCtx.doPair();