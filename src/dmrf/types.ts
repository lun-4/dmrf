export interface ForwardFunction {
  (message: any): void
}

export interface RejectFunction {
  (errorMessage: string): void
}

export interface SendHook {
  (message: any, forward: ForwardFunction): any;
}

export interface ReceiveHook {
  (message: any, reject: RejectFunction, forward: ForwardFunction): any;
}

export interface MRFSpec {
  mrfVersion: number
  name: string
}

export interface MRF {
  spec: MRFSpec
  sendHook: SendHook
  receiveHook: ReceiveHook
}

// INTERNAL API ONLY
export interface DMRFNatives {
  init(): any;
  receiveHook(message: any): Promise<boolean>;
  sendHook(message: any): Promise<boolean>;
};
