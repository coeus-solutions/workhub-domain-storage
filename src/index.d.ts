export declare class DomainStorage {
  setServerUrl: (url: string) => undefined
  setFailTimeout: (timeout: number) => undefined
  getItem: (key: string) => Promise<string|null>
  setItem: (key: string, value: string) => Promise<undefined>
  removeItem: (key: string) => Promise<undefined>
}

export declare class DomainStorageServer {

}
