import Network from "../src/index";
import { Commands } from "escpos";
import { Printer } from "escpos";

const values = [
  {
    text: "Hello",
    text2: "World",
  },
  {
    text: "Foo",
    text2: "Bar",
  },
];

async function test() {
  try {
    const networkAdapter = new Network("192.168.1.30", 9100, 1);
    const printer = await new Printer(networkAdapter, "CP865").open();

    await printer
      .init()
      .setCodeTable(Commands.CodeTable.PC865)
      .setJustification(Commands.Justification.Center)
      .setJustification(Commands.Justification.Right)
      .writeLine("Just some text, a newline will be added.")
      .barcode(
        "1234567890123",
        Commands.Barcode.EAN13,
        50,
        2,
        Commands.Font.A,
        Commands.Position.Below
      )
      .qr("We can put all kinds of cool things in these...")
      .writeList(values.map((v) => `${v.text} ... ${v.text2}`)) // Prints one entry per line
      .feed(4)
      .cut(true)
      .close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
}

test();
