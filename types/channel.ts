export interface Channel {
  id: string;
  name: string;
  logo?: string;
  category: string;
  group?: string;
  language?: string;
  streamUrl: string;
  description?: string;
  tvgId?: string;
  number?: string;
  isDemo?: boolean;
}
export interface Programme {
  id: string;
  channelId: string;
  title: string;
  start: string;
  end: string;
  isSample: boolean;
}
