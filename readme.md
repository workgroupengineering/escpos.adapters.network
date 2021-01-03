# ESC/POS library

## Features:

- Adapter for Network ESC/POS printer
                           
## Usage example:

```bash
npm install github:workgroupengineering/escpos.adapters.network@latest
```

```javascript
import { Printer } from 'escpos';
import { Commands } from 'escpos';
import { Network } from 'escpos.adapters.network';

const adapter =  new Network("192.168.1.30", 9100, 1);
const printer = await new Printer(adapter).open();
                           
printer.setFont(Commands.Font.A)
       .setJustification(Commands.Justification.Center)
       .setTextMode(Commands.TextMode.DualWidthAndHeight)
       .writeLine("This is some large centered text")
       .setTextMode(Commands.TextMode.Normal)
       .setJustification(Commands.Justification.Left)
       .writeLine("Some normal text")
       .feed(4)
       .close()
       .then(() => console.log("Done printing..."));
```
