/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { WasmProcess, Readable, Writable } from '@vscode/wasm-wasi';
import {
  Message,
  WriteableStreamMessageWriter,
  Disposable,
  Emitter,
  Event,
  ReadableStreamMessageReader,
  MessageTransports,
} from 'vscode-languageclient/node';

interface ReadableStream {
  onData(listener: (data: Uint8Array) => void): Disposable;
  onClose(listener: () => void): Disposable;
  onError(listener: (error: any) => void): Disposable;
  onEnd(listener: () => void): Disposable;
}

class ReadableStreamImpl implements ReadableStream {
  private readonly errorEmitter: Emitter<[Error, Message | undefined, number | undefined]>;
  private readonly closeEmitter: Emitter<void>;
  private readonly endEmitter: Emitter<void>;

  private readonly readable: Readable;

  constructor(readable: Readable) {
    this.errorEmitter = new Emitter<[Error, Message, number]>();
    this.closeEmitter = new Emitter<void>();
    this.endEmitter = new Emitter<void>();
    this.readable = readable;
  }

  public get onData(): Event<Uint8Array> {
    return this.readable.onData;
  }

  public get onError(): Event<[Error, Message | undefined, number | undefined]> {
    return this.errorEmitter.event;
  }

  public fireError(error: any, message?: Message, count?: number): void {
    this.errorEmitter.fire([error, message, count]);
  }

  public get onClose(): Event<void> {
    return this.closeEmitter.event;
  }

  public fireClose(): void {
    this.closeEmitter.fire(undefined);
  }

  public onEnd(listener: () => void): Disposable {
    return this.endEmitter.event(listener);
  }

  public fireEnd(): void {
    this.endEmitter.fire(undefined);
  }
}

type MessageBufferEncoding = 'ascii' | 'utf-8';
interface WritableStream {
  onClose(listener: () => void): Disposable;
  onError(listener: (error: any) => void): Disposable;
  onEnd(listener: () => void): Disposable;
  write(data: Uint8Array): Promise<void>;
  write(data: string, encoding: MessageBufferEncoding): Promise<void>;
  end(): void;
}

const decoder = new TextDecoder('utf-8');

class WritableStreamImpl implements WritableStream {
  private readonly errorEmitter: Emitter<[Error, Message | undefined, number | undefined]>;
  private readonly closeEmitter: Emitter<void>;
  private readonly endEmitter: Emitter<void>;

  private readonly writable: Writable;

  constructor(writable: Writable) {
    this.errorEmitter = new Emitter<[Error, Message, number]>();
    this.closeEmitter = new Emitter<void>();
    this.endEmitter = new Emitter<void>();
    this.writable = writable;
  }

  public get onError(): Event<[Error, Message | undefined, number | undefined]> {
    return this.errorEmitter.event;
  }

  public fireError(error: any, message?: Message, count?: number): void {
    this.errorEmitter.fire([error, message, count]);
  }

  public get onClose(): Event<void> {
    return this.closeEmitter.event;
  }

  public fireClose(): void {
    this.closeEmitter.fire(undefined);
  }

  public onEnd(listener: () => void): Disposable {
    return this.endEmitter.event(listener);
  }

  public fireEnd(): void {
    this.endEmitter.fire(undefined);
  }

  public write(data: string | Uint8Array, _encoding?: MessageBufferEncoding): Promise<void> {
    if (typeof data === 'string') {
      console.log('🚀 ~ file: lspServer.ts:114 ~ WritableStreamImpl ~ write ~ data:', data);
      return this.writable.write(data, 'utf-8');
    } else {
      console.log('🚀 ~ file: lspServer.ts:117 ~ WritableStreamImpl ~ write ~ data:', decoder.decode(data));
      return this.writable.write(data);
    }
  }

  public end(): void {
    // TODO
  }
}

export async function runServerProcess(
  process: WasmProcess,
  readable: Readable | undefined = process.stdout,
  writable: Writable | undefined = process.stdin,
): Promise<MessageTransports> {
  if (readable === undefined || writable === undefined) {
    throw new Error('Process created without streams or no streams provided.');
  }

  const reader = new ReadableStreamImpl(readable);
  const writer = new WritableStreamImpl(writable);

  process.run().then(
    (value) => {
      if (value === 0) {
        reader.fireEnd();
      } else {
        reader.fireError([new Error(`Process exited with code: ${value}`), undefined, undefined]);
      }
    },
    (error) => {
      reader.fireError([error, undefined, undefined]);
    },
  );

  return {
    reader: new ReadableStreamMessageReader(reader),
    writer: new WriteableStreamMessageWriter(writer),
    detached: false,
  };
}
