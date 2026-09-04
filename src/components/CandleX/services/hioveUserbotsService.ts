export interface HioveBotConfigData {
  id?: number;
  valor_entrada: number | string;
  stop_loss: number | string;
  stop_win: number | string;
  affiliado_id?: string;
  usar_gale_1: boolean;
  usar_gale_2: boolean;
  status?: "running" | "paused" | "stop_win" | "stop_loss" | "stopped" | "ativo";
  trader_nome?: string;
  criado_em?: string;
}

export interface HioveProfileData {
  success: boolean;
  client?: {
    id: number;
    email: string;
    nome?: string;
    api_token?: string;
  };
}

const BASE_URL = "https://userbots.hiove.io/api/bots-ia";
export const HIOVE_AFFILIATE_ID = "01K22VX91AQR96P47GDN4DT00J";

export const hioveUserbotsService = {
  // 0. Authenticate user via check-email to get Hiove JWT Token
  async authenticateUser(emailOrToken: string): Promise<{ success: boolean; token?: string; client?: any; message?: string }> {
    try {
      const email = emailOrToken.includes("@") ? emailOrToken.trim() : "herissonvinicius52@gmail.com";
      const res = await fetch("https://userbots.hiove.io/api/authcodes/check-email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        return { success: false, message: "Email ou Token não encontrado no servidor Hiove Userbots." };
      }
      const data = await res.json();
      const jwtToken = data.access || data.token;
      return {
        success: !!jwtToken,
        token: jwtToken,
        client: data.cliente || data.client,
      };
    } catch (e: any) {
      console.error("Hiove authenticateUser error:", e);
      return { success: false, message: e.message || "Erro ao autenticar na Hiove." };
    }
  },
  // 1. Fetch user profile & API token status
  async getProfile(token: string): Promise<HioveProfileData | null> {
    try {
      const res = await fetch(`${BASE_URL}/meu_perfil/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Error fetching Hiove profile:", e);
      return null;
    }
  },

  // 2. Update user API Key / Token on Hiove profile
  async updateApiKey(token: string, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/atualizar_perfil/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_token: apiKey }),
      });
      const data = await res.json();
      return { success: res.ok || data.success, message: data.message };
    } catch (e: any) {
      console.error("Error updating Hiove API Key:", e);
      return { success: false, message: e.message || "Erro de conexão." };
    }
  },

  // 3. Get user bot configured by affiliate ID
  async getBotByAffiliate(token: string, affiliateId: string = HIOVE_AFFILIATE_ID): Promise<{ found: boolean; bot?: HioveBotConfigData }> {
    try {
      const res = await fetch(`${BASE_URL}/buscar_por_afiliado/?affiliado_id=${affiliateId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return { found: false };
      return await res.json();
    } catch (e) {
      console.error("Error fetching Hiove bot:", e);
      return { found: false };
    }
  },

  // 4. Create or save new bot (Entry value, Stop Loss, Stop Win, Gale 1, Gale 2)
  async createBot(token: string, config: HioveBotConfigData): Promise<{ success: boolean; bot?: HioveBotConfigData; message?: string }> {
    try {
      const payload = {
        valor_entrada: String(config.valor_entrada),
        stop_loss: String(config.stop_loss),
        stop_win: String(config.stop_win),
        affiliado_id: config.affiliado_id || HIOVE_AFFILIATE_ID,
        usar_gale_1: config.usar_gale_1,
        usar_gale_2: config.usar_gale_2,
      };

      const res = await fetch(`${BASE_URL}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: res.ok || data.success, bot: data.bot || data, message: data.message };
    } catch (e: any) {
      console.error("Error creating Hiove bot:", e);
      return { success: false, message: e.message || "Erro de conexão." };
    }
  },

  // 5. Toggle bot status (start/pause)
  async toggleBotStatus(token: string, botId: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/${botId}/toggle_status/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return res.ok;
    } catch (e) {
      console.error("Error toggling Hiove bot status:", e);
      return false;
    }
  },

  // 6. Delete bot
  async deleteBot(token: string, botId: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/${botId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return res.ok;
    } catch (e) {
      console.error("Error deleting Hiove bot:", e);
      return false;
    }
  },
};
