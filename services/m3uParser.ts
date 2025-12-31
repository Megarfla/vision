
import { Channel } from '../types';

const M3U_URL = 'https://raw.githubusercontent.com/Megarfla/Mt/refs/heads/main/tv';

export const fetchChannels = async (): Promise<Channel[]> => {
  try {
    const response = await fetch(M3U_URL);
    if (!response.ok) throw new Error('Falha ao carregar lista IPTV remota.');
    const text = await response.text();
    return parseM3U(text);
  } catch (error) {
    console.error('M3U Parser Error:', error);
    throw error;
  }
};

const parseM3U = (data: string): Channel[] => {
  // Suporte para diferentes tipos de quebra de linha
  const lines = data.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};
  let count = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Tenta extrair o nome (geralmente após a última vírgula)
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : `Canal ${count}`;
      
      // Atributos usando regex mais flexível
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const idMatch = line.match(/tvg-id="([^"]*)"/i);

      currentChannel = {
        id: idMatch ? idMatch[1] : `ch-${count}`,
        number: count,
        name: name || `Canal ${count}`,
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : 'Geral'
      };
    } else if (line.startsWith('http')) {
      // Se encontramos uma URL e já temos informações do canal
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as Channel);
        count++;
        currentChannel = {};
      }
    }
  }

  return channels;
};
