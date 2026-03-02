export class Web3Auth {
  clientId: string;
  web3AuthNetwork: string;
  uiConfig?: unknown;
  provider: unknown = null;
  connected = false;

  constructor(config: { clientId: string; web3AuthNetwork: string; uiConfig?: unknown }) {
    this.clientId = config.clientId;
    this.web3AuthNetwork = config.web3AuthNetwork;
    this.uiConfig = config.uiConfig;
  }

  async init() {
    return Promise.resolve();
  }

  async connect() {
    this.connected = true;
    this.provider = {};
    return this.provider;
  }

  async logout() {
    this.connected = false;
    this.provider = null;
    return Promise.resolve();
  }

  async getUserInfo() {
    return Promise.resolve({});
  }
}

export const WALLET_ADAPTERS = {
  OPENLOGIN: 'openlogin',
};

export const CHAIN_NAMESPACES = {
  EIP155: 'eip155',
};
