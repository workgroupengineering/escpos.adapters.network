import { Socket } from "net";
import { Adapter } from "escpos";

interface IEndpoint {
  address: string;
  port: number;
}

export default class Network extends Adapter {
  private retrying: boolean;
  private options: IEndpoint;
  private device: Socket;
  private retries: number;
  private connected: boolean;
  private forceClose: boolean;
  private frameSize = 512;
  private frameWaitTime = 10;

  constructor(
    address: string,
    port = 9100,
    retries = 0,
    frameOptions?: { Size?: number; waitTime?: number }
  ) {
    super();
    this.device = new Socket();
    this.retrying = false;
    this.forceClose = false;
    this.retries = 0;
    this.options = { address, port };
    this.connected = false;
    if (frameOptions) {
      if (frameOptions.Size) this.frameSize = frameOptions.Size;
      if (frameOptions.waitTime) this.frameWaitTime = frameOptions.waitTime;
    }

    this.device.on("close", () => {
      this.connected = false;
      if (this.forceClose) {
        return;
      }
      if (this.retrying && (retries === 0 || this.retries < retries)) {
        this.retries++;
        setTimeout(() => {
          this.device.connect(this.options.port, this.options.address);
        }, 5000);
      } else {
        this.retrying = false;
        throw new Error(
          `Cannot connect to ${this.options.address}:${this.options.port}`
        );
      }
    });

    this.device.on("error", (err) => {
      /* eslint-disable no-alert, no-console */
      console.error(err);
      /* eslint-enable no-alert, no-console */
      this.connected = false;
    });
  }

  public async open(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.retrying = true;
      this.forceClose = false;
      this.device.connect(this.options.port, this.options.address);
      this.device.on("connect", () => {
        this.retrying = false;
        this.connected = true;
        resolve();
      });
    });
  }

  private async writeInternal(data: Uint8Array): Promise<void> {
    return new Promise<void>((resolve) => {
      this.throwIfNeeded();
      this.device.write(Buffer.from(data), null);
      if (resolve) {
        resolve();
      }
    });
  }

  public async write(data: Uint8Array): Promise<void> {
    const buffer = data;
    const chunkSize = this.frameSize;
    const numberOfchunk = Math.ceil(buffer.length / chunkSize);
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
    let index = 0;
    for (index; index < numberOfchunk; index++) {
      const start = index * chunkSize;
      const end =
        start + chunkSize > buffer.length ? buffer.length : start + chunkSize;
      const chunk = buffer.slice(start, end);
      await this.writeInternal(chunk);
      await wait(this.frameWaitTime);
    }
    return;
  }

  public async close(): Promise<void> {
    this.throwIfNeeded();
    this.retrying = false;
    this.connected = false;
    this.forceClose = true;
    this.device.destroy();
  }

  private throwIfNeeded(reason?: string) {
    if (!this.device || !this.connected) {
      throw new Error(reason || "The network socket is not open");
    }
  }
}
