
export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  number: number;
}

export interface Category {
  name: string;
  channels: Channel[];
}

export enum UIState {
  IDLE = 'IDLE',
  ZAPPING = 'ZAPPING',
  MENU = 'MENU',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}
