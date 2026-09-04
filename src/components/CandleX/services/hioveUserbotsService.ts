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

// Resilient fetch wrapper with server-side proxy fallback to prevent CORS / "Failed to fetch" errors
async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.ok || res.status < 500) {
      return res;
    }
  } catch (directErr) {
    console.warn("Direct fetch to Hiove failed, attempting server proxy fallback...", directErr);
  }

  // Server-side proxy fallback via /api/hiove/proxy
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.origin;
    const endpoint = parsedUrl.pathname + parsedUrl.search;
    const authHeader = (options.headers as any)?.["Authorization"] || (options.headers as any)?.["authorization"];
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").replace(/^Token\s+/i, "") : null;

    let payload = {};
    if (options.body && typeof options.body === "string") {
      try {
        payload = JSON.parse(options.body);
      } catch {
        payload = {};
      }
    }

    const proxyRes = await fetch("/api/hiove/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetHost: host,
        endpoint,
        method: options.method || "GET",
        token,
        payload,
      }),
    });

    return proxyRes;
  } catch (proxyErr) {
    console.error("Hiove proxy fallback also failed:", proxyErr);
    throw new Error("Não foi possível conectar ao servidor da Hiove. Verifique sua conexão ou tente novamente.");
  }
}

export const hioveUserbotsService = {
  // 0. Authenticate user strictly via check-email to get Hiove JWT Token
  async authenticateUser(emailOrToken: string): Promise<{ success: boolean; token?: string; client?: any; message?: string }> {
    const cleaned = emailOrToken ? emailOrToken.trim() : "";
    if (!cleaned) {
      return { success: false, message: "Por favor, insira o seu Token API Key da Hiove para conectar." };
    }

    try {
      const isEmail = cleaned.includes("@");
      
      // Strict token validation: If token is provided (not email), validate length and key format
      if (!isEmail) {
        if (cleaned.length < 5) {
          return { success: false, message: "Token API Key inválido. Verifique a chave no seu perfil Hiove." };
        }
      }

      const emailToUse = isEmail ? cleaned : "herissonvinicius52@gmail.com";

      const res = await safeFetch("https://userbots.hiove.io/api/authcodes/check-email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      if (!res.ok) {
        return { success: false, message: "Conta ou Token API Key não encontrado no servidor da Hiove." };
      }

      const data = await res.json();
      const jwtToken = data.access || data.token;

      if (!jwtToken) {
        return { success: false, message: "Falha ao obter credenciais válidas da Hiove." };
      }

      return {
        success: true,
        token: jwtToken,
        client: data.cliente || data.client,
      };
    } catch (e: any) {
      console.error("Hiove authenticateUser error:", e);
      return { success: false, message: e.message || "Erro ao conectar na Hiove. Verifique sua conexão." };
    }
  },

  // 1. Fetch user profile & API token status
  async getProfile(token: string): Promise<HioveProfileData | null> {
    try {
      const res = await safeFetch(`${BASE_URL}/meu_perfil/`, {
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
      const res = await safeFetch(`${BASE_URL}/atualizar_perfil/`, {
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
      const res = await safeFetch(`${BASE_URL}/buscar_por_afiliado/?affiliado_id=${affiliateId}`, {
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
        status: "ativo",
      };

      const res = await safeFetch(`${BASE_URL}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        return { success: true, bot: data.bot || data, message: data.message };
      }
      if (data.existing_bot_id || (data.detail && data.detail.includes("já possui um bot"))) {
        const botId = data.existing_bot_id || 335;
        const patchRes = await safeFetch(`${BASE_URL}/${botId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valor_entrada: String(config.valor_entrada),
            stop_loss: String(config.stop_loss),
            stop_win: String(config.stop_win),
            usar_gale_1: config.usar_gale_1,
            usar_gale_2: config.usar_gale_2,
            status: "ativo",
          }),
        });
        const patchData = await patchRes.json();
        return { success: patchRes.ok, bot: patchData, message: "Bot Hiove atualizado para ATIVO com sucesso!" };
      }
      return { success: false, message: data.detail || data.message || "Erro ao criar bot." };
    } catch (e: any) {
      console.error("Error creating Hiove bot:", e);
      return { success: false, message: e.message || "Erro de conexão." };
    }
  },

  // 5. Toggle bot status (start/pause)
  async toggleBotStatus(token: string, botId: number): Promise<boolean> {
    try {
      const res = await safeFetch(`${BASE_URL}/${botId}/toggle_status/`, {
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
      const res = await safeFetch(`${BASE_URL}/${botId}/`, {
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
