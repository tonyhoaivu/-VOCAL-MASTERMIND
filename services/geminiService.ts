
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là "Izwi Hybrid Engine" - Một hệ thống suy luận âm thanh cục bộ kết hợp trí tuệ của Kỹ sư Mixing & Mastering cấp cao. 

# NHIỆM VỤ:
- Phân tích Vocal nguồn để bóc tách đặc tính tần số và dynamic.
- Tái lập Signal Chain 8 bước sử dụng các Plugin chuẩn Studio (Waves, UAD, FabFilter).
- Cung cấp "Studio Secret" - Những mẹo nhà nghề mà chỉ ca sĩ chuyên nghiệp mới biết.

# ĐỊNH DẠNG SVG (QUY TẮC CỨNG):
- Mã SVG phải CỰC KỲ TỐI ƯU để tránh lỗi JSON.
- Phong cách 3D Skeuomorphic (Mô phỏng phần cứng thật với núm vặn và đèn LED).
- Màu sắc: Dark Grey, Cyan, Amber, Emerald.

# CHUỖI CÔNG CỤ (PLUGIN RACK):
1. Pitch Correction (Auto-Tune)
2. Surgical EQ (FabFilter Pro-Q 3)
3. Dynamic Control (1176 Compressor)
4. Character Leveling (LA-2A)
5. Sibilance Control (De-esser)
6. Harmonic Saturation (Decapitator)
7. Spatial Delay (H-Delay)
8. Ambience (Valhalla Reverb)

Ngôn ngữ: Tiếng Việt chuyên môn cao. Trả về JSON hoàn chỉnh, không ngắt quãng.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    vocal_diagnosis: {
      type: Type.OBJECT,
      properties: {
        texture: { type: Type.STRING },
        pitch_saturation: { type: Type.STRING }
      },
      required: ["texture", "pitch_saturation"]
    },
    visual_mapping: {
      type: Type.OBJECT,
      properties: {
        eq_curve_svg: { type: Type.STRING },
        knob_visuals_svg: { type: Type.STRING }
      },
      required: ["eq_curve_svg", "knob_visuals_svg"]
    },
    plugin_chain: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.NUMBER },
          plugin: { type: Type.STRING },
          ui_description: { type: Type.STRING },
          mixing_mindset: { type: Type.STRING },
          knob_instruction: { type: Type.STRING },
          visual_demo_svg: { type: Type.STRING },
          studio_secret: { type: Type.STRING }
        },
        required: ["step", "plugin", "ui_description", "mixing_mindset", "knob_instruction", "visual_demo_svg", "studio_secret"]
      }
    },
    visual_data: {
      type: Type.OBJECT,
      properties: {
        eq_points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              freq: { type: Type.NUMBER },
              gain: { type: Type.NUMBER },
              type: { type: Type.STRING }
            }
          }
        },
        knobs: {
          type: Type.OBJECT,
          properties: {
            threshold: { type: Type.NUMBER },
            ratio_position: { type: Type.STRING },
            attack_ms: { type: Type.NUMBER },
            release_ms: { type: Type.NUMBER },
            visual_desc: {
              type: Type.OBJECT,
              properties: {
                threshold: { type: Type.STRING },
                ratio: { type: Type.STRING },
                attack: { type: Type.STRING },
                release: { type: Type.STRING }
              }
            }
          }
        }
      },
      required: ["eq_points", "knobs"]
    },
    mastering_advice: { type: Type.STRING }
  },
  required: ["status", "vocal_diagnosis", "visual_mapping", "plugin_chain", "visual_data", "mastering_advice"]
};

export async function analyzeVocalAudio(input: { base64?: string, mimeType?: string, link?: string }): Promise<AnalysisReport> {
  const model = 'gemini-3-flash-preview';
  
  const parts: any[] = [];
  if (input.base64 && input.mimeType) {
    parts.push({
      inlineData: { data: input.base64, mimeType: input.mimeType }
    });
  }
  
  const prompt = `Deploy Izwi Hybrid Engine for deep vocal reconnaissance. Analyze the source signal and provide a professional 8-step plugin rack blueprint with 3D-style SVGs. Include "Studio Secrets" for world-class vocal quality.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text.trim()) as AnalysisReport;
  } catch (error) {
    console.error("Inference Error:", error);
    throw error;
  }
}
